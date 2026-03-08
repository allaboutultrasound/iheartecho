"""
Remove inner banner blocks from exported ScanCoach content components.
Uses a line-based approach: find the banner start line, then count div depth
to find the exact closing </div>, and remove that range.
"""

def remove_banner_by_line(path, banner_start_line):
    """
    banner_start_line: 1-indexed line number where the banner <div starts.
    Removes from that line to the matching closing </div>.
    """
    with open(path) as f:
        lines = f.readlines()

    # Convert to 0-indexed
    start = banner_start_line - 1

    depth = 0
    end = None
    for i in range(start, len(lines)):
        line = lines[i]
        # Count opening divs
        depth += line.count('<div')
        # Count closing divs
        depth -= line.count('</div>')
        if depth <= 0 and i > start:
            end = i + 1  # exclusive
            break

    if end is None:
        print(f"  ERROR: could not find closing div in {path}")
        return

    removed_lines = lines[start:end]
    print(f"  Removing lines {banner_start_line}–{end} ({len(removed_lines)} lines) from {path}")

    new_lines = lines[:start] + lines[end:]
    with open(path, 'w') as f:
        f.writelines(new_lines)
    print(f"  Done. File now has {len(new_lines)} lines.")


# ── DiastolicNavigator.tsx: banner starts at line 24 (the <div with overflow-hidden) ──
# Line 24 is: "      {/* ─── Banner ─── */}"
# Line 25 is: "      <div"
# We want to remove lines 24 (the comment) through the closing </div> of the banner
print("DiastolicNavigator.tsx")
remove_banner_by_line("client/src/pages/DiastolicNavigator.tsx", 24)

# ── HOCMScanCoach.tsx: banner starts at line 574 ──
# Line 573: "  return (    <div>"  <- this is the outer wrapper, keep it
# Line 574: "      <div"  <- this is the banner div
print("\nHOCMScanCoach.tsx")
remove_banner_by_line("client/src/pages/HOCMScanCoach.tsx", 574)

# ── UEAScanCoach.tsx: banner is inline with the outer <div on line 464 ──
# Line 464: "    <div>  <div"  <- outer wrapper + banner start on same line
# We need to handle this differently - fix the line first
print("\nUEAScanCoach.tsx")
with open("client/src/pages/UEAScanCoach.tsx") as f:
    content = f.read()
# Fix the malformed line: "    <div>  <div" -> split into two lines
content = content.replace('    <div>  <div\n        className="relative overflow-hidden"\n        style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 60%, #189aa1 100%)" }}\n      >',
                           '    <div>\n      <div\n        className="relative overflow-hidden"\n        style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 60%, #189aa1 100%)" }}\n      >')
with open("client/src/pages/UEAScanCoach.tsx", 'w') as f:
    f.write(content)
# Now find the new line number of the banner div
with open("client/src/pages/UEAScanCoach.tsx") as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if 'relative overflow-hidden' in line and i > 460:
        print(f"  Banner div found at line {i+1}")
        remove_banner_by_line("client/src/pages/UEAScanCoach.tsx", i+1)
        break

print("\nAll done.")
