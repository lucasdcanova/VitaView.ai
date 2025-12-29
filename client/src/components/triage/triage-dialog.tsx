import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Activity, Stethoscope } from "lucide-react";

interface TriageDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointmentId: number;
    patientName: string;
    profileId?: number;
    existingTriage?: any;
}

const MANCHESTER_PRIORITIES = [
    { value: "emergent", label: "Emergente", color: "bg-red-500", time: "Imediato" },
    { value: "very_urgent", label: "Muito Urgente", color: "bg-orange-500", time: "10 min" },
    { value: "urgent", label: "Urgente", color: "bg-yellow-500", time: "60 min" },
    { value: "standard", label: "Pouco Urgente", color: "bg-green-500", time: "120 min" },
    { value: "non_urgent", label: "Não Urgente", color: "bg-blue-500", time: "240 min" },
];

const MANCHESTER_DISCRIMINATORS = [
    "Dor torácica",
    "Dispneia",
    "Alteração do nível de consciência",
    "Convulsão",
    "Hemorragia",
    "Dor abdominal",
    "Trauma",
    "Febre",
    "Vômitos",
    "Cefaleia",
    "Outro"
];

export function TriageDialog({ open, onOpenChange, appointmentId, patientName, profileId, existingTriage }: TriageDialogProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("anamnesis");

    // Anamnese
    const [chiefComplaint, setChiefComplaint] = useState(existingTriage?.chiefComplaint || "");
    const [currentIllnessHistory, setCurrentIllnessHistory] = useState(existingTriage?.currentIllnessHistory || "");
    const [painScale, setPainScale] = useState(existingTriage?.painScale?.toString() || "");

    // Sinais vitais
    const [systolicBp, setSystolicBp] = useState(existingTriage?.systolicBp?.toString() || "");
    const [diastolicBp, setDiastolicBp] = useState(existingTriage?.diastolicBp?.toString() || "");
    const [heartRate, setHeartRate] = useState(existingTriage?.heartRate?.toString() || "");
    const [respiratoryRate, setRespiratoryRate] = useState(existingTriage?.respiratoryRate?.toString() || "");
    const [temperature, setTemperature] = useState(existingTriage?.temperature || "");
    const [oxygenSaturation, setOxygenSaturation] = useState(existingTriage?.oxygenSaturation?.toString() || "");
    const [bloodGlucose, setBloodGlucose] = useState(existingTriage?.bloodGlucose?.toString() || "");
    const [weight, setWeight] = useState(existingTriage?.weight || "");
    const [height, setHeight] = useState(existingTriage?.height?.toString() || "");

    // Manchester
    const [manchesterPriority, setManchesterPriority] = useState(existingTriage?.manchesterPriority || "standard");
    const [manchesterDiscriminator, setManchesterDiscriminator] = useState(existingTriage?.manchesterDiscriminator || "");
    const [notes, setNotes] = useState(existingTriage?.notes || "");

    const handleSave = async () => {
        if (!chiefComplaint.trim()) {
            toast({
                title: "Erro",
                description: "A queixa principal é obrigatória",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const triageData = {
                appointmentId,
                profileId,
                chiefComplaint,
                currentIllnessHistory: currentIllnessHistory || null,
                painScale: painScale ? parseInt(painScale) : null,
                systolicBp: systolicBp ? parseInt(systolicBp) : null,
                diastolicBp: diastolicBp ? parseInt(diastolicBp) : null,
                heartRate: heartRate ? parseInt(heartRate) : null,
                respiratoryRate: respiratoryRate ? parseInt(respiratoryRate) : null,
                temperature: temperature || null,
                oxygenSaturation: oxygenSaturation ? parseInt(oxygenSaturation) : null,
                bloodGlucose: bloodGlucose ? parseInt(bloodGlucose) : null,
                weight: weight || null,
                height: height ? parseInt(height) : null,
                manchesterPriority,
                manchesterDiscriminator: manchesterDiscriminator || null,
                notes: notes || null,
            };

            const url = existingTriage
                ? `/api/triage/${existingTriage.id}`
                : "/api/triage";

            const method = existingTriage ? "PATCH" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(triageData),
            });

            if (!response.ok) throw new Error("Erro ao salvar triagem");

            toast({
                title: "Sucesso",
                description: existingTriage ? "Triagem atualizada com sucesso" : "Triagem registrada com sucesso",
            });

            onOpenChange(false);
        } catch (error) {
            console.error("Error saving triage:", error);
            toast({
                title: "Erro",
                description: "Não foi possível salvar a triagem",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const selectedPriority = MANCHESTER_PRIORITIES.find(p => p.value === manchesterPriority);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Stethoscope className="h-5 w-5" />
                        {existingTriage ? "Editar Triagem" : "Realizar Triagem"}
                    </DialogTitle>
                    <DialogDescription>
                        Paciente: <span className="font-semibold">{patientName}</span>
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="anamnesis">Anamnese</TabsTrigger>
                        <TabsTrigger value="vitals">Sinais Vitais</TabsTrigger>
                        <TabsTrigger value="manchester">Manchester</TabsTrigger>
                    </TabsList>

                    <TabsContent value="anamnesis" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="chiefComplaint">Queixa Principal *</Label>
                            <Textarea
                                id="chiefComplaint"
                                placeholder="Ex: Dor torácica há 2 horas"
                                value={chiefComplaint}
                                onChange={(e) => setChiefComplaint(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="currentIllnessHistory">História da Doença Atual</Label>
                            <Textarea
                                id="currentIllnessHistory"
                                placeholder="Descreva a evolução dos sintomas..."
                                value={currentIllnessHistory}
                                onChange={(e) => setCurrentIllnessHistory(e.target.value)}
                                rows={4}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="painScale">Escala de Dor (0-10)</Label>
                            <Input
                                id="painScale"
                                type="number"
                                min="0"
                                max="10"
                                placeholder="0 = sem dor, 10 = dor máxima"
                                value={painScale}
                                onChange={(e) => setPainScale(e.target.value)}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="vitals" className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="systolicBp">PA Sistólica (mmHg)</Label>
                                <Input
                                    id="systolicBp"
                                    type="number"
                                    placeholder="120"
                                    value={systolicBp}
                                    onChange={(e) => setSystolicBp(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="diastolicBp">PA Diastólica (mmHg)</Label>
                                <Input
                                    id="diastolicBp"
                                    type="number"
                                    placeholder="80"
                                    value={diastolicBp}
                                    onChange={(e) => setDiastolicBp(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="heartRate">Frequência Cardíaca (bpm)</Label>
                                <Input
                                    id="heartRate"
                                    type="number"
                                    placeholder="72"
                                    value={heartRate}
                                    onChange={(e) => setHeartRate(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="respiratoryRate">Frequência Respiratória (rpm)</Label>
                                <Input
                                    id="respiratoryRate"
                                    type="number"
                                    placeholder="16"
                                    value={respiratoryRate}
                                    onChange={(e) => setRespiratoryRate(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="temperature">Temperatura (°C)</Label>
                                <Input
                                    id="temperature"
                                    type="number"
                                    step="0.1"
                                    placeholder="36.5"
                                    value={temperature}
                                    onChange={(e) => setTemperature(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="oxygenSaturation">SpO2 (%)</Label>
                                <Input
                                    id="oxygenSaturation"
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="98"
                                    value={oxygenSaturation}
                                    onChange={(e) => setOxygenSaturation(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bloodGlucose">Glicemia (mg/dL)</Label>
                                <Input
                                    id="bloodGlucose"
                                    type="number"
                                    placeholder="90"
                                    value={bloodGlucose}
                                    onChange={(e) => setBloodGlucose(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="weight">Peso (kg)</Label>
                                <Input
                                    id="weight"
                                    type="number"
                                    step="0.1"
                                    placeholder="70.5"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="height">Altura (cm)</Label>
                                <Input
                                    id="height"
                                    type="number"
                                    placeholder="170"
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* IMC Calculation */}
                        {weight && height && parseFloat(weight) > 0 && parseFloat(height) > 0 && (
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-medium text-blue-900">IMC (Índice de Massa Corporal)</div>
                                        <div className="text-xs text-blue-700 mt-1">
                                            {(() => {
                                                const bmi = parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2);
                                                let classification = "";
                                                let color = "";

                                                if (bmi < 18.5) {
                                                    classification = "Abaixo do peso";
                                                    color = "text-yellow-700";
                                                } else if (bmi < 25) {
                                                    classification = "Peso normal";
                                                    color = "text-green-700";
                                                } else if (bmi < 30) {
                                                    classification = "Sobrepeso";
                                                    color = "text-orange-700";
                                                } else if (bmi < 35) {
                                                    classification = "Obesidade Grau I";
                                                    color = "text-red-700";
                                                } else if (bmi < 40) {
                                                    classification = "Obesidade Grau II";
                                                    color = "text-red-800";
                                                } else {
                                                    classification = "Obesidade Grau III";
                                                    color = "text-red-900";
                                                }

                                                return (
                                                    <span className={color}>
                                                        {classification}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-blue-900">
                                        {(parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1)}
                                    </div>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="manchester" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label>Prioridade de Manchester *</Label>
                            <div className="grid grid-cols-1 gap-2">
                                {MANCHESTER_PRIORITIES.map((priority) => (
                                    <button
                                        key={priority.value}
                                        type="button"
                                        onClick={() => setManchesterPriority(priority.value)}
                                        className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${manchesterPriority === priority.value
                                            ? "border-primary bg-primary/5"
                                            : "border-gray-200 hover:border-gray-300"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-4 h-4 rounded-full ${priority.color}`} />
                                            <div className="text-left">
                                                <div className="font-semibold">{priority.label}</div>
                                                <div className="text-sm text-gray-500">Tempo: {priority.time}</div>
                                            </div>
                                        </div>
                                        {manchesterPriority === priority.value && (
                                            <Activity className="h-5 w-5 text-primary" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="discriminator">Discriminador</Label>
                            <Select value={manchesterDiscriminator} onValueChange={setManchesterDiscriminator}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um discriminador" />
                                </SelectTrigger>
                                <SelectContent>
                                    {MANCHESTER_DISCRIMINATORS.map((disc) => (
                                        <SelectItem key={disc} value={disc}>
                                            {disc}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Observações</Label>
                            <Textarea
                                id="notes"
                                placeholder="Observações adicionais sobre a triagem..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={4}
                            />
                        </div>

                        {selectedPriority && (
                            <div className={`flex items-start gap-2 p-3 rounded-lg ${selectedPriority.color} bg-opacity-10 border border-current`}>
                                <AlertCircle className="h-5 w-5 mt-0.5" />
                                <div className="text-sm">
                                    <div className="font-semibold">Prioridade: {selectedPriority.label}</div>
                                    <div>Tempo de espera máximo: {selectedPriority.time}</div>
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {existingTriage ? "Atualizar" : "Salvar"} Triagem
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
