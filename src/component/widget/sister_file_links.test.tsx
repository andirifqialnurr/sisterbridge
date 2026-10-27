import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { DokumenDownloadLink } from "./sister_file_links";

it.each([undefined, null, "", "../secret", 123])("does not offer a download for invalid ID %s", id => {
  expect(renderToStaticMarkup(<DokumenDownloadLink id={id} />)).toBe("");
});

it("renders an accessible action rather than navigating to raw API JSON", () => {
  const html = renderToStaticMarkup(<DokumenDownloadLink id="33333333-3333-4333-8333-333333333333" label="Unduh dokumen" />);
  expect(html).toContain('type="button"');
  expect(html).toContain('aria-busy="false"');
  expect(html).toContain("Unduh dokumen");
  expect(html).not.toContain("href=");
  expect(html).not.toContain("target=");
});
