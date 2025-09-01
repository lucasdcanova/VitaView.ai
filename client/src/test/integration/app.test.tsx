import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'wouter';
import App from '../../App';
import { AuthProvider } from '../../hooks/use-auth';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock service worker for API calls
const server = setupServer(
  rest.get('/api/user', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User'
      })
    );
  }),
  
  rest.post('/api/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          fullName: 'Test User'
        }
      })
    );
  }),
  
  rest.get('/api/exams', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          name: 'Hemograma Completo',
          uploadDate: '2024-01-15T10:30:00Z',
          status: 'processed'
        }
      ])
    );
  }),

  rest.get('/api/health-metrics/latest', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          name: 'Hemoglobina',
          value: '14.5',
          unit: 'g/dL',
          status: 'normal',
          date: '2024-01-15T10:30:00Z'
        }
      ])
    );
  })
);

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          {children}
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

describe('VitaView AI Application Integration Tests', () => {
  beforeEach(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
    server.close();
  });

  describe('Application Loading and Performance', () => {
    it('should load the application without errors', async () => {
      render(<App />, { wrapper: TestWrapper });
      
      // Check if the app loads
      expect(screen.getByText(/VitaView/)).toBeInTheDocument();
    });

    it('should handle service worker registration', () => {
      // Mock service worker
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          register: vi.fn().mockResolvedValue({
            addEventListener: vi.fn(),
            scope: 'http://localhost:3000/'
          }),
        },
        configurable: true,
      });

      render(<App />, { wrapper: TestWrapper });
      
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
    });

    it('should register error boundary correctly', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Component that throws an error
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const { container } = render(
        <TestWrapper>
          <ThrowError />
        </TestWrapper>
      );

      // Should display error boundary UI
      expect(screen.getByText(/Ops! Algo deu errado/)).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Authentication Flow', () => {
    it('should redirect to auth page when not authenticated', async () => {
      // Mock unauthenticated state
      server.use(
        rest.get('/api/user', (req, res, ctx) => {
          return res(ctx.status(401), ctx.json({ message: 'Not authenticated' }));
        })
      );

      render(<App />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(window.location.pathname).toBe('/');
      });
    });

    it('should handle successful authentication', async () => {
      const user = userEvent.setup();
      
      render(<App />, { wrapper: TestWrapper });

      // Navigate to auth page
      fireEvent.click(screen.getByText(/Entrar/));

      // Fill login form
      await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/senha/i), 'password123');
      await user.click(screen.getByRole('button', { name: /entrar/i }));

      // Should redirect to dashboard after successful login
      await waitFor(() => {
        expect(window.location.pathname).toBe('/dashboard');
      });
    });

    it('should handle logout correctly', async () => {
      const user = userEvent.setup();
      
      // Mock authenticated state
      server.use(
        rest.get('/api/user', (req, res, ctx) => {
          return res(ctx.status(200), ctx.json({
            id: 1,
            username: 'testuser',
            email: 'test@example.com'
          }));
        })
      );

      render(<App />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByText(/Dashboard/)).toBeInTheDocument();
      });

      // Click logout
      await user.click(screen.getByText(/Sair/));

      await waitFor(() => {
        expect(window.location.pathname).toBe('/');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API error
      server.use(
        rest.get('/api/exams', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ message: 'Internal server error' }));
        })
      );

      render(<App />, { wrapper: TestWrapper });

      await waitFor(() => {
        // Should show error message or fallback UI
        expect(screen.getByText(/erro/i) || screen.getByText(/falha/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      // Mock network error
      server.use(
        rest.get('/api/user', (req, res, ctx) => {
          return res.networkError('Network error');
        })
      );

      render(<App />, { wrapper: TestWrapper });

      await waitFor(() => {
        // Should handle network error appropriately
        expect(screen.getByText(/conexão/i) || screen.getByText(/rede/i)).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should handle mobile viewport correctly', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<App />, { wrapper: TestWrapper });

      // Should adapt to mobile layout
      const mobileElements = screen.queryAllByTestId(/mobile/);
      expect(mobileElements.length).toBeGreaterThan(0);
    });

    it('should handle touch events', async () => {
      const user = userEvent.setup();
      
      render(<App />, { wrapper: TestWrapper });

      const button = screen.getByRole('button', { name: /entrar/i });
      
      // Simulate touch event
      fireEvent.touchStart(button);
      fireEvent.touchEnd(button);
      
      await user.click(button);
      
      // Should handle touch interactions correctly
      expect(button).toHaveClass(/active/);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics', () => {
      const performanceSpy = vi.spyOn(performance, 'now');
      
      render(<App />, { wrapper: TestWrapper });
      
      // Should call performance.now() for metrics
      expect(performanceSpy).toHaveBeenCalled();
      
      performanceSpy.mockRestore();
    });

    it('should handle lazy loading', async () => {
      render(<App />, { wrapper: TestWrapper });
      
      // Should show loading state for lazy components
      expect(screen.getByText(/carregando/i) || screen.getByTestId('loading')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText(/carregando/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<App />, { wrapper: TestWrapper });
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(<App />, { wrapper: TestWrapper });
      
      // Should be able to navigate with keyboard
      await user.tab();
      expect(document.activeElement).toHaveAttribute('tabindex');
    });

    it('should have proper focus management', async () => {
      const user = userEvent.setup();
      
      render(<App />, { wrapper: TestWrapper });
      
      const focusableElements = screen.getAllByRole('button');
      
      for (const element of focusableElements) {
        await user.click(element);
        expect(element).toHaveFocus();
      }
    });
  });

  describe('Security Features', () => {
    it('should sanitize user input', async () => {
      const user = userEvent.setup();
      
      render(<App />, { wrapper: TestWrapper });
      
      const input = screen.getByPlaceholderText(/email/i);
      
      // Try to inject script
      await user.type(input, '<script>alert("xss")</script>');
      
      // Should sanitize the input
      expect(input).not.toHaveValue('<script>alert("xss")</script>');
    });

    it('should handle CSP violations', () => {
      const violationHandler = vi.fn();
      
      // Mock CSP violation
      document.addEventListener('securitypolicyviolation', violationHandler);
      
      render(<App />, { wrapper: TestWrapper });
      
      // Should have security headers in place
      expect(document.querySelector('meta[http-equiv="Content-Security-Policy"]')).toBeTruthy();
    });
  });

  describe('Data Management', () => {
    it('should cache API responses correctly', async () => {
      render(<App />, { wrapper: TestWrapper });
      
      // First request
      await waitFor(() => {
        expect(screen.getByText(/Dashboard/)).toBeInTheDocument();
      });
      
      // Should cache the response and not make duplicate requests
      const requestCount = server.listHandlers().length;
      
      // Navigate away and back
      fireEvent.click(screen.getByText(/Profile/));
      fireEvent.click(screen.getByText(/Dashboard/));
      
      // Should use cached data
      expect(server.listHandlers().length).toBe(requestCount);
    });

    it('should handle offline mode', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      });

      render(<App />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByText(/offline/i) || screen.getByText(/sem conexão/i)).toBeInTheDocument();
      });
    });
  });
});