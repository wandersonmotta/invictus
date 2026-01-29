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

  const stop = React.useCallback(() => {
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    setStatus("idle");
    setExact(null);
    setApprox(null);
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
        const nextExact = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setExact(nextExact);
        setApprox(roundLatLng(nextExact, approxDecimals));
        setStatus("granted");
      },
      (err) => {
        watchIdRef.current = null;
        if (err.code === err.PERMISSION_DENIED) {
          setStatus("denied");
          return;
        }
        setStatus("error");
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 },
    );
  }, [approxDecimals, toast]);

  React.useEffect(() => {
    return () => {
      if (watchIdRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { status, exact, approx, start, stop };
}
