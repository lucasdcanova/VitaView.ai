import { useState } from "react";
import { PatientData } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PatientContextFormProps = {
  initialData: PatientData;
  onSubmit: (data: PatientData) => void;
  isLoading: boolean;
};

export default function PatientContextForm({
  initialData,
  onSubmit,
  isLoading,
}: PatientContextFormProps) {
  const [open, setOpen] = useState(false);
  const [patientData, setPatientData] = useState<PatientData>(initialData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(patientData);
    setOpen(false);
  };

  const updatePatientData = (
    field: keyof PatientData,
    value: string | number | string[]
  ) => {
    setPatientData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Função auxiliar para lidar com listas separadas por vírgula
  const handleListInput = (field: keyof PatientData, value: string) => {
    const items = value
      .split(',')
      .map(item => item.trim())
      .filter(item => item !== '');
    updatePatientData(field, items);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          disabled={isLoading}
          className="relative"
        >
          {isLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Análise Avançada com IA</DialogTitle>
          <DialogDescription>
            Forneça informações adicionais do paciente para uma análise mais personalizada e precisa pelo modelo OpenAI.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="gender" className="text-right">
                Sexo
              </Label>
              <Select 
                value={patientData.gender || ""}
                onValueChange={(value) => updatePatientData("gender", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o sexo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="age" className="text-right">
                Idade
              </Label>
              <Input
                id="age"
                type="number"
                value={patientData.age || ""}
                onChange={(e) => updatePatientData("age", parseInt(e.target.value) || 0)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="diseases" className="text-right">
                Doenças
              </Label>
              <Textarea
                id="diseases"
                placeholder="Hipertensão, diabetes, etc. (separadas por vírgula)"
                value={patientData.diseases?.join(", ") || ""}
                onChange={(e) => handleListInput("diseases", e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="surgeries" className="text-right">
                Cirurgias
              </Label>
              <Textarea
                id="surgeries"
                placeholder="Apendicectomia, etc. (separadas por vírgula)"
                value={patientData.surgeries?.join(", ") || ""}
                onChange={(e) => handleListInput("surgeries", e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="allergies" className="text-right">
                Alergias
              </Label>
              <Textarea
                id="allergies"
                placeholder="Penicilina, látex, etc. (separadas por vírgula)"
                value={patientData.allergies?.join(", ") || ""}
                onChange={(e) => handleListInput("allergies", e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="familyHistory" className="text-right">
                Histórico familiar
              </Label>
              <Textarea
                id="familyHistory"
                placeholder="Ex: Pai com diabetes, mãe com hipertensão..."
                value={patientData.familyHistory || ""}
                onChange={(e) => updatePatientData("familyHistory", e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Analisar com OpenAI</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}