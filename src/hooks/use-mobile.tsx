import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

/**
 * Retorna true para dispositivos mobile E tablets (< 1024px).
 * Usado para navegação unificada (menu bottom + sheet em vez de sidebar desktop).
 */
export function useIsMobileOrTablet() {
  const [isMobileOrTablet, setIsMobileOrTablet] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${TABLET_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobileOrTablet(window.innerWidth < TABLET_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobileOrTablet(window.innerWidth < TABLET_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobileOrTablet;
}
