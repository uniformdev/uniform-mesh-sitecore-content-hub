export class RateLimitError extends Error {
  constructor(url: string) {
    super('Rate limit exceeded: ' + url);

    Object.setPrototypeOf(this, RateLimitError.prototype);

    this.name = 'RateLimitError';
  }
}

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, url: string) {
    super(`API error: [${statusCode}] ${url}`);

    Object.setPrototypeOf(this, ApiError.prototype);

    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}
