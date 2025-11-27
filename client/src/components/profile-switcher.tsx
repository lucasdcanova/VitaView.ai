import { useState } from "react";
import { useProfiles } from "@/hooks/use-profiles";
import {
  ChevronDown,
  UserPlus,
  Edit,
  Trash2,
  User,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Profile } from "@shared/schema";

type ProfileFormData = {
  name: string;
  gender: string;
  birthDate: string;
  planType?: string;
};

const profileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  gender: z.string().min(1, "Gênero é obrigatório"),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
  planType: z.string().optional(),
});

export default function ProfileSwitcher() {
  const { profiles, activeProfile, setActiveProfile, createProfile, updateProfile, deleteProfile } = useProfiles();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [profileToEdit, setProfileToEdit] = useState<Profile | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null);

  const createForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      gender: "",
      birthDate: "",
      planType: "",
    },
  });

  const editForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      gender: "",
      birthDate: "",
      planType: "",
    },
  });

  const onCreateSubmit = (data: ProfileFormData) => {
    createProfile({
      name: data.name,
      gender: data.gender,
      birthDate: data.birthDate,
      planType: data.planType || null,
      relationship: null,
      bloodType: null,
      isDefault: false,
    });
    setIsCreateDialogOpen(false);
    createForm.reset();
  };

  const onEditSubmit = (data: ProfileFormData) => {
    if (profileToEdit) {
      updateProfile(profileToEdit.id, {
        name: data.name,
        gender: data.gender,
        birthDate: data.birthDate,
        planType: data.planType || null,
      });
      setIsEditDialogOpen(false);
      setProfileToEdit(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (profileToDelete) {
      deleteProfile(profileToDelete.id);
      setIsDeleteDialogOpen(false);
      setProfileToDelete(null);
    }
  };

  const openEditDialog = (profile: Profile) => {
    setProfileToEdit(profile);
    editForm.reset({
      name: profile.name,
      gender: profile.gender || "",
      birthDate: profile.birthDate || "",
      planType: profile.planType || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (profile: Profile) => {
    setProfileToDelete(profile);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="inline-block">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="flex w-full items-center justify-between gap-3 px-4 py-2 rounded-full border border-primary-200 bg-white shadow-sm text-primary-700 hover:text-primary-900 hover:border-primary-300"
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-3">
                <User className="w-4 h-4" />
              </div>
              <div className="flex flex-col items-start overflow-hidden">
                <span className="font-semibold text-sm truncate max-w-[180px]">
                  {activeProfile?.name || "Selecione um paciente"}
                </span>
                <span className="text-xs text-gray-500 truncate max-w-[180px]">
                  {activeProfile?.planType ? `Plano: ${activeProfile.planType}` : "Adicionar ou selecionar paciente"}
                </span>
              </div>
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <div className="p-2">
            <div className="flex items-center p-2">
              <Users className="w-4 h-4 mr-2 text-primary-500" />
              <span className="font-medium">Selecionar paciente</span>
            </div>
            <Separator className="my-2" />
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {profiles.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 text-center">
                  Nenhum paciente cadastrado. Adicione um paciente para começar a análise.
                </div>
              ) : (
                profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className={`flex items-center justify-between p-2 rounded hover:bg-gray-100 cursor-pointer ${activeProfile?.id === profile.id ? "bg-primary-50 text-primary-700" : ""
                      }`}
                    onClick={() => setActiveProfile(profile)}
                  >
                    <div className="flex items-center">
                      <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-2">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{profile.name}</div>
                        <div className="text-xs text-gray-500">{profile.planType ? profile.planType : "Paciente"}</div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(profile);
                        }}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      {!profile.isDefault && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteDialog(profile);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <Separator className="my-2" />
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full justify-start" variant="outline">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Cadastrar paciente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar novo paciente</DialogTitle>
                </DialogHeader>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome completo *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do paciente" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gênero *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o gênero" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Masculino">Masculino</SelectItem>
                              <SelectItem value="Feminino">Feminino</SelectItem>
                              <SelectItem value="Outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de nascimento *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="planType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de plano (opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="SUS, particular, convênio..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2 pt-2">
                      <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                      </DialogClose>
                      <Button type="submit">Salvar</Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </PopoverContent>
      </Popover>

      {/* Edit Patient Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar paciente</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do paciente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gênero *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o gênero" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Feminino">Feminino</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de nascimento *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="planType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de plano (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="SUS, particular, convênio..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2 pt-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Patient Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remover paciente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Tem certeza que deseja remover o paciente "{profileToDelete?.name}"?
              Essa ação não pode ser desfeita e todos os dados clínicos associados serão excluídos.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
              >
                Remover
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
