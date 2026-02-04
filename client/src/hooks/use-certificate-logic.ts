import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { generateCertificatePDF } from "@/lib/certificate-pdf";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Certificate } from "@shared/schema";

interface PatientData {
    id: number;
    userId: number;
    name: string;
    cpf?: string | null;
}

export function useCertificateLogic(patient: PatientData) {
    const { toast } = useToast();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // --- Certificate State ---
    const [certType, setCertType] = useState<'afastamento' | 'comparecimento' | 'acompanhamento' | 'aptidao' | 'laudo'>("afastamento");
    const [certDays, setCertDays] = useState("1");
    const [certStartTime, setCertStartTime] = useState("");
    const [certEndTime, setCertEndTime] = useState("");
    const [certCid, setCertCid] = useState("");
    const [patientDoc, setPatientDoc] = useState("");
    const [certCity, setCertCity] = useState("");
    const [customCertText, setCustomCertText] = useState("");

    // Initialize patient doc from profile
    useEffect(() => {
        if (patient?.cpf) {
            setPatientDoc(patient.cpf);
        }
    }, [patient]);

    // Initialize city from user's profile
    useEffect(() => {
        if (user?.address) {
            setCertCity(user.address);
        }
    }, [user]);

    const { data: certificateHistory = [] } = useQuery<Certificate[]>({
        queryKey: [`/api/certificates/patient/${patient.id}`],
        enabled: !!patient.id
    });

    const createCertificateMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/certificates", data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/certificates/patient/${patient.id}`] });
            toast({ title: "Sucesso", description: "Atestado salvo e gerado!" });
        },
        onError: (err) => {
            console.error(err);
            toast({ title: "Erro", description: "Falha ao salvar atestado.", variant: "destructive" });
        }
    });

    const handleSaveAndPrintCertificate = async () => {
        if (!user) {
            toast({ title: "Erro", description: "Usuário não identificado. Faça login novamente.", variant: "destructive" });
            return;
        }

        const doctorName = user.fullName || user.username || "Dr. VitaView";
        const doctorCrm = user.crm || "CRM pendente";

        // Open tab immediately to avoid blocker
        const newTab = window.open('', '_blank');
        if (newTab) {
            newTab.document.write('<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;"><div>Salvando e Gerando Atestado...</div></body></html>');
        }

        createCertificateMutation.mutateAsync({
            profileId: patient.id,
            userId: patient.userId,
            doctorName,
            doctorCrm,
            patientName: patient.name,
            patientDoc: patientDoc,
            type: certType,
            issueDate: new Date().toISOString(),
            daysOff: certType === 'afastamento' ? certDays : undefined,
            startTime: certType === 'comparecimento' ? certStartTime : undefined,
            endTime: certType === 'comparecimento' ? certEndTime : undefined,
            cid: certCid || undefined,
            city: certCity,
            customText: customCertText || undefined,
            status: 'active'
        }).then(async (savedData) => {
            // Generate PDF Client-side
            try {
                const blob = generateCertificatePDF({
                    type: savedData.type as any,
                    doctorName: savedData.doctorName,
                    doctorCrm: savedData.doctorCrm,
                    patientName: savedData.patientName,
                    patientDoc: savedData.patientDoc,
                    issueDate: savedData.issueDate,
                    daysOff: savedData.daysOff,
                    startTime: savedData.startTime,
                    endTime: savedData.endTime,
                    cid: savedData.cid,
                    city: savedData.city,
                    customText: savedData.customText
                });

                const url = window.URL.createObjectURL(blob);
                if (newTab) newTab.location.href = url;
            } catch (e) {
                console.error(e);
                newTab?.close();
                toast({ title: "Erro", description: "Atestado salvo, mas falha ao gerar PDF.", variant: "destructive" });
            }
        }).catch(() => {
            newTab?.close();
        });
    };

    const handleReprintCertificate = async (c: Certificate) => {
        const newTab = window.open('', '_blank');
        if (newTab) {
            newTab.document.write('<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;"><div>Gerando PDF...</div></body></html>');
        }

        try {
            const blob = generateCertificatePDF({
                type: c.type as any,
                doctorName: c.doctorName,
                doctorCrm: c.doctorCrm,
                patientName: c.patientName,
                patientDoc: c.patientDoc || undefined,
                issueDate: c.issueDate,
                daysOff: c.daysOff || undefined,
                startTime: c.startTime || undefined,
                endTime: c.endTime || undefined,
                cid: c.cid || undefined,
                city: c.city || undefined,
                customText: c.customText || undefined
            });

            const url = window.URL.createObjectURL(blob);
            if (newTab) newTab.location.href = url;
            else window.open(url, '_blank');

        } catch (err) {
            console.error("Erro PDF:", err);
            newTab?.close();
            toast({ title: "Erro", description: "Falha ao gerar PDF.", variant: "destructive" });
        }
    };

    return {
        // State
        certType, setCertType,
        certDays, setCertDays,
        certStartTime, setCertStartTime,
        certEndTime, setCertEndTime,
        certCid, setCertCid,
        patientDoc, setPatientDoc,
        certCity, setCertCity,
        customCertText, setCustomCertText,

        // Data
        certificateHistory,

        // Actions
        handleSaveAndPrintCertificate,
        handleReprintCertificate,
        isPending: createCertificateMutation.isPending,
        user
    };
}
