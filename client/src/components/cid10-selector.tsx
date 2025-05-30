import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CID10Code {
  code: string;
  description: string;
  category: string;
}

interface CID10SelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

// Base de dados CID-10 com códigos mais comuns organizados por categoria
const CID10_DATABASE: CID10Code[] = [
  // Doenças infecciosas e parasitárias (A00-B99)
  { code: "A09", description: "Diarreia e gastroenterite de origem infecciosa presumível", category: "Infecciosas" },
  { code: "A15", description: "Tuberculose respiratória", category: "Infecciosas" },
  { code: "A90", description: "Dengue", category: "Infecciosas" },
  { code: "B34.9", description: "Infecção viral não especificada", category: "Infecciosas" },
  
  // Neoplasias (C00-D48)
  { code: "C50", description: "Neoplasia maligna da mama", category: "Neoplasias" },
  { code: "C78", description: "Neoplasia maligna secundária de órgãos respiratórios e digestivos", category: "Neoplasias" },
  { code: "D12", description: "Neoplasia benigna do cólon, reto, ânus e canal anal", category: "Neoplasias" },
  
  // Doenças endócrinas (E00-E90)
  { code: "E10", description: "Diabetes mellitus tipo 1", category: "Endócrinas" },
  { code: "E11", description: "Diabetes mellitus tipo 2", category: "Endócrinas" },
  { code: "E14", description: "Diabetes mellitus não especificado", category: "Endócrinas" },
  { code: "E66", description: "Obesidade", category: "Endócrinas" },
  { code: "E78", description: "Distúrbios do metabolismo de lipoproteínas", category: "Endócrinas" },
  
  // Transtornos mentais (F00-F99)
  { code: "F32", description: "Episódios depressivos", category: "Mentais" },
  { code: "F41", description: "Outros transtornos ansiosos", category: "Mentais" },
  { code: "F43", description: "Reações ao estresse grave e transtornos de adaptação", category: "Mentais" },
  
  // Doenças do sistema nervoso (G00-G99)
  { code: "G43", description: "Enxaqueca", category: "Neurológicas" },
  { code: "G44", description: "Outras síndromes de cefaleia", category: "Neurológicas" },
  { code: "G93.1", description: "Lesão cerebral anóxica, não classificada em outra parte", category: "Neurológicas" },
  
  // Doenças do olho (H00-H59)
  { code: "H52", description: "Transtornos da refração e da acomodação", category: "Oftalmológicas" },
  { code: "H57.1", description: "Dor ocular", category: "Oftalmológicas" },
  
  // Doenças do aparelho circulatório (I00-I99)
  { code: "I10", description: "Hipertensão essencial", category: "Cardiovasculares" },
  { code: "I20", description: "Angina pectoris", category: "Cardiovasculares" },
  { code: "I21", description: "Infarto agudo do miocárdio", category: "Cardiovasculares" },
  { code: "I25", description: "Doença isquêmica crônica do coração", category: "Cardiovasculares" },
  { code: "I48", description: "Fibrilação e flutter atrial", category: "Cardiovasculares" },
  { code: "I50", description: "Insuficiência cardíaca", category: "Cardiovasculares" },
  
  // Doenças do aparelho respiratório (J00-J99)
  { code: "J00", description: "Nasofaringite aguda (resfriado comum)", category: "Respiratórias" },
  { code: "J06", description: "Infecções agudas das vias aéreas superiores", category: "Respiratórias" },
  { code: "J18", description: "Pneumonia por microorganismo não especificado", category: "Respiratórias" },
  { code: "J20", description: "Bronquite aguda", category: "Respiratórias" },
  { code: "J44", description: "Doença pulmonar obstrutiva crônica", category: "Respiratórias" },
  { code: "J45", description: "Asma", category: "Respiratórias" },
  
  // Doenças do aparelho digestivo (K00-K93)
  { code: "K21", description: "Doença do refluxo gastroesofágico", category: "Digestivas" },
  { code: "K25", description: "Úlcera gástrica", category: "Digestivas" },
  { code: "K29", description: "Gastrite e duodenite", category: "Digestivas" },
  { code: "K35", description: "Apendicite aguda", category: "Digestivas" },
  { code: "K59", description: "Outros transtornos funcionais do intestino", category: "Digestivas" },
  { code: "K80", description: "Colelitíase", category: "Digestivas" },
  
  // Doenças da pele (L00-L99)
  { code: "L20", description: "Dermatite atópica", category: "Dermatológicas" },
  { code: "L30", description: "Outras dermatites", category: "Dermatológicas" },
  { code: "L40", description: "Psoríase", category: "Dermatológicas" },
  
  // Doenças do sistema osteomuscular (M00-M99)
  { code: "M05", description: "Artrite reumatoide soropositiva", category: "Osteomusculares" },
  { code: "M15", description: "Poliartrose", category: "Osteomusculares" },
  { code: "M17", description: "Gonartrose", category: "Osteomusculares" },
  { code: "M25", description: "Outros transtornos articulares", category: "Osteomusculares" },
  { code: "M54", description: "Dorsalgia", category: "Osteomusculares" },
  { code: "M79", description: "Outros transtornos dos tecidos moles", category: "Osteomusculares" },
  
  // Doenças do aparelho geniturinário (N00-N99)
  { code: "N18", description: "Doença renal crônica", category: "Geniturinário" },
  { code: "N20", description: "Cálculo do rim e do ureter", category: "Geniturinário" },
  { code: "N39", description: "Outros transtornos do trato urinário", category: "Geniturinário" },
  { code: "N40", description: "Hiperplasia da próstata", category: "Geniturinário" },
  
  // Gravidez, parto e puerpério (O00-O99)
  { code: "O80", description: "Parto único espontâneo", category: "Obstétricas" },
  { code: "O82", description: "Parto único por cesariana", category: "Obstétricas" },
  
  // Sintomas e sinais (R00-R99)
  { code: "R05", description: "Tosse", category: "Sintomas" },
  { code: "R06", description: "Anormalidades da respiração", category: "Sintomas" },
  { code: "R10", description: "Dor abdominal e pélvica", category: "Sintomas" },
  { code: "R50", description: "Febre não especificada", category: "Sintomas" },
  { code: "R51", description: "Cefaleia", category: "Sintomas" },
  { code: "R53", description: "Mal estar e fadiga", category: "Sintomas" },
  { code: "R68", description: "Outros sintomas e sinais gerais", category: "Sintomas" },
  
  // Lesões e envenenamentos (S00-T98)
  { code: "S72", description: "Fratura do fêmur", category: "Traumatológicas" },
  { code: "T78", description: "Efeitos adversos não especificados", category: "Traumatológicas" },
  
  // Fatores que influenciam o estado de saúde (Z00-Z99)
  { code: "Z00", description: "Exame médico geral", category: "Preventivas" },
  { code: "Z01", description: "Outros exames e investigações especiais", category: "Preventivas" },
  { code: "Z51", description: "Outros cuidados médicos", category: "Preventivas" }
];

