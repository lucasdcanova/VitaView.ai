// Tipos de receituário especial no Brasil
export const PRESCRIPTION_TYPES = {
    A: {
        name: "Receita A",
        color: "#FFC107",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-400",
        textColor: "text-yellow-800",
        description: "Entorpecentes (Opioides)",
        validity: "30 dias",
        copies: "1 via retida na farmácia + 1 via para paciente"
    },
    B1: {
        name: "Receita B1",
        color: "#2196F3",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-400",
        textColor: "text-blue-800",
        description: "Psicotrópicos (Ansiolíticos, Antidepressivos)",
        validity: "30 dias",
        copies: "1 via retida na farmácia + 1 via para paciente"
    },
    B2: {
        name: "Receita B2",
        color: "#3F51B5",
        bgColor: "bg-indigo-50",
        borderColor: "border-indigo-400",
        textColor: "text-indigo-800",
        description: "Psicotrópicos Anorexígenos",
        validity: "30 dias",
        copies: "1 via retida na farmácia + 1 via para paciente"
    },
    C: {
        name: "Receita C",
        color: "#9C27B0",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-400",
        textColor: "text-purple-800",
        description: "Retinoides, Imunossupressores",
        validity: "30 dias",
        copies: "2 vias (branca)"
    },
} as const;

export type PrescriptionTypeKey = keyof typeof PRESCRIPTION_TYPES;
