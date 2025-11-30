import { useCallback, useRef } from 'react';

export function useScrollPosition(
  scrollRef: React.RefObject<HTMLDivElement | null>
) {
  const savedScrollPosition = useRef<number | null>(null);
  const isInitialLoad = useRef(true);

  const saveScrollPosition = useCallback(() => {
    if (scrollRef.current) {
      savedScrollPosition.current = scrollRef.current.scrollLeft;
    }
  }, [scrollRef]);

  const restoreScrollPosition = useCallback(() => {
    if (scrollRef.current && savedScrollPosition.current !== null) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = savedScrollPosition.current!;
        }
      });
    }
  }, [scrollRef]);

  const scrollToEnd = useCallback(() => {
    if (!scrollRef.current || !isInitialLoad.current) return;

    const performScroll = () => {
      if (!scrollRef.current || !isInitialLoad.current) return;

      const el = scrollRef.current;
      const scrollWidth = el.scrollWidth;
      const clientWidth = el.clientWidth;

      // Only scroll if there's actually content to scroll
      if (scrollWidth > clientWidth) {
        const maxScroll = scrollWidth - clientWidth;
        el.scrollLeft = maxScroll;
        isInitialLoad.current = false;
      } else {
        // If no scroll needed, still mark as loaded
        isInitialLoad.current = false;
      }
    };

    // Use multiple requestAnimationFrame calls to ensure DOM is fully rendered
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        performScroll();
        // Also try after delays as fallback for slower renders
        setTimeout(() => {
          if (isInitialLoad.current && scrollRef.current) {
            performScroll();
          }
        }, 150);
        setTimeout(() => {
          if (isInitialLoad.current && scrollRef.current) {
            performScroll();
          }
        }, 300);
      });
    });
  }, [scrollRef]);

  const getIsInitialLoad = useCallback(() => isInitialLoad.current, []);

  return {
    saveScrollPosition,
    restoreScrollPosition,
    scrollToEnd,
    getIsInitialLoad,
  };
}
