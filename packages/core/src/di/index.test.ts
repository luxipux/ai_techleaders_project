import { describe, expect, it } from "vitest";

import { asClass, asFunction, asValue, createDiContainer, InjectionMode, Lifetime } from "./index";

interface TestCradle {
  greeting: string;
  greeter: Greeter;
  requestId: string;
}

class Greeter {
  readonly #greeting: string;

  constructor({ greeting }: Pick<TestCradle, "greeting">) {
    this.#greeting = greeting;
  }

  greet(name: string) {
    return `${this.#greeting}, ${name}!`;
  }
}

describe("createDiContainer", () => {
  it("uses PROXY injection mode with strict lifetimes", () => {
    const container = createDiContainer<TestCradle>();
    expect(container.options.injectionMode).toBe(InjectionMode.PROXY);
    expect(container.options.strict).toBe(true);
  });

  it("injects dependencies as one destructured cradle object", () => {
    const container = createDiContainer<TestCradle>();
    container.register({ greeting: asValue("Hello"), greeter: asClass(Greeter) });
    expect(container.cradle.greeter.greet("Ada")).toBe("Hello, Ada!");
  });

  it("rejects a singleton that depends on a scoped registration", () => {
    const container = createDiContainer<TestCradle>();
    container.register({
      requestId: asFunction(() => "req-1").scoped(),
      greeting: asFunction(({ requestId }: Pick<TestCradle, "requestId">) => requestId).singleton(),
    });
    expect(() => container.createScope().resolve("greeting")).toThrow(/singleton|lifetime/i);
  });

  it("re-exports the Awilix lifetimes", () => {
    expect(Lifetime).toMatchObject({ SINGLETON: "SINGLETON", SCOPED: "SCOPED", TRANSIENT: "TRANSIENT" });
  });
});
