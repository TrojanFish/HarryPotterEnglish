import { useState, useEffect } from 'react';

/**
 * useBreakpoint — Responsive multi-device breakpoint detector
 * Standard Tailwind breakpoints:
 * - Mobile:  < 768px (iPhone / Android smartphones)
 * - Tablet:  >= 768px && < 1024px (iPad / Android tablets in portrait/landscape)
 * - Desktop: >= 1024px (Laptops, PC monitors, wide displays)
 */
export function useBreakpoint() {
  const [windowWidth, setWindowWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth;
    }
    return 1200;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId = null;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowWidth(window.innerWidth);
      }, 60);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

  const device = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

  return {
    windowWidth,
    isMobile,
    isTablet,
    isDesktop,
    device
  };
}

export default useBreakpoint;
