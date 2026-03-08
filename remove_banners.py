"""
Remove inner banner blocks from exported ScanCoach content components.
Each banner is a <div className="relative overflow-hidden" style={{ background: "linear-gradient... }}>
that wraps a full hero section. We replace it with nothing (the outer ScanCoach.tsx hero already
provides the page title).
"""

import re

def remove_banner_block(content: str, start_marker: str) -> str:
    """
    Find the div starting with start_marker and remove it (including all nested children).
    Returns the modified content.
    """
    idx = content.find(start_marker)
    if idx == -1:
        print(f"  WARNING: marker not found: {start_marker[:60]}")
        return content

    # Walk forward counting open/close divs to find the matching closing </div>
    depth = 0
    i = idx
    while i < len(content):
        if content[i:i+4] == '<div':
            depth += 1
            i += 4
        elif content[i:i+6] == '</div>':
            depth -= 1
            if depth == 0:
                end = i + 6
                # Remove the block and any immediately following newline
                removed = content[idx:end]
                content = content[:idx] + content[end:].lstrip('\n')
                print(f"  Removed {len(removed)} chars")
                return content
            else:
                i += 6
        else:
            i += 1

    print(f"  WARNING: could not find closing div for banner")
    return content


# ── DiastolicNavigator.tsx ──────────────────────────────────────────────────
path = "client/src/pages/DiastolicNavigator.tsx"
with open(path) as f:
    content = f.read()
print(f"\n{path}")
marker = '      {/* ─── Banner ─── */}\n      <div\n        className="relative overflow-hidden mb-6"'
content = remove_banner_block(content, marker)
with open(path, "w") as f:
    f.write(content)

# ── HOCMScanCoach.tsx ───────────────────────────────────────────────────────
path = "client/src/pages/HOCMScanCoach.tsx"
with open(path) as f:
    content = f.read()
print(f"\n{path}")
marker = '      <div\n        className="relative overflow-hidden"\n        style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 60%, #189aa1 100%)" }}\n      >'
content = remove_banner_block(content, marker)
with open(path, "w") as f:
    f.write(content)

# ── StrainScanCoach.tsx ─────────────────────────────────────────────────────
path = "client/src/pages/StrainScanCoach.tsx"
with open(path) as f:
    content = f.read()
print(f"\n{path}")
# Strain uses BRAND_DARK variable in the gradient
marker = '      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${BRAND_DARK} 0%, #0e3a40 60%, ${BRAND} 100%)` }}>'
content = remove_banner_block(content, marker)
with open(path, "w") as f:
    f.write(content)

# ── UEAScanCoach.tsx ────────────────────────────────────────────────────────
path = "client/src/pages/UEAScanCoach.tsx"
with open(path) as f:
    content = f.read()
print(f"\n{path}")
marker = '    <div>  <div\n        className="relative overflow-hidden"\n        style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 60%, #189aa1 100%)" }}\n      >'
content = remove_banner_block(content, marker)
# Also clean up the <div>  <div pattern that was left
content = content.replace('  return (\n    <div>  {/* ── Tab Bar', '  return (\n    <div>\n      {/* ── Tab Bar')
with open(path, "w") as f:
    f.write(content)

print("\nDone.")
