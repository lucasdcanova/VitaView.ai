import { useEffect, useRef, useCallback } from 'react';

// Performance monitoring hook
export function usePerformance() {
  const metricsRef = useRef<{
    navigationStart?: number;
    loadStart?: number;
    loadEnd?: number;
    renderStart?: number;
    renderEnd?: number;
  }>({});

  // Mark the start of rendering
  const markRenderStart = useCallback(() => {
    metricsRef.current.renderStart = performance.now();
  }, []);

  // Mark the end of rendering
  const markRenderEnd = useCallback(() => {
    metricsRef.current.renderEnd = performance.now();
    
    if (metricsRef.current.renderStart) {
      const renderTime = metricsRef.current.renderEnd - metricsRef.current.renderStart;
      console.log(`[Perf] Component render time: ${renderTime.toFixed(2)}ms`);
      
      // Send to analytics if render time is slow
      if (renderTime > 100) {
        console.warn(`[Perf] Slow render detected: ${renderTime.toFixed(2)}ms`);
        
        if (window.gtag) {
          window.gtag('event', 'slow_render', {
            value: Math.round(renderTime),
            custom_map: {
              component: 'unknown' // Could be enhanced to track component name
            }
          });
        }
      }
    }
  }, []);

  // Measure API call performance
  const measureApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    endpoint: string
  ) => {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`[Perf] API call ${endpoint}: ${duration.toFixed(2)}ms`);
      
      // Track slow API calls
      if (duration > 2000) {
        console.warn(`[Perf] Slow API call detected: ${endpoint} took ${duration.toFixed(2)}ms`);
        
        if (window.gtag) {
          window.gtag('event', 'slow_api_call', {
            value: Math.round(duration),
            custom_map: {
              endpoint: endpoint
            }
          });
        }
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.error(`[Perf] API call ${endpoint} failed after ${duration.toFixed(2)}ms:`, error);
      
      if (window.gtag) {
        window.gtag('event', 'api_call_error', {
          value: Math.round(duration),
          custom_map: {
            endpoint: endpoint,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
      
      throw error;
    }
  }, []);

  // Monitor memory usage
  const checkMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
      const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
      
      console.log(`[Perf] Memory usage: ${usedMB}MB / ${totalMB}MB (limit: ${limitMB}MB)`);
      
      // Warn about high memory usage
      const usagePercent = (usedMB / limitMB) * 100;
      if (usagePercent > 80) {
        console.warn(`[Perf] High memory usage detected: ${usagePercent.toFixed(1)}%`);
        
        if (window.gtag) {
          window.gtag('event', 'high_memory_usage', {
            value: Math.round(usagePercent),
            custom_map: {
              used_mb: usedMB,
              limit_mb: limitMB
            }
          });
        }
      }
      
      return { usedMB, totalMB, limitMB, usagePercent };
    }
    
    return null;
  }, []);

  // Monitor Core Web Vitals
  const measureWebVitals = useCallback(() => {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          const lcp = lastEntry.startTime;
          
          console.log(`[Perf] LCP: ${lcp.toFixed(2)}ms`);
          
          if (window.gtag) {
            window.gtag('event', 'web_vital_lcp', {
              value: Math.round(lcp)
            });
          }
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const fid = entry.processingStart - entry.startTime;
            console.log(`[Perf] FID: ${fid.toFixed(2)}ms`);
            
            if (window.gtag) {
              window.gtag('event', 'web_vital_fid', {
                value: Math.round(fid)
              });
            }
          }
        });
        
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          
          console.log(`[Perf] CLS: ${clsValue.toFixed(4)}`);
          
          if (window.gtag) {
            window.gtag('event', 'web_vital_cls', {
              value: Math.round(clsValue * 1000) // Convert to milliseconds for GA
            });
          }
        });
        
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('[Perf] Web Vitals monitoring not supported:', error);
      }
    }
  }, []);

  // Initialize performance monitoring
  useEffect(() => {
    metricsRef.current.navigationStart = performance.timeOrigin;
    
    // Monitor Web Vitals
    measureWebVitals();
    
    // Periodic memory monitoring
    const memoryInterval = setInterval(() => {
      checkMemoryUsage();
    }, 30000); // Check every 30 seconds
    
    // Monitor resource loading
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const resource = entry as PerformanceResourceTiming;
            const loadTime = resource.loadEnd - resource.loadStart;
            
            // Log slow resources
            if (loadTime > 1000) {
              console.warn(`[Perf] Slow resource: ${resource.name} took ${loadTime.toFixed(2)}ms`);
            }
            
            // Track specific resource types
            if (resource.name.includes('.js') || resource.name.includes('.css')) {
              console.log(`[Perf] ${resource.name}: ${loadTime.toFixed(2)}ms`);
            }
          }
        });
        
        resourceObserver.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.warn('[Perf] Resource monitoring not supported:', error);
      }
    }
    
    return () => {
      clearInterval(memoryInterval);
    };
  }, [measureWebVitals, checkMemoryUsage]);

  return {
    markRenderStart,
    markRenderEnd,
    measureApiCall,
    checkMemoryUsage,
    measureWebVitals
  };
}

