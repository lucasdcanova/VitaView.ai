import os

path = 'client/src/pages/health-trends-new.tsx'
with open(path, 'r') as f:
    lines = f.readlines()

# 1. Fix Loading Block
loading_start = -1
for i, line in enumerate(lines):
    if "if (examsLoading || diagnosesLoading || medicationsLoading) {" in line:
        loading_start = i
        break

main_return_start = -1
for i in range(loading_start + 1, len(lines)):
    # Find the main return. It should start with "  return (" and be followed by <div...
    if lines[i].startswith("  return (") and "min-h-screen" in lines[i+1]:
        main_return_start = i
        break

# Correct Loading Block
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
    "  }\n",
    "\n"
]

if loading_start != -1 and main_return_start != -1:
    lines[loading_start : main_return_start] = correct_loading

# 2. Fix Main Return Wrapper
# Re-find main return start
main_return_start = -1
for i in range(loading_start + len(correct_loading), len(lines)):
    if lines[i].startswith("  return (") and "min-h-screen" in lines[i+1]:
        main_return_start = i
        break

if main_return_start != -1:
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
    lines[main_return_start : main_return_start + 9] = new_wrapper

with open(path, 'w') as f:
    f.writelines(lines)

print("Fixed health-trends-new.tsx")
