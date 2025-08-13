import { toast } from "@/hooks/use-toast";

// Error types for better error categorization
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError extends Error {
  type: ErrorType;
  statusCode?: number;
  originalError?: Error;
  context?: Record<string, any>;
  userMessage?: string;
}

// Create a custom error class
export class VitaViewError extends Error implements AppError {
  type: ErrorType;
  statusCode?: number;
  originalError?: Error;
  context?: Record<string, any>;
  userMessage?: string;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    options: {
      statusCode?: number;
      originalError?: Error;
      context?: Record<string, any>;
      userMessage?: string;
    } = {}
  ) {
    super(message);
    this.name = 'VitaViewError';
    this.type = type;
    this.statusCode = options.statusCode;
    this.originalError = options.originalError;
    this.context = options.context;
    this.userMessage = options.userMessage;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, VitaViewError);
    }
  }
}

// Error parsing utilities
export function parseApiError(error: any): AppError {
  // Handle fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new VitaViewError(
      'Network connection failed',
      ErrorType.NETWORK,
      {
        statusCode: 0,
        originalError: error,
        userMessage: 'Erro de conexão. Verifique sua internet e tente novamente.'
      }
    );
  }

  // Handle Response errors
  if (error.response) {
    const status = error.response.status;
    let type = ErrorType.SERVER;
    let userMessage = 'Ocorreu um erro no servidor. Tente novamente mais tarde.';

    switch (status) {
      case 400:
        type = ErrorType.VALIDATION;
        userMessage = 'Dados inválidos. Verifique os campos e tente novamente.';
        break;
      case 401:
        type = ErrorType.AUTHENTICATION;
        userMessage = 'Sessão expirada. Faça login novamente.';
        break;
      case 403:
        type = ErrorType.AUTHORIZATION;
        userMessage = 'Você não tem permissão para realizar esta ação.';
        break;
      case 404:
        userMessage = 'Recurso não encontrado.';
        break;
      case 409:
        userMessage = 'Conflito de dados. Verifique se os dados já existem.';
        break;
      case 413:
        userMessage = 'Arquivo muito grande. Reduza o tamanho e tente novamente.';
        break;
      case 429:
        userMessage = 'Muitas tentativas. Aguarde um momento e tente novamente.';
        break;
      case 500:
        userMessage = 'Erro interno do servidor. Nossa equipe foi notificada.';
        break;
      case 502:
      case 503:
      case 504:
        userMessage = 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.';
        break;
      default:
        userMessage = `Erro ${status}: ${error.response.statusText || 'Erro desconhecido'}`;
    }

    return new VitaViewError(
      error.response.data?.message || error.message || 'API Error',
      type,
      {
        statusCode: status,
        originalError: error,
        userMessage,
        context: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.response.data
        }
      }
    );
  }

  // Handle request errors
  if (error.request) {
    return new VitaViewError(
      'Request failed',
      ErrorType.NETWORK,
      {
        statusCode: 0,
        originalError: error,
        userMessage: 'Falha na comunicação com o servidor. Verifique sua conexão.',
        context: {
          url: error.config?.url,
          method: error.config?.method
        }
      }
    );
  }

  // Handle generic errors
  return new VitaViewError(
    error.message || 'Unknown error occurred',
    ErrorType.UNKNOWN,
    {
      originalError: error,
      userMessage: 'Ocorreu um erro inesperado. Tente novamente.'
    }
  );
}

