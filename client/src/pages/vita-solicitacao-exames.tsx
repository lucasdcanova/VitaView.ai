import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { generateExamRequestPDF, type ExamRequestData } from "@/lib/exam-request-pdf";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    FileText,
    Search,
    Plus,
    PlusCircle,
    Trash2,
    Printer,
    History,
    FlaskConical,
    ScanLine,
    Pencil,
    ChevronsUpDown,
    Check,
    X,
    Package,
    Baby,
    HeartPulse,
    Activity,
    Stethoscope
} from "lucide-react";
import { FeatureGate } from '@/components/ui/feature-gate';
import { cn } from "@/lib/utils";

// Banco de dados de exames comuns - EXPANDIDO
const EXAM_DATABASE = {
    laboratorial: [
        // Hematologia
        { name: "Hemograma completo", category: "Hematologia" },
        { name: "Reticulócitos", category: "Hematologia" },
        { name: "Contagem de plaquetas", category: "Hematologia" },
        { name: "Tipagem sanguínea ABO-Rh", category: "Hematologia" },
        { name: "Coombs direto", category: "Hematologia" },
        { name: "Coombs indireto", category: "Hematologia" },
        // Bioquímica - Glicemia
        { name: "Glicemia de jejum", category: "Glicemia" },
        { name: "Glicemia pós-prandial", category: "Glicemia" },
        { name: "Hemoglobina glicada (HbA1c)", category: "Glicemia" },
        { name: "Curva glicêmica (TTOG 75g)", category: "Glicemia" },
        { name: "Frutosamina", category: "Glicemia" },
        // Lipidograma
        { name: "Colesterol total", category: "Lipidograma" },
        { name: "HDL-colesterol", category: "Lipidograma" },
        { name: "LDL-colesterol", category: "Lipidograma" },
        { name: "VLDL-colesterol", category: "Lipidograma" },
        { name: "Triglicerídeos", category: "Lipidograma" },
        { name: "Apolipoproteína A1", category: "Lipidograma" },
        { name: "Apolipoproteína B", category: "Lipidograma" },
        { name: "Lipoproteína (a)", category: "Lipidograma" },
        // Função Renal
        { name: "Ureia", category: "Função Renal" },
        { name: "Creatinina", category: "Função Renal" },
        { name: "Ácido úrico", category: "Função Renal" },
        { name: "Clearance de creatinina", category: "Função Renal" },
        { name: "Cistatina C", category: "Função Renal" },
        { name: "Microalbuminúria", category: "Função Renal" },
        { name: "Relação albumina/creatinina urinária", category: "Função Renal" },
        // Função Hepática
        { name: "TGO (AST)", category: "Função Hepática" },
        { name: "TGP (ALT)", category: "Função Hepática" },
        { name: "Gama GT", category: "Função Hepática" },
        { name: "Fosfatase alcalina", category: "Função Hepática" },
        { name: "Bilirrubinas totais e frações", category: "Função Hepática" },
        { name: "Albumina", category: "Função Hepática" },
        { name: "Proteínas totais e frações", category: "Função Hepática" },
        { name: "LDH (Desidrogenase láctica)", category: "Função Hepática" },
        { name: "Amilase", category: "Função Hepática" },
        { name: "Lipase", category: "Função Hepática" },
        // Tireoide
        { name: "TSH", category: "Tireoide" },
        { name: "T4 livre", category: "Tireoide" },
        { name: "T4 total", category: "Tireoide" },
        { name: "T3 livre", category: "Tireoide" },
        { name: "T3 total", category: "Tireoide" },
        { name: "Anti-TPO", category: "Tireoide" },
        { name: "Anti-tireoglobulina", category: "Tireoide" },
        { name: "Tireoglobulina", category: "Tireoide" },
        // Vitaminas e Minerais
        { name: "Vitamina D (25-OH)", category: "Vitaminas" },
        { name: "Vitamina B12", category: "Vitaminas" },
        { name: "Ácido fólico", category: "Vitaminas" },
        { name: "Vitamina B1 (Tiamina)", category: "Vitaminas" },
        { name: "Vitamina B6", category: "Vitaminas" },
        { name: "Zinco", category: "Vitaminas" },
        { name: "Selênio", category: "Vitaminas" },
        // Metabolismo do Ferro
        { name: "Ferritina", category: "Ferro" },
        { name: "Ferro sérico", category: "Ferro" },
        { name: "Capacidade total de ligação do ferro (TIBC)", category: "Ferro" },
        { name: "Índice de saturação de transferrina", category: "Ferro" },
        { name: "Transferrina", category: "Ferro" },
        // Eletrólitos
        { name: "Sódio", category: "Eletrólitos" },
        { name: "Potássio", category: "Eletrólitos" },
        { name: "Cálcio total", category: "Eletrólitos" },
        { name: "Cálcio iônico", category: "Eletrólitos" },
        { name: "Magnésio", category: "Eletrólitos" },
        { name: "Fósforo", category: "Eletrólitos" },
        { name: "Cloro", category: "Eletrólitos" },
        // Coagulação
        { name: "Tempo de protrombina (TP)", category: "Coagulação" },
        { name: "INR", category: "Coagulação" },
        { name: "TTPa", category: "Coagulação" },
        { name: "Fibrinogênio", category: "Coagulação" },
        { name: "D-dímero", category: "Coagulação" },
        { name: "Tempo de sangramento", category: "Coagulação" },
        // Hormônios
        { name: "Beta-HCG quantitativo", category: "Hormônios" },
        { name: "Prolactina", category: "Hormônios" },
        { name: "Cortisol", category: "Hormônios" },
        { name: "Insulina basal", category: "Hormônios" },
        { name: "HOMA-IR", category: "Hormônios" },
        { name: "FSH", category: "Hormônios" },
        { name: "LH", category: "Hormônios" },
        { name: "Estradiol", category: "Hormônios" },
        { name: "Progesterona", category: "Hormônios" },
        { name: "Testosterona total", category: "Hormônios" },
        { name: "Testosterona livre", category: "Hormônios" },
        { name: "DHEA-S", category: "Hormônios" },
        { name: "PTH (Paratormônio)", category: "Hormônios" },
        { name: "GH (Hormônio do crescimento)", category: "Hormônios" },
        { name: "IGF-1", category: "Hormônios" },
        // Marcadores Tumorais
        { name: "PSA total", category: "Marcadores Tumorais" },
        { name: "PSA livre", category: "Marcadores Tumorais" },
        { name: "CEA", category: "Marcadores Tumorais" },
        { name: "CA 125", category: "Marcadores Tumorais" },
        { name: "CA 19-9", category: "Marcadores Tumorais" },
        { name: "CA 15-3", category: "Marcadores Tumorais" },
        { name: "AFP (Alfafetoproteína)", category: "Marcadores Tumorais" },
        // Urinálise
        { name: "EAS (Urina tipo I)", category: "Urinálise" },
        { name: "Urina 24h (proteínas)", category: "Urinálise" },
        { name: "Urina 24h (creatinina)", category: "Urinálise" },
        { name: "Urina 24h (cálcio)", category: "Urinálise" },
        { name: "Urina 24h (ácido úrico)", category: "Urinálise" },
        // Microbiologia
        { name: "Urocultura com antibiograma", category: "Microbiologia" },
        { name: "Cultura de secreção vaginal", category: "Microbiologia" },
        { name: "Cultura de secreção uretral", category: "Microbiologia" },
        { name: "Hemocultura", category: "Microbiologia" },
        { name: "Coprocultura", category: "Microbiologia" },
        // Inflamação e Autoimunidade
        { name: "PCR (Proteína C-reativa)", category: "Inflamação" },
        { name: "PCR ultrassensível", category: "Inflamação" },
        { name: "VHS (Velocidade de hemossedimentação)", category: "Inflamação" },
        { name: "FAN (Fator antinuclear)", category: "Autoimunidade" },
        { name: "Fator reumatoide", category: "Autoimunidade" },
        { name: "Anti-CCP", category: "Autoimunidade" },
        { name: "Complemento C3", category: "Autoimunidade" },
        { name: "Complemento C4", category: "Autoimunidade" },
        // Sorologias
        { name: "HIV 1 e 2 (anticorpos)", category: "Sorologia" },
        { name: "HTLV I e II", category: "Sorologia" },
        { name: "VDRL", category: "Sorologia" },
        { name: "FTA-ABS", category: "Sorologia" },
        { name: "Hepatite B - HBsAg", category: "Sorologia" },
        { name: "Hepatite B - Anti-HBs", category: "Sorologia" },
        { name: "Hepatite B - Anti-HBc total", category: "Sorologia" },
        { name: "Hepatite C - Anti-HCV", category: "Sorologia" },
        { name: "Toxoplasmose IgG e IgM", category: "Sorologia" },
        { name: "Rubéola IgG e IgM", category: "Sorologia" },
        { name: "Citomegalovírus IgG e IgM", category: "Sorologia" },
        { name: "Dengue IgG e IgM", category: "Sorologia" },
        { name: "Dengue NS1", category: "Sorologia" },
        // Parasitológico
        { name: "Parasitológico de fezes (3 amostras)", category: "Parasitologia" },
        { name: "Pesquisa de sangue oculto nas fezes", category: "Parasitologia" },
        // Cardíacos
        { name: "Troponina I", category: "Cardíaco" },
        { name: "CK-MB", category: "Cardíaco" },
        { name: "BNP (Peptídeo natriurético)", category: "Cardíaco" },
        { name: "NT-proBNP", category: "Cardíaco" },
        { name: "Homocisteína", category: "Cardíaco" },
    ],
    imagem: [
        // Radiologia
        { name: "Raio-X de tórax PA", category: "Radiologia" },
        { name: "Raio-X de tórax PA e perfil", category: "Radiologia" },
        { name: "Raio-X de coluna cervical", category: "Radiologia" },
        { name: "Raio-X de coluna torácica", category: "Radiologia" },
        { name: "Raio-X de coluna lombar", category: "Radiologia" },
        { name: "Raio-X de coluna lombossacra", category: "Radiologia" },
        { name: "Raio-X de bacia", category: "Radiologia" },
        { name: "Raio-X de mão e punho", category: "Radiologia" },
        { name: "Raio-X de joelho", category: "Radiologia" },
        { name: "Raio-X de tornozelo e pé", category: "Radiologia" },
        { name: "Raio-X de ombro", category: "Radiologia" },
        { name: "Raio-X de seios da face", category: "Radiologia" },
        { name: "Raio-X de abdome simples", category: "Radiologia" },
        // Ultrassonografia
        { name: "Ultrassonografia abdominal total", category: "Ultrassonografia" },
        { name: "Ultrassonografia abdominal superior", category: "Ultrassonografia" },
        { name: "Ultrassonografia de tireoide", category: "Ultrassonografia" },
        { name: "Ultrassonografia de mamas", category: "Ultrassonografia" },
        { name: "Ultrassonografia pélvica transvaginal", category: "Ultrassonografia" },
        { name: "Ultrassonografia pélvica suprapúbica", category: "Ultrassonografia" },
        { name: "Ultrassonografia de próstata via abdominal", category: "Ultrassonografia" },
        { name: "Ultrassonografia de próstata transretal", category: "Ultrassonografia" },
        { name: "Ultrassonografia de rins e vias urinárias", category: "Ultrassonografia" },
        { name: "Ultrassonografia de bolsa escrotal", category: "Ultrassonografia" },
        { name: "Ultrassonografia obstétrica", category: "Ultrassonografia" },
        { name: "Ultrassonografia obstétrica morfológica", category: "Ultrassonografia" },
        { name: "Ultrassonografia obstétrica com Doppler", category: "Ultrassonografia" },
        { name: "Ultrassonografia de partes moles", category: "Ultrassonografia" },
        { name: "Ultrassonografia de articulação", category: "Ultrassonografia" },
        { name: "Doppler de carótidas e vertebrais", category: "Ultrassonografia" },
        { name: "Doppler de membros inferiores arterial", category: "Ultrassonografia" },
        { name: "Doppler de membros inferiores venoso", category: "Ultrassonografia" },
        { name: "Doppler de membros superiores", category: "Ultrassonografia" },
        // Cardiologia
        { name: "Eletrocardiograma (ECG)", category: "Cardiologia" },
        { name: "Ecocardiograma transtorácico", category: "Cardiologia" },
        { name: "Ecocardiograma com Doppler", category: "Cardiologia" },
        { name: "Ecocardiograma de estresse", category: "Cardiologia" },
        { name: "Holter 24h", category: "Cardiologia" },
        { name: "MAPA 24h", category: "Cardiologia" },
        { name: "Teste ergométrico", category: "Cardiologia" },
        { name: "Cintilografia miocárdica", category: "Cardiologia" },
        // Tomografia
        { name: "Tomografia de crânio", category: "Tomografia" },
        { name: "Tomografia de tórax", category: "Tomografia" },
        { name: "Tomografia de tórax alta resolução", category: "Tomografia" },
        { name: "Tomografia de abdome total", category: "Tomografia" },
        { name: "Tomografia de abdome e pelve", category: "Tomografia" },
        { name: "Tomografia de coluna lombar", category: "Tomografia" },
        { name: "Tomografia de coluna cervical", category: "Tomografia" },
        { name: "Tomografia de seios da face", category: "Tomografia" },
        { name: "Angiotomografia de aorta", category: "Tomografia" },
        { name: "Angiotomografia coronariana", category: "Tomografia" },
        // Ressonância
        { name: "Ressonância magnética de crânio", category: "Ressonância" },
        { name: "Ressonância magnética de coluna cervical", category: "Ressonância" },
        { name: "Ressonância magnética de coluna torácica", category: "Ressonância" },
        { name: "Ressonância magnética de coluna lombar", category: "Ressonância" },
        { name: "Ressonância magnética de joelho", category: "Ressonância" },
        { name: "Ressonância magnética de ombro", category: "Ressonância" },
        { name: "Ressonância magnética de punho", category: "Ressonância" },
        { name: "Ressonância magnética de quadril", category: "Ressonância" },
        { name: "Ressonância magnética de pelve", category: "Ressonância" },
        { name: "Ressonância magnética de abdome", category: "Ressonância" },
        { name: "Ressonância magnética de mama", category: "Ressonância" },
        { name: "Ressonância magnética cardíaca", category: "Ressonância" },
        // Mamografia e Densitometria
        { name: "Mamografia bilateral", category: "Mamografia" },
        { name: "Mamografia digital bilateral", category: "Mamografia" },
        { name: "Densitometria óssea (coluna e fêmur)", category: "Densidade Óssea" },
        { name: "Densitometria óssea de corpo inteiro", category: "Densidade Óssea" },
        // Endoscopia
        { name: "Endoscopia digestiva alta", category: "Endoscopia" },
        { name: "Colonoscopia", category: "Endoscopia" },
        { name: "Retossigmoidoscopia", category: "Endoscopia" },
        // Outros
        { name: "Espirometria", category: "Pneumologia" },
        { name: "Polissonografia", category: "Neurologia" },
        { name: "Eletroencefalograma", category: "Neurologia" },
        { name: "Eletroneuromiografia", category: "Neurologia" },
        { name: "Audiometria", category: "Otorrino" },
        { name: "Impedanciometria", category: "Otorrino" },
        { name: "Fundoscopia", category: "Oftalmologia" },
        { name: "Tonometria", category: "Oftalmologia" },
    ],
};

