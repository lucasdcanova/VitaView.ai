import type { Profile } from "@shared/schema";
import { useCertificateLogic } from "@/hooks/use-certificate-logic";
import { CertificateForm } from "@/components/certificates/CertificateForm";
import { CertificateHistory } from "@/components/certificates/CertificateHistory";

interface VitaCertificatesProps {
    patient: Profile;
}

export default function VitaCertificates({ patient }: VitaCertificatesProps) {
    const {
        certType, setCertType,
        certDays, setCertDays,
        certStartTime, setCertStartTime,
        certEndTime, setCertEndTime,
        certCid, setCertCid,
        patientDoc, setPatientDoc,
        certCity, setCertCity,
        customCertText, setCustomCertText,
        certificateHistory,
        handleSaveAndPrintCertificate,
        handleReprintCertificate,
        isPending,
        user
    } = useCertificateLogic(patient);

    return (
        <div className="space-y-6 pb-20">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* --- COLUNA ESQUERDA: NOVO ATESTADO --- */}
                <div className="space-y-6">
                    <CertificateForm
                        certType={certType}
                        setCertType={setCertType}
                        certDays={certDays}
                        setCertDays={setCertDays}
                        certStartTime={certStartTime}
                        setCertStartTime={setCertStartTime}
                        certEndTime={certEndTime}
                        setCertEndTime={setCertEndTime}
                        certCid={certCid}
                        setCertCid={setCertCid}
                        patientDoc={patientDoc}
                        setPatientDoc={setPatientDoc}
                        certCity={certCity}
                        setCertCity={setCertCity}
                        customCertText={customCertText}
                        setCustomCertText={setCustomCertText}
                        patientName={patient?.name || ""}
                        onSave={handleSaveAndPrintCertificate}
                        isPending={isPending}
                        isUserLoggedIn={!!user}
                    />
                </div>

                {/* --- COLUNA DIREITA: HISTÓRICO --- */}
                <div className="space-y-6 h-full">
                    <CertificateHistory
                        history={certificateHistory}
                        onReprint={handleReprintCertificate}
                    />
                </div>
            </div>
        </div>
    );
}
