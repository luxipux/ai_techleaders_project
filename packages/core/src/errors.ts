/** Base class for expected, domain-level errors (safe to show to the user). */
export class AppError extends Error {
  constructor(
    message: string,
    readonly code: string = "app_error",
    readonly status: number = 500,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found", options?: ErrorOptions) {
    super(message, "not_found", 404, options);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input", options?: ErrorOptions) {
    super(message, "validation_error", 400, options);
  }
}