export function CID10Selector({ value, onValueChange, placeholder = "Buscar CID-10..." }: CID10SelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [filteredCodes, setFilteredCodes] = useState<CID10Code[]>(CID10_DATABASE);

  useEffect(() => {
    if (!searchValue) {
      setFilteredCodes(CID10_DATABASE);
      return;
    }

    const filtered = CID10_DATABASE.filter((item) => {
      const searchTerm = searchValue.toLowerCase();
      return (
        item.code.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm)
      );
    });

    setFilteredCodes(filtered.slice(0, 20)); // Limitar a 20 resultados
  }, [searchValue]);

  const selectedCode = CID10_DATABASE.find((code) => code.code === value);

  return (
    <div className="space-y-2">
      <Label htmlFor="cid-selector">Código CID-10</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="cid-selector"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedCode ? (
              <span className="flex items-center">
                <span className="font-mono text-xs bg-gray-100 px-1 rounded mr-2">
                  {selectedCode.code}
                </span>
                <span className="truncate">{selectedCode.description}</span>
              </span>
            ) : (
              placeholder
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput
              placeholder="Digite para buscar CID-10..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandEmpty>Nenhum código encontrado.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {filteredCodes.map((code) => (
                <CommandItem
                  key={code.code}
                  value={code.code}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                  className="flex items-center"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === code.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center">
                      <span className="font-mono text-xs bg-gray-100 px-1 rounded mr-2">
                        {code.code}
                      </span>
                      <span className="text-xs text-gray-500 bg-blue-50 px-1 rounded">
                        {code.category}
                      </span>
                    </div>
                    <span className="text-sm text-left">{code.description}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}