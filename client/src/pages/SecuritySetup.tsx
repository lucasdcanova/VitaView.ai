import React, { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Fingerprint, Smartphone, Check, AlertTriangle } from 'lucide-react';
import { BiometricAuth } from '@/components/auth/BiometricAuth';
import { TOTPSetup } from '@/components/auth/TOTPSetup';

interface SecuritySetupProps {
  userId: string;
  onComplete: () => void;
  onCancel: () => void;
}

interface SecurityStatus {
  hasBiometric: boolean;
  hasTOTP: boolean;
  biometricCount: number;
  totpEnabled: boolean;
}

export default function SecuritySetup({ userId, onComplete, onCancel }: SecuritySetupProps) {
  const [currentStep, setCurrentStep] = useState<'overview' | 'biometric' | 'totp'>('overview');
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    hasBiometric: false,
    hasTOTP: false,
    biometricCount: 0,
    totpEnabled: false
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSecurityStatus();
  }, [userId]);

  const loadSecurityStatus = async () => {
    try {
      // Check biometric credentials
      const biometricResponse = await fetch(`/api/auth/biometric/credentials/${userId}`, {
        credentials: 'include'
      });
      
      let biometricCredentials = [];
      if (biometricResponse.ok) {
        biometricCredentials = await biometricResponse.json();
      }

      // Check TOTP status
      const totpResponse = await fetch(`/api/auth/totp/status/${userId}`, {
        credentials: 'include'
      });
      
      let totpStatus = { enabled: false };
      if (totpResponse.ok) {
        totpStatus = await totpResponse.json();
      }

      setSecurityStatus({
        hasBiometric: biometricCredentials.length > 0,
        hasTOTP: totpStatus.enabled,
        biometricCount: biometricCredentials.length,
        totpEnabled: totpStatus.enabled
      });

    } catch (error) {
      console.error('Failed to load security status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricComplete = () => {
    loadSecurityStatus();
    setCurrentStep('overview');
  };

  const handleTOTPComplete = () => {
    loadSecurityStatus();
    setCurrentStep('overview');
  };

  const getSecurityScore = (): { score: number; level: string; color: string } => {
    let score = 0;
    
    if (securityStatus.hasBiometric) score += 50;
    if (securityStatus.hasTOTP) score += 50;
    
    if (score >= 100) return { score, level: 'Máxima', color: 'text-green-600 bg-green-100' };
    if (score >= 50) return { score, level: 'Alta', color: 'text-blue-600 bg-blue-100' };
    if (score >= 25) return { score, level: 'Média', color: 'text-yellow-600 bg-yellow-100' };
    return { score, level: 'Baixa', color: 'text-red-600 bg-red-100' };
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800">Verificando Configurações</h2>
            <p className="text-gray-600 text-sm mt-1">Carregando status de segurança...</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'biometric') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-4">
          <button
            onClick={() => setCurrentStep('overview')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>
        <BiometricAuth
          userId={userId}
          requireRegistration={true}
          onSuccess={() => {}}
          onError={(error) => console.error('Biometric error:', error)}
        />
      </div>
    );
  }

  if (currentStep === 'totp') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-4">
          <button
            onClick={() => setCurrentStep('overview')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>
        <TOTPSetup
          userId={userId}
          onComplete={handleTOTPComplete}
          onCancel={() => setCurrentStep('overview')}
        />
      </div>
    );
  }

  const securityScore = getSecurityScore();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Configurações de Segurança</h1>
          <p className="text-gray-600 mt-2">
            Configure autenticação biométrica e de dois fatores para máxima proteção dos seus dados médicos
          </p>
        </div>

        {/* Security Score */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-700">Nível de Segurança</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${securityScore.color}`}>
              {securityScore.level}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${securityScore.score}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {securityScore.score}/100 pontos de segurança
          </p>
        </div>

        {/* Security Methods */}
        <div className="space-y-4 mb-8">
          {/* Biometric Authentication */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  securityStatus.hasBiometric ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <Fingerprint className={`w-6 h-6 ${
                    securityStatus.hasBiometric ? 'text-green-600' : 'text-gray-400'
                  }`} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-800">Autenticação Biométrica</h3>
                  {securityStatus.hasBiometric && (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {securityStatus.hasBiometric 
                    ? `${securityStatus.biometricCount} método(s) biométrico(s) configurado(s)`
                    : 'Use sua impressão digital, Face ID ou Touch ID para acesso rápido e seguro'
                  }
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentStep('biometric')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      securityStatus.hasBiometric
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {securityStatus.hasBiometric ? 'Gerenciar' : 'Configurar'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* TOTP Authentication */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  securityStatus.hasTOTP ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <Smartphone className={`w-6 h-6 ${
                    securityStatus.hasTOTP ? 'text-green-600' : 'text-gray-400'
                  }`} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-800">Autenticação de Dois Fatores (2FA)</h3>
                  {securityStatus.hasTOTP && (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {securityStatus.hasTOTP 
                    ? 'Autenticação de dois fatores está ativa e funcionando'
                    : 'Use códigos do Google Authenticator ou similar para uma camada extra de proteção'
                  }
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentStep('totp')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      securityStatus.hasTOTP
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {securityStatus.hasTOTP ? 'Gerenciar' : 'Configurar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Recommendations */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-orange-800 mb-2">Recomendações de Segurança</h3>
              <ul className="text-sm text-orange-700 space-y-1">
                {!securityStatus.hasBiometric && (
                  <li>• Configure autenticação biométrica para acesso mais conveniente</li>
                )}
                {!securityStatus.hasTOTP && (
                  <li>• Ative a autenticação de dois fatores para proteção adicional</li>
                )}
                <li>• Mantenha seus códigos de backup em local seguro</li>
                <li>• Revise regularmente os dispositivos com acesso à sua conta</li>
                {securityStatus.hasBiometric && securityStatus.hasTOTP && (
                  <li>• ✅ Parabéns! Você tem a configuração de segurança máxima</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={onComplete}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
          >
            Concluir
          </button>
        </div>

        {/* Security Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">🔒 Sobre a Segurança dos Dados Médicos</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• Todos os dados são criptografados com padrão militar (AES-256)</p>
            <p>• Biometria é armazenada apenas no seu dispositivo</p>
            <p>• Códigos 2FA são únicos e renovados a cada 30 segundos</p>
            <p>• Backup de códigos permite acesso mesmo sem o app autenticador</p>
            <p>• Auditoria completa de todos os acessos aos seus dados</p>
          </div>
        </div>
      </div>
    </div>
  );
}