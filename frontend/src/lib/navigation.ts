export type TravelMode = "walking" | "driving" | "transit" | "bicycling";

export interface LatLng {
  lat: number;
  lng: number;
}

interface OpenDirectionsOptions {
  destination: LatLng;
  mode?: TravelMode;
  includeCurrentLocation?: boolean;
}

const DEFAULT_TRAVEL_MODE: TravelMode = "walking";
const GEOLOCATION_TIMEOUT_MS = 5000;

export const TRAVEL_MODE_OPTIONS: Array<{ value: TravelMode; label: string }> = [
  { value: "walking", label: "徒歩" },
  { value: "driving", label: "車" },
  { value: "transit", label: "電車・バス" },
  { value: "bicycling", label: "自転車" },
];

export function isTravelMode(value: string): value is TravelMode {
  return TRAVEL_MODE_OPTIONS.some((option) => option.value === value);
}

async function getCurrentLocation(): Promise<LatLng | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => resolve(null),
      {
        enableHighAccuracy: true,
        timeout: GEOLOCATION_TIMEOUT_MS,
        maximumAge: 60_000,
      }
    );
  });
}

function buildDirectionsUrl(destination: LatLng, mode: TravelMode, origin: LatLng | null): string {
  const params = new URLSearchParams({
    api: "1",
    destination: `${destination.lat},${destination.lng}`,
    travelmode: mode,
  });

  if (origin) {
    params.set("origin", `${origin.lat},${origin.lng}`);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export async function openDirectionsInGoogleMaps({
  destination,
  mode = DEFAULT_TRAVEL_MODE,
  includeCurrentLocation = true,
}: OpenDirectionsOptions): Promise<void> {
  const origin = includeCurrentLocation ? await getCurrentLocation() : null;
  const url = buildDirectionsUrl(destination, mode, origin);
  window.open(url, "_blank", "noopener,noreferrer");
}
