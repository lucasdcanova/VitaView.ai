import os

file_path = 'client/src/pages/health-trends-new.tsx'
with open(file_path, 'r') as f:
    lines = f.readlines()

# 1. Interface & Export
found_export = False
for i, line in enumerate(lines):
    if "export default function HealthTrendsNew() {" in line:
        lines[i] = "interface HealthTrendsNewProps {\n  embedded?: boolean;\n}\n\nexport default function HealthTrendsNew({ embedded = false }: HealthTrendsNewProps = {}) {\n"
        found_export = True
        break

if not found_export:
    print("Warning: Export line not found")

# 2. Loading Block
loading_sig = "if (examsLoading || diagnosesLoading || medicationsLoading) {"
loading_start = -1
for i, line in enumerate(lines):
    if loading_sig in line:
        loading_start = i
        break

if loading_start != -1:
    new_loading = [
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
    # Replace the block. Assuming 16 lines is mostly correct, but let's be safe and find the closing bracket.
    # Search for "    );" with indentation.
    loading_end = -1
    for j in range(loading_start + 1, loading_start + 30):
        if lines[j].strip() == ");" and lines[j].startswith("    "):
             loading_end = j
             break
    
    if loading_end != -1:
        # We need to replace up to closing bracket + 1 (closing brace of if)
        # Verify lines[loading_end+1] is "  }"
        lines[loading_start : loading_end + 2] = new_loading
    else:
        print("Warning: Could not find end of loading block")
        # Fallback to fixed size if needed, but risky.
        lines[loading_start : loading_start+16] = new_loading

# 3. Main Return & Wrapper
main_ret = -1
for i in range(len(lines)):
    if "return (" in lines[i] and i+1 < len(lines) and "min-h-screen" in lines[i+1]:
        main_ret = i
        break

if main_ret != -1:
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
    # Replace 9 lines.
    lines[main_ret : main_ret+9] = new_wrapper
else:
    print("Warning: Main return block not found")

# 4. Header
header_start = -1
header_sig = 'className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6"'
for i, line in enumerate(lines):
    if header_sig in line:
        header_start = i
        break

grid_start = -1
grid_sig = 'className="grid gap-8 md:grid-cols-[1fr,360px]"'
for i in range(header_start if header_start != -1 else 0, len(lines)):
    if grid_sig in lines[i]:
        grid_start = i
        break

if header_start != -1 and grid_start != -1:
    header_end = -1
    for k in range(grid_start - 1, header_start, -1):
        if lines[k].strip() == "</div>":
            header_end = k
            break
            
    if header_end != -1:
        lines.insert(header_start, "              {!embedded && (\n")
        header_end += 1 # shift due to insertion
        lines.insert(header_end + 1, "              )}\n")
        lines.insert(header_end + 2, "              {embedded && (\n")
        lines.insert(header_end + 3, "                <div className=\"flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4\">\n")
        lines.insert(header_end + 4, "                   <div className=\"flex items-center gap-4\">\n")
        lines.insert(header_end + 5, "                     {allergies.length > 0 ? (\n")
        lines.insert(header_end + 6, "                          <span className=\"text-red-600 font-medium text-sm bg-red-50 border border-red-200 px-3 py-1 rounded-full\">\n")
        lines.insert(header_end + 7, "                             Alérgico a {allergies.map((a: any) => a.allergen).join(\", \")}\n")
        lines.insert(header_end + 8, "                          </span>\n")
        lines.insert(header_end + 9, "                     ) : (\n")
        lines.insert(header_end + 10, "                          <span className=\"text-gray-500 text-sm bg-gray-50 border border-gray-200 px-3 py-1 rounded-full\">\n")
        lines.insert(header_end + 11, "                             Nega alergias\n")
        lines.insert(header_end + 12, "                          </span>\n")
        lines.insert(header_end + 13, "                     )}\n")
        lines.insert(header_end + 14, "                     <Button variant=\"ghost\" size=\"icon\" className=\"h-6 w-6 text-gray-400 hover:text-gray-600\" onClick={() => setIsManageAllergiesDialogOpen(true)} title=\"Gerenciar alergias\"><PlusCircle className=\"h-4 w-4\" /></Button>\n")
        lines.insert(header_end + 15, "                   </div>\n")
        lines.insert(header_end + 16, "                   <div className=\"flex items-center gap-2\">\n")
        lines.insert(header_end + 17, "                      <Button variant=\"ghost\" size=\"sm\" className=\"text-gray-500\" onClick={generatePDF}><FileText className=\"w-4 h-4 mr-2\" /> PDF</Button>\n")
        lines.insert(header_end + 18, "                      <Button size=\"sm\" className=\"gap-2\" onClick={() => setIsDialogOpen(true)}><PlusCircle className=\"w-4 h-4\" /> Novo Registro</Button>\n")
        lines.insert(header_end + 19, "                   </div>\n")
        lines.insert(header_end + 20, "                </div>\n")
        lines.insert(header_end + 21, "              )}\n")
    else:
        print("Warning: Could not find header end")
else:
    print(f"Warning: Header markers not found. Start: {header_start}, Grid: {grid_start}")

with open(file_path, 'w') as f:
    f.writelines(lines)

print("Successfully applied embedded mode patch.")
