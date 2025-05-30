import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export function CID10Selector({ value, onValueChange, placeholder = "Buscar CID-10..." }: CID10SelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [filteredCodes, setFilteredCodes] = useState<CID10Code[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar base apenas quando necessário
  const searchCodes = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return (term: string) => {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(async () => {
        if (!term.trim() || term.length < 2) {
          setFilteredCodes([]);
          return;
        }

        setIsLoading(true);
        
        try {
          // Importação dinâmica para carregar apenas quando necessário
          const { CID10_DATABASE } = await import("@/data/cid10-database");
          
          const searchTerm = term.toLowerCase();
          const filtered = CID10_DATABASE.filter((item) => {
            return (
              item.code.toLowerCase().includes(searchTerm) ||
              item.description.toLowerCase().includes(searchTerm) ||
              item.category.toLowerCase().includes(searchTerm)
            );
          });

          setFilteredCodes(filtered.slice(0, 15)); // Reduzir para 15 resultados
        } catch (error) {
          console.error('Erro ao carregar base CID-10:', error);
          setFilteredCodes([]);
        } finally {
          setIsLoading(false);
        }
      }, 300); // Debounce de 300ms
    };
  }, []);

  useEffect(() => {
    searchCodes(searchValue);
  }, [searchValue, searchCodes]);

  // Buscar código selecionado dinamicamente quando necessário
  const [selectedCode, setSelectedCode] = useState<CID10Code | null>(null);
  
  useEffect(() => {
    if (!value) {
      setSelectedCode(null);
      return;
    }
    
    // Carregar base apenas para encontrar o código selecionado
    import("@/data/cid10-database").then(({ CID10_DATABASE }) => {
      const found = CID10_DATABASE.find((code) => code.code === value);
      setSelectedCode(found || null);
    });
  }, [value]);

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
            <CommandEmpty>
              {isLoading ? "Carregando..." : searchValue.length < 2 ? "Digite pelo menos 2 caracteres" : "Nenhum código encontrado."}
            </CommandEmpty>
            <ScrollArea className="h-64">
              <CommandGroup>
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
            </ScrollArea>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}