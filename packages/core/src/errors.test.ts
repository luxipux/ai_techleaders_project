import { describe, expect, it } from "vitest";

import { AppError, NotFoundError, ValidationError } from "./errors";

describe("AppError", () => {
  it("defaults to a generic 500 error", () => {
    const error = new AppError("Boom");
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Boom");
    expect(error.code).toBe("app_error");
    expect(error.status).toBe(500);
    expect(error.name).toBe("AppError");
  });

  it("accepts a custom code, status and cause", () => {
    const cause = new Error("root cause");
    const error = new AppError("Conflict", "conflict", 409, { cause });
    expect(error.code).toBe("conflict");
    expect(error.status).toBe(409);
    expect(error.cause).toBe(cause);
  });

  it("names subclasses after the concrete class", () => {
    class PaymentRequiredError extends AppError {}
    expect(new PaymentRequiredError("Pay").name).toBe("PaymentRequiredError");
  });
});

describe("NotFoundError", () => {
  it("is a 404 with a default message", () => {
    const error = new NotFoundError();
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ message: "Not found", code: "not_found", status: 404, name: "NotFoundError" });
  });

  it("accepts a custom message and cause", () => {
    const cause = new Error("missing row");
    const error = new NotFoundError("User not found", { cause });
    expect(error.message).toBe("User not found");
    expect(error.cause).toBe(cause);
  });
});

describe("ValidationError", () => {
  it("is a 400 with a default message", () => {
    const error = new ValidationError();
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({
      message: "Invalid input",
      code: "validation_error",
      status: 400,
      name: "ValidationError",
    });
  });

  it("accepts a custom message and cause", () => {
    const cause = new Error("bad email");
    const error = new ValidationError("Email is invalid", { cause });
    expect(error.message).toBe("Email is invalid");
    expect(error.cause).toBe(cause);
  });
});
