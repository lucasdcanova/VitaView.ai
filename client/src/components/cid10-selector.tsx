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
          <div className="flex flex-col">
            <div className="p-3 border-b">
              <Input
                placeholder="Digite para buscar CID-10..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full"
              />
            </div>
            <div 
              className="p-1" 
              style={{ 
                maxHeight: '256px', 
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {isLoading && (
                <div className="p-4 text-center text-gray-500">
                  Carregando...
                </div>
              )}
              {!isLoading && searchValue.length < 2 && (
                <div className="p-4 text-center text-gray-500">
                  Digite pelo menos 2 caracteres
                </div>
              )}
              {!isLoading && searchValue.length >= 2 && filteredCodes.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  Nenhum código encontrado
                </div>
              )}
              {filteredCodes.map((code) => (
                <div
                  key={code.code}
                  onClick={() => {
                    onValueChange(code.code);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center p-2 cursor-pointer rounded hover:bg-gray-100",
                    value === code.code ? "bg-blue-50 border border-blue-200" : ""
                  )}
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
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}