// Protocolos clínicos - Conjuntos de exames por indicação
const EXAM_PROTOCOLS = [
    {
        id: "gestacao-1tri",
        name: "Gestação - 1º Trimestre",
        icon: Baby,
        color: "pink",
        description: "Exames de rotina pré-natal inicial",
        exams: [
            { name: "Hemograma completo", type: "laboratorial" as const },
            { name: "Tipagem sanguínea ABO-Rh", type: "laboratorial" as const },
            { name: "Coombs indireto", type: "laboratorial" as const },
            { name: "Glicemia de jejum", type: "laboratorial" as const },
            { name: "EAS (Urina tipo I)", type: "laboratorial" as const },
            { name: "Urocultura com antibiograma", type: "laboratorial" as const },
            { name: "VDRL", type: "laboratorial" as const },
            { name: "HIV 1 e 2 (anticorpos)", type: "laboratorial" as const },
            { name: "HTLV I e II", type: "laboratorial" as const },
            { name: "Hepatite B - HBsAg", type: "laboratorial" as const },
            { name: "Hepatite C - Anti-HCV", type: "laboratorial" as const },
            { name: "Toxoplasmose IgG e IgM", type: "laboratorial" as const },
            { name: "Rubéola IgG e IgM", type: "laboratorial" as const },
            { name: "Citomegalovírus IgG e IgM", type: "laboratorial" as const },
            { name: "TSH", type: "laboratorial" as const },
            { name: "T4 livre", type: "laboratorial" as const },
            { name: "Ultrassonografia obstétrica", type: "imagem" as const },
        ]
    },
    {
        id: "gestacao-2tri",
        name: "Gestação - 2º Trimestre",
        icon: Baby,
        color: "pink",
        description: "Exames de acompanhamento pré-natal",
        exams: [
            { name: "Hemograma completo", type: "laboratorial" as const },
            { name: "Glicemia de jejum", type: "laboratorial" as const },
            { name: "Curva glicêmica (TTOG 75g)", type: "laboratorial" as const },
            { name: "EAS (Urina tipo I)", type: "laboratorial" as const },
            { name: "Urocultura com antibiograma", type: "laboratorial" as const },
            { name: "Toxoplasmose IgG e IgM", type: "laboratorial" as const },
            { name: "Hepatite B - HBsAg", type: "laboratorial" as const },
            { name: "HIV 1 e 2 (anticorpos)", type: "laboratorial" as const },
            { name: "VDRL", type: "laboratorial" as const },
            { name: "Ultrassonografia obstétrica morfológica", type: "imagem" as const },
        ]
    },
    {
        id: "gestacao-3tri",
        name: "Gestação - 3º Trimestre",
        icon: Baby,
        color: "pink",
        description: "Exames finais do pré-natal",
        exams: [
            { name: "Hemograma completo", type: "laboratorial" as const },
            { name: "Glicemia de jejum", type: "laboratorial" as const },
            { name: "EAS (Urina tipo I)", type: "laboratorial" as const },
            { name: "Urocultura com antibiograma", type: "laboratorial" as const },
            { name: "VDRL", type: "laboratorial" as const },
            { name: "HIV 1 e 2 (anticorpos)", type: "laboratorial" as const },
            { name: "Hepatite B - HBsAg", type: "laboratorial" as const },
            { name: "Cultura de secreção vaginal", type: "laboratorial" as const },
            { name: "Ultrassonografia obstétrica com Doppler", type: "imagem" as const },
        ]
    },
    {
        id: "hipertensao",
        name: "Hipertensão",
        icon: HeartPulse,
        color: "red",
        description: "Avaliação inicial e follow-up HAS",
        exams: [
            { name: "Hemograma completo", type: "laboratorial" as const },
            { name: "Glicemia de jejum", type: "laboratorial" as const },
            { name: "Hemoglobina glicada (HbA1c)", type: "laboratorial" as const },
            { name: "Colesterol total", type: "laboratorial" as const },
            { name: "HDL-colesterol", type: "laboratorial" as const },
            { name: "LDL-colesterol", type: "laboratorial" as const },
            { name: "Triglicerídeos", type: "laboratorial" as const },
            { name: "Creatinina", type: "laboratorial" as const },
            { name: "Ureia", type: "laboratorial" as const },
            { name: "Ácido úrico", type: "laboratorial" as const },
            { name: "Potássio", type: "laboratorial" as const },
            { name: "Sódio", type: "laboratorial" as const },
            { name: "EAS (Urina tipo I)", type: "laboratorial" as const },
            { name: "Microalbuminúria", type: "laboratorial" as const },
            { name: "Eletrocardiograma (ECG)", type: "imagem" as const },
        ]
    },
    {
        id: "checkup-homem",
        name: "Check-up Homem (40+)",
        icon: Stethoscope,
        color: "indigo",
        description: "Avaliação de saúde preventiva",
        exams: [
            { name: "Hemograma completo", type: "laboratorial" as const },
            { name: "Glicemia de jejum", type: "laboratorial" as const },
            { name: "Hemoglobina glicada (HbA1c)", type: "laboratorial" as const },
            { name: "Colesterol total", type: "laboratorial" as const },
            { name: "HDL-colesterol", type: "laboratorial" as const },
            { name: "LDL-colesterol", type: "laboratorial" as const },
            { name: "Triglicerídeos", type: "laboratorial" as const },
            { name: "Creatinina", type: "laboratorial" as const },
            { name: "Ureia", type: "laboratorial" as const },
            { name: "Ácido úrico", type: "laboratorial" as const },
            { name: "TGO (AST)", type: "laboratorial" as const },
            { name: "TGP (ALT)", type: "laboratorial" as const },
            { name: "Gama GT", type: "laboratorial" as const },
            { name: "TSH", type: "laboratorial" as const },
            { name: "PSA total", type: "laboratorial" as const },
            { name: "PSA livre", type: "laboratorial" as const },
            { name: "Vitamina D (25-OH)", type: "laboratorial" as const },
            { name: "EAS (Urina tipo I)", type: "laboratorial" as const },
            { name: "Pesquisa de sangue oculto nas fezes", type: "laboratorial" as const },
            { name: "Eletrocardiograma (ECG)", type: "imagem" as const },
            { name: "Ultrassonografia abdominal total", type: "imagem" as const },
        ]
    },
    {
        id: "checkup-mulher",
        name: "Check-up Mulher (40+)",
        icon: Stethoscope,
        color: "blue",
        description: "Avaliação de saúde preventiva",
        exams: [
            { name: "Hemograma completo", type: "laboratorial" as const },
            { name: "Glicemia de jejum", type: "laboratorial" as const },
            { name: "Hemoglobina glicada (HbA1c)", type: "laboratorial" as const },
            { name: "Colesterol total", type: "laboratorial" as const },
            { name: "HDL-colesterol", type: "laboratorial" as const },
            { name: "LDL-colesterol", type: "laboratorial" as const },
            { name: "Triglicerídeos", type: "laboratorial" as const },
            { name: "Creatinina", type: "laboratorial" as const },
            { name: "Ureia", type: "laboratorial" as const },
            { name: "TGO (AST)", type: "laboratorial" as const },
            { name: "TGP (ALT)", type: "laboratorial" as const },
            { name: "TSH", type: "laboratorial" as const },
            { name: "T4 livre", type: "laboratorial" as const },
            { name: "Vitamina D (25-OH)", type: "laboratorial" as const },
            { name: "Cálcio total", type: "laboratorial" as const },
            { name: "Ferritina", type: "laboratorial" as const },
            { name: "EAS (Urina tipo I)", type: "laboratorial" as const },
            { name: "Pesquisa de sangue oculto nas fezes", type: "laboratorial" as const },
            { name: "Eletrocardiograma (ECG)", type: "imagem" as const },
            { name: "Mamografia bilateral", type: "imagem" as const },
            { name: "Ultrassonografia de mamas", type: "imagem" as const },
            { name: "Ultrassonografia pélvica transvaginal", type: "imagem" as const },
            { name: "Densitometria óssea (coluna e fêmur)", type: "imagem" as const },
        ]
    },
    {
        id: "anemia",
        name: "Anemia",
        icon: FlaskConical,
        color: "orange",
        description: "Diagnóstico diferencial de anemias",
        exams: [
            { name: "Hemograma completo", type: "laboratorial" as const },
            { name: "Reticulócitos", type: "laboratorial" as const },
            { name: "Ferritina", type: "laboratorial" as const },
            { name: "Ferro sérico", type: "laboratorial" as const },
            { name: "Capacidade total de ligação do ferro (TIBC)", type: "laboratorial" as const },
            { name: "Índice de saturação de transferrina", type: "laboratorial" as const },
            { name: "Vitamina B12", type: "laboratorial" as const },
            { name: "Ácido fólico", type: "laboratorial" as const },
            { name: "LDH (Desidrogenase láctica)", type: "laboratorial" as const },
            { name: "Bilirrubinas totais e frações", type: "laboratorial" as const },
            { name: "Coombs direto", type: "laboratorial" as const },
        ]
    },
    {
        id: "gastrointestinal",
        name: "Gastrointestinal",
        icon: Activity,
        color: "amber",
        description: "Avaliação hepática e pancreática",
        exams: [
            { name: "TGO (AST)", type: "laboratorial" as const },
            { name: "TGP (ALT)", type: "laboratorial" as const },
            { name: "Bilirrubinas totais e frações", type: "laboratorial" as const },
            { name: "Fosfatase alcalina", type: "laboratorial" as const },
            { name: "Gama GT", type: "laboratorial" as const },
            { name: "Amilase", type: "laboratorial" as const },
            { name: "Lipase", type: "laboratorial" as const },
            { name: "Albumina", type: "laboratorial" as const },
            { name: "Proteínas totais e frações", type: "laboratorial" as const },
        ]
    },
    {
        id: "ists",
        name: "Investigação de ISTs",
        icon: Activity,
        color: "purple",
        description: "Rastreio de infecções sexualmente transmissíveis",
        exams: [
            { name: "HIV 1 e 2 (anticorpos)", type: "laboratorial" as const },
            { name: "VDRL", type: "laboratorial" as const },
            { name: "FTA-ABS", type: "laboratorial" as const },
            { name: "Hepatite B - HBsAg", type: "laboratorial" as const },
            { name: "Hepatite B - Anti-HBs", type: "laboratorial" as const },
            { name: "Hepatite B - Anti-HBc total", type: "laboratorial" as const },
            { name: "Hepatite C - Anti-HCV", type: "laboratorial" as const },
            { name: "HTLV I e II", type: "laboratorial" as const },
            { name: "Cultura de secreção uretral", type: "laboratorial" as const },
            { name: "Cultura de secreção vaginal", type: "laboratorial" as const },
        ]
    },
];

