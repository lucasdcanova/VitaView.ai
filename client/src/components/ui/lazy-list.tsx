import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FixedSizeList as List, VariableSizeList, ListChildComponentProps } from 'react-window';
import { cn } from '@/lib/utils';

interface LazyListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number | ((index: number) => number);
  containerHeight?: number;
  className?: string;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  overscanCount?: number;
  threshold?: number;
  onScroll?: (scrollOffset: number) => void;
  onItemsRendered?: (startIndex: number, stopIndex: number) => void;
}

export function LazyList<T>({
  items,
  renderItem,
  itemHeight = 100,
  containerHeight = 400,
  className,
  loadingComponent,
  emptyComponent,
  overscanCount = 5,
  threshold = 0.8,
  onScroll,
  onItemsRendered
}: LazyListProps<T>) {
  const [isLoading, setIsLoading] = useState(false);

  // Memoize the row renderer to prevent unnecessary re-renders
  const Row = useCallback(({ index, style }: ListChildComponentProps) => {
    const item = items[index];
    if (!item) return null;

    return (
      <div style={style} className="flex items-center">
        {renderItem(item, index)}
      </div>
    );
  }, [items, renderItem]);

  const handleItemsRendered = useCallback(({ 
    visibleStartIndex, 
    visibleStopIndex 
  }: {
    visibleStartIndex: number;
    visibleStopIndex: number;
  }) => {
    onItemsRendered?.(visibleStartIndex, visibleStopIndex);

    // Trigger loading more items when approaching the end
    const totalItems = items.length;
    const remainingItems = totalItems - visibleStopIndex;
    const loadMoreThreshold = Math.max(1, Math.floor(totalItems * (1 - threshold)));
    
    if (remainingItems <= loadMoreThreshold && !isLoading) {
      setIsLoading(true);
      // Simulate async loading - in real app this would trigger data fetching
      setTimeout(() => setIsLoading(false), 1000);
    }
  }, [items.length, threshold, isLoading, onItemsRendered]);

  if (items.length === 0 && emptyComponent) {
    return <div className={className}>{emptyComponent}</div>;
  }

  // Use variable size list if itemHeight is a function
  const ListComponent = typeof itemHeight === 'function' ? VariableSizeList : List;

  return (
    <div className={cn('w-full', className)}>
      <ListComponent
        height={containerHeight}
        itemCount={items.length}
        itemSize={itemHeight}
        onItemsRendered={handleItemsRendered}
        onScroll={onScroll}
        overscanCount={overscanCount}
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
      >
        {Row}
      </ListComponent>
      
      {isLoading && loadingComponent && (
        <div className="flex justify-center py-4">
          {loadingComponent}
        </div>
      )}
    </div>
  );
}

// Lazy Grid Component for grid layouts
interface LazyGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  columns?: number;
  gap?: number;
  itemHeight?: number;
  className?: string;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
}

export function LazyGrid<T>({
  items,
  renderItem,
  columns = 3,
  gap = 16,
  itemHeight = 200,
  className,
  loadingComponent,
  emptyComponent
}: LazyGridProps<T>) {
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const itemsPerPage = columns * 4; // Show 4 rows initially
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Load initial items
  useEffect(() => {
    const initialItems = items.slice(0, itemsPerPage);
    setVisibleItems(initialItems);
  }, [items, itemsPerPage]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          const nextPageItems = items.slice(0, page * itemsPerPage + itemsPerPage);
          setVisibleItems(nextPageItems);
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [items, page, itemsPerPage]);

  if (items.length === 0 && emptyComponent) {
    return <div className={className}>{emptyComponent}</div>;
  }

  return (
    <div ref={containerRef} className={cn('w-full', className)}>
      <div 
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: `${gap}px`
        }}
      >
        {visibleItems.map((item, index) => (
          <div
            key={index}
            style={{ minHeight: itemHeight }}
            className="flex flex-col"
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
      
      {/* Sentinel element for infinite scroll */}
      {visibleItems.length < items.length && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {loadingComponent || (
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          )}
        </div>
      )}
    </div>
  );
}

// Lazy Masonry Layout for irregular-sized items
interface LazyMasonryProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  columns?: number;
  gap?: number;
  className?: string;
}

export function LazyMasonry<T>({
  items,
  renderItem,
  columns = 3,
  gap = 16,
  className
}: LazyMasonryProps<T>) {
  const [columnItems, setColumnItems] = useState<T[][]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Distribute items across columns
  useEffect(() => {
    const cols: T[][] = Array.from({ length: columns }, () => []);
    const columnHeights = new Array(columns).fill(0);

    items.forEach((item, index) => {
      // Find shortest column
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
      cols[shortestColumnIndex].push(item);
      
      // Estimate height - in real implementation, you'd measure actual heights
      columnHeights[shortestColumnIndex] += 200; // Estimated item height
    });

    setColumnItems(cols);
  }, [items, columns]);

  return (
    <div 
      ref={containerRef} 
      className={cn('flex', className)}
      style={{ gap: `${gap}px` }}
    >
      {columnItems.map((columnItems, columnIndex) => (
        <div 
          key={columnIndex} 
          className="flex-1 flex flex-col"
          style={{ gap: `${gap}px` }}
        >
          {columnItems.map((item, itemIndex) => {
            const originalIndex = items.indexOf(item);
            return (
              <div key={originalIndex}>
                {renderItem(item, originalIndex)}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Hook for implementing custom lazy loading logic
export const useLazyPagination = <T,>(
  items: T[],
  initialPageSize: number = 10,
  increment: number = 5
) => {
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const startIndex = 0;
    const endIndex = currentPage * initialPageSize;
    const newVisibleItems = items.slice(startIndex, endIndex);
    
    setVisibleItems(newVisibleItems);
    setHasMore(endIndex < items.length);
  }, [items, currentPage, initialPageSize]);

  const loadMore = useCallback(() => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMore]);

  const reset = useCallback(() => {
    setCurrentPage(1);
    setHasMore(true);
  }, []);

  return {
    visibleItems,
    hasMore,
    loadMore,
    reset,
    currentPage
  };
};