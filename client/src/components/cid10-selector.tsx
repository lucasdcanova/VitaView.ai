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
import { CID10_DATABASE } from "@/data/cid10-database";

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