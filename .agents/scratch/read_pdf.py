import pypdf
import sys

def read_pdf(file_path):
    reader = pypdf.PdfReader(file_path)
    print(f"Total pages: {len(reader.pages)}")
    for i in range(min(15, len(reader.pages))):
        page = reader.pages[i]
        text = page.extract_text()
        print(f"--- Page {i + 1} ---")
        print(text[:1000])  # print up to 1000 chars per page to avoid overflow

if __name__ == "__main__":
    read_pdf(r"c:\Users\Jennifer and Jim\Desktop\lakeland-grader\public\curr-mls-standards-math-6-12-sboe-2016.pdf")
