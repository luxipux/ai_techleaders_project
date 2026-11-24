import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import RootLayout, { metadata } from "./layout";

describe("RootLayout", () => {
  it("renders the html shell around the page", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <p>child</p>
      </RootLayout>,
    );
    expect(html).toMatch(/^<html lang="en">/);
    expect(html).toContain('<body class="min-h-svh"><p>child</p></body>');
  });

  it("defines the site title template and description", () => {
    expect(metadata.title).toEqual({ default: "DevMentor", template: "%s · DevMentor" });
    expect(metadata.description).toMatch(/DevMentor/);
  });
});
