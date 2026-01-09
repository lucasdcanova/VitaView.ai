import os

file_path = 'client/src/pages/health-trends-new.tsx'
with open(file_path, 'r') as f:
    lines = f.readlines()

# Verify start/end lines context
print(f"Line 1766 (index 1765): {lines[1765].strip()}")
print(f"Line 2078 (index 2077): {lines[2077].strip()}")

target_start = "        {/* Dialog para adicionar nova alergia */}"
target_end = "        </Dialog>"

if lines[1765].strip() != target_start.strip():
    print("WARNING: Start line mismatch!")
    print(f"Expected: {target_start.strip()}")
    print(f"Found: {lines[1765].strip()}")

if lines[2077].strip() != target_end.strip():
    print("WARNING: End line mismatch!")
    print(f"Expected: {target_end.strip()}")
    print(f"Found: {lines[2077].strip()}")

# Proceeding with patch
new_content = """        {/* Dialogs de Alergia */}
        <AllergyDialog
          open={isAllergyDialogOpen}
          onOpenChange={setIsAllergyDialogOpen}
          form={allergyForm}
          onSubmit={onAllergySubmit}
          isPending={addAllergyMutation.isPending}
          mode="create"
        />

        <AllergyDialog
          open={isEditAllergyDialogOpen}
          onOpenChange={setIsEditAllergyDialogOpen}
          form={editAllergyForm}
          onSubmit={onEditAllergySubmit}
          isPending={editAllergyMutation.isPending}
          mode="edit"
          onRemove={() => editingAllergy && handleRemoveAllergy(editingAllergy.id)}
          isRemovePending={deleteAllergyMutation.isPending}
        />

        <ManageAllergiesDialog
          open={isManageAllergiesDialogOpen}
          onOpenChange={setIsManageAllergiesDialogOpen}
          allergies={allergies}
          onEdit={(allergy) => openEditAllergyDialog(allergy)}
          onRemove={handleRemoveAllergy}
          onAdd={() => setIsAllergyDialogOpen(true)}
        />
"""

# Note: lines[1765] is the first line to remove.
# lines[2077] is the last line to remove.
# We keep lines[:1765]
# We keep lines[2078:]

new_lines = lines[:1765] + [new_content] + lines[2078:]

with open(file_path, 'w') as f:
    f.writelines(new_lines)

print("Successfully patched allergy dialogs.")
