/**
 * Core weather data models and types for SmartProcure.
 */

export type WeatherSeverity = "normal" | "caution" | "warning" | "severe";

export interface CurrentWeather {
  locationName: string;
  latitude: number;
  longitude: number;
  temperature: number; // in Celsius
  feelsLike: number; // in Celsius
  condition: string; // e.g. "Clear Sky", "Partly Cloudy", "Moderate Rain"
  icon: string; // e.g. "sun", "cloud", "rain", "thunderstorm", "fog"
  weatherCode: number; // WMO code
  humidity: number; // percentage
  windSpeed: number; // in km/h
  windDirection: string; // compass direction e.g. "NE", "SSE"
  windDirectionDegrees: number;
  precipitation: number; // in mm
  pressure?: number; // in hPa
  visibility?: number; // in km
  uvIndex?: number;
  updatedAt: string; // ISO date string
}

export interface HourlyForecast {
  time: string; // formatted time e.g. "08:00 AM"
  isoTime: string;
  timestamp: number;
  temperature: number; // Celsius
  condition: string;
  icon: string;
  weatherCode: number;
  precipitationProbability: number; // percentage
  precipitationAmount: number; // in mm
  humidity: number;
  windSpeed: number; // km/h
}

export interface DailyForecast {
  date: string; // YYYY-MM-DD
  dayName: string; // "Today", "Tomorrow", "Monday", etc.
  formattedDate: string; // "Oct 03"
  minTemperature: number;
  maxTemperature: number;
  condition: string;
  icon: string;
  weatherCode: number;
  precipitationProbability: number; // percentage
  precipitationAmount: number; // in mm
  windSpeedMax: number; // km/h
}

export interface RainSummary {
  todayRainMm: number;
  rainProbabilityToday: number;
  rainExpectedNext7DaysMm: number;
  isRainLikely: boolean;
  rainyPeriods: string[]; // e.g. ["Afternoon", "Late Evening"]
}

export interface WeatherAlert {
  id: string;
  title: string;
  severity: WeatherSeverity;
  description: string;
  startsAt: string;
  endsAt: string;
  source: string;
}

export interface FarmingInsight {
  id: string;
  type: "irrigation" | "harvest" | "spray" | "drainage" | "general";
  title: string;
  message: string;
  priority: "info" | "warning" | "alert";
}

export interface CropAwareInsight {
  cropName: string;
  insight: string;
  recommendation: string;
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  rainSummary: RainSummary;
  alerts: WeatherAlert[];
  farmingInsights: FarmingInsight[];
  cropInsights: CropAwareInsight[];
  isCached?: boolean;
}

export interface WeatherQueryParams {
  latitude: number;
  longitude: number;
  locationName?: string;
  crops?: string[];
  forceRefresh?: boolean;
}
