import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, Image, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExtractedPatient {
    name: string;
    cpf?: string | null;
    birthDate?: string | null;
    gender?: string | null;
    phone?: string | null;
    email?: string | null;
    bloodType?: string | null;
    insuranceName?: string | null;
    city?: string | null;
    state?: string | null;
    confidence: number;
    source: string;
}

export default function BulkImportPage() {
    const [, setLocation] = useLocation();
    const [files, setFiles] = useState<File[]>([]);
    const [extractedPatients, setExtractedPatients] = useState<ExtractedPatient[]>([]);
    const [selectedPatients, setSelectedPatients] = useState<Set<number>>(new Set());
    const [isExtracting, setIsExtracting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [duplicates, setDuplicates] = useState<any[]>([]);
    const [errors, setErrors] = useState<Array<{ file: string; error: string }>>([]);
    const [summary, setSummary] = useState<any>(null);
    const { toast } = useToast();

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg'],
            'application/pdf': ['.pdf'],
            'text/csv': ['.csv'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
        },
        maxFiles: 10
    });

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleExtract = async () => {
        if (files.length === 0) {
            toast({
                title: "Nenhum arquivo selecionado",
                description: "Por favor, adicione pelo menos um arquivo para processar.",
                variant: "destructive"
            });
            return;
        }

        setIsExtracting(true);
        setErrors([]);
        setSummary(null);

        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file);
            });

            const response = await fetch('/api/patients/bulk-import/extract', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Erro ao processar arquivos');
            }

            const data = await response.json();

            setExtractedPatients(data.patients || []);
            setDuplicates(data.duplicates || []);
            setErrors(data.errors || []);
            setSummary(data.summary);

            // Select all non-duplicate patients by default
            const nonDuplicateIndices = new Set<number>();
            data.patients.forEach((patient: ExtractedPatient, index: number) => {
                const isDuplicate = data.duplicates.some((dup: any) =>
                    dup.name.toLowerCase() === patient.name.toLowerCase() ||
                    (patient.cpf && dup.cpf === patient.cpf)
                );
                if (!isDuplicate) {
                    nonDuplicateIndices.add(index);
                }
            });
            setSelectedPatients(nonDuplicateIndices);

            toast({
                title: "Extração concluída!",
                description: `${data.totalExtracted} paciente(s) encontrado(s). ${data.duplicates.length} duplicata(s) detectada(s).`
            });
        } catch (error) {
            toast({
                title: "Erro na extração",
                description: error instanceof Error ? error.message : "Erro desconhecido",
                variant: "destructive"
            });
        } finally {
            setIsExtracting(false);
        }
    };

    const handleImport = async () => {
        const patientsToImport = extractedPatients.filter((_, index) => selectedPatients.has(index));

        if (patientsToImport.length === 0) {
            toast({
                title: "Nenhum paciente selecionado",
                description: "Selecione pelo menos um paciente para importar.",
                variant: "destructive"
            });
            return;
        }

        setIsImporting(true);

        try {
            const response = await fetch('/api/patients/bulk-import/confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    patients: patientsToImport,
                    skipDuplicates: true
                }),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Erro ao importar pacientes');
            }

            const data = await response.json();

            toast({
                title: "Importação concluída!",
                description: `${data.created.length} paciente(s) importado(s) com sucesso. ${data.skipped} ignorado(s).`
            });

            // Reset state
            setFiles([]);
            setExtractedPatients([]);
            setSelectedPatients(new Set());
            setDuplicates([]);
            setErrors([]);
            setSummary(null);

        } catch (error) {
            toast({
                title: "Erro na importação",
                description: error instanceof Error ? error.message : "Erro desconhecido",
                variant: "destructive"
            });
        } finally {
            setIsImporting(false);
        }
    };

    const togglePatient = (index: number) => {
        setSelectedPatients(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const toggleAll = () => {
        if (selectedPatients.size === extractedPatients.length) {
            setSelectedPatients(new Set());
        } else {
            setSelectedPatients(new Set(extractedPatients.map((_, i) => i)));
        }
    };

    const getFileIcon = (file: File) => {
        if (file.type.startsWith('image/')) return <Image className="w-4 h-4" />;
        if (file.type === 'application/pdf') return <FileText className="w-4 h-4" />;
        return <FileSpreadsheet className="w-4 h-4" />;
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.9) return "text-green-600";
        if (confidence >= 0.7) return "text-yellow-600";
        return "text-red-600";
    };

    const isDuplicate = (patient: ExtractedPatient) => {
        return duplicates.some(dup =>
            dup.name.toLowerCase() === patient.name.toLowerCase() ||
            (patient.cpf && dup.cpf === patient.cpf)
        );
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            <div className="mb-8">
                <Button
                    variant="ghost"
                    className="mb-4 pl-0 hover:bg-transparent hover:text-primary"
                    onClick={() => setLocation("/health-trends")}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar para Vita Timeline
                </Button>
                <h1 className="text-3xl font-bold mb-2">Importação em Massa de Pacientes</h1>
                <p className="text-muted-foreground">
                    Importe múltiplos pacientes de uma vez usando fotos, PDFs ou planilhas. A IA extrairá automaticamente os dados.
                </p>
            </div>

            {/* Upload Zone */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>1. Adicionar Arquivos</CardTitle>
                    <CardDescription>
                        Arraste arquivos ou clique para selecionar. Suporta imagens (JPG, PNG), PDFs e planilhas (CSV, Excel).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'
                            }`}
                    >
                        <input {...getInputProps()} />
                        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        {isDragActive ? (
                            <p className="text-lg">Solte os arquivos aqui...</p>
                        ) : (
                            <>
                                <p className="text-lg mb-2">Arraste arquivos aqui ou clique para selecionar</p>
                                <p className="text-sm text-muted-foreground">
                                    Máximo 10 arquivos, 10MB cada
                                </p>
                            </>
                        )}
                    </div>

                    {files.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <h3 className="font-semibold">Arquivos selecionados ({files.length}):</h3>
                            {files.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <div className="flex items-center gap-2">
                                        {getFileIcon(file)}
                                        <span className="text-sm">{file.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            ({(file.size / 1024).toFixed(1)} KB)
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFile(index)}
                                    >
                                        <XCircle className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    <Button
                        className="mt-4 w-full"
                        onClick={handleExtract}
                        disabled={files.length === 0 || isExtracting}
                    >
                        {isExtracting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processando com IA...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4 mr-2" />
                                Extrair Dados com IA
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Summary */}
            {summary && (
                <Alert className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Resumo:</strong> {summary.patientsExtracted} paciente(s) extraído(s) de {summary.totalFiles} arquivo(s).
                        {summary.duplicatesFound > 0 && ` ${summary.duplicatesFound} duplicata(s) encontrada(s).`}
                        {summary.errorsCount > 0 && ` ${summary.errorsCount} erro(s) encontrado(s).`}
                    </AlertDescription>
                </Alert>
            )}

            {/* Errors */}
            {errors.length > 0 && (
                <Alert variant="destructive" className="mb-6">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Erros encontrados:</strong>
                        <ul className="mt-2 list-disc list-inside">
                            {errors.map((error, index) => (
                                <li key={index}>{error.file}: {error.error}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            {/* Preview Table */}
            {extractedPatients.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>2. Revisar e Confirmar</CardTitle>
                        <CardDescription>
                            Revise os dados extraídos e selecione quais pacientes importar. Pacientes duplicados estão marcados em vermelho.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    checked={selectedPatients.size === extractedPatients.length}
                                    onCheckedChange={toggleAll}
                                />
                                <span className="text-sm font-medium">
                                    Selecionar todos ({selectedPatients.size} de {extractedPatients.length})
                                </span>
                            </div>
                            <Button
                                onClick={handleImport}
                                disabled={selectedPatients.size === 0 || isImporting}
                            >
                                {isImporting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Importando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Importar Selecionados ({selectedPatients.size})
                                    </>
                                )}
                            </Button>
                        </div>

                        <div className="border rounded-lg overflow-auto max-h-[600px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12"></TableHead>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>CPF</TableHead>
                                        <TableHead>Data Nasc.</TableHead>
                                        <TableHead>Telefone</TableHead>
                                        <TableHead>Cidade</TableHead>
                                        <TableHead>Convênio</TableHead>
                                        <TableHead>Confiança</TableHead>
                                        <TableHead>Origem</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {extractedPatients.map((patient, index) => {
                                        const isPatientDuplicate = isDuplicate(patient);
                                        return (
                                            <TableRow
                                                key={index}
                                                className={isPatientDuplicate ? "bg-red-50" : ""}
                                            >
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedPatients.has(index)}
                                                        onCheckedChange={() => togglePatient(index)}
                                                        disabled={isPatientDuplicate}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {patient.name}
                                                    {isPatientDuplicate && (
                                                        <span className="ml-2 text-xs text-red-600">(Duplicado)</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>{patient.cpf || '-'}</TableCell>
                                                <TableCell>{patient.birthDate || '-'}</TableCell>
                                                <TableCell>{patient.phone || '-'}</TableCell>
                                                <TableCell>{patient.city || '-'}</TableCell>
                                                <TableCell>{patient.insuranceName || '-'}</TableCell>
                                                <TableCell>
                                                    <span className={getConfidenceColor(patient.confidence)}>
                                                        {(patient.confidence * 100).toFixed(0)}%
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {patient.source}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
