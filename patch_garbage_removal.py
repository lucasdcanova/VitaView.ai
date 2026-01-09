import os

path = 'client/src/pages/health-trends-new.tsx'
with open(path, 'r') as f:
    lines = f.readlines()

new_lines = []
i = 0
found_garbage = False

while i < len(lines):
    line = lines[i]
    
    if i+1 < len(lines) and line.strip() == "return (" and "!min-h-0" in lines[i+1]:
        # Check if it ends within 20 lines.
        ends_soon = False
        for k in range(i, min(i+20, len(lines))):
            if lines[k].strip() == "}":
                 ends_soon = True
                 break
        
        if ends_soon:
             print(f"Skipping garbage block at {i}")
             j = i
             while j < len(lines):
                 if lines[j].strip() == "}":
                     i = j + 1
                     break
                 j += 1
             continue
    
    new_lines.append(line)
    i += 1

with open(path, 'w') as f:
    f.writelines(new_lines)
print("Removed garbage block")
