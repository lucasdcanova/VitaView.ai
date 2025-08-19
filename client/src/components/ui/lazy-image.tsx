import React, { useState, useRef, useEffect, forwardRef, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'loading'> {
  src: string;
  alt: string;
  placeholder?: string;
  fallback?: string;
  threshold?: number;
  rootMargin?: string;
  fadeInDuration?: number;
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
  loading?: 'lazy' | 'eager';
  quality?: 'low' | 'medium' | 'high';
  sizes?: string;
}

const LazyImage = forwardRef<HTMLImageElement, LazyImageProps>(({
  src,
  alt,
  placeholder,
  fallback = '/assets/image-placeholder.svg',
  threshold = 0.1,
  rootMargin = '50px',
  fadeInDuration = 300,
  onLoad,
  onError,
  className,
  loading = 'lazy',
  quality = 'medium',
  sizes,
  ...props
}, ref) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Combine refs
  const combinedRef = (node: HTMLImageElement | null) => {
    imgRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  useEffect(() => {
    const img = imgRef.current;
    if (!img || loading === 'eager') {
      setIsInView(true);
      return;
    }

    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observerRef.current.observe(img);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, rootMargin, loading]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
    onError?.();
  };

  // Generate responsive image URLs based on quality
  const getOptimizedSrc = (originalSrc: string, quality: string) => {
    // This would integrate with an image optimization service like Cloudinary, ImageKit, or similar
    // For now, return the original src
    if (originalSrc.includes('cloudinary.com') || originalSrc.includes('imagekit.io')) {
      const qualityParam = quality === 'low' ? 'q_30' : quality === 'medium' ? 'q_70' : 'q_90';
      return originalSrc.includes('?') 
        ? `${originalSrc}&${qualityParam}` 
        : `${originalSrc}?${qualityParam}`;
    }
    return originalSrc;
  };

  const optimizedSrc = getOptimizedSrc(src, quality);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Placeholder/Loading state */}
      {!isLoaded && !hasError && (
        <div 
          className={cn(
            'absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center',
            'transition-opacity duration-300',
            isInView ? 'opacity-100' : 'opacity-60'
          )}
        >
          {placeholder ? (
            <img 
              src={placeholder} 
              alt="Loading..." 
              className="w-8 h-8 opacity-40"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-300 rounded animate-pulse" />
          )}
        </div>
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <img 
            src={fallback} 
            alt="Failed to load image"
            className="w-8 h-8 opacity-40"
          />
        </div>
      )}

      {/* Actual image */}
      {isInView && (
        <img
          ref={combinedRef}
          src={optimizedSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          sizes={sizes}
          className={cn(
            'w-full h-full object-cover transition-opacity',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          style={{
            transitionDuration: `${fadeInDuration}ms`
          }}
          {...props}
        />
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export { LazyImage };

// Higher-order component for lazy loading any component
interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
}

export const LazyComponent: React.FC<LazyComponentProps> = ({
  children,
  fallback,
  threshold = 0.1,
  rootMargin = '50px',
  className
}) => {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <div ref={ref} className={className}>
      {isInView ? children : fallback}
    </div>
  );
};

// Lazy loading hook
export const useLazyLoading = (threshold = 0.1, rootMargin = '50px') => {
  const [isInView, setIsInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          setHasBeenInView(true);
        } else {
          setIsInView(false);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return {
    ref,
    isInView,
    hasBeenInView
  };
};