// Global error handler
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: AppError[] = [];
  private isHandling = false;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Handle errors with different strategies based on type
  handle(error: any, options: {
    showToast?: boolean;
    logError?: boolean;
    throwError?: boolean;
    context?: Record<string, any>;
  } = {}): AppError {
    const {
      showToast = true,
      logError = true,
      throwError = false,
      context
    } = options;

    const appError = error instanceof VitaViewError ? error : parseApiError(error);
    
    // Add context if provided
    if (context) {
      appError.context = { ...appError.context, ...context };
    }

    // Log error
    if (logError) {
      this.logError(appError);
    }

    // Show user notification
    if (showToast) {
      this.showErrorToast(appError);
    }

    // Add to error queue for batch reporting
    this.errorQueue.push(appError);
    this.processErrorQueue();

    // Throw error if requested
    if (throwError) {
      throw appError;
    }

    return appError;
  }

  private logError(error: AppError) {
    const logLevel = this.getLogLevel(error.type);
    const logMessage = `[${error.type}] ${error.message}`;
    const logDetails = {
      type: error.type,
      statusCode: error.statusCode,
      context: error.context,
      stack: error.stack
    };

    switch (logLevel) {
      case 'error':
        console.error(logMessage, logDetails);
        break;
      case 'warn':
        console.warn(logMessage, logDetails);
        break;
      case 'info':
        console.info(logMessage, logDetails);
        break;
      default:
        console.log(logMessage, logDetails);
    }

    // Send to external logging service
    this.sendToLoggingService(error);
  }

  private getLogLevel(errorType: ErrorType): 'error' | 'warn' | 'info' | 'debug' {
    switch (errorType) {
      case ErrorType.SERVER:
      case ErrorType.UNKNOWN:
        return 'error';
      case ErrorType.NETWORK:
      case ErrorType.AUTHORIZATION:
        return 'warn';
      case ErrorType.VALIDATION:
      case ErrorType.AUTHENTICATION:
        return 'info';
      default:
        return 'debug';
    }
  }

  private showErrorToast(error: AppError) {
    const title = this.getErrorTitle(error.type);
    const description = error.userMessage || error.message;

    toast({
      variant: "destructive",
      title,
      description,
      duration: this.getToastDuration(error.type),
    });
  }

  private getErrorTitle(errorType: ErrorType): string {
    switch (errorType) {
      case ErrorType.NETWORK:
        return 'Erro de Conexão';
      case ErrorType.VALIDATION:
        return 'Dados Inválidos';
      case ErrorType.AUTHENTICATION:
        return 'Erro de Autenticação';
      case ErrorType.AUTHORIZATION:
        return 'Acesso Negado';
      case ErrorType.SERVER:
        return 'Erro do Servidor';
      case ErrorType.CLIENT:
        return 'Erro na Aplicação';
      default:
        return 'Erro';
    }
  }

  private getToastDuration(errorType: ErrorType): number {
    switch (errorType) {
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
        return 7000; // Longer for auth errors
      case ErrorType.VALIDATION:
        return 5000;
      default:
        return 4000;
    }
  }

  private async processErrorQueue() {
    if (this.isHandling || this.errorQueue.length === 0) return;

    this.isHandling = true;

    try {
      // Process errors in batches
      const batch = this.errorQueue.splice(0, 10);
      await this.reportErrorBatch(batch);
    } catch (reportingError) {
      console.error('Failed to report errors:', reportingError);
    } finally {
      this.isHandling = false;

      // Process remaining errors
      if (this.errorQueue.length > 0) {
        setTimeout(() => this.processErrorQueue(), 1000);
      }
    }
  }

  private async sendToLoggingService(error: AppError) {
    // Send to external logging service like Sentry, LogRocket, etc.
    try {
      // Example integration
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: error.message,
          fatal: false,
          custom_map: {
            error_type: error.type,
            status_code: error.statusCode,
            context: JSON.stringify(error.context)
          }
        });
      }

      // If Sentry is configured
      if ((window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: {
            errorType: error.type,
            statusCode: error.statusCode
          },
          contexts: {
            error: error.context
          }
        });
      }
    } catch (loggingError) {
      console.error('Failed to send error to logging service:', loggingError);
    }
  }

  private async reportErrorBatch(errors: AppError[]) {
    // This could send a batch of errors to your monitoring service
    // For now, just log the batch
    console.log('Error batch:', errors.map(e => ({
      type: e.type,
      message: e.message,
      statusCode: e.statusCode,
      timestamp: new Date().toISOString()
    })));
  }

  // Utility methods
  clearErrorQueue() {
    this.errorQueue = [];
  }

  getErrorStats() {
    const stats: Record<ErrorType, number> = {
      [ErrorType.NETWORK]: 0,
      [ErrorType.VALIDATION]: 0,
      [ErrorType.AUTHENTICATION]: 0,
      [ErrorType.AUTHORIZATION]: 0,
      [ErrorType.SERVER]: 0,
      [ErrorType.CLIENT]: 0,
      [ErrorType.UNKNOWN]: 0
    };

    this.errorQueue.forEach(error => {
      stats[error.type]++;
    });

    return {
      total: this.errorQueue.length,
      byType: stats
    };
  }
}

// Convenience functions
export const errorHandler = ErrorHandler.getInstance();

export function handleError(error: any, options?: Parameters<typeof errorHandler.handle>[1]): AppError {
  return errorHandler.handle(error, options);
}

export function handleApiError(error: any, context?: Record<string, any>): AppError {
  return errorHandler.handle(error, { context, showToast: true, logError: true });
}

export function handleSilentError(error: any, context?: Record<string, any>): AppError {
  return errorHandler.handle(error, { context, showToast: false, logError: true });
}

// React hook for error handling
export function useErrorHandler() {
  const handleError = (error: any, options?: {
    showToast?: boolean;
    context?: Record<string, any>;
  }) => {
    return errorHandler.handle(error, {
      showToast: options?.showToast ?? true,
      logError: true,
      context: options?.context
    });
  };

  return { handleError };
}

// Async wrapper with error handling
export async function withErrorHandling<T>(
  asyncFn: () => Promise<T>,
  options: {
    context?: Record<string, any>;
    fallbackValue?: T;
    showToast?: boolean;
  } = {}
): Promise<T | undefined> {
  try {
    return await asyncFn();
  } catch (error) {
    const appError = handleError(error, {
      context: options.context,
      showToast: options.showToast ?? true
    });

    if (options.fallbackValue !== undefined) {
      return options.fallbackValue;
    }

    // Re-throw for critical errors that should bubble up
    if (appError.type === ErrorType.AUTHENTICATION) {
      throw appError;
    }

    return undefined;
  }
}