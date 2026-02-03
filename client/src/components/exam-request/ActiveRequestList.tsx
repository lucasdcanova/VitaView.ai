import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, Printer, FileText, Search, Plus, FlaskConical, ScanLine, X, PlusCircle, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { EXAM_DATABASE, EXAM_PROTOCOLS, ALL_EXAMS } from "@/constants/exam-database";
import { CustomProtocol } from "@/hooks/use-exam-protocols";

interface SelectedExam {
    id: string;
    name: string;
    type: 'laboratorial' | 'imagem' | 'outros';
    notes?: string;
}

interface ActiveRequestListProps {
    selectedExams: SelectedExam[];
    clinicalIndication: string;
    setClinicalIndication: (val: string) => void;
    observations: string;
    setObservations: (val: string) => void;
    onRemoveExam: (id: string) => void;
    onUpdateExamNotes: (id: string, notes: string) => void;
    onSaveAndPrint: () => void;
    isEditing: boolean;
    onAddExam: (exam: { name: string; type: 'laboratorial' | 'imagem' | 'outros' }) => void;
    // Protocol props
    customProtocols?: CustomProtocol[];
    onApplyProtocol?: (exams: any[]) => void;
    protocolLogic?: {
        createProtocolOpen: boolean;
        setCreateProtocolOpen: (open: boolean) => void;
        deleteMode: boolean;
        setDeleteMode: (mode: boolean) => void;
        deleteConfirmationOpen: boolean;
        setDeleteConfirmationOpen: (open: boolean) => void;
        protocolsToDelete: (string | number)[];
        toggleProtocolToDelete: (id: string | number) => void;
        handleCreateProtocol: () => void;
        bulkDeleteMutation: any;
        newProtocolData: any;
        setNewProtocolData: (data: any) => void;
        newProtocolSearch: string;
        setNewProtocolSearch: (search: string) => void;
    };
}

