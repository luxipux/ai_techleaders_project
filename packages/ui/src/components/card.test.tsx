import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";

describe("Card", () => {
  it("renders every part with its slot and merged classes", () => {
    render(
      <Card className="c">
        <CardHeader className="h">
          <CardTitle className="t">Title</CardTitle>
          <CardDescription className="d">Description</CardDescription>
          <CardAction className="a">Action</CardAction>
        </CardHeader>
        <CardContent className="ct">Content</CardContent>
        <CardFooter className="f">Footer</CardFooter>
      </Card>,
    );

    const parts = {
      card: "Title",
      "card-title": "Title",
      "card-description": "Description",
      "card-action": "Action",
      "card-content": "Content",
      "card-footer": "Footer",
    };
    for (const [slot, text] of Object.entries(parts)) {
      const element = document.querySelector(`[data-slot="${slot}"]`);
      expect(element?.textContent, slot).toContain(text);
    }
    expect(document.querySelector('[data-slot="card-header"]')?.className).toMatch(/ h$/);
    expect(screen.getByText("Title").className).toMatch(/ t$/);
    expect(screen.getByText("Footer").className).toMatch(/ f$/);
  });
});
