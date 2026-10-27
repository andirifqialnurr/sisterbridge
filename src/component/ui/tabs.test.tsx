import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { Tabs } from "./tabs";

it("connects the selected tab and panel with a single roving tab stop", () => {
  const html = renderToStaticMarkup(<Tabs ariaLabel="Test sections" items={[
    { value: "first", label: "First" },
    { value: "disabled", label: "Disabled", disabled: true },
    { value: "last", label: "Last" },
  ]} value="last" onValueChange={vi.fn()}>Panel</Tabs>);
  const buttons = html.match(/<button[^>]*role="tab"[^>]*>/g) ?? [];
  expect(buttons).toHaveLength(3);
  expect(buttons.filter(button => button.includes('tabindex="0"'))).toHaveLength(1);
  const selected = buttons.find(button => button.includes('aria-selected="true"'))!;
  expect(selected).toContain('tabindex="0"');
  const id = selected.match(/\sid="([^"]+)"/)![1];
  const panel = selected.match(/aria-controls="([^"]+)"/)![1];
  expect(html).toContain(`aria-labelledby="${id}"`);
  expect(html).toContain(`id="${panel}" role="tabpanel"`);
  expect(buttons.find(button => button.includes('disabled=""'))).toContain('tabindex="-1"');
});