// Todos os exames em uma lista única para busca
const ALL_EXAMS = [
    ...EXAM_DATABASE.laboratorial.map(e => ({ ...e, type: 'laboratorial' as const })),
    ...EXAM_DATABASE.imagem.map(e => ({ ...e, type: 'imagem' as const })),
];


// Interface para exame selecionado
interface SelectedExam {
    id: string;
    name: string;
    type: 'laboratorial' | 'imagem' | 'outros';
    notes?: string;
}

// Interface para tipo ExamRequest do backend
interface ExamRequestRecord {
    id: number;
    doctorName: string;
    doctorCrm: string;
    doctorSpecialty: string | null;
    exams: SelectedExam[];
    clinicalIndication: string | null;
    issueDate: string;
    status: string;
}

interface VitaSolicitacaoExamesProps {
    patient: {
        id: number;
        userId: number;
        name: string;
        birthDate?: string | null;
        cpf?: string | null;
        phone?: string | null;
        street?: string | null;
        number?: string | null;
        neighborhood?: string | null;
        city?: string | null;
        state?: string | null;
        cep?: string | null;
        planType?: string | null;
        insuranceCardNumber?: string | null;
    };
}

export default function VitaSolicitacaoExames({ patient }: VitaSolicitacaoExamesProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // State
    const [selectedExams, setSelectedExams] = useState<SelectedExam[]>([]);
    const [clinicalIndication, setClinicalIndication] = useState("");
    const [observations, setObservations] = useState("");
    const [searchValue, setSearchValue] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);
    const [editingRequestId, setEditingRequestId] = useState<number | null>(null);

    // State for Protocol Management
    const [createProtocolOpen, setCreateProtocolOpen] = useState(false);
    const [deleteMode, setDeleteMode] = useState(false);
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
    const [protocolsToDelete, setProtocolsToDelete] = useState<(number | string)[]>([]);
    const [newProtocolData, setNewProtocolData] = useState({
        name: "",
        icon: "FlaskConical",
        color: "blue",
        exams: [] as { name: string; type: 'laboratorial' | 'imagem' }[]
    });
    const [newProtocolSearch, setNewProtocolSearch] = useState("");

    // Reset create form when opening
    useEffect(() => {
        if (createProtocolOpen) {
            setNewProtocolData({
                name: "",
                icon: "FlaskConical",
                color: "blue",
                exams: []
            });
            setNewProtocolSearch("");
        }
    }, [createProtocolOpen]);

    // Query para histórico
    const { data: examRequestHistory = [] } = useQuery<ExamRequestRecord[]>({
        queryKey: [`/api/exam-requests/patient/${patient.id}`],
        enabled: !!patient.id,
    });

    // Query para protocolos customizados do usuário
    interface CustomProtocol {
        id: number;
        userId: number;
        name: string;
        description: string | null;
        icon: string;
        color: string;
        exams: { name: string; type: 'laboratorial' | 'imagem' }[];
        isDefault: boolean;
        createdAt: string;
        updatedAt: string;
    }

    const { data: customProtocols = [] } = useQuery<CustomProtocol[]>({
        queryKey: ['/api/exam-protocols'],
        enabled: !!user,
    });

    // Mutation para criar novo protocolo
    const createProtocolMutation = useMutation({
        mutationFn: async (data: { name: string; description?: string; exams: any[]; icon?: string; color?: string }) => {
            const res = await apiRequest("POST", "/api/exam-protocols", data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/exam-protocols'] });
            toast({ title: "Sucesso", description: "Protocolo salvo!" });
            setCreateProtocolOpen(false);
        },
        onError: (err) => {
            console.error(err);
            toast({ title: "Erro", description: "Falha ao salvar protocolo.", variant: "destructive" });
        }
    });

    // Bulk Delete Mutation
    const bulkDeleteMutation = useMutation({
        mutationFn: async (ids: (number | string)[]) => {
            const customProtocolIds = ids.filter(id => typeof id === 'number') as number[];
            const systemProtocolIds = ids.filter(id => typeof id === 'string') as string[];

            const promises = [];

            // 1. Delete custom protocols
            if (customProtocolIds.length > 0) {
                promises.push(...customProtocolIds.map(id => apiRequest("DELETE", `/api/exam-protocols/${id}`)));
            }

            // 2. Hide system protocols (update user preferences)
            if (systemProtocolIds.length > 0) {
                // Get current hidden protocols
                const currentPreferences = (user?.preferences as any) || {};
                const currentHidden = (currentPreferences.hiddenProtocolIds as string[]) || [];
                const newHidden = Array.from(new Set([...currentHidden, ...systemProtocolIds]));

                promises.push(apiRequest("PATCH", "/api/user/preferences", {
                    preferences: {
                        hiddenProtocolIds: newHidden
                    }
                }));
            }

            await Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/exam-protocols'] });
            queryClient.invalidateQueries({ queryKey: ['/api/user'] }); // Refresh user to update preferences
            toast({ title: "Sucesso", description: "Protocolos excluídos/ocultados!" });
            setDeleteMode(false);
            setProtocolsToDelete([]);
            setDeleteConfirmationOpen(false);
        },
        onError: (err) => {
            console.error(err);
            toast({ title: "Erro", description: "Falha ao excluir protocolos.", variant: "destructive" });
        }
    });

    // Mutation para criar solicitação
    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/exam-requests", data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/exam-requests/patient/${patient.id}`] });
            toast({ title: "Sucesso", description: "Solicitação de exames salva!" });
            resetForm();
        },
        onError: (err) => {
            console.error(err);
            toast({ title: "Erro", description: "Falha ao salvar solicitação.", variant: "destructive" });
        }
    });

    // Mutation para atualizar solicitação
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            const res = await apiRequest("PUT", `/api/exam-requests/${id}`, data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/exam-requests/patient/${patient.id}`] });
            toast({ title: "Sucesso", description: "Solicitação atualizada!" });
            resetForm();
        },
        onError: (err) => {
            console.error(err);
            toast({ title: "Erro", description: "Falha ao atualizar solicitação.", variant: "destructive" });
        }
    });

    const resetForm = () => {
        setSelectedExams([]);
        setClinicalIndication("");
        setObservations("");
        setEditingRequestId(null);
    };

    // Adicionar exame à lista
    const addExam = (exam: { name: string; type: 'laboratorial' | 'imagem' | 'outros' }) => {
        const id = `${Date.now()}-${Math.random()}`;
        setSelectedExams(prev => [...prev, { ...exam, id }]);
        setSearchOpen(false);
        setSearchValue("");
    };

    // Remover exame da lista
    const removeExam = (id: string) => {
        setSelectedExams(prev => prev.filter(e => e.id !== id));
    };

    // Atualizar observação de um exame
    const updateExamNotes = (id: string, notes: string) => {
        setSelectedExams(prev => prev.map(e => e.id === id ? { ...e, notes } : e));
    };

    // Salvar e imprimir
    const handleSaveAndPrint = async () => {
        if (selectedExams.length === 0) {
            toast({ title: "Lista vazia", description: "Adicione pelo menos um exame.", variant: "destructive" });
            return;
        }
        if (!user) {
            toast({ title: "Erro", description: "Usuário não identificado.", variant: "destructive" });
            return;
        }

        // Abrir janela antes do async para evitar bloqueio de popup
        const pdfWindow = window.open('', '_blank');
        if (pdfWindow) {
            pdfWindow.document.write('<html><head><title>Gerando Solicitação...</title></head><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;"><div><h2>Gerando Solicitação...</h2><p>Por favor, aguarde.</p></div></body></html>');
        }

        const doctorName = user.fullName || user.username || "Dr. VitaView";
        const doctorCrm = user.crm || "CRM pendente";
        const doctorSpecialty = user.specialty || "Clínica Médica";

        const requestData = {
            profileId: patient.id,
            userId: patient.userId,
            doctorName,
            doctorCrm,
            doctorSpecialty,
            exams: selectedExams.map(e => ({
                name: e.name,
                type: e.type,
                notes: e.notes
            })),
            clinicalIndication: clinicalIndication || undefined,
            observations: observations || undefined,
            issueDate: new Date().toISOString(),
            status: 'pending'
        };

        try {
            let savedData;
            if (editingRequestId) {
                savedData = await updateMutation.mutateAsync({ id: editingRequestId, data: requestData });
            } else {
                savedData = await createMutation.mutateAsync(requestData);
            }

            // Gerar PDF
            if (pdfWindow) {
                const pdfData: ExamRequestData = {
                    doctorName: savedData.doctorName,
                    doctorCrm: savedData.doctorCrm,
                    doctorSpecialty: savedData.doctorSpecialty || undefined,
                    doctorRqe: (user as any)?.rqe || undefined,
                    patientName: patient.name,
                    patientCpf: patient.cpf || undefined,
                    patientBirthDate: patient.birthDate || undefined,
                    patientAddress: patient.street ? `${patient.street}${patient.number ? `, ${patient.number}` : ""}${patient.neighborhood ? ` - ${patient.neighborhood}` : ""}${patient.city ? `, ${patient.city}` : ""}${patient.state ? ` - ${patient.state}` : ""}` : undefined,
                    patientPhone: patient.phone || undefined,
                    patientInsurance: patient.planType ? `${patient.planType}${patient.insuranceCardNumber ? ` - ${patient.insuranceCardNumber}` : ""}` : undefined,
                    issueDate: new Date(savedData.issueDate),
                    exams: savedData.exams as any[],
                    clinicalIndication: savedData.clinicalIndication || undefined,
                    observations: savedData.observations || undefined
                };
                generateExamRequestPDF(pdfData, pdfWindow);
            }

            toast({ title: "Sucesso", description: editingRequestId ? "Solicitação atualizada!" : "Solicitação salva!" });
            resetForm();

        } catch (error) {
            console.error(error);
            if (pdfWindow) pdfWindow.close();
            toast({ title: "Erro", description: "Falha ao salvar solicitação.", variant: "destructive" });
        }
    };

    // Carregar solicitação para edição
    const handleEditRequest = (request: ExamRequestRecord) => {
        setSelectedExams(request.exams.map((e, idx) => ({
            ...e,
            id: `edit-${request.id}-${idx}`
        })));
        setClinicalIndication(request.clinicalIndication || "");
        setEditingRequestId(request.id);
        toast({ title: "Solicitação carregada", description: "Edite e clique em Salvar." });
    };

    // Reimprimir solicitação
    const handleReprint = (request: ExamRequestRecord) => {
        const pdfData: ExamRequestData = {
            doctorName: request.doctorName,
            doctorCrm: request.doctorCrm,
            doctorSpecialty: request.doctorSpecialty || undefined,
            patientName: patient.name,
            patientCpf: patient.cpf || undefined,
            patientBirthDate: patient.birthDate || undefined,
            patientInsurance: patient.planType || undefined,
            issueDate: new Date(request.issueDate),
            exams: request.exams as any[],
            clinicalIndication: request.clinicalIndication || undefined,
        };
        generateExamRequestPDF(pdfData);
    };

    // Formatar nomes dos exames para exibição no histórico
    const formatExamNames = (exams: SelectedExam[]): string => {
        if (!exams || exams.length === 0) return "Nenhum exame";
        const names = exams.map(e => e.name.split(" ")[0]);
        if (names.length <= 3) {
            return names.join(", ");
        }
        return `${names.slice(0, 3).join(", ")} +${names.length - 3}`;
    };

    // Filtrar exames para busca
    const filteredExams = searchValue
        ? ALL_EXAMS.filter(e =>
            e.name.toLowerCase().includes(searchValue.toLowerCase()) ||
            e.category.toLowerCase().includes(searchValue.toLowerCase())
        )
        : ALL_EXAMS;

    return (
        <div className="space-y-6">
            {/* Card de Solicitação */}
            <Card className={`border-blue-100 shadow-md bg-gradient-to-b from-white to-blue-50/20 ${editingRequestId ? 'ring-2 ring-blue-400' : ''}`}>
                <CardHeader className={`border-b pb-4 ${editingRequestId ? 'bg-blue-50/50 border-blue-100' : 'bg-blue-50/30 border-blue-100'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                                {editingRequestId ? (
                                    <>
                                        <Pencil className="h-5 w-5 text-blue-700" />
                                        Editando Solicitação
                                    </>
                                ) : (
                                    <>
                                        <FlaskConical className="h-5 w-5 text-blue-700" />
                                        Solicitar Exames
                                    </>
                                )}
                            </CardTitle>
                            <CardDescription className="text-sm">
                                {editingRequestId
                                    ? "Modifique os exames e clique em Salvar para atualizar."
                                    : "Selecione os exames laboratoriais e de imagem a solicitar."}
                            </CardDescription>
                        </div>
                        {editingRequestId && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs text-gray-600 hover:text-red-600"
                                onClick={resetForm}
                            >
                                <X className="h-3 w-3 mr-1" /> Cancelar
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                    {/* Protocolos Clínicos */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                                <Package className="h-3 w-3" /> Protocolos Clínicos
                            </label>
                            <div className="flex items-center gap-2">
                                {/* Create Protocol Dialog */}
                                <Dialog open={createProtocolOpen} onOpenChange={setCreateProtocolOpen}>
                                    <DialogTrigger asChild>
                                        <FeatureGate feature="create-protocol">
                                            <Button size="sm" className="h-6 text-[10px] bg-blue-600 hover:bg-blue-700 text-white px-2">
                                                <PlusCircle className="h-3 w-3 mr-1" /> Criar
                                            </Button>
                                        </FeatureGate>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>Criar Novo Protocolo</DialogTitle>
                                            <DialogDescription>
                                                Configure o nome, aparência e exames do seu protocolo personalizado.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="p-name">Nome do Protocolo</Label>
                                                    <Input
                                                        id="p-name"
                                                        placeholder="Ex: Check-up Pessoal"
                                                        value={newProtocolData.name}
                                                        onChange={(e) => setNewProtocolData({ ...newProtocolData, name: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Ícone (Emoji)</Label>
                                                    <div className="flex gap-2">
                                                        {/* Simple emoji selection for MVP */}
                                                        {["🏥", "🩺", "❤️", "🧠", "🩸", "👶", "💊", "🦠"].map(emoji => (
                                                            <button
                                                                key={emoji}
                                                                type="button"
                                                                className={cn(
                                                                    "h-9 w-9 flex items-center justify-center rounded-md border text-lg transition-all",
                                                                    newProtocolData.icon === emoji ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200" : "border-gray-200 hover:bg-gray-50"
                                                                )}
                                                                onClick={() => setNewProtocolData({ ...newProtocolData, icon: emoji })}
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Cor de Destaque</Label>
                                                <div className="flex gap-2 flex-wrap">
                                                    {[
                                                        { id: "blue", bg: "bg-blue-500" },
                                                        { id: "green", bg: "bg-green-500" },
                                                        { id: "red", bg: "bg-red-500" },
                                                        { id: "purple", bg: "bg-purple-500" },
                                                        { id: "orange", bg: "bg-orange-500" },
                                                        { id: "amber", bg: "bg-amber-500" },
                                                        { id: "pink", bg: "bg-pink-500" },
                                                        { id: "teal", bg: "bg-teal-500" },
                                                    ].map(color => (
                                                        <button
                                                            key={color.id}
                                                            type="button"
                                                            className={cn(
                                                                "h-8 w-8 rounded-full border-2 transition-all",
                                                                color.bg,
                                                                newProtocolData.color === color.id ? "border-gray-900 scale-110 shadow-sm" : "border-transparent opacity-70 hover:opacity-100"
                                                            )}
                                                            onClick={() => setNewProtocolData({ ...newProtocolData, color: color.id })}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Adicionar Exames ({newProtocolData.exams.length})</Label>
                                                <div className="relative">
                                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                                    <Input
                                                        placeholder="Buscar exames..."
                                                        className="pl-9"
                                                        value={newProtocolSearch}
                                                        onChange={(e) => setNewProtocolSearch(e.target.value)}
                                                    />
                                                </div>
                                                {newProtocolSearch && (
                                                    <div className="border rounded-md max-h-40 overflow-y-auto mt-1 bg-white shadow-sm z-10 w-full absolute">
                                                        {ALL_EXAMS
                                                            .filter(e => e.name.toLowerCase().includes(newProtocolSearch.toLowerCase()))
                                                            .slice(0, 50)
                                                            .map(exam => (
                                                                <button
                                                                    key={exam.name}
                                                                    type="button"
                                                                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 flex items-center justify-between"
                                                                    onClick={() => {
                                                                        if (!newProtocolData.exams.find(e => e.name === exam.name)) {
                                                                            setNewProtocolData({
                                                                                ...newProtocolData,
                                                                                exams: [...newProtocolData.exams, { name: exam.name, type: exam.type as any }]
                                                                            });
                                                                        }
                                                                        setNewProtocolSearch("");
                                                                    }}
                                                                >
                                                                    <span>{exam.name}</span>
                                                                    <Plus className="h-3 w-3 text-blue-500" />
                                                                </button>
                                                            ))}
                                                    </div>
                                                )}

                                                <div className="border rounded-md p-2 min-h-[100px] max-h-[200px] overflow-y-auto bg-slate-50 space-y-1">
                                                    {newProtocolData.exams.length === 0 ? (
                                                        <p className="text-xs text-gray-400 text-center py-8">Nenhum exame adicionado</p>
                                                    ) : (
                                                        newProtocolData.exams.map((exam, idx) => (
                                                            <div key={idx} className="flex items-center justify-between bg-white px-2 py-1 rounded border text-sm">
                                                                <span>{exam.name}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setNewProtocolData({
                                                                        ...newProtocolData,
                                                                        exams: newProtocolData.exams.filter((_, i) => i !== idx)
                                                                    })}
                                                                    className="text-red-500 hover:text-red-700"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setCreateProtocolOpen(false)}>Cancelar</Button>
                                            <Button
                                                onClick={() => {
                                                    if (!newProtocolData.name) {
                                                        toast({ title: "Nome obrigatório", variant: "destructive" });
                                                        return;
                                                    }
                                                    if (newProtocolData.exams.length === 0) {
                                                        toast({ title: "Adicione exames", variant: "destructive" });
                                                        return;
                                                    }
                                                    createProtocolMutation.mutate({
                                                        ...newProtocolData,
                                                        description: `${newProtocolData.exams.length} exames`
                                                    });
                                                }}
                                                disabled={createProtocolMutation.isPending}
                                            >
                                                {createProtocolMutation.isPending ? "Salvando..." : "Criar Protocolo"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <AlertDialog open={deleteConfirmationOpen} onOpenChange={setDeleteConfirmationOpen}>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Excluir protocolos?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Você selecionou {protocolsToDelete.length} protocolos para exclusão. Esta ação não pode ser desfeita.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => bulkDeleteMutation.mutate(protocolsToDelete)}>
                                                Excluir
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>

                                {deleteMode ? (
                                    <>
                                        <span className="text-xs font-medium text-gray-500">
                                            {protocolsToDelete.length} selecionados
                                        </span>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="h-6 text-[10px]"
                                            onClick={() => {
                                                if (protocolsToDelete.length > 0) {
                                                    setDeleteConfirmationOpen(true);
                                                } else {
                                                    setDeleteMode(false);
                                                }
                                            }}
                                        >
                                            {protocolsToDelete.length > 0 ? "Confirmar Apagar" : "Cancelar"}
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-[10px] text-gray-400 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => setDeleteMode(true)}
                                    >
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        Apagar
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {/* Protocolos padrão do sistema - não apagáveis por enquanto */}
                            {EXAM_PROTOCOLS.filter(p => !((user?.preferences as any)?.hiddenProtocolIds as string[] | undefined)?.includes(p.id)).map(protocol => {
                                const Icon = protocol.icon;
                                const colorClasses = {
                                    pink: "hover:bg-pink-50 hover:border-pink-300 border-pink-200 bg-pink-50/50",
                                    red: "hover:bg-red-50 hover:border-red-300 border-red-200 bg-red-50/50",
                                    blue: "hover:bg-blue-50 hover:border-blue-300 border-blue-200 bg-blue-50/50",
                                    indigo: "hover:bg-indigo-50 hover:border-indigo-300 border-indigo-200 bg-indigo-50/50",
                                    purple: "hover:bg-purple-50 hover:border-purple-300 border-purple-200 bg-purple-50/50",
                                    amber: "hover:bg-amber-50 hover:border-amber-300 border-amber-200 bg-amber-50/50",
                                    orange: "hover:bg-orange-50 hover:border-orange-300 border-orange-200 bg-orange-50/50",
                                };
                                const iconColorClasses = {
                                    pink: "text-pink-600",
                                    red: "text-red-600",
                                    blue: "text-blue-600",
                                    indigo: "text-indigo-600",
                                    purple: "text-purple-600",
                                    amber: "text-amber-600",
                                    orange: "text-orange-600",
                                };

                                const isSelected = protocolsToDelete.includes(protocol.id);

                                return (
                                    <button
                                        key={protocol.id}
                                        type="button"
                                        title={protocol.description}
                                        className={cn(
                                            "flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all",
                                            deleteMode
                                                ? (isSelected ? "ring-2 ring-red-500 bg-red-50 border-red-200" : "opacity-60 hover:opacity-100 border-gray-200 hover:bg-gray-50")
                                                : (colorClasses[protocol.color as keyof typeof colorClasses] || "hover:bg-gray-50 border-gray-200")
                                        )}
                                        onClick={() => {
                                            if (deleteMode) {
                                                setProtocolsToDelete(prev =>
                                                    prev.includes(protocol.id)
                                                        ? prev.filter(id => id !== protocol.id)
                                                        : [...prev, protocol.id]
                                                );
                                                return;
                                            }

                                            const newExams = protocol.exams.map(e => ({
                                                id: `${Date.now()}-${Math.random()}-${e.name}`,
                                                name: e.name,
                                                type: e.type
                                            }));
                                            setSelectedExams(prev => {
                                                const existingNames = new Set(prev.map(ex => ex.name));
                                                const uniqueNewExams = newExams.filter(ex => !existingNames.has(ex.name));
                                                return [...prev, ...uniqueNewExams];
                                            });
                                            setClinicalIndication(prev =>
                                                prev ? prev : protocol.description
                                            );
                                            toast({
                                                title: `Protocolo: ${protocol.name}`,
                                                description: `${protocol.exams.length} exames adicionados`,
                                            });
                                        }}
                                    >
                                        <Icon className={cn("h-4 w-4 flex-shrink-0",
                                            deleteMode && isSelected ? "text-red-500" : (iconColorClasses[protocol.color as keyof typeof iconColorClasses] || "text-gray-600")
                                        )} />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-gray-900 whitespace-nowrap">{protocol.name}</span>
                                            <span className="text-[10px] text-gray-500">{protocol.exams.length} exames</span>
                                        </div>
                                    </button>
                                );
                            })}

                            {/* Protocolos customizados do usuário */}
                            {customProtocols.map(protocol => {
                                const isSelectedForDelete = protocolsToDelete.includes(protocol.id);

                                // Color logic for custom protocols
                                const protocolColor = protocol.color || 'blue';
                                const colorClasses = {
                                    blue: "border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300",
                                    green: "border-green-200 bg-green-50/50 hover:bg-green-50 hover:border-green-300",
                                    red: "border-red-200 bg-red-50/50 hover:bg-red-50 hover:border-red-300",
                                    purple: "border-purple-200 bg-purple-50/50 hover:bg-purple-50 hover:border-purple-300",
                                    orange: "border-orange-200 bg-orange-50/50 hover:bg-orange-50 hover:border-orange-300",
                                    amber: "border-amber-200 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-300",
                                    pink: "border-pink-200 bg-pink-50/50 hover:bg-pink-50 hover:border-pink-300",
                                    teal: "border-teal-200 bg-teal-50/50 hover:bg-teal-50 hover:border-teal-300",
                                };
                                const bgClass = colorClasses[protocolColor as keyof typeof colorClasses] || colorClasses.blue;

                                return (
                                    <button
                                        key={`custom-${protocol.id}`}
                                        type="button"
                                        title={protocol.description || protocol.name}
                                        className={cn(
                                            "relative w-full flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all",
                                            deleteMode
                                                ? (isSelectedForDelete ? "border-red-500 bg-red-50" : "border-gray-200 opacity-60 hover:opacity-100")
                                                : bgClass
                                        )}
                                        onClick={() => {
                                            if (deleteMode) {
                                                if (isSelectedForDelete) {
                                                    setProtocolsToDelete(prev => prev.filter(id => id !== protocol.id));
                                                } else {
                                                    setProtocolsToDelete(prev => [...prev, protocol.id]);
                                                }
                                            } else {
                                                // Default behavior: add exams
                                                const newExams = protocol.exams.map(e => ({
                                                    id: `${Date.now()}-${Math.random()}-${e.name}`,
                                                    name: e.name,
                                                    type: e.type
                                                }));
                                                setSelectedExams(prev => {
                                                    const existingNames = new Set(prev.map(ex => ex.name));
                                                    const uniqueNewExams = newExams.filter(ex => !existingNames.has(ex.name));
                                                    return [...prev, ...uniqueNewExams];
                                                });
                                                setClinicalIndication(prev =>
                                                    prev ? prev : protocol.description || protocol.name
                                                );
                                                toast({
                                                    title: `Protocolo: ${protocol.name}`,
                                                    description: `${protocol.exams.length} exames adicionados`,
                                                });
                                            }
                                        }}
                                    >
                                        {deleteMode && (
                                            <div className={cn(
                                                "h-4 w-4 rounded border flex items-center justify-center mr-1 transition-colors",
                                                isSelectedForDelete ? "bg-red-500 border-red-500 text-white" : "border-gray-400 bg-white"
                                            )}>
                                                {isSelectedForDelete && <X className="h-3 w-3" />}
                                            </div>
                                        )}

                                        {/* Icon rendering - handle both lucide names and emojis */}
                                        {protocol.icon && protocol.icon.length <= 2 ? (
                                            <span className="text-lg leading-none">{protocol.icon}</span>
                                        ) : (
                                            <FlaskConical className={cn("h-4 w-4 flex-shrink-0", `text-${protocolColor}-600`)} />
                                        )}

                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-xs font-medium text-gray-900 whitespace-nowrap truncate max-w-[120px]">{protocol.name}</span>
                                            <span className="text-[10px] text-gray-500">{protocol.exams.length} exames</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Buscar exame */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">Buscar Exame</label>
                        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={searchOpen}
                                    className="w-full justify-between font-normal h-10 text-sm bg-white"
                                >
                                    <span className="flex items-center gap-2 text-muted-foreground">
                                        <Search className="h-4 w-4" />
                                        Buscar exame laboratorial ou de imagem...
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                                <div className="flex items-center border-b px-3">
                                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                    <input
                                        className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                                        placeholder="Buscar exame..."
                                        value={searchValue}
                                        onChange={(e) => setSearchValue(e.target.value)}
                                    />
                                </div>
                                <div className="max-h-[300px] overflow-y-auto p-1">
                                    {/* Opção de digitar manualmente */}
                                    {searchValue && (
                                        <div
                                            className="flex items-center gap-2 rounded-sm px-2 py-2 text-sm cursor-pointer hover:bg-blue-50 border-b mb-1 bg-gradient-to-r from-blue-50 to-transparent"
                                            onClick={() => addExam({ name: searchValue, type: 'outros' })}
                                        >
                                            <span className="text-blue-600">✏️</span>
                                            <span className="flex-1 text-blue-700 font-medium">
                                                Digitar manualmente: "{searchValue}"
                                            </span>
                                        </div>
                                    )}

                                    {filteredExams.length === 0 && !searchValue ? (
                                        <p className="text-sm text-gray-500 text-center py-4">Nenhum exame encontrado.</p>
                                    ) : (
                                        <>
                                            {/* Laboratoriais */}
                                            {filteredExams.filter(e => e.type === 'laboratorial').length > 0 && (
                                                <>
                                                    <div className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-50">
                                                        <FlaskConical className="h-3 w-3 inline mr-1" /> Laboratoriais
                                                    </div>
                                                    {filteredExams.filter(e => e.type === 'laboratorial').slice(0, 15).map((exam) => (
                                                        <div
                                                            key={exam.name}
                                                            className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-green-50"
                                                            onClick={() => addExam({ name: exam.name, type: 'laboratorial' })}
                                                        >
                                                            <Check className={cn(
                                                                "h-4 w-4 text-green-600",
                                                                selectedExams.find(e => e.name === exam.name) ? "opacity-100" : "opacity-0"
                                                            )} />
                                                            <span className="flex-1">{exam.name}</span>
                                                            <span className="text-xs text-gray-400">{exam.category}</span>
                                                        </div>
                                                    ))}
                                                </>
                                            )}

                                            {/* Imagem */}
                                            {filteredExams.filter(e => e.type === 'imagem').length > 0 && (
                                                <>
                                                    <div className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 mt-1">
                                                        <ScanLine className="h-3 w-3 inline mr-1" /> Imagem
                                                    </div>
                                                    {filteredExams.filter(e => e.type === 'imagem').slice(0, 15).map((exam) => (
                                                        <div
                                                            key={exam.name}
                                                            className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-blue-50"
                                                            onClick={() => addExam({ name: exam.name, type: 'imagem' })}
                                                        >
                                                            <Check className={cn(
                                                                "h-4 w-4 text-blue-600",
                                                                selectedExams.find(e => e.name === exam.name) ? "opacity-100" : "opacity-0"
                                                            )} />
                                                            <span className="flex-1">{exam.name}</span>
                                                            <span className="text-xs text-gray-400">{exam.category}</span>
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Indicação Clínica */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">Indicação Clínica (opcional)</label>
                        <Textarea
                            className="h-16 text-sm bg-white resize-none"
                            placeholder="Ex: Investigação de diabetes, check-up anual..."
                            value={clinicalIndication}
                            onChange={(e) => setClinicalIndication(e.target.value)}
                        />
                    </div>

                    {/* Lista de exames selecionados */}
                    <div className="bg-white rounded-lg border border-gray-200 min-h-[120px] flex flex-col">
                        <div className="p-2 border-b bg-gray-50 flex justify-between items-center rounded-t-lg">
                            <span className="font-medium text-xs text-gray-700">Exames Selecionados ({selectedExams.length})</span>
                            {selectedExams.length > 0 && (
                                <Button variant="ghost" size="sm" className="text-xs text-red-500 h-6 px-2" onClick={() => setSelectedExams([])}>
                                    Limpar
                                </Button>
                            )}
                        </div>
                        <div className="p-2 space-y-2 flex-1 max-h-[200px] overflow-y-auto">
                            {selectedExams.length > 0 ? (
                                selectedExams.map((exam, idx) => (
                                    <div key={exam.id} className="flex items-start justify-between p-2 bg-gray-50 rounded-lg border border-gray-100 group">
                                        <div className="flex items-start gap-2 flex-1">
                                            <div className={cn(
                                                "h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5",
                                                exam.type === 'laboratorial' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                            )}>
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                                                    {exam.name}
                                                    <Badge variant="outline" className={cn(
                                                        "text-[10px] h-4",
                                                        exam.type === 'laboratorial' ? "border-green-300 text-green-700" : "border-blue-300 text-blue-700"
                                                    )}>
                                                        {exam.type === 'laboratorial' ? 'Lab' : exam.type === 'imagem' ? 'Img' : 'Outro'}
                                                    </Badge>
                                                </div>
                                                <Input
                                                    className="h-6 text-xs mt-1 bg-white"
                                                    placeholder="Observação (opcional)"
                                                    value={exam.notes || ""}
                                                    onChange={(e) => updateExamNotes(exam.id, e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeExam(exam.id)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-1 min-h-[80px]">
                                    <FileText className="h-6 w-6 opacity-20" />
                                    <p className="text-xs">Nenhum exame selecionado</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Botão Salvar */}
                    <div className="flex gap-2">
                        <Button
                            className={cn(
                                "flex-1 h-10 text-sm shadow-lg",
                                editingRequestId ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200" : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                            )}
                            onClick={handleSaveAndPrint}
                            disabled={createMutation.isPending || updateMutation.isPending || selectedExams.length === 0 || !user}
                        >
                            <Printer className="h-4 w-4 mr-1" />
                            {(createMutation.isPending || updateMutation.isPending)
                                ? "Salvando..."
                                : editingRequestId
                                    ? "Atualizar e Imprimir"
                                    : "Salvar e Imprimir"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Histórico */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <History className="h-5 w-5 text-gray-600" />
                        Histórico de Solicitações
                    </CardTitle>
                    <CardDescription className="text-sm">Solicitações de exames emitidas para este paciente.</CardDescription>
                </CardHeader>
                <CardContent>
                    {examRequestHistory.length > 0 ? (
                        <div className="space-y-2">
                            {examRequestHistory.map(req => (
                                <div key={req.id} className={`flex items-center justify-between p-3 rounded-lg border ${req.status === 'cancelled' ? 'bg-red-50 border-red-100 opacity-70' : 'bg-white border-gray-100 shadow-sm'}`}>
                                    <div className="flex gap-3 items-center">
                                        <div className="bg-blue-100 p-2 rounded-full hidden sm:block">
                                            <FlaskConical className="h-4 w-4 text-blue-700" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">{formatExamNames(req.exams)}</p>
                                            <p className="text-xs text-gray-500">{format(new Date(req.issueDate), "dd/MM/yyyy")} • Dr(a). {req.doctorName}</p>
                                            {req.status === 'cancelled' && <span className="text-xs text-red-600 font-bold">CANCELADA</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        {req.status !== 'cancelled' && (
                                            <>
                                                <Button variant="ghost" size="sm" className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleEditRequest(req)}>
                                                    <Pencil className="h-3 w-3 mr-1" /> Editar
                                                </Button>
                                                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleReprint(req)}>
                                                    <Printer className="h-3 w-3 mr-1" /> Reimprimir
                                                </Button>
                                            </>
                                        )}
                                        {req.status === 'cancelled' && (
                                            <Button disabled variant="outline" size="sm" className="h-8 opacity-50 text-xs">Cancelada</Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic">Nenhuma solicitação encontrada.</p>
                    )}
                </CardContent>
            </Card>
        </div >
    );
}
