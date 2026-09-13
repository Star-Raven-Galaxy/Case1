import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORTS_DIR =
  process.env.REPORTS_DIR || path.join(__dirname, '../../reports');

async function ensureReportsDir() {
  try {
    await fs.mkdir(REPORTS_DIR, { recursive: true });
  } catch (error) {
    console.error(`Не удалось создать директорию ${REPORTS_DIR}:`, error.message);
  }
}

function getReportFileName(city) {
  const today = new Date().toISOString().split('T')[0];
  const safeCity = city.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_');
  return path.join(REPORTS_DIR, `${safeCity}-${today}.json`);
}

export async function saveReport(cityInfo, data) {
  await ensureReportsDir();
  const filePath = getReportFileName(cityInfo.name);

  const report = {
    city: cityInfo,
    date: new Date().toISOString(),
    data,
  };

  await fs.writeFile(filePath, JSON.stringify(report, null, 2), 'utf-8');
  return filePath;
}

export async function loadReport(city) {
  const filePath = getReportFileName(city);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw new Error(`Ошибка чтения кэша: ${error.message}`);
  }
}

export function isCacheValid(report) {
  const today = new Date().toISOString().split('T')[0];
  const reportDate = new Date(report.date).toISOString().split('T')[0];
  return reportDate === today;
}