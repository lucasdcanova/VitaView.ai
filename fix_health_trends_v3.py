import os

path = 'client/src/pages/health-trends-new.tsx'
with open(path, 'r') as f:
    lines = f.readlines()

new_lines = []
i = 0
found_garbage = False

while i < len(lines):
    line = lines[i]
    
    # 1. Detect Garbage Block (The bad return block)
    if i+1 < len(lines) and line.strip() == "return (" and "!min-h-0" in lines[i+1]:
        print(f"Found garbage block at line {i}")
        # Skip this block until "  }"
        j = i
        while j < len(lines):
            if lines[j].strip() == "}":
                 i = j + 1
                 found_garbage = True
                 break
            j += 1
        continue

    # 2. Detect Main Return (Original) and Patch it
    if i+5 < len(lines) and line.strip() == "return (" and "min-h-screen" in lines[i+1] and "!min-h-0" not in lines[i+1]:
        print(f"Found main return at line {i}")
        new_wrapper = [
            "  return (\n",
            "    <div className={`min-h-screen flex flex-col ${embedded ? 'bg-gray-50 !min-h-0' : ''}`}>\n",
            "      {!embedded && <MobileHeader />}\n",
            "\n",
            "      <div className={`flex flex-1 relative ${embedded ? 'block' : ''}`}>\n",
            "        {!embedded && <Sidebar />}\n",
            "\n",
            "        <main className=\"flex-1 bg-gray-50\">\n",
            "          <div className={embedded ? \"\" : \"p-4 md:p-6\"}>\n"
        ]
        new_lines.extend(new_wrapper)
        
        # Skip 9 lines of original code
        i += 9 
        continue

    new_lines.append(line)
    i += 1

with open(path, 'w') as f:
    f.writelines(new_lines)

print("Fixed v3")
