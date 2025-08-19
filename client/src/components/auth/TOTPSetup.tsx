import React, { useState, useEffect } from 'react';
import { QrCode, Key, Copy, Download, AlertCircle, CheckCircle, Smartphone } from 'lucide-react';

interface TOTPSetupProps {
  userId: string;
  onComplete: () => void;
  onCancel: () => void;
}

interface TOTPData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  manualEntryKey: string;
}

export function TOTPSetup({ userId, onComplete, onCancel }: TOTPSetupProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'backup' | 'complete'>('setup');
  const [totpData, setTotpData] = useState<TOTPData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [savedBackupCodes, setSavedBackupCodes] = useState(false);

  useEffect(() => {
    setupTOTP();
  }, []);

  const setupTOTP = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/totp/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId,
          userEmail: `user-${userId}@vitaview.ai` // This would come from user context
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to setup TOTP');
      }

      const data = await response.json();
      setTotpData(data);
      
    } catch (error: any) {
      setError(error.message || 'Setup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTOTP = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/totp/verify-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token: verificationCode }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Verification failed');
      }

      const result = await response.json();
      if (result.success) {
        setStep('backup');
      } else {
        setError('Invalid verification code');
      }
      
    } catch (error: any) {
      setError(error.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'secret') {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const downloadBackupCodes = () => {
    if (!totpData?.backupCodes) return;

    const content = [
      'VitaView AI - Códigos de Backup',
      '================================',
      '',
      'IMPORTANTE: Guarde estes códigos em local seguro.',
      'Cada código só pode ser usado uma vez.',
      '',
      'Códigos de Backup:',
      ...totpData.backupCodes.map((code, index) => `${index + 1}. ${code}`),
      '',
      `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vitaview-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setSavedBackupCodes(true);
  };

  const completeSetup = () => {
    setStep('complete');
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  if (isLoading && !totpData) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800">Configurando Autenticação</h2>
            <p className="text-gray-600 text-sm mt-1">Gerando códigos de segurança...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !totpData) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Erro na Configuração</h2>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={setupTOTP}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Tentar Novamente
              </button>
              <button
                onClick={onCancel}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        
        {/* Step 1: Setup */}
        {step === 'setup' && totpData && (
          <div className="space-y-6">
            <div className="text-center">
              <QrCode className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h2 className="text-xl font-semibold text-gray-800">Configurar Autenticação TOTP</h2>
              <p className="text-gray-600 text-sm mt-1">
                Escaneie o código QR ou digite a chave manualmente
              </p>
            </div>

            <div className="space-y-4">
              {/* QR Code */}
              <div className="text-center">
                <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                  <img
                    src={totpData.qrCode}
                    alt="QR Code para TOTP"
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Escaneie com Google Authenticator ou similar
                </p>
              </div>

              {/* Manual Entry */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Chave Manual (se não conseguir escanear):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={totpData.manualEntryKey}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(totpData.manualEntryKey, 'secret')}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title="Copiar chave"
                  >
                    {copiedSecret ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {copiedSecret && (
                  <p className="text-xs text-green-600">Chave copiada!</p>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">Como configurar:</h3>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Instale um app autenticador (Google Authenticator, Authy, etc.)</li>
                  <li>Escaneie o código QR ou digite a chave manual</li>
                  <li>Digite o código de 6 dígitos gerado pelo app</li>
                </ol>
              </div>
            </div>

            <button
              onClick={() => setStep('verify')}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
            >
              Continuar para Verificação
            </button>
          </div>
        )}

        {/* Step 2: Verify */}
        {step === 'verify' && (
          <div className="space-y-6">
            <div className="text-center">
              <Smartphone className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h2 className="text-xl font-semibold text-gray-800">Verificar Código</h2>
              <p className="text-gray-600 text-sm mt-1">
                Digite o código de 6 dígitos do seu app autenticador
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Verificação
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                  maxLength={6}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('setup')}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={verifyTOTP}
                  disabled={isLoading || verificationCode.length !== 6}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Verificando...' : 'Verificar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Backup Codes */}
        {step === 'backup' && totpData && (
          <div className="space-y-6">
            <div className="text-center">
              <Key className="w-12 h-12 text-orange-600 mx-auto mb-3" />
              <h2 className="text-xl font-semibold text-gray-800">Códigos de Backup</h2>
              <p className="text-gray-600 text-sm mt-1">
                Salve estes códigos em local seguro. Use se perder acesso ao app autenticador.
              </p>
            </div>

            <div className="space-y-4">
              {/* Warning */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div className="text-sm text-orange-800">
                    <p className="font-medium">Importante:</p>
                    <ul className="mt-1 list-disc list-inside text-xs space-y-0.5">
                      <li>Cada código só pode ser usado uma vez</li>
                      <li>Guarde em local seguro e offline</li>
                      <li>Não compartilhe estes códigos</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Backup Codes */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                  {totpData.backupCodes.map((code, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs">{index + 1}.</span>
                      <code className="bg-white px-2 py-1 rounded border text-center flex-1">
                        {code}
                      </code>
                    </div>
                  ))}
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={downloadBackupCodes}
                className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Baixar Códigos de Backup
              </button>

              {savedBackupCodes && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-800">Códigos salvos com sucesso!</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="confirm-backup"
                  checked={savedBackupCodes}
                  onChange={(e) => setSavedBackupCodes(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="confirm-backup" className="text-sm text-gray-700">
                  Confirmo que salvei os códigos de backup em local seguro
                </label>
              </div>

              <button
                onClick={completeSetup}
                disabled={!savedBackupCodes}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Finalizar Configuração
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-green-800">Configuração Concluída!</h2>
              <p className="text-green-600 text-sm mt-2">
                A autenticação de dois fatores está agora ativa na sua conta.
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
              <h3 className="font-medium text-green-800 mb-2">Próximos passos:</h3>
              <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
                <li>Use o app autenticador para gerar códigos de login</li>
                <li>Mantenha os códigos de backup em local seguro</li>
                <li>Configure autenticação biométrica para maior conveniência</li>
              </ul>
            </div>
          </div>
        )}

        {/* Cancel button (except on complete step) */}
        {step !== 'complete' && (
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={onCancel}
              className="w-full text-gray-600 text-sm hover:text-gray-800 transition-colors"
            >
              Cancelar configuração
            </button>
          </div>
        )}
      </div>
    </div>
  );
}