export function ActiveRequestList({
    selectedExams,
    clinicalIndication,
    setClinicalIndication,
    observations,
    setObservations,
    onRemoveExam,
    onUpdateExamNotes,
    onSaveAndPrint,
    isEditing,
    onAddExam,
    customProtocols = [],
    onApplyProtocol,
    protocolLogic
}: ActiveRequestListProps) {
    const [searchValue, setSearchValue] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchValue);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchValue]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
        return [];
    }, [searchValue, searchResults]);

    const handleAdd = (exam: { name: string; type: 'laboratorial' | 'imagem' | 'outros'; category?: string }) => {
        onAddExam({ name: exam.name, type: exam.type });
        setSearchValue("");
        setIsSearchOpen(false);
    };

    // Helper for protocol creation dialog filtered exams - searches by name OR TUSS code
    const filteredExamsForProtocol = protocolLogic ? ALL_EXAMS.filter(exam =>
        exam.name.toLowerCase().includes(protocolLogic.newProtocolSearch.toLowerCase()) ||
        (exam.tuss && exam.tuss.includes(protocolLogic.newProtocolSearch))
    ).slice(0, 15) : [];

    // All protocols (system + custom)
    const allProtocols = [
        ...EXAM_PROTOCOLS.map(p => ({ ...p, isSystem: true })),
        ...customProtocols.map(p => ({ ...p, isSystem: false }))
    ];

    return (
        <Card className="border-gray-200 shadow-md h-fit">
            <CardHeader className="bg-gray-50 border-b border-gray-200 py-3">
                <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-700" />
                    {isEditing ? "Editando Solicitação" : "Nova Solicitação"}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {/* Quick Protocols Section - 3 per row */}
                {onApplyProtocol && protocolLogic && (
                    <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Protocolos Rápidos</span>
                            <div className="flex items-center gap-1">
                                {!protocolLogic.deleteMode ? (
                                    <>
                                        {/* Create Protocol Dialog */}
                                        <Dialog open={protocolLogic.createProtocolOpen} onOpenChange={protocolLogic.setCreateProtocolOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2">
                                                    <PlusCircle className="mr-1 h-3 w-3" />
                                                    Criar Novo
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                                                <DialogHeader>
                                                    <DialogTitle>Criar Novo Protocolo</DialogTitle>
                                                    <DialogDescription>
                                                        Crie um conjunto de exames para acesso rápido.
                                                    </DialogDescription>
                                                </DialogHeader>

                                                <div className="flex-1 overflow-y-auto py-4 space-y-6">
                                                    <div className="grid grid-cols-1 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>Nome do Protocolo</Label>
                                                            <Input
                                                                placeholder="Ex: Check-up Cardiológico"
                                                                value={protocolLogic.newProtocolData.name}
                                                                onChange={(e) => protocolLogic.setNewProtocolData({ ...protocolLogic.newProtocolData, name: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <Label>Selecionar Exames ({protocolLogic.newProtocolData.exams.length})</Label>
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                            <Input
                                                                placeholder="Buscar exames..."
                                                                value={protocolLogic.newProtocolSearch}
                                                                onChange={(e) => protocolLogic.setNewProtocolSearch(e.target.value)}
                                                                className="pl-9"
                                                            />
                                                        </div>

                                                        <div className="border rounded-md h-[250px] overflow-hidden flex flex-col">
                                                            <ScrollArea className="flex-1">
                                                                <div className="divide-y">
                                                                    {filteredExamsForProtocol.map((exam, idx) => {
                                                                        const isSelected = protocolLogic.newProtocolData.exams.some((e: any) => e.name === exam.name);
                                                                        return (
                                                                            <div
                                                                                key={idx}
                                                                                className={cn(
                                                                                    "flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors",
                                                                                    isSelected && "bg-gray-100"
                                                                                )}
                                                                                onClick={() => {
                                                                                    if (isSelected) {
                                                                                        protocolLogic.setNewProtocolData({
                                                                                            ...protocolLogic.newProtocolData,
                                                                                            exams: protocolLogic.newProtocolData.exams.filter((e: any) => e.name !== exam.name)
                                                                                        });
                                                                                    } else {
                                                                                        protocolLogic.setNewProtocolData({
                                                                                            ...protocolLogic.newProtocolData,
                                                                                            exams: [...protocolLogic.newProtocolData.exams, { name: exam.name, type: exam.type }]
                                                                                        });
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <div className="flex items-center gap-3">
                                                                                    <Checkbox checked={isSelected} />
                                                                                    <div>
                                                                                        <span className="text-sm block">
                                                                                            {exam.name}
                                                                                            {exam.tuss && <span className="ml-1 text-[10px] text-gray-400 font-mono">({exam.tuss})</span>}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                <Badge variant="outline" className="text-[10px] h-5">{exam.category}</Badge>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </ScrollArea>
                                                        </div>
                                                    </div>
                                                </div>

                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => protocolLogic.setCreateProtocolOpen(false)}>Cancelar</Button>
                                                    <Button onClick={protocolLogic.handleCreateProtocol} disabled={!protocolLogic.newProtocolData.name || protocolLogic.newProtocolData.exams.length === 0}>
                                                        Salvar Protocolo
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => protocolLogic.setDeleteMode(true)}
                                            className="h-6 text-[10px] text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2"
                                        >
                                            <Pencil className="mr-1 h-3 w-3" />
                                            Editar
                                        </Button>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-gray-500 mr-1">{protocolLogic.protocolsToDelete.length} sel.</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => protocolLogic.setDeleteMode(false)}
                                            className="h-6 text-[10px] px-2"
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            disabled={protocolLogic.protocolsToDelete.length === 0}
                                            onClick={() => protocolLogic.setDeleteConfirmationOpen(true)}
                                            className="h-6 text-[10px] px-2"
                                        >
                                            Excluir
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3-column protocol grid */}
                        <div className="grid grid-cols-3 gap-2">
                            {allProtocols.slice(0, 6).map((protocol) => {
                                const Icon = (protocol as any).icon || FileText;
                                const isDeleting = protocolLogic?.deleteMode && protocolLogic.protocolsToDelete.includes((protocol as any).id);

                                return (
                                    <button
                                        key={(protocol as any).id}
                                        className={cn(
                                            "relative flex items-center gap-2 p-2 rounded-lg border text-left transition-all",
                                            protocolLogic?.deleteMode
                                                ? isDeleting ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-red-200"
                                                : "bg-white border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                                        )}
                                        onClick={() => {
                                            if (protocolLogic?.deleteMode) {
                                                protocolLogic.toggleProtocolToDelete((protocol as any).id);
                                            } else {
                                                onApplyProtocol((protocol as any).exams);
                                            }
                                        }}
                                    >
                                        <div className="p-1.5 rounded-md flex-shrink-0 bg-gray-100">
                                            <Icon className="h-3.5 w-3.5 text-gray-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs font-medium text-gray-800 block truncate">{(protocol as any).name}</span>
                                            <span className="text-[10px] text-gray-500">{(protocol as any).exams?.length || 0} exames</span>
                                        </div>
                                        {protocolLogic?.deleteMode && (
                                            <Checkbox checked={isDeleting} className="absolute top-1 right-1 h-3.5 w-3.5 data-[state=checked]:bg-red-500" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Search Area - Dropdown style */}
                <div className="p-3 border-b border-gray-100 bg-white">
                    <div className="relative" ref={searchContainerRef}>
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                        <Input
                            id="exam-search"
                            placeholder="Buscar exames..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onFocus={() => setIsSearchOpen(true)}
                            className="pl-9 h-10 bg-white border-gray-300 focus:border-gray-500 transition-all pr-10"
                        />
                        {isSearchOpen && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1 h-8 w-8 p-0 z-10"
                                onClick={() => {
                                    setIsSearchOpen(false);
                                    setSearchValue("");
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}

                        {/* Dropdown with exam list - Only visible when search is open */}
                        {isSearchOpen && (
                            <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
                                {searchValue ? (
                                    <ScrollArea className="h-[250px]">
                                        <div className="p-2 space-y-1">
                                            {isLoading && searchValue ? (
                                                <div className="p-4 text-center text-gray-400">
                                                    <span className="animate-pulse">Buscando na tabela TUSS...</span>
                                                </div>
                                            ) : filteredExams.length > 0 ? (
                                                filteredExams.map((exam: any, idx: number) => (
                                                    <button
                                                        key={`${exam.name}-${idx}`}
                                                        onClick={() => handleAdd(exam)}
                                                        className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-between group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-1.5 rounded-full bg-gray-100 text-gray-600">
                                                                {exam.type === 'laboratorial' ? <FlaskConical className="h-3.5 w-3.5" /> : <ScanLine className="h-3.5 w-3.5" />}
                                                            </div>
                                                            <div>
                                                                <span className="text-sm font-medium text-gray-900 block">
                                                                    {exam.name}
                                                                    {exam.tuss && <span className="ml-2 text-[10px] text-gray-400 font-mono">({exam.tuss})</span>}
                                                                </span>
                                                                <span className="text-xs text-gray-500">{exam.category}</span>
                                                            </div>
                                                        </div>
                                                        <Plus className="h-4 w-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center text-gray-400">
                                                    <p>Nenhum exame encontrado.</p>
                                                    <Button
                                                        variant="link"
                                                        className="mt-2 text-gray-600 h-auto p-0"
                                                        onClick={() => {
                                                            onAddExam({ name: searchValue, type: 'outros' });
                                                            setSearchValue("");
                                                            setIsSearchOpen(false);
                                                        }}
                                                    >
                                                        Adicionar "{searchValue}" como personalizado
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                ) : (
                                    <ScrollArea className="h-[280px]">
                                        <div className="p-2 space-y-0.5">
                                            {/* All exams combined - lab first, then imaging */}
                                            {[
                                                ...EXAM_DATABASE.laboratorial.map(e => ({ ...e, type: 'laboratorial' as const })),
                                                ...EXAM_DATABASE.imagem.map(e => ({ ...e, type: 'imagem' as const }))
                                            ].map((exam, idx) => (
                                                <button
                                                    key={`${exam.type}-${idx}`}
                                                    onClick={() => handleAdd(exam)}
                                                    className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-between group"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-base">{exam.type === 'laboratorial' ? '🔬' : '📷'}</span>
                                                        <div>
                                                            <span className="text-sm text-gray-700 block">
                                                                {exam.name}
                                                                {exam.tuss && <span className="ml-1 text-[10px] text-gray-400 font-mono">({exam.tuss})</span>}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 uppercase tracking-wider">{exam.category}</span>
                                                        </div>
                                                    </div>
                                                    <Plus className="h-3 w-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Clinical Indication */}
                <div className="p-3 border-b border-gray-100 bg-white">
                    <Label htmlFor="clinical-indication" className="text-xs text-gray-600 mb-1.5 block">Indicação Clínica (opcional)</Label>
                    <Input
                        id="clinical-indication"
                        value={clinicalIndication}
                        onChange={(e) => setClinicalIndication(e.target.value)}
                        placeholder="Ex: Check-up anual, Investigação de anemia..."
                        className="bg-gray-50/50 h-9"
                    />
                </div>

                {/* Selected Exam List */}
                <div className="border-b border-gray-100">
                    <div className="px-3 py-2 bg-gray-50/50 flex items-center justify-between">
                        <span className="text-xs text-gray-600">
                            {selectedExams.length === 0 ? "Nenhum exame selecionado" : `${selectedExams.length} exame(s) selecionado(s)`}
                        </span>
                        {selectedExams.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => selectedExams.forEach(e => onRemoveExam(e.id))}
                                className="h-6 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50 px-2"
                            >
                                <X className="mr-1 h-3 w-3" />
                                Limpar
                            </Button>
                        )}
                    </div>
                </div>
                <div className="max-h-[250px] overflow-y-auto">
                    {selectedExams.length === 0 ? (
                        <div className="p-4 text-center text-gray-400">
                            <FileText className="h-6 w-6 mx-auto mb-1 opacity-20" />
                            <p className="text-xs">Utilize a busca ou protocolos acima</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {selectedExams.map((exam, index) => (
                                <div key={exam.id} className="p-2.5 hover:bg-gray-50 transition-colors group">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-mono text-gray-400 w-4">
                                                    {(index + 1).toString().padStart(2, '0')}
                                                </span>
                                                <span className="font-medium text-gray-900 text-sm">{exam.name}</span>
                                                <Badge variant="secondary" className="text-[9px] h-4 px-1 font-normal bg-gray-100 text-gray-500">
                                                    {exam.type}
                                                </Badge>
                                            </div>
                                            <Input
                                                placeholder="Observações (opcional)"
                                                value={exam.notes || ""}
                                                onChange={(e) => onUpdateExamNotes(exam.id, e.target.value)}
                                                className="mt-1.5 h-6 text-xs bg-transparent border-transparent hover:border-gray-200 focus:border-emerald-500 focus:bg-white transition-all px-0 hover:px-2"
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onRemoveExam(exam.id)}
                                            className="opacity-10 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:opacity-100 transition-all h-6 w-6 p-0"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-3 bg-gray-50 border-t border-gray-100 space-y-3">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] text-gray-500 uppercase font-semibold">Observações Gerais</Label>
                        <Textarea
                            value={observations}
                            onChange={(e) => setObservations(e.target.value)}
                            placeholder="Observações que sairão no rodapé do pedido..."
                            className="bg-white min-h-[60px] text-sm"
                        />
                    </div>

                    <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-10 text-sm shadow-sm"
                        onClick={onSaveAndPrint}
                        disabled={selectedExams.length === 0}
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        {isEditing ? "Salvar Alterações e Imprimir" : "Salvar Solicitação e Imprimir"}
                    </Button>
                </div>
            </CardContent>

            {/* Delete Confirmation Dialog */}
            {
                protocolLogic && (
                    <AlertDialog open={protocolLogic.deleteConfirmationOpen} onOpenChange={protocolLogic.setDeleteConfirmationOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Protocolos?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Você tem certeza que deseja excluir/ocultar os {protocolLogic.protocolsToDelete.length} protocolos selecionados?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => protocolLogic.bulkDeleteMutation.mutate(protocolLogic.protocolsToDelete)}
                                >
                                    {protocolLogic.bulkDeleteMutation.isPending ? "Excluindo..." : "Confirmar Exclusão"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )
            }
        </Card >
    );
}
