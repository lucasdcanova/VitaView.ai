import { useQuery } from "@tanstack/react-query";
import type { Prescription } from "@shared/schema";

export function usePrescriptionHistory(patientId: number) {
    const { data: prescriptions = [], isLoading } = useQuery<Prescription[]>({
        queryKey: [`/api/prescriptions/patient/${patientId}`],
        enabled: !!patientId
    });

    return {
        prescriptions,
        isLoading
    };
}
