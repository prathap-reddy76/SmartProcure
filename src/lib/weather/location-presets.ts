/**
 * Andhra Pradesh agricultural location presets and meteorological mappings.
 */

export interface LocationPreset {
  id: string;
  name: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
}

export const AP_AGRICULTURAL_LOCATIONS: LocationPreset[] = [
  {
    id: "kurnool",
    name: "Kurnool",
    district: "Kurnool",
    state: "Andhra Pradesh",
    latitude: 15.8281,
    longitude: 78.0373,
  },
  {
    id: "visakhapatnam",
    name: "Visakhapatnam",
    district: "Visakhapatnam",
    state: "Andhra Pradesh",
    latitude: 17.7289,
    longitude: 83.2721,
  },
  {
    id: "anakapalle",
    name: "Anakapalle",
    district: "Anakapalle",
    state: "Andhra Pradesh",
    latitude: 17.6897,
    longitude: 83.0033,
  },
  {
    id: "vijayawada",
    name: "Vijayawada",
    district: "NTR",
    state: "Andhra Pradesh",
    latitude: 16.5062,
    longitude: 80.648,
  },
  {
    id: "guntur",
    name: "Guntur",
    district: "Guntur",
    state: "Andhra Pradesh",
    latitude: 16.3067,
    longitude: 80.4365,
  },
  {
    id: "tirupati",
    name: "Tirupati",
    district: "Tirupati",
    state: "Andhra Pradesh",
    latitude: 13.6288,
    longitude: 79.4192,
  },
  {
    id: "rajahmundry",
    name: "Rajahmundry",
    district: "East Godavari",
    state: "Andhra Pradesh",
    latitude: 17.0005,
    longitude: 81.804,
  },
  {
    id: "nellore",
    name: "Nellore",
    district: "SPSR Nellore",
    state: "Andhra Pradesh",
    latitude: 14.4426,
    longitude: 79.9865,
  },
  {
    id: "anantapur",
    name: "Anantapur",
    district: "Anantapur",
    state: "Andhra Pradesh",
    latitude: 14.6819,
    longitude: 77.6006,
  },
  {
    id: "kadapa",
    name: "Kadapa",
    district: "YSR",
    state: "Andhra Pradesh",
    latitude: 14.4673,
    longitude: 78.8242,
  },
  {
    id: "eluru",
    name: "Eluru",
    district: "Eluru",
    state: "Andhra Pradesh",
    latitude: 16.7107,
    longitude: 81.0952,
  },
  {
    id: "ongole",
    name: "Ongole",
    district: "Prakasam",
    state: "Andhra Pradesh",
    latitude: 15.5057,
    longitude: 80.0499,
  },
  {
    id: "srikakulam",
    name: "Srikakulam",
    district: "Srikakulam",
    state: "Andhra Pradesh",
    latitude: 18.2949,
    longitude: 83.8938,
  },
  {
    id: "chittoor",
    name: "Chittoor",
    district: "Chittoor",
    state: "Andhra Pradesh",
    latitude: 13.2172,
    longitude: 79.1003,
  },
  {
    id: "vizianagaram",
    name: "Vizianagaram",
    district: "Vizianagaram",
    state: "Andhra Pradesh",
    latitude: 18.1124,
    longitude: 83.4072,
  },
];

/**
 * Resolves a name/district query to a known preset.
 */
export function findMatchingLocation(query: string): LocationPreset | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  return (
    AP_AGRICULTURAL_LOCATIONS.find(
      (loc) =>
        loc.name.toLowerCase() === q ||
        loc.district.toLowerCase() === q ||
        loc.name.toLowerCase().includes(q) ||
        loc.district.toLowerCase().includes(q)
    ) || null
  );
}

/**
 * Degrees to compass direction string.
 */
export function degreesToCompass(deg: number): string {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const val = Math.floor((deg / 22.5) + 0.5);
  return directions[val % 16];
}

/**
 * Maps WMO weather code to condition name and icon identifier.
 * See: https://open-meteo.com/en/docs
 */
export function interpretWmoWeatherCode(code: number): {
  condition: string;
  icon: "sun" | "cloud-sun" | "cloud" | "fog" | "drizzle" | "rain" | "thunderstorm" | "snow";
} {
  switch (code) {
    case 0:
      return { condition: "Clear Sky", icon: "sun" };
    case 1:
      return { condition: "Mainly Clear", icon: "cloud-sun" };
    case 2:
      return { condition: "Partly Cloudy", icon: "cloud-sun" };
    case 3:
      return { condition: "Overcast", icon: "cloud" };
    case 45:
    case 48:
      return { condition: "Foggy / Mist", icon: "fog" };
    case 51:
    case 53:
    case 55:
      return { condition: "Light Drizzle", icon: "drizzle" };
    case 56:
    case 57:
      return { condition: "Freezing Drizzle", icon: "drizzle" };
    case 61:
      return { condition: "Slight Rain", icon: "rain" };
    case 63:
      return { condition: "Moderate Rain", icon: "rain" };
    case 65:
      return { condition: "Heavy Rain", icon: "rain" };
    case 66:
    case 67:
      return { condition: "Freezing Rain", icon: "rain" };
    case 71:
    case 73:
    case 75:
      return { condition: "Snow Fall", icon: "snow" };
    case 77:
      return { condition: "Snow Grains", icon: "snow" };
    case 80:
      return { condition: "Slight Rain Showers", icon: "rain" };
    case 81:
      return { condition: "Moderate Rain Showers", icon: "rain" };
    case 82:
      return { condition: "Violent Rain Showers", icon: "rain" };
    case 85:
    case 86:
      return { condition: "Snow Showers", icon: "snow" };
    case 95:
      return { condition: "Thunderstorm", icon: "thunderstorm" };
    case 96:
    case 99:
      return { condition: "Thunderstorm with Hail", icon: "thunderstorm" };
    default:
      return { condition: "Partly Cloudy", icon: "cloud-sun" };
  }
}
