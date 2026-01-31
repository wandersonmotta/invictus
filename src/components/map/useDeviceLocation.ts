import * as React from "react";

import { useToast } from "@/hooks/use-toast";
import { roundLatLng, type LatLng } from "@/lib/geo";

export type DeviceLocationStatus = "idle" | "requesting" | "granted" | "denied" | "error" | "unsupported";

export function useDeviceLocation({ approxDecimals = 2 }: { approxDecimals?: number } = {}) {
  const { toast } = useToast();
  const watchIdRef = React.useRef<number | null>(null);

  const [status, setStatus] = React.useState<DeviceLocationStatus>("idle");
  const [exact, setExact] = React.useState<LatLng | null>(null);
  const [approx, setApprox] = React.useState<LatLng | null>(null);

  // Track last update time to throttle updates
  const lastUpdateRef = React.useRef<number>(0);
  const MIN_UPDATE_INTERVAL_MS = 5000; // Minimum 5 seconds between state updates

  const stop = React.useCallback(() => {
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    setStatus("idle");
    setExact(null);
    setApprox(null);
    lastUpdateRef.current = 0;
  }, []);

  const start = React.useCallback(() => {
    if (typeof window === "undefined") return;
    if (!navigator.geolocation) {
      setStatus("unsupported");
      toast({
        title: "Geolocalização indisponível",
        description: "Seu dispositivo/navegador não suporta GPS.",
      });
      return;
    }

    // se já está ativo, não reinicia
    if (watchIdRef.current != null) return;

    setStatus("requesting");
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        const nextExact = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const nextApprox = roundLatLng(nextExact, approxDecimals);

        // Throttle: only update state if enough time has passed
        // or if this is the first position (lastUpdateRef.current === 0)
        if (lastUpdateRef.current === 0 || now - lastUpdateRef.current >= MIN_UPDATE_INTERVAL_MS) {
          lastUpdateRef.current = now;
          setExact(nextExact);
          setApprox(nextApprox);
          setStatus("granted");
        } else if (status !== "granted") {
          // Always update status on first successful position
          setStatus("granted");
        }
      },
      (err) => {
        watchIdRef.current = null;
        if (err.code === err.PERMISSION_DENIED) {
          setStatus("denied");
          return;
        }
        setStatus("error");
      },
      { 
        enableHighAccuracy: true, 
        maximumAge: 60_000, 
        timeout: 10_000 
      },
    );
  }, [approxDecimals, toast, status]);

  React.useEffect(() => {
    return () => {
      if (watchIdRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { status, exact, approx, start, stop };
}
