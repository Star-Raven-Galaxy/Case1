import { ApiError, NetworkError } from '../utils/errors.js';

const DEFAULT_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT, 10) || 5000;

async function fetchWithTimeout(url, options = {}, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new ApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new NetworkError(`Превышен таймаут запроса (${timeout} мс)`);
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new NetworkError('Не удается соединиться с сервером. Проверьте интернет-соединение.');
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new NetworkError(error.message || 'Неизвестная сетевая ошибка');
  }
}

export async function getCityCoordinates(city) {
  const baseUrl = process.env.WEATHER_API_GEO_URL || 'https://geocoding-api.open-meteo.com/v1/search';

  const url = new URL(baseUrl);
  url.searchParams.set('name', city);
  url.searchParams.set('count', '1');
  url.searchParams.set('language', 'ru');
  url.searchParams.set('format', 'json');

  const data = await fetchWithTimeout(url.toString());

  if (!data.results || data.results.length === 0) {
    return null;
  }

  const result = data.results[0];

  return {
    name: result.name,
    country: result.country || 'Неизвестно',
    latitude: result.latitude,
    longitude: result.longitude,
  };
}

export async function getWeatherForecast(lat, lon, days = 3) {
  const baseUrl = process.env.WEATHER_API_FORECAST_URL || 'https://api.open-meteo.com/v1/forecast';

  const url = new URL(baseUrl);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum');
  url.searchParams.set('forecast_days', String(days));
  url.searchParams.set('timezone', 'auto');

  const data = await fetchWithTimeout(url.toString());

  if (!data.daily) {
    throw new ApiError('Неверный формат ответа от API прогноза', 500);
  }

  const { time, temperature_2m_max, temperature_2m_min, precipitation_sum } = data.daily;

  return time.map((date, index) => ({
    date,
    tempMax: temperature_2m_max[index],
    tempMin: temperature_2m_min[index],
    precipitation: precipitation_sum[index],
  }));
}