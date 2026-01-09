import os

path = 'client/src/pages/health-trends-new.tsx'
with open(path, 'r') as f:
    lines = f.readlines()

start = -1
for i, line in enumerate(lines):
    if "if (examsLoading || diagnosesLoading || medicationsLoading) {" in line:
        start = i
        break

if start != -1:
    end = -1
    # Search for closing brace within range
    for i in range(start, start + 50):
        if lines[i].strip() == "}":
            end = i
            # Check indentation to be safe? Match "  }"?
            # View file showed "  }"
            if lines[i].startswith("  "):
               break
    
    if end != -1:
        correct_loading = [
        "  if (examsLoading || diagnosesLoading || medicationsLoading) {\n",
        "    if (embedded) {\n",
        "      return (\n",
        "        <div className=\"flex items-center justify-center h-64 bg-gray-50\">\n",
        "          <div className=\"animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full\" />\n",
        "        </div>\n",
        "      );\n",
        "    }\n",
        "    return (\n",
        "      <div className=\"min-h-screen flex flex-col\">\n",
        "        <MobileHeader />\n",
        "        <div className=\"flex flex-1 relative\">\n",
        "          <Sidebar />\n",
        "          <main className=\"flex-1 bg-gray-50\">\n",
        "            <div className=\"p-4 md:p-6\">\n",
        "              <div className=\"flex items-center justify-center h-64\">\n",
        "                <div className=\"animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full\" />\n",
        "              </div>\n",
        "            </div>\n",
        "          </main>\n",
        "        </div>\n",
        "      </div>\n",
        "    );\n",
        "  }\n"
        ]
        
        lines[start : end+1] = correct_loading
        
        with open(path, 'w') as f:
            f.writelines(lines)
            print("Fixed Loading Block")
    else:
        print("End of block not found")
else:
    print("Start of block not found")
