export class AppError extends Error {
  constructor(message, code = 1) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(`Ошибка валидации: ${message}`, 5);
    this.name = 'ValidationError';
  }
}

export class CityNotFoundError extends AppError {
  constructor(city) {
    super(`Город "${city}" не найден. Проверьте название и попробуйте снова.`, 2);
    this.name = 'CityNotFoundError';
    this.city = city;
  }
}

export class ApiError extends AppError {
  constructor(message, statusCode) {
    super(`Ошибка API: ${message} (статус: ${statusCode})`, 3);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

export class NetworkError extends AppError {
  constructor(message) {
    super(`Сетевая ошибка: ${message}`, 4);
    this.name = 'NetworkError';
  }
}