// Component wrapper for automatic performance monitoring
export function withPerformanceMonitoring<T extends {}>(
  Component: React.ComponentType<T>,
  componentName?: string
) {
  const WrappedComponent = (props: T) => {
    const { markRenderStart, markRenderEnd } = usePerformance();
    
    // Mark render start
    useEffect(() => {
      markRenderStart();
    });
    
    // Mark render end after DOM updates
    useEffect(() => {
      markRenderEnd();
    });
    
    return <Component {...props} />;
  };
  
  WrappedComponent.displayName = `withPerformanceMonitoring(${
    componentName || Component.displayName || Component.name
  })`;
  
  return WrappedComponent;
}

// Web Vitals measurement utilities
export const webVitals = {
  // Get current page load metrics
  getPageMetrics() {
    if (!('performance' in window)) return null;
    
    const timing = performance.timing;
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      // Page Load Time
      pageLoadTime: timing.loadEventEnd - timing.navigationStart,
      
      // Time to First Byte
      ttfb: timing.responseStart - timing.navigationStart,
      
      // DOM Content Loaded
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      
      // DOM Interactive
      domInteractive: timing.domInteractive - timing.navigationStart,
      
      // Modern metrics (if available)
      ...(navigation && {
        dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcpConnection: navigation.connectEnd - navigation.connectStart,
        tlsHandshake: navigation.connectEnd - navigation.secureConnectionStart,
        serverResponse: navigation.responseEnd - navigation.requestStart,
        domProcessing: navigation.domContentLoadedEventEnd - navigation.responseEnd,
        resourceLoading: navigation.loadEventEnd - navigation.domContentLoadedEventEnd
      })
    };
  },
  
  // Log all current metrics
  logCurrentMetrics() {
    const metrics = this.getPageMetrics();
    if (metrics) {
      console.group('[Perf] Page Load Metrics');
      console.log(`Page Load Time: ${metrics.pageLoadTime}ms`);
      console.log(`Time to First Byte: ${metrics.ttfb}ms`);
      console.log(`DOM Content Loaded: ${metrics.domContentLoaded}ms`);
      console.log(`DOM Interactive: ${metrics.domInteractive}ms`);
      
      if (metrics.dnsLookup !== undefined) {
        console.log(`DNS Lookup: ${metrics.dnsLookup}ms`);
        console.log(`TCP Connection: ${metrics.tcpConnection}ms`);
        console.log(`Server Response: ${metrics.serverResponse}ms`);
        console.log(`DOM Processing: ${metrics.domProcessing}ms`);
        console.log(`Resource Loading: ${metrics.resourceLoading}ms`);
      }
      
      console.groupEnd();
    }
  }
};