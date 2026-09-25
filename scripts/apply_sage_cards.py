from pathlib import Path

root = Path("client/src")
replacements = {
    'bg-white border border-[#e3ebe6]': 'bg-[#b6c9bf] border border-[#a6bdb1]',
    'bg-white/70 border border-white/80': 'bg-[#b6c9bf]/80 border border-[#a6bdb1]/70',
    'border border-white/70 bg-white/65': 'border border-[#d2e0d8] bg-[#b6c9bf]/80',
    'bg-[#fff1ea]': 'bg-[#b6c9bf]',
    'bg-[#e8f3ed]': 'bg-[#b6c9bf]',
}
for path in list(root.glob("pages/*.tsx")) + list(root.glob("components/*.tsx")):
    text = path.read_text()
    updated = text
    for old, new in replacements.items():
        updated = updated.replace(old, new)
    if updated != text:
        path.write_text(updated)
        print(path)
