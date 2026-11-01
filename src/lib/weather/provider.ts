import { WeatherData, WeatherQueryParams } from "./types";

/**
 * WeatherProvider abstraction interface.
 * Decouples the application from any specific weather service vendor.
 */
export interface WeatherProvider {
  /**
   * Unique name of the weather provider (e.g. 'open-meteo', 'mock')
   */
  readonly name: string;

  /**
   * Fetches and normalizes weather data for given coordinates.
   */
  fetchWeather(params: WeatherQueryParams): Promise<WeatherData>;
}
