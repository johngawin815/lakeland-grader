import openpyxl
import json

wb = openpyxl.load_workbook('public/templates/Q3_GradeSpreadsheet_2025-2026.xlsx')
sheet = wb.active
rows = list(sheet.iter_rows(values_only=True))

units = ['Harmony', 'Integrity']
unit_data = {}
current_unit = None
for r in rows:
    if r and isinstance(r[0], str):
        for unit in units:
            if unit in r[0]:
                current_unit = unit
                unit_data[current_unit] = []
                break
        else:
            if current_unit and r[0] and r[0] != 'Student Name' and r[0] != 'Course':
                unit_data[current_unit].append(r)

with open('public/templates/Q3_GradeSpreadsheet_2025-2026.json', 'w') as f:
    json.dump(unit_data, f, ensure_ascii=False, indent=2)
print('Extracted Harmony and Integrity unit data to Q3_GradeSpreadsheet_2025-2026.json')
