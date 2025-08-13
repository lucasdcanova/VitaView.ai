import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  eventId?: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to monitoring service if available
    this.logErrorToService(error, errorInfo);

    this.setState({
      error,
      errorInfo,
      eventId: this.generateEventId()
    });
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // This would integrate with your error monitoring service
    // For example: Sentry, LogRocket, Bugsnag, etc.
    try {
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: error.toString(),
          fatal: false,
          custom_map: {
            component_stack: errorInfo.componentStack
          }
        });
      }
    } catch (e) {
      console.warn('Failed to log error to monitoring service:', e);
    }
  }

  private generateEventId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportError = () => {
    const { error, errorInfo, eventId } = this.state;
    const errorDetails = {
      eventId,
      error: error?.toString(),
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    // Copy error details to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => {
        alert('Detalhes do erro copiados para a área de transferência. Por favor, cole-os ao reportar o problema.');
      })
      .catch(() => {
        console.log('Error details:', errorDetails);
        alert('Não foi possível copiar os detalhes. Verifique o console do navegador para mais informações.');
      });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, eventId } = this.state;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Ops! Algo deu errado
              </CardTitle>
              <CardDescription className="text-gray-600">
                Ocorreu um erro inesperado. Nosso time já foi notificado e está trabalhando para corrigir o problema.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {eventId && (
                <div className="bg-gray-100 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">ID do Erro:</p>
                  <code className="text-xs font-mono text-gray-800 break-all">
                    {eventId}
                  </code>
                </div>
              )}

              {isDevelopment && error && (
                <details className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <summary className="text-sm font-medium text-red-800 cursor-pointer">
                    Detalhes do Erro (Desenvolvimento)
                  </summary>
                  <div className="mt-2 text-xs font-mono text-red-700 whitespace-pre-wrap break-words">
                    {error.toString()}
                    {error.stack && (
                      <div className="mt-2 border-t border-red-200 pt-2">
                        {error.stack}
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="text-sm text-gray-600 space-y-2">
                <p>Você pode tentar:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Recarregar a página</li>
                  <li>Voltar para a página inicial</li>
                  <li>Aguardar alguns minutos e tentar novamente</li>
                  <li>Limpar o cache do navegador</li>
                </ul>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-2">
              <div className="flex space-x-2 w-full">
                <Button
                  onClick={this.handleReload}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recarregar
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  className="flex-1"
                  variant="outline"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Início
                </Button>
              </div>
              
              <Button
                onClick={this.handleReportError}
                variant="ghost"
                size="sm"
                className="w-full text-xs"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                Reportar Problema
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Hook for functional components to trigger error boundary
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);
  
  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    console.error('Error captured by useErrorHandler:', error);
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<T extends {}>(
  Component: React.ComponentType<T>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: T) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}