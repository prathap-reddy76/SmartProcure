import { WeatherProvider } from "./provider";
import {
  WeatherData,
  WeatherQueryParams,
  CurrentWeather,
  HourlyForecast,
  DailyForecast,
  RainSummary,
  WeatherAlert,
} from "./types";
import {
  interpretWmoWeatherCode,
  degreesToCompass,
} from "./location-presets";
import {
  generateFarmingInsights,
  generateCropAwareInsights,
} from "./insights-engine";
import https from "node:https";

/**
 * Open-Meteo Weather API Provider.
 * Free, open, and requires no API key.
 */
interface OpenMeteoRawResponse {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    apparent_temperature?: number;
    precipitation?: number;
    weather_code?: number;
    surface_pressure?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    relative_humidity_2m?: number[];
    precipitation_probability?: number[];
    precipitation?: number[];
    weather_code?: number[];
    wind_speed_10m?: number[];
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    apparent_temperature_max?: number[];
    apparent_temperature_min?: number[];
    precipitation_sum?: number[];
    precipitation_probability_max?: number[];
    wind_speed_10m_max?: number[];
  };
}

export class OpenMeteoProvider implements WeatherProvider {
  readonly name = "open-meteo";

  private async fetchWithTlsFallback(url: string): Promise<OpenMeteoRawResponse> {
    try {
      // First attempt: standard fetch
      const res = await fetch(url, {
        headers: { "User-Agent": "SmartProcure-App/1.0" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        throw new Error(`Open-Meteo API returned status ${res.status}`);
      }
      return (await res.json()) as OpenMeteoRawResponse;
    } catch {
      // In local Windows environments with custom certificate stores or inspection, retry with https request fallback
      return new Promise((resolve, reject) => {
        const req = https.get(
          url,
          {
            rejectUnauthorized: false,
            headers: { "User-Agent": "SmartProcure-App/1.0" },
            timeout: 8000,
          },
          (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
              try {
                if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
                  reject(new Error(`Open-Meteo fallback status ${res.statusCode}`));
                  return;
                }
                resolve(JSON.parse(data));
              } catch (parseErr) {
                reject(parseErr);
              }
            });
          }
        );
        req.on("error", (e) => reject(e));
        req.on("timeout", () => {
          req.destroy();
          reject(new Error("Weather provider request timed out."));
        });
      });
    }
  }

  async fetchWeather(params: WeatherQueryParams): Promise<WeatherData> {
    const { latitude, longitude, locationName = "Current Location", crops = [] } = params;

    const lat = Number(latitude.toFixed(4));
    const lon = Number(longitude.toFixed(4));

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto&forecast_days=7`;

    const raw = await this.fetchWithTlsFallback(url);

    if (!raw || !raw.current || !raw.hourly || !raw.daily) {
      throw new Error("Invalid or incomplete data received from weather service.");
    }

    // 1. Normalize Current Weather
    const curr = raw.current;
    const wmoInterpretation = interpretWmoWeatherCode(curr.weather_code ?? 0);
    const windDirectionDeg = curr.wind_direction_10m ?? 0;

    const current: CurrentWeather = {
      locationName,
      latitude: lat,
      longitude: lon,
      temperature: Math.round((curr.temperature_2m ?? 0) * 10) / 10,
      feelsLike: Math.round((curr.apparent_temperature ?? 0) * 10) / 10,
      condition: wmoInterpretation.condition,
      icon: wmoInterpretation.icon,
      weatherCode: curr.weather_code ?? 0,
      humidity: Math.round(curr.relative_humidity_2m ?? 0),
      windSpeed: Math.round(curr.wind_speed_10m ?? 0),
      windDirection: degreesToCompass(windDirectionDeg),
      windDirectionDegrees: windDirectionDeg,
      precipitation: Math.round((curr.precipitation ?? 0) * 10) / 10,
      pressure: Math.round(curr.surface_pressure ?? 1013),
      updatedAt: new Date().toISOString(),
    };

    // 2. Normalize Hourly Forecast (Next 24 Hours)
    const hourlyTimes: string[] = raw.hourly.time || [];
    const hourlyTemps: number[] = raw.hourly.temperature_2m || [];
    const hourlyCodes: number[] = raw.hourly.weather_code || [];
    const hourlyRainProbs: number[] = raw.hourly.precipitation_probability || [];
    const hourlyRains: number[] = raw.hourly.precipitation || [];
    const hourlyHumidity: number[] = raw.hourly.relative_humidity_2m || [];
    const hourlyWinds: number[] = raw.hourly.wind_speed_10m || [];

    const nowIso = new Date().toISOString().slice(0, 13); // "YYYY-MM-DDTHH"
    let startIndex = hourlyTimes.findIndex((t) => t.startsWith(nowIso));
    if (startIndex === -1) startIndex = 0;

    const hourlySliceIndices = Array.from({ length: 24 }, (_, i) => startIndex + i).filter(
      (idx) => idx < hourlyTimes.length
    );

    const hourly: HourlyForecast[] = hourlySliceIndices.map((idx) => {
      const timeStr = hourlyTimes[idx];
      const d = new Date(timeStr);
      const code = hourlyCodes[idx] ?? 0;
      const interp = interpretWmoWeatherCode(code);

      const hours = d.getHours();
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHour = hours % 12 === 0 ? 12 : hours % 12;
      const formattedTime = `${displayHour} ${ampm}`;

      return {
        time: formattedTime,
        isoTime: timeStr,
        timestamp: d.getTime(),
        temperature: Math.round(hourlyTemps[idx] ?? 0),
        condition: interp.condition,
        icon: interp.icon,
        weatherCode: code,
        precipitationProbability: Math.round(hourlyRainProbs[idx] ?? 0),
        precipitationAmount: Math.round((hourlyRains[idx] ?? 0) * 10) / 10,
        humidity: Math.round(hourlyHumidity[idx] ?? 0),
        windSpeed: Math.round(hourlyWinds[idx] ?? 0),
      };
    });

    // 3. Normalize Daily Forecast (7 Days)
    const dailyTimes: string[] = raw.daily.time || [];
    const dailyCodes: number[] = raw.daily.weather_code || [];
    const dailyMaxTemps: number[] = raw.daily.temperature_2m_max || [];
    const dailyMinTemps: number[] = raw.daily.temperature_2m_min || [];
    const dailyRainSums: number[] = raw.daily.precipitation_sum || [];
    const dailyRainProbs: number[] = raw.daily.precipitation_probability_max || [];
    const dailyWindMax: number[] = raw.daily.wind_speed_10m_max || [];

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const daily: DailyForecast[] = dailyTimes.slice(0, 7).map((dateStr, idx) => {
      const d = new Date(dateStr);
      const code = dailyCodes[idx] ?? 0;
      const interp = interpretWmoWeatherCode(code);

      let dayName = dayNames[d.getDay()];
      if (idx === 0) dayName = "Today";
      else if (idx === 1) dayName = "Tomorrow";

      const formattedDate = `${monthNames[d.getMonth()]} ${d.getDate()}`;

      return {
        date: dateStr,
        dayName,
        formattedDate,
        minTemperature: Math.round(dailyMinTemps[idx] ?? 0),
        maxTemperature: Math.round(dailyMaxTemps[idx] ?? 0),
        condition: interp.condition,
        icon: interp.icon,
        weatherCode: code,
        precipitationProbability: Math.round(dailyRainProbs[idx] ?? 0),
        precipitationAmount: Math.round((dailyRainSums[idx] ?? 0) * 10) / 10,
        windSpeedMax: Math.round(dailyWindMax[idx] ?? 0),
      };
    });

    // 4. Compute Rain Summary
    const todayRainMm = daily[0]?.precipitationAmount ?? current.precipitation;
    const rainProbabilityToday = daily[0]?.precipitationProbability ?? 0;
    const rainExpectedNext7DaysMm = daily.reduce((acc, d) => acc + d.precipitationAmount, 0);

    const rainyPeriods: string[] = [];
    // Check morning (6-12), afternoon (12-17), evening (17-21), night (21-6)
    const next12Hours = hourly.slice(0, 12);
    for (const h of next12Hours) {
      if (h.precipitationProbability >= 50 || h.precipitationAmount >= 1.0) {
        if (!rainyPeriods.includes(h.time)) {
          rainyPeriods.push(h.time);
        }
      }
    }

    const rainSummary: RainSummary = {
      todayRainMm: Math.round(todayRainMm * 10) / 10,
      rainProbabilityToday,
      rainExpectedNext7DaysMm: Math.round(rainExpectedNext7DaysMm * 10) / 10,
      isRainLikely: rainProbabilityToday >= 50 || todayRainMm > 2,
      rainyPeriods: rainyPeriods.slice(0, 4),
    };

    // 5. Evaluate Meteorological Alerts based on strictly defined criteria
    const alerts: WeatherAlert[] = [];

    // Check today and tomorrow for severe criteria
    const maxWind = Math.max(current.windSpeed, ...(daily.slice(0, 2).map((d) => d.windSpeedMax)));
    const maxDayRain = Math.max(...(daily.slice(0, 2).map((d) => d.precipitationAmount)));
    const hasThunderstorm = [current.weatherCode, daily[0]?.weatherCode, daily[1]?.weatherCode].some(
      (c) => c === 95 || c === 96 || c === 99
    );
    const maxTemp = Math.max(current.temperature, daily[0]?.maxTemperature ?? 0);

    if (maxWind >= 55) {
      alerts.push({
        id: `alert-wind-${Date.now()}`,
        title: "Severe Wind Warning",
        severity: "severe",
        description: `Gale or severe wind gusts exceeding ${maxWind} km/h are expected. Secure farm implements, nursery covers, and temporary yard shelters.`,
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 86400000).toISOString(),
        source: "Meteorological Alert System",
      });
    } else if (maxWind >= 40) {
      alerts.push({
        id: `alert-wind-${Date.now()}`,
        title: "Strong Wind Caution",
        severity: "caution",
        description: `Brisk winds up to ${maxWind} km/h forecast. Avoid aerial or foliar spraying operations.`,
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 86400000).toISOString(),
        source: "Meteorological Advisory",
      });
    }

    if (maxDayRain >= 40) {
      alerts.push({
        id: `alert-rain-${Date.now()}`,
        title: "Heavy Rainfall Warning",
        severity: "warning",
        description: `High precipitation (${Math.round(maxDayRain)} mm) forecast within 24 hours. Risk of localized field waterlogging. Clear drainage outlets.`,
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 86400000).toISOString(),
        source: "Meteorological Alert System",
      });
    }

    if (hasThunderstorm) {
      alerts.push({
        id: `alert-thunder-${Date.now()}`,
        title: "Thunderstorm Advisory",
        severity: "caution",
        description: "Thunderstorms with lightning and sudden gusty showers detected in the vicinity. Move machinery and cattle to sheltered areas.",
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 43200000).toISOString(),
        source: "Meteorological Advisory",
      });
    }

    if (maxTemp >= 42) {
      alerts.push({
        id: `alert-heat-${Date.now()}`,
        title: "Extreme Heatwave Alert",
        severity: "severe",
        description: `Peak temperatures reaching ${Math.round(maxTemp)}°C. Avoid outdoor midday field labor. Ensure livestock have shade and water.`,
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 86400000).toISOString(),
        source: "Meteorological Alert System",
      });
    }

    // 6. Generate Agricultural Insights
    const farmingInsights = generateFarmingInsights(current, daily, rainSummary);
    const cropInsights = generateCropAwareInsights(crops, current, daily, rainSummary);

    return {
      current,
      hourly,
      daily,
      rainSummary,
      alerts,
      farmingInsights,
      cropInsights,
    };
  }
}
