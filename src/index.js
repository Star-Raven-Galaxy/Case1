import 'dotenv/config';

import { parseArgs } from 'util';
import { getWeatherForCities } from './services/weather-service.js';
import { formatMultipleOutput, formatError } from './format/formatter.js';
import { ValidationError } from './utils/errors.js';

function parseCommandLineArgs() {
     const args = process.argv.slice(2);

  let parsed;
  try {
    parsed = parseArgs({
      args,
      options: {
        city: { type: 'string', short: 'c' },
        days: { type: 'string', short: 'd', default: '3' },
        'no-cache': { type: 'boolean', short: 'n', default: false },
        help: { type: 'boolean', short: 'h', default: false },
      },
      strict: true,
      allowPositionals: false,
    });
} catch (error) {
    // parseArgs бросает на неизвестные флаги, отсутствие значения и т.п.
    throw new ValidationError(error.message);
  }
   const { values } = parsed;

  // Если --help — возвращается специальный маркер
  if (values.help) {
    return { help: true };
  }
    const rawCity = values.city;
  if (!rawCity) {
    throw new ValidationError(
      'Параметр --city обязателен. Пример: --city "Москва" или --city "Москва,Питер"'
    );
  }

  const cities = rawCity
    .split(',')
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  if (cities.length === 0) {
    throw new ValidationError('Список городов пуст. Укажите хотя бы один город.');
  }
  const days = parseInt(values.days, 10);
  if (Number.isNaN(days) || days < 1 || days > 7) {
    throw new ValidationError(
      `Параметр --days должен быть числом от 1 до 7 (получено: "${values.days}")`
    );
  }

  return {
    cities,
    days,
    useCache: !values['no-cache'],
  };
}
function showHelp() {
  console.log(`
  Погодный дайджест — консольная утилита прогноза погоды

Использование:
  node src/index.js --city <название> [--days <число>] [--no-cache]

Параметры:
  --city, -c      Название города или несколько через запятую (обязательно)
  --days, -d      Количество дней прогноза, 1–7 (по умолчанию 3)
  --no-cache, -n  Принудительно запросить свежие данные, игнорируя кэш
  --help, -h      Показать эту справку

Примеры:
  node src/index.js --city "Москва"
  node src/index.js --city "Нижний Новгород" --days 5
  node src/index.js --city "Москва,Санкт-Петербург,Казань"
  node src/index.js --city "Лондон" --days 7 --no-cache

Переменные окружения (.env):
  WEATHER_API_GEO_URL       URL геокодинга
  WEATHER_API_FORECAST_URL  URL прогноза
  REQUEST_TIMEOUT           Таймаут запроса, мс (по умолчанию 5000)
  REPORTS_DIR               Директория для отчётов (по умолчанию ./reports)
`);
}

async function main() {
  try {
    const args = parseCommandLineArgs();

    if (args.help) {
      showHelp();
      process.exit(0);
    }

    console.log(
      `\n  Получение прогноза погоды для ${args.cities.length} гор. ...\n`
    );

    const results = await getWeatherForCities(args.cities, args.days, args.useCache);

    const output = formatMultipleOutput(results);
    console.log(output);

    // Если хотя бы один город упал — код выхода 1
    const hasErrors = results.some((r) => !r.success);
    process.exit(hasErrors ? 1 : 0);
  } catch (error) {
    // Сюда попадают только «глобальные» ошибки:
    // - ValidationError от parseCommandLineArgs
    // - непредвиденные ошибки (например, ошибка fs в cache.js)
    console.error(formatError(error));
    process.exit(error.code || 1);
  }
}

main();