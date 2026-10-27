import { jelajahModules, type JelajahModule } from "@/modules/jelajah/api/jelajah_catalog";

export type BusinessSearchParams = Record<string, string | string[] | undefined>;

function matchPath(template: string, path: string) {
  const expected = template.split("/").filter(Boolean);
  const actual = path.split("/").filter(Boolean);
  if (expected.length !== actual.length) return null;
  const ids: string[] = [];
  for (let index = 0; index < expected.length; index += 1) {
    if (/^\{[^}]+\}$/.test(expected[index])) ids.push(actual[index]);
    else if (expected[index] !== actual[index]) return null;
  }
  return ids;
}

function queryMatches(module: JelajahModule, params: BusinessSearchParams) {
  return Object.entries(module.query ?? {}).every(([key, value]) => params[key] === value);
}

// All literal list paths must win over /{id}, regardless of catalog order.
// In particular, "ajuan" is a list segment, never a record ID.
export function resolveBusinessRoute(path: string, params: BusinessSearchParams = {}) {
  const list = jelajahModules.find((module) =>
    matchPath(module.path, path)?.length === 0 && queryMatches(module, params),
  );
  if (list) return { module: list, itemId: undefined };

  for (const entry of jelajahModules) {
    const template = entry.kind === "sdm_object"
      ? entry.path
      : entry.detailPath ?? (entry.children?.length ? `${entry.path}/{id}` : undefined);
    if (!template) continue;
    const ids = matchPath(template, path);
    if (ids?.length === 1) return { module: entry, itemId: ids[0] };
  }
  return null;
}
