import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, FlaskConical, ScanLine, Package } from "lucide-react";
import { ALL_EXAMS, EXAM_DATABASE } from "@/constants/exam-database";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ExamSelectorProps {
    onAddExam: (exam: { name: string; type: 'laboratorial' | 'imagem' | 'outros' }) => void;
}

export function ExamSelector({ onAddExam }: ExamSelectorProps) {
    const [searchValue, setSearchValue] = useState("");

    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchValue);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchValue]);

    const { data: searchResults, isLoading } = useQuery({
        queryKey: ['tuss-search', debouncedSearch],
        queryFn: async () => {
            if (!debouncedSearch) return [];
            const res = await apiRequest("GET", `/api/tuss/search?q=${encodeURIComponent(debouncedSearch)}`);
            return res.json();
        },
        enabled: debouncedSearch.length > 1
    });

    const filteredExams = useMemo(() => {
        if (!searchValue) return [];
        if (searchResults && Array.isArray(searchResults)) return searchResults;
        // Fallback or loading state handled in UI
        return [];
    }, [searchValue, searchResults]);


    const handleAdd = (exam: typeof ALL_EXAMS[0]) => {
        onAddExam(exam);
        // Optional: clear search after add? Keep it for rapid entry.
        // setSearchValue(""); 
    };

    return (
        <div className="space-y-4">
            {/* Search Area */}
            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Buscar exames (ex: Hemograma, Raio-X, TSH)..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="pl-9 h-10 bg-white shadow-sm border-gray-200 focus:border-blue-300 transition-all"
                />
            </div>

            {/* Results or Categories */}
            <div className="min-h-[300px] bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                {searchValue ? (
                    <ScrollArea className="h-[400px]">
                        <div className="p-2 space-y-1">
                            {isLoading && searchValue ? (
                                <div className="p-4 text-center text-gray-400">
                                    <span className="animate-pulse">Buscando na tabela TUSS...</span>
                                </div>
                            ) : filteredExams.length > 0 ? (

                                filteredExams.map((exam, idx) => (
                                    <button
                                        key={`${exam.name}-${idx}`}
                                        onClick={() => handleAdd(exam)}
                                        className="w-full text-left px-3 py-2 rounded-md hover:bg-blue-50 transition-colors flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-1.5 rounded-full",
                                                exam.type === 'laboratorial' ? "bg-purple-100 text-purple-600" : "bg-sky-100 text-sky-600"
                                            )}>
                                                {exam.type === 'laboratorial' ? <FlaskConical className="h-3.5 w-3.5" /> : <ScanLine className="h-3.5 w-3.5" />}
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-gray-900 block">{exam.name}</span>
                                                <span className="text-xs text-gray-500">{exam.category}</span>
                                            </div>
                                        </div>
                                        <Plus className="h-4 w-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-400">
                                    <p>Nenhum exame encontrado.</p>
                                    <Button
                                        variant="link"
                                        className="mt-2 text-blue-600 h-auto p-0"
                                        onClick={() => onAddExam({ name: searchValue, type: 'outros' })}
                                    >
                                        Adicionar "{searchValue}" como personalizado
                                    </Button>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                ) : (
                    <Tabs defaultValue="lab" className="h-full flex flex-col">
                        <div className="px-4 pt-3 border-b border-gray-100">
                            <TabsList className="bg-transparent p-0 gap-4">
                                <TabsTrigger
                                    value="lab"
                                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none px-0 pb-2 text-gray-500 hover:text-gray-800"
                                >
                                    Laboratoriais
                                </TabsTrigger>
                                <TabsTrigger
                                    value="img"
                                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-sky-500 rounded-none px-0 pb-2 text-gray-500 hover:text-gray-800"
                                >
                                    Imagem
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="lab" className="flex-1 p-0 m-0">
                            <ScrollArea className="h-[400px]">
                                <div className="p-2 space-y-1">
                                    {EXAM_DATABASE.laboratorial.map((exam, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => onAddExam({ ...exam, type: 'laboratorial' })}
                                            className="w-full text-left px-3 py-2 rounded-md hover:bg-purple-50 transition-colors flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <FlaskConical className="h-3.5 w-3.5 text-purple-400" />
                                                <div>
                                                    <span className="text-sm text-gray-700 block">{exam.name}</span>
                                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">{exam.category}</span>
                                                </div>
                                            </div>
                                            <Plus className="h-3 w-3 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="img" className="flex-1 p-0 m-0">
                            <ScrollArea className="h-[400px]">
                                <div className="p-2 space-y-1">
                                    {EXAM_DATABASE.imagem.map((exam, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => onAddExam({ ...exam, type: 'imagem' })}
                                            className="w-full text-left px-3 py-2 rounded-md hover:bg-sky-50 transition-colors flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <ScanLine className="h-3.5 w-3.5 text-sky-400" />
                                                <div>
                                                    <span className="text-sm text-gray-700 block">{exam.name}</span>
                                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">{exam.category}</span>
                                                </div>
                                            </div>
                                            <Plus className="h-3 w-3 text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </div>
    );
}
