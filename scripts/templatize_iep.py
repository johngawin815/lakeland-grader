#!/usr/bin/env python3
"""
Templatize IEP .docx files — replaces Word content controls (SDT elements)
with docxtemplater-compatible {placeholder} tags.

Processes both template files:
  - iep_blank_master_form_rev_8-23_fillable.docx
  - iep_blank_master_form_with_transition_rev_8-23.docx

Outputs to:
  - public/templates/iep_template.docx
  - public/templates/iep_template_with_transition.docx
"""

import zipfile
import xml.etree.ElementTree as ET
import os
import shutil
import copy
import re

NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
NS14 = 'http://schemas.microsoft.com/office/word/2010/wordml'

# Register namespaces to preserve them in output
NAMESPACES = {
    'wpc': 'http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas',
    'cx': 'http://schemas.microsoft.com/office/drawing/2014/chartex',
    'cx1': 'http://schemas.microsoft.com/office/drawing/2015/9/8/chartex',
    'cx2': 'http://schemas.microsoft.com/office/drawing/2015/10/21/chartex',
    'cx3': 'http://schemas.microsoft.com/office/drawing/2016/5/9/chartex',
    'cx4': 'http://schemas.microsoft.com/office/drawing/2016/5/10/chartex',
    'cx5': 'http://schemas.microsoft.com/office/drawing/2016/5/11/chartex',
    'cx6': 'http://schemas.microsoft.com/office/drawing/2016/5/12/chartex',
    'cx7': 'http://schemas.microsoft.com/office/drawing/2016/5/13/chartex',
    'cx8': 'http://schemas.microsoft.com/office/drawing/2016/5/14/chartex',
    'mc': 'http://schemas.openxmlformats.org/markup-compatibility/2006',
    'aink': 'http://schemas.microsoft.com/office/drawing/2016/ink',
    'am3d': 'http://schemas.microsoft.com/office/drawing/2017/model3d',
    'o': 'urn:schemas-microsoft-com:office:office',
    'oel': 'http://schemas.microsoft.com/office/2019/extlnk',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'm': 'http://schemas.openxmlformats.org/officeDocument/2006/math',
    'v': 'urn:schemas-microsoft-com:vml',
    'wp14': 'http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing',
    'wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
    'w10': 'urn:schemas-microsoft-com:office:word',
    'w': NS,
    'w14': NS14,
    'w15': 'http://schemas.microsoft.com/office/word/2012/wordml',
    'w16cex': 'http://schemas.microsoft.com/office/word/2018/wordml/cex',
    'w16cid': 'http://schemas.microsoft.com/office/word/2016/wordml/cid',
    'w16': 'http://schemas.microsoft.com/office/word/2018/wordml',
    'w16sdtdh': 'http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash',
    'w16se': 'http://schemas.microsoft.com/office/word/2015/wordml/symex',
    'wpg': 'http://schemas.microsoft.com/office/word/2010/wordprocessingGroup',
    'wpi': 'http://schemas.microsoft.com/office/word/2010/wordprocessingInk',
    'wne': 'http://schemas.microsoft.com/office/word/2006/wordml',
    'wps': 'http://schemas.microsoft.com/office/word/2010/wordprocessingShape',
}

for prefix, uri in NAMESPACES.items():
    ET.register_namespace(prefix, uri)


def is_checkbox(sdt_elem):
    """Check if an SDT is a checkbox."""
    pr = sdt_elem.find(f'{{{NS}}}sdtPr')
    if pr is None:
        return False
    if pr.find(f'{{{NS}}}checkBox') is not None:
        return True
    if pr.find(f'{{{NS14}}}checkbox') is not None:
        return True
    return False


def is_dropdown_or_combo(sdt_elem):
    """Check if an SDT is a dropdown or combobox."""
    pr = sdt_elem.find(f'{{{NS}}}sdtPr')
    if pr is None:
        return False
    return (pr.find(f'{{{NS}}}dropDownList') is not None or
            pr.find(f'{{{NS}}}comboBox') is not None)


def is_date_picker(sdt_elem):
    """Check if an SDT is a date picker."""
    pr = sdt_elem.find(f'{{{NS}}}sdtPr')
    if pr is None:
        return False
    return pr.find(f'{{{NS}}}date') is not None


def get_sdt_text(sdt_elem):
    """Get the text content of an SDT element."""
    texts = []
    for t in sdt_elem.findall(f'.//{{{NS}}}t'):
        if t.text:
            texts.append(t.text)
    return ''.join(texts).strip()


def get_sdt_run_props(sdt_elem):
    """Extract run properties from the SDT content for formatting preservation."""
    content = sdt_elem.find(f'{{{NS}}}sdtContent')
    if content is not None:
        # Look for the first run with properties
        for r in content.findall(f'.//{{{NS}}}r'):
            rpr = r.find(f'{{{NS}}}rPr')
            if rpr is not None:
                return copy.deepcopy(rpr)
    return None


def make_text_run(placeholder_text, run_props=None):
    """Create a w:r element with a w:t containing the placeholder text."""
    r = ET.SubElement(ET.Element('dummy'), f'{{{NS}}}r')
    if run_props is not None:
        r.append(run_props)
    t = ET.SubElement(r, f'{{{NS}}}t')
    t.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
    t.text = placeholder_text
    return r


def replace_sdts_in_element(parent, sdt_mapping, sdt_counter):
    """
    Recursively walk an element tree, replacing SDT elements with {placeholder} text.
    Returns updated sdt_counter.
    """
    children = list(parent)
    for i, child in enumerate(children):
        tag = child.tag.split('}')[1] if '}' in child.tag else child.tag

        if tag == 'sdt':
            sdt_counter[0] += 1
            idx = sdt_counter[0]

            # Skip checkboxes — leave them as-is
            if is_checkbox(child):
                continue

            # Get placeholder name from mapping
            placeholder = sdt_mapping.get(idx)
            if placeholder is None:
                # Not in our mapping — leave as-is
                continue

            # Get formatting from existing SDT content
            run_props = get_sdt_run_props(child)

            # Determine if this is a block-level SDT (contains w:p) or inline (contains w:r)
            content = child.find(f'{{{NS}}}sdtContent')
            has_paragraphs = content is not None and content.find(f'{{{NS}}}p') is not None
            has_runs_only = content is not None and content.find(f'{{{NS}}}r') is not None and not has_paragraphs

            if has_paragraphs:
                # Block-level SDT: replace with a paragraph containing the placeholder
                new_p = ET.Element(f'{{{NS}}}p')
                new_r = make_text_run(f'{{{placeholder}}}', run_props)
                new_p.append(new_r)
                parent.remove(child)
                parent.insert(i, new_p)
            else:
                # Inline SDT: replace with just a text run
                new_r = make_text_run(f'{{{placeholder}}}', run_props)
                parent.remove(child)
                parent.insert(i, new_r)
        else:
            # Recurse into non-SDT elements
            replace_sdts_in_element(child, sdt_mapping, sdt_counter)

    return sdt_counter


# ─── SDT PLACEHOLDER MAPPINGS ────────────────────────────────────────────────

# Common mapping for both templates (SDTs 1-170)
COMMON_MAPPING = {
    # Page 1 — Student Demographics
    1: 'student_name',
    2: 'disability_category',
    3: 'secondary_disability',
    4: 'student_address',
    5: 'student_phone',
    6: 'birth_date',
    7: 'student_age',
    8: 'grade_level',
    9: 'resident_district',

    # Decision Maker
    10: 'decision_maker_name',
    11: 'decision_maker_address',
    12: 'decision_maker_phone',
    13: 'decision_maker_email',
    14: 'decision_maker_fax',

    # Case Manager
    15: 'case_manager',
    16: 'case_manager_phone',

    # Dates
    17: 'eval_date',
    18: 'prev_iep_date',
    19: 'triennial_date',
    20: 'iep_meeting_date',
    21: 'iep_initiation_date',
    22: 'annual_review_date',
    23: 'copy_provided_date',

    # Present Levels (PLAAFP)
    24: 'disability_impact',
    25: 'student_strengths',
    26: 'parent_concerns',
    27: 'changes_functioning',
    28: 'eval_summary',
    29: 'transition_assessments',

    # Goal 1
    30: 'goal_1_number',
    31: 'goal_1_text',
    32: 'goal_1_benchmark_1',
    33: 'goal_1_benchmark_2',
    34: 'goal_1_benchmark_3',

    # Goal 2
    63: 'goal_2_number',
    64: 'goal_2_text',
    65: 'goal_2_benchmark_1',
    66: 'goal_2_benchmark_2',
    67: 'goal_2_benchmark_3',

    # Goal 3
    96: 'goal_3_number',
    97: 'goal_3_text',
    98: 'goal_3_benchmark_1',
    99: 'goal_3_benchmark_2',
    100: 'goal_3_benchmark_3',

    # Goal 4
    129: 'goal_4_number',
    130: 'goal_4_text',
    131: 'goal_4_benchmark_1',
    132: 'goal_4_benchmark_2',
    133: 'goal_4_benchmark_3',

    # Related Services (Service Summary)
    162: 'related_service_1_type',
    163: 'related_service_1_amount',
    164: 'related_service_1_frequency',
    165: 'related_service_2_type',
    166: 'related_service_2_amount',
    167: 'related_service_2_frequency',
    168: 'related_service_3_type',
    169: 'related_service_3_amount',
    170: 'related_service_3_frequency',
}

