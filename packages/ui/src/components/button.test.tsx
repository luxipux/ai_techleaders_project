import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { cn } from "../lib/utils";
import { Button, buttonVariants } from "./button";

describe("Button", () => {
  it("renders a button with the default variant and size", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.dataset).toMatchObject({ slot: "button", variant: "default", size: "default" });
    expect(button.className).toBe(cn(buttonVariants()));
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("applies variant, size and extra classes", () => {
    render(
      <Button variant="destructive" size="lg" className="w-full">
        Delete
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button.dataset).toMatchObject({ variant: "destructive", size: "lg" });
    expect(button.className).toBe(cn(buttonVariants({ variant: "destructive", size: "lg" }), "w-full"));
  });

  it("renders its child element when asChild is set", () => {
    render(
      <Button asChild variant="outline" size="sm">
        <a href="/docs">Docs</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Docs" });
    expect(link.dataset).toMatchObject({ slot: "button", variant: "outline", size: "sm" });
  });
});
