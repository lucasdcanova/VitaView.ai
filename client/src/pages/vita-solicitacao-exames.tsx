import { useAuth } from "@/hooks/use-auth";
import { FeatureGate } from '@/components/ui/feature-gate';
import { ExamSelector } from "@/components/exam-request/ExamSelector";
import { ActiveRequestList } from "@/components/exam-request/ActiveRequestList";
import { ProtocolManager } from "@/components/exam-request/ProtocolManager";
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
    const { user } = useAuth();

    // Hooks
    const requestLogic = useExamRequestLogic(patient);
    const protocolLogic = useExamProtocols();

    return (
        <div className="h-full flex flex-col gap-6">
            <FeatureGate
                featureId="exam_request"
                title="Solicitação Inteligente de Exames"
                description="Acesse templates prontos, histórico de solicitações e emissão rápida de guias."
            >
                <div className="grid grid-cols-12 gap-6 h-full">
                    {/* Left Column: Tools (Exam Selector & Protocols) */}
                    <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
                        {/* 1. Exam Selector */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-600 p-1 rounded-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                                </span>
                                Buscar Exames
                            </h3>
                            <ExamSelector onAddExam={requestLogic.addExam} />
                        </div>

                        {/* 2. Protocol Manager */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex-1">
                            <ProtocolManager
                                customProtocols={protocolLogic.customProtocols}
                                onApplyProtocol={(exams) => exams.forEach(requestLogic.addExam)}
                                // Pass all protocol logic props
                                createProtocolOpen={protocolLogic.createProtocolOpen}
                                setCreateProtocolOpen={protocolLogic.setCreateProtocolOpen}
                                deleteMode={protocolLogic.deleteMode}
                                setDeleteMode={protocolLogic.setDeleteMode}
                                deleteConfirmationOpen={protocolLogic.deleteConfirmationOpen}
                                setDeleteConfirmationOpen={protocolLogic.setDeleteConfirmationOpen}
                                protocolsToDelete={protocolLogic.protocolsToDelete}
                                toggleProtocolToDelete={protocolLogic.toggleProtocolToDelete}
                                handleCreateProtocol={protocolLogic.handleCreateProtocol}
                                bulkDeleteMutation={protocolLogic.bulkDeleteMutation}
                                newProtocolData={protocolLogic.newProtocolData}
                                setNewProtocolData={protocolLogic.setNewProtocolData}
                                newProtocolSearch={protocolLogic.newProtocolSearch}
                                setNewProtocolSearch={protocolLogic.setNewProtocolSearch}
                            />
                        </div>
                    </div>

                    {/* Right Column: Active Request & History */}
                    <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
                        {/* 1. Active Request List */}
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
                        />

                        {/* 2. Request History */}
                        <ExamRequestHistory
                            history={requestLogic.examRequestHistory}
                            onReprint={requestLogic.handleReprint}
                            onEdit={requestLogic.handleEditRequest}
                        />
                    </div>
                </div>
            </FeatureGate>
        </div>
    );
}
