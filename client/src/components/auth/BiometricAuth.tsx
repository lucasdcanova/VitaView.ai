import React, { useState, useEffect } from 'react';
import { AlertCircle, Fingerprint, Shield, Smartphone, Key, Eye, EyeOff } from 'lucide-react';

interface BiometricAuthProps {
  onSuccess: (credentials: AuthResult) => void;
  onError: (error: string) => void;
  userId?: string;
  requireRegistration?: boolean;
}

interface AuthResult {
  sessionToken: string;
  expiresAt: number;
  securityLevel: string;
  authMethod: string;
}

interface BiometricCredential {
  id: string;
  deviceInfo: {
    name: string;
    type: 'fingerprint' | 'faceId' | 'touchId' | 'voice' | 'iris';
  };
  trustLevel: 'high' | 'medium' | 'low';
  lastUsed: Date;
}

export function BiometricAuth({ onSuccess, onError, userId, requireRegistration = false }: BiometricAuthProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [availableCredentials, setAvailableCredentials] = useState<BiometricCredential[]>([]);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [showBackupCode, setShowBackupCode] = useState(false);

  useEffect(() => {
    checkBiometricSupport();
    if (userId && !requireRegistration) {
      loadUserCredentials();
    }
  }, [userId, requireRegistration]);

  const checkBiometricSupport = async () => {
    const supported = !!(
      window.PublicKeyCredential && 
      await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    );
    setIsSupported(supported);
  };

  const loadUserCredentials = async () => {
    try {
      const response = await fetch(`/api/auth/biometric/credentials/${userId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const credentials = await response.json();
        setAvailableCredentials(credentials);
      }
    } catch (error) {
      console.error('Failed to load biometric credentials:', error);
    }
  };

  const authenticateWithBiometric = async () => {
    if (!isSupported) {
      setShowFallback(true);
      return;
    }

    setIsAuthenticating(true);
    
    try {
      // Request authentication challenge
      const challengeResponse = await fetch('/api/auth/biometric/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
        credentials: 'include'
      });

      if (!challengeResponse.ok) {
        throw new Error('Failed to get authentication challenge');
      }

      const { challenge, allowCredentials } = await challengeResponse.json();

      // Perform WebAuthn authentication
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(Buffer.from(challenge, 'base64url')),
          allowCredentials: allowCredentials?.map((cred: any) => ({
            id: new Uint8Array(Buffer.from(cred.id, 'base64url')),
            type: 'public-key',
          })) || [],
          userVerification: 'required',
          timeout: 60000,
        }
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Biometric authentication cancelled');
      }

      // Send credential for verification
      const authResponse = await fetch('/api/auth/biometric/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          credential: {
            id: credential.id,
            rawId: Array.from(new Uint8Array(credential.rawId)),
            response: {
              authenticatorData: Array.from(new Uint8Array((credential.response as AuthenticatorAssertionResponse).authenticatorData)),
              clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON)),
              signature: Array.from(new Uint8Array((credential.response as AuthenticatorAssertionResponse).signature)),
              userHandle: (credential.response as AuthenticatorAssertionResponse).userHandle ? 
                Array.from(new Uint8Array((credential.response as AuthenticatorAssertionResponse).userHandle!)) : null,
            },
            type: credential.type,
          }
        }),
        credentials: 'include'
      });

      if (!authResponse.ok) {
        throw new Error('Biometric authentication failed');
      }

      const result = await authResponse.json();
      onSuccess(result);

    } catch (error: any) {
      console.error('Biometric authentication error:', error);
      onError(error.message || 'Biometric authentication failed');
      setShowFallback(true);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const authenticateWithTOTP = async () => {
    if (!totpCode || totpCode.length !== 6) {
      onError('Please enter a valid 6-digit code');
      return;
    }

    try {
      const response = await fetch('/api/auth/mfa/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, totpCode }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('TOTP authentication failed');
      }

      const result = await response.json();
      onSuccess(result);

    } catch (error: any) {
      onError(error.message || 'Authentication failed');
    }
  };

  const authenticateWithBackupCode = async () => {
    if (!backupCode) {
      onError('Please enter a backup code');
      return;
    }

    try {
      const response = await fetch('/api/auth/mfa/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, backupCode }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Backup code authentication failed');
      }

      const result = await response.json();
      onSuccess(result);

    } catch (error: any) {
      onError(error.message || 'Authentication failed');
    }
  };

  const getBiometricIcon = (type: string) => {
    switch (type) {
      case 'faceId':
      case 'iris':
        return <Eye className="w-6 h-6" />;
      case 'touchId':
      case 'fingerprint':
        return <Fingerprint className="w-6 h-6" />;
      default:
        return <Shield className="w-6 h-6" />;
    }
  };

  const getTrustLevelColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (requireRegistration) {
    return <BiometricRegistration userId={userId!} onComplete={() => window.location.reload()} />;
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="text-center mb-6">
          <Shield className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-gray-800">Autenticação Segura</h2>
          <p className="text-gray-600 text-sm mt-1">
            Use biometria ou código de autenticação para continuar
          </p>
        </div>

        {/* Biometric Authentication */}
        {isSupported && availableCredentials.length > 0 && !showFallback && (
          <div className="space-y-4">
            <div className="space-y-2">
              {availableCredentials.map((credential) => (
                <div
                  key={credential.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getBiometricIcon(credential.deviceInfo.type)}
                    <div>
                      <div className="font-medium text-sm text-gray-800">
                        {credential.deviceInfo.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        Último uso: {new Date(credential.lastUsed).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTrustLevelColor(credential.trustLevel)}`}>
                    {credential.trustLevel}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={authenticateWithBiometric}
              disabled={isAuthenticating}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAuthenticating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Autenticando...
                </>
              ) : (
                <>
                  <Fingerprint className="w-5 h-5" />
                  Usar Biometria
                </>
              )}
            </button>

            <button
              onClick={() => setShowFallback(true)}
              className="w-full text-gray-600 text-sm hover:text-gray-800 transition-colors"
            >
              Usar código de autenticação
            </button>
          </div>
        )}

        {/* Fallback Authentication (TOTP/Backup codes) */}
        {(showFallback || !isSupported || availableCredentials.length === 0) && (
          <div className="space-y-4">
            {!showBackupCode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Autenticação (6 dígitos)
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono tracking-widest"
                    />
                  </div>
                </div>

                <button
                  onClick={authenticateWithTOTP}
                  disabled={totpCode.length !== 6}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Verificar Código
                </button>

                <button
                  onClick={() => setShowBackupCode(true)}
                  className="w-full text-gray-600 text-sm hover:text-gray-800 transition-colors"
                >
                  Usar código de backup
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Backup
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showBackupCode ? 'text' : 'password'}
                      value={backupCode}
                      onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                      placeholder="XXXX-XXXX"
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowBackupCode(!showBackupCode)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showBackupCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={authenticateWithBackupCode}
                  disabled={!backupCode}
                  className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Usar Código de Backup
                </button>

                <button
                  onClick={() => setShowBackupCode(false)}
                  className="w-full text-gray-600 text-sm hover:text-gray-800 transition-colors"
                >
                  Voltar para código TOTP
                </button>
              </div>
            )}
          </div>
        )}

        {!isSupported && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Biometria não disponível</p>
                <p className="text-xs mt-1">
                  Seu dispositivo não suporta autenticação biométrica. Use o código de autenticação.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Biometric Registration Component
function BiometricRegistration({ userId, onComplete }: { userId: string; onComplete: () => void }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [step, setStep] = useState<'initial' | 'registering' | 'success' | 'error'>('initial');
  const [error, setError] = useState<string>('');
  const [deviceName, setDeviceName] = useState('');

  const registerBiometric = async () => {
    setIsRegistering(true);
    setStep('registering');
    setError('');

    try {
      // Get registration options
      const optionsResponse = await fetch('/api/auth/biometric/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
        credentials: 'include'
      });

      if (!optionsResponse.ok) {
        throw new Error('Failed to get registration options');
      }

      const { challengeId, options } = await optionsResponse.json();

      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: {
          ...options,
          challenge: new Uint8Array(Buffer.from(options.challenge, 'base64url')),
          user: {
            ...options.user,
            id: new Uint8Array(Buffer.from(options.user.id, 'base64url')),
          },
          excludeCredentials: options.excludeCredentials?.map((cred: any) => ({
            ...cred,
            id: new Uint8Array(Buffer.from(cred.id, 'base64url')),
          })) || [],
        }
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Biometric registration cancelled');
      }

      // Verify registration
      const verifyResponse = await fetch('/api/auth/biometric/verify-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          credential: {
            id: credential.id,
            rawId: Array.from(new Uint8Array(credential.rawId)),
            response: {
              clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON)),
              attestationObject: Array.from(new Uint8Array((credential.response as AuthenticatorAttestationResponse).attestationObject)),
            },
            type: credential.type,
          },
          deviceInfo: {
            name: deviceName || 'Dispositivo Biométrico',
          }
        }),
        credentials: 'include'
      });

      if (!verifyResponse.ok) {
        throw new Error('Failed to verify biometric registration');
      }

      setStep('success');
      setTimeout(() => {
        onComplete();
      }, 2000);

    } catch (error: any) {
      console.error('Biometric registration error:', error);
      setError(error.message || 'Registration failed');
      setStep('error');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="text-center mb-6">
          <Fingerprint className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-gray-800">Configurar Biometria</h2>
          <p className="text-gray-600 text-sm mt-1">
            Configure a autenticação biométrica para acesso mais seguro
          </p>
        </div>

        {step === 'initial' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Dispositivo (opcional)
              </label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="Ex: iPhone de João"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={registerBiometric}
              disabled={isRegistering}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Registrar Biometria
            </button>

            <div className="text-xs text-gray-500 space-y-1">
              <p>• Mantenha seu dedo/face no sensor quando solicitado</p>
              <p>• A biometria é armazenada apenas no seu dispositivo</p>
              <p>• Configure códigos de backup como alternativa</p>
            </div>
          </div>
        )}

        {step === 'registering' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div>
              <h3 className="font-medium text-gray-800">Registrando biometria...</h3>
              <p className="text-sm text-gray-600 mt-1">Siga as instruções do seu dispositivo</p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-green-800">Biometria configurada!</h3>
              <p className="text-sm text-green-600 mt-1">Você pode agora usar biometria para entrar</p>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium">Erro no registro</p>
                  <p className="text-xs mt-1">{error}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setStep('initial');
                setError('');
              }}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}