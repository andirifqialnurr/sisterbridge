import { expect, it } from "vitest";
import { safeNextPath } from "./safe_next_path";

it.each([null, "", "https://evil.test/", "javascript:alert(1)", "//evil.test", "///evil.test", "/\\evil.test", "/\n/evil.test", "/\t/evil.test", "/\r/evil.test", "/path\u0000", "/path\\name"])("rejects unsafe post-login navigation %j", value => {
  expect(safeNextPath(value)).toBe("/");
});

it.each(["/", "/pegawai?page=2", "/referensi/agama", "/pegawai?search=Example%20Name#results"])("preserves local path/query/hash %s", value => {
  expect(safeNextPath(value)).toBe(value);
});

it("canonicalizes dot segments without escaping the application origin", () => {
  expect(safeNextPath("/pegawai/../referensi/agama")).toBe("/referensi/agama");
});
