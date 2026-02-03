import { ActiveRequestList } from "@/components/exam-request/ActiveRequestList";
import { ExamRequestHistory } from "@/components/exam-request/ExamRequestHistory";
import { useExamRequestLogic } from "@/hooks/use-exam-request-logic";
import { useExamProtocols } from "@/hooks/use-exam-protocols";

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

    // Hooks
    const requestLogic = useExamRequestLogic(patient);
    const protocolLogic = useExamProtocols();

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Single column layout - stacked vertically */}
            <div className="flex flex-col gap-6 h-full">
                {/* 1. Active Request List (Nova Solicitação) - Now includes exam search and protocols */}
                <ActiveRequestList
                    selectedExams={requestLogic.selectedExams}
                    clinicalIndication={requestLogic.clinicalIndication}
                    setClinicalIndication={requestLogic.setClinicalIndication}
                    observations={requestLogic.observations}
                    setObservations={requestLogic.setObservations}
                    onRemoveExam={requestLogic.removeExam}
                    onUpdateExamNotes={requestLogic.updateExamNotes}
                    onSaveAndPrint={requestLogic.handleSaveAndPrint}
                    isEditing={!!requestLogic.editingRequestId}
                    onAddExam={requestLogic.addExam}
                    // Protocol props
                    customProtocols={protocolLogic.customProtocols}
                    onApplyProtocol={(exams) => exams.forEach(requestLogic.addExam)}
                    protocolLogic={{
                        createProtocolOpen: protocolLogic.createProtocolOpen,
                        setCreateProtocolOpen: protocolLogic.setCreateProtocolOpen,
                        deleteMode: protocolLogic.deleteMode,
                        setDeleteMode: protocolLogic.setDeleteMode,
                        deleteConfirmationOpen: protocolLogic.deleteConfirmationOpen,
                        setDeleteConfirmationOpen: protocolLogic.setDeleteConfirmationOpen,
                        protocolsToDelete: protocolLogic.protocolsToDelete,
                        toggleProtocolToDelete: protocolLogic.toggleProtocolToDelete,
                        handleCreateProtocol: protocolLogic.handleCreateProtocol,
                        bulkDeleteMutation: protocolLogic.bulkDeleteMutation,
                        newProtocolData: protocolLogic.newProtocolData,
                        setNewProtocolData: protocolLogic.setNewProtocolData,
                        newProtocolSearch: protocolLogic.newProtocolSearch,
                        setNewProtocolSearch: protocolLogic.setNewProtocolSearch
                    }}
                />

                {/* 2. Request History */}
                <ExamRequestHistory
                    history={requestLogic.examRequestHistory}
                    onReprint={requestLogic.handleReprint}
                    onEdit={requestLogic.handleEditRequest}
                />
            </div>
        </div>
    );
}
