import { describe, expect, it } from "vitest";

import { jelajahModules } from "@/modules/jelajah/api/jelajah_catalog";

import { replicaEndpointTemplates } from "./replica/replica_catalog";
import { sisterPdfGetEndpoints } from "./sister_get_endpoints";

// Placeholder names differ ({id_kls} in the PDF, {id} in code); compare shapes.
const normalize = (path: string) => path.replace(/\{[^}]+\}/g, "{}");
const pdfEndpoints = sisterPdfGetEndpoints.map(normalize);

// Served by /api/sister/file/{foto,dokumen}; binary, not JSON.
const fileRouteEndpoints = ["/data_pribadi/foto/{}", "/dokumen/{}/download"];

function explorerEndpoints() {
  return new Set(
    jelajahModules
      .flatMap((module) => [
        module.path,
        ...(module.detailPath ? [module.detailPath] : []),
        ...(module.children ?? []).map((child) => child.path),
      ])
      .map(normalize),
  );
}

describe("SISTER GET coverage", () => {
  it("lists the 140 unique GET endpoints of the PDF", () => {
    expect(new Set(sisterPdfGetEndpoints).size).toBe(140);
  });

  it("gives every PDF GET endpoint a read path in the app", () => {
    const replica = new Set(replicaEndpointTemplates().map(normalize));
    const explorer = explorerEndpoints();
    const uncovered = pdfEndpoints.filter(
      (path) => !replica.has(path) && !explorer.has(path) && !fileRouteEndpoints.includes(path),
    );
    expect(uncovered).toEqual([]);
  });

  it("replicates every JSON GET endpoint except keyword searches", () => {
    const replica = new Set(replicaEndpointTemplates().map(normalize));
    const notReplicated = pdfEndpoints.filter(
      (path) => !replica.has(path) && !fileRouteEndpoints.includes(path),
    );
    expect(notReplicated.sort()).toEqual([
      "/kolaborator_eksternal",
      "/kolaborator_eksternal/{}",
      "/referensi/mahasiswa_pddikti",
    ]);
  });

  it("does not invent endpoints outside the PDF", () => {
    const pdf = new Set(pdfEndpoints);
    const invented = [...replicaEndpointTemplates().map(normalize), ...explorerEndpoints()].filter(
      (path) => !pdf.has(path),
    );
    expect(invented).toEqual([]);
  });
});