# Additional mapping for Transition template (Form C fields)
TRANSITION_EXTRA_MAPPING = {
    # Transition Assessments Table
    171: 'transition_assessment_date_1',
    172: 'career_interest_areas',
    173: 'transition_assessment_date_2',
    174: 'ktea_reading_ge',
    175: 'ktea_math_ge',
    176: 'ktea_writing_ge',
    177: 'transition_assessment_date_3',
    178: 'independent_living_worksheet',

    # Graduation
    179: 'anticipated_graduation_date',

    # Employment Section
    182: 'employment_goal',
    183: 'employment_skills_obtained',
    184: 'employment_skills_needed',
    185: 'school_employment_services',
    186: 'student_employment_services',
    187: 'parent_employment_services',

    # Education/Training Section
    188: 'education_goal',
    189: 'education_skills_obtained',
    190: 'education_skills_needed',
    191: 'school_education_services',
    192: 'student_education_services',
    193: 'parent_education_services',

    # Independent Living Section
    194: 'independent_living_goal',
    195: 'independent_living_skills_obtained',
    196: 'independent_living_skills_needed',
    197: 'school_independent_living_services',
    198: 'student_independent_living_services',
    199: 'parent_independent_living_services',
}


def process_template(input_path, output_path, sdt_mapping):
    """Process a single .docx template, replacing SDTs with {placeholder} tags."""
    # Copy the original file
    shutil.copy2(input_path, output_path)

    # Read document.xml from the zip
    with zipfile.ZipFile(output_path, 'r') as zin:
        doc_xml = zin.read('word/document.xml')
        # Get list of all files in zip
        file_list = zin.namelist()
        file_contents = {}
        for name in file_list:
            if name != 'word/document.xml':
                file_contents[name] = zin.read(name)

    # Parse XML
    root = ET.fromstring(doc_xml)

    # Replace SDTs
    sdt_counter = [0]
    replace_sdts_in_element(root, sdt_mapping, sdt_counter)

    print(f"  Processed {sdt_counter[0]} SDT elements total")

    # Write modified XML back
    modified_xml = ET.tostring(root, encoding='unicode', xml_declaration=True)
    # Fix the XML declaration to match Word's expected format
    if modified_xml.startswith("<?xml"):
        modified_xml = modified_xml.replace("<?xml version='1.0' encoding='us-ascii'?>",
                                            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>')

    # Rewrite the zip file
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zout:
        # Write modified document.xml
        zout.writestr('word/document.xml', modified_xml.encode('utf-8'))
        # Write all other files unchanged
        for name, content in file_contents.items():
            zout.writestr(name, content)

    print(f"  Saved to: {output_path}")


def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    templates_dir = os.path.join(base_dir, 'public', 'templates')

    # Process non-transition template
    print("Processing IEP template (without transition)...")
    process_template(
        os.path.join(templates_dir, 'iep_blank_master_form_rev_8-23_fillable.docx'),
        os.path.join(templates_dir, 'iep_template.docx'),
        COMMON_MAPPING,
    )

    # Process transition template
    print("\nProcessing IEP template (with transition)...")
    transition_mapping = {**COMMON_MAPPING, **TRANSITION_EXTRA_MAPPING}
    process_template(
        os.path.join(templates_dir, 'iep_blank_master_form_with_transition_rev_8-23.docx'),
        os.path.join(templates_dir, 'iep_template_with_transition.docx'),
        transition_mapping,
    )

    print("\nDone! Template files created:")
    print(f"  - {templates_dir}/iep_template.docx")
    print(f"  - {templates_dir}/iep_template_with_transition.docx")
    print("\nPlaceholder tags added (use with docxtemplater):")

    all_mapping = {**COMMON_MAPPING, **TRANSITION_EXTRA_MAPPING}
    for idx in sorted(all_mapping.keys()):
        marker = " [transition only]" if idx in TRANSITION_EXTRA_MAPPING else ""
        print(f"  {{{all_mapping[idx]}}}{marker}")


if __name__ == '__main__':
    main()
