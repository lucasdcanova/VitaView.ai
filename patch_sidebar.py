import os

file_path = 'client/src/pages/health-trends-new.tsx'
with open(file_path, 'r') as f:
    lines = f.readlines()

# Verify markers
print(f"Line 1485: {lines[1484].strip()}")
print(f"Line 1544: {lines[1543].strip()}")
print(f"Line 1546: {lines[1545].strip()}")
print(f"Line 1589: {lines[1588].strip()}")
print(f"Line 1591: {lines[1590].strip()}")
print(f"Line 1639: {lines[1638].strip()}")

# Proceed with patching
# Ranges to remove (inclusive 0-indexed):
# [1484, 1543]
# [1545, 1588]
# [1590, 1638]

# Construct new lines
# Keep 0..1483 -> lines[:1484]
# Keep 1544 (empty line 1545) -> lines[1544] (as list: lines[1544:1545])
# Keep 1589 (empty line 1590) -> lines[1589:1590]
# Keep 1639 (empty line 1640) and beyond -> lines[1639:]

new_lines = lines[:1484] + lines[1544:1545] + lines[1589:1590] + lines[1639:]

with open(file_path, 'w') as f:
    f.writelines(new_lines)

print("Successfully removed sidebar cards.")
