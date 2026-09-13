import { getCityCoordinates, getWeatherForecast } from '../api/weather-client.js';
import { loadReport, saveReport, isCacheValid } from '../storage/cache.js';
import { CityNotFoundError } from '../utils/errors.js';

export async function getWeatherForCity(city, days = 3, useCache = true) {
  if (useCache) {
    const cached = await loadReport(city);
    if (cached && isCacheValid(cached)) {
      console.log(`[КЭШ] Использован сохранённый отчёт для "${city}"`);
      return {
        city: cached.city,
        forecast: cached.data,
        fromCache: true,
      };
    }
  }

  console.log(`[ЗАПРОС] Получение данных для "${city}"...`);

  const coordinates = await getCityCoordinates(city);
  if (!coordinates) {
    throw new CityNotFoundError(city);
  }

  const forecast = await getWeatherForecast(
    coordinates.latitude,
    coordinates.longitude,
    days
  );

  const cityInfo = {
    name: coordinates.name,
    country: coordinates.country,
    lat: coordinates.latitude,
    lon: coordinates.longitude,
  };

  await saveReport(cityInfo, forecast);

  return {
    city: cityInfo,
    forecast,
    fromCache: false,
  };
}

export async function getWeatherForCities(cities, days = 3, useCache = true) {
  const promises = cities.map(async (city) => {
    const trimmed = city.trim();
    try {
      const result = await getWeatherForCity(trimmed, days, useCache);
      return { city: trimmed, success: true, data: result };
    } catch (error) {
      return { city: trimmed, success: false, error: error.message };
    }
  });

  return await Promise.all(promises);
}