/**
 * Форматирование вывода в консоль.
 * Без цветов, без эмодзи — чистый текст.
 */

function formatForecastTable(forecast) {
  if (!forecast || forecast.length === 0) {
    return 'Нет данных о прогнозе.';
  }

  const header = [
    'Дата       | Мин. °C | Макс. °C | Осадки, мм',
    '-----------+---------+----------+------------',
  ];

  const rows = forecast.map((day) => {
    const date = day.date.split('T')[0];
    const min = String(day.tempMin).padStart(7);
    const max = String(day.tempMax).padStart(8);
    const precip = String(day.precipitation).padStart(10);
    return `${date} |${min} |${max} |${precip}`;
  });

  return [...header, ...rows].join('\n');
}

export function formatWeatherOutput(data) {
  const { city, forecast, fromCache } = data;
  const cacheStatus = fromCache ? '[из кэша]' : '[свежие данные]';

  let output = '';
  output += '='.repeat(50) + '\n';
  output += `${city.name}, ${city.country}\n`;
  output += `   Координаты: ${city.lat}, ${city.lon}\n`;
  output += `   Статус: ${cacheStatus}\n\n`;
  output += formatForecastTable(forecast) + '\n';
  output += '='.repeat(50);

  return output;
}

export function formatMultipleOutput(results) {
  let output = '';

  results.forEach((result, index) => {
    if (index > 0) output += '\n\n';

    if (result.success) {
      output += formatWeatherOutput(result.data);
    } else {
      output += `${result.city}: ${result.error}`;
    }
  });

  return output;
}

export function formatError(error, city = '') {
  const prefix = city ? `${city}: ` : '';
  return `${prefix}${error.message || error}`;
}