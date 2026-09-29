import { describe, expect, it } from "vitest";

import type { ReplicaFetchResult, ReplicaFetcher } from "./replica_fetch";
import { MemoryReplicaStore } from "./replica_memory_store";
import { RateGate } from "./replica_rate_gate";
import { runReplicaSync, toItems, toReplicaItems, type ReplicaSyncOptions } from "./replica_sync";

const idPt = "00000000-0000-4000-8000-0000000000a1";
const idUnit = "00000000-0000-4000-8000-0000000000b1";
const idSdm = "00000000-0000-4000-8000-000000000001";
const idPenelitian = "00000000-0000-4000-8000-0000000000c1";
const idPenelitian2 = "00000000-0000-4000-8000-0000000000c2";

type Responses = Record<string, unknown | ReplicaFetchResult>;

function key(path: string, query?: Record<string, string>) {
  const search = new URLSearchParams(Object.entries(query ?? {})).toString();
  return search ? `${path}?${search}` : path;
}

// Unlisted requests answer an empty array, like SISTER does for a SDM
// without data on most list endpoints.
function fakeFetcher(responses: Responses) {
  const calls: string[] = [];
  const fetcher: ReplicaFetcher = async (path, query) => {
    const requestKey = key(path, query);
    calls.push(requestKey);
    const response = responses[requestKey];
    if (response && typeof response === "object" && "ok" in response) {
      return response as ReplicaFetchResult;
    }
    return { ok: true, payload: response ?? [] };
  };
  return { fetcher, calls };
}

const options: ReplicaSyncOptions = {
  integrationId: "00000000-0000-4000-8000-00000000ffff",
  baseUrl: "https://sister.example.test/ws-sandbox.php/1.0/",
  credentialRef: "environment",
  scope: "full",
  concurrency: 3,
  // Effectively unpaced; pacing itself is covered by replica_rate_gate.test.ts.
  requestsPerSecond: 100_000,
  includeChildren: true,
};

// A gate whose pauses complete instantly.
function instantGate(maxConsecutiveRateLimits = 6) {
  let now = 0;
  return new RateGate({
    requestsPerSecond: 100_000,
    maxConsecutiveRateLimits,
    now: () => now,
    sleep: async (ms) => {
      now += ms;
    },
  });
}

const rateLimited: ReplicaFetchResult = {
  ok: false,
  status: 429,
  code: "SISTER_HTTP_429",
  message: "Too Many Requests",
};

function baseResponses(): Responses {
  return {
    "/referensi/profil_pt": { id_perguruan_tinggi: idPt, nama_perguruan_tinggi: "PT Uji" },
    "/referensi/agama": [
      { id: 1, nama: "Islam" },
      { id: 2, nama: "Kristen" },
    ],
    [`/referensi/unit_kerja?id_perguruan_tinggi=${idPt}`]: [{ id: idUnit, nama: "Prodi", id_jenis_unit: 3 }],
    [`/referensi/detail_unit_kerja?id_unit_kerja=${idUnit}`]: [{ id: idUnit, nama: "Prodi" }],
    "/referensi/sdm": [{ id_sdm: idSdm, nama_sdm: "Dosen Uji" }],
    [`/data_pribadi/profil/${idSdm}`]: { nama: "Dosen Uji" },
    [`/penelitian?id_sdm=${idSdm}&per_page=100&page=1`]: [{ id: idPenelitian, judul: "A" }],
    [`/penelitian/${idPenelitian}`]: { id: idPenelitian, judul: "A", dokumen: [] },
    [`/penelitian/${idPenelitian}/bidang_ilmu`]: [{ id: "bi-1" }],
    [`/bkd/laporan_akhir_bkd?id_sdm=${idSdm}`]: [
      { id_smt: "20231", sks_kinerja: "12.0000" },
      { id_smt: "20232", sks_kinerja: "13.0000" },
    ],
    [`/bkd/ajar?id_sdm=${idSdm}&id_smt=20231`]: [{ id_smt: "20231", judul_keg: "Kuliah" }],
    [`/pengajaran?id_sdm=${idSdm}`]: [{ id: "ajar-1" }, { id: "ajar-2" }],
    ["/pengajaran/ajar-1"]: { id: "ajar-1", id_kelas: "kelas-1", id_pt: idPt },
    // Taught at another PT: SISTER would answer 403 for this class.
    ["/pengajaran/ajar-2"]: { id: "ajar-2", id_kelas: "kelas-lain", id_pt: "other-pt" },
    ["/kelas_kuliah/kelas-1/dokumen"]: [{ id: "dok-1", nama: "SK Mengajar" }],
  };
}

describe("replica item helpers", () => {
  it("normalizes array, object, and empty object payloads", () => {
    expect(toItems([1, 2])).toEqual({ items: [1, 2], shape: "array" });
    expect(toItems({ a: 1 })).toEqual({ items: [{ a: 1 }], shape: "object" });
    expect(toItems({})).toEqual({ items: [], shape: "empty_object" });
  });

  it("keys items by id, then id_sdm, then content hash, and objects as self", () => {
    const [byId, bySdm, byHash] = toReplicaItems(
      [{ id: 7 }, { id_sdm: "s-1" }, { nama: "tanpa id" }],
      "list",
    );
    expect(byId.itemKey).toBe("7");
    expect(bySdm.itemKey).toBe("s-1");
    expect(byHash.itemKey).toMatch(/^h:[0-9a-f]{40}$/);
    expect(toReplicaItems([{ id: "x" }], "object")[0].itemKey).toBe("self");
  });

  it("hashes independently of key order", () => {
    const [a] = toReplicaItems([{ id: 1, x: 1, y: 2 }], "list");
    const [b] = toReplicaItems([{ y: 2, x: 1, id: 1 }], "list");
    expect(a.hash).toBe(b.hash);
  });
});

describe("runReplicaSync", () => {
  it("replicates reference data, SDM scopes, children, and BKD semesters with GET only", async () => {
    const store = new MemoryReplicaStore();
    const { fetcher, calls } = fakeFetcher(baseResponses());

    const result = await runReplicaSync(
      { fetcher, store, authorize: async () => ({ role: "Sister-WS Basic" }) },
      options,
    );

    expect(result.status).toBe("SUCCEEDED");
    expect(result.errorCount).toBe(0);
    expect(store.liveRecords("/referensi/agama")).toHaveLength(2);
    expect(store.liveRecords("/referensi/profil_pt")[0].itemKey).toBe("self");
    expect(store.liveRecords("/referensi/detail_unit_kerja")).toHaveLength(1);
    expect(store.liveRecords("/penelitian")[0]).toMatchObject({ idSdm, itemKey: idPenelitian });
    expect(store.liveRecords("/penelitian/{id}")[0]).toMatchObject({ idSdm, parentId: idPenelitian });
    expect(store.liveRecords("/penelitian/{id}/bidang_ilmu")).toHaveLength(1);
    expect(store.liveRecords("/data_pribadi/profil/{id_sdm}")[0].scopeKey).toBe(`id_sdm=${idSdm}`);

    // BKD activity semesters come from laporan_akhir_bkd, not /referensi/semester.
    expect(calls).toContain(`/bkd/ajar?id_sdm=${idSdm}&id_smt=20231`);
    expect(calls).toContain(`/bkd/penelitian?id_sdm=${idSdm}&id_smt=20232`);
    expect(store.liveRecords("/bkd/ajar")).toHaveLength(1);

    // Kelas kuliah documents follow id_kelas from the pengajaran detail.
    expect(calls).toContain("/kelas_kuliah/kelas-1/dokumen");
    expect(calls).not.toContain("/kelas_kuliah/kelas-lain/dokumen");
    expect(store.liveRecords("/kelas_kuliah/{id}/dokumen")[0]).toMatchObject({ parentId: "kelas-1" });

    // Binary and search endpoints are never requested.
    expect(calls.some((call) => call.includes("/foto/") || call.endsWith("/download"))).toBe(false);
    expect(calls.some((call) => call.startsWith("/kolaborator_eksternal"))).toBe(false);
    expect(calls.some((call) => call.startsWith("/referensi/mahasiswa_pddikti"))).toBe(false);
  });

  it("records failures as PARTIAL, keeps prior rows, and skips children of a failed list", async () => {
    const store = new MemoryReplicaStore();
    const deps = { store, authorize: async () => ({ role: "Sister-WS Basic" }) };
    await runReplicaSync({ ...deps, fetcher: fakeFetcher(baseResponses()).fetcher }, options);

    const responses = baseResponses();
    responses[`/penelitian?id_sdm=${idSdm}&per_page=100&page=1`] = {
      ok: false,
      status: 500,
      code: "SISTER_HTTP_500",
      message: "Terjadi kesalahan dalam sistem",
    };
    responses["/referensi/semester"] = {
      ok: false,
      status: 500,
      code: "SISTER_HTTP_500",
      message: "Terjadi kesalahan dalam sistem",
    };
    const { fetcher, calls } = fakeFetcher(responses);

    const result = await runReplicaSync({ ...deps, fetcher }, options);

    expect(result.status).toBe("PARTIAL");
    expect(result.errorCount).toBe(2);
    expect(result.errors.map((error) => error.endpoint).sort()).toEqual([
      "/penelitian",
      "/referensi/semester",
    ]);
    expect(store.liveRecords("/penelitian")).toHaveLength(1);
    expect(store.liveRecords("/penelitian/{id}")).toHaveLength(1);
    expect(calls).not.toContain(`/penelitian/${idPenelitian}`);
    expect(store.failedScopes.get(`/penelitian|id_sdm=${idSdm}`)).toBe(500);
  });

  it("treats 404 as an empty scope rather than an error", async () => {
    const store = new MemoryReplicaStore();
    const responses = baseResponses();
    responses[`/data_pribadi/profil/${idSdm}`] = {
      ok: false,
      status: 404,
      code: "SISTER_HTTP_404",
      message: "not found",
    };

    const result = await runReplicaSync(
      { fetcher: fakeFetcher(responses).fetcher, store, authorize: async () => ({ role: "r" }) },
      options,
    );

    expect(result.errorCount).toBe(0);
    expect(store.liveRecords("/data_pribadi/profil/{id_sdm}")).toHaveLength(0);
  });

  it("only re-fetches children of new or changed parents and retires removed ones", async () => {
    const store = new MemoryReplicaStore();
    const deps = { store, authorize: async () => ({ role: "r" }) };
    await runReplicaSync({ ...deps, fetcher: fakeFetcher(baseResponses()).fetcher }, options);

    // Unchanged list: no detail requests on the second run.
    const second = fakeFetcher(baseResponses());
    await runReplicaSync({ ...deps, fetcher: second.fetcher }, options);
    expect(second.calls).not.toContain(`/penelitian/${idPenelitian}`);
    expect(second.calls).toContain(`/penelitian?id_sdm=${idSdm}&per_page=100&page=1`);

    // Item 1 removed, item 2 added.
    const responses = baseResponses();
    responses[`/penelitian?id_sdm=${idSdm}&per_page=100&page=1`] = [{ id: idPenelitian2, judul: "B" }];
    responses[`/penelitian/${idPenelitian2}`] = { id: idPenelitian2, judul: "B" };
    const third = fakeFetcher(responses);
    const result = await runReplicaSync({ ...deps, fetcher: third.fetcher }, options);

    expect(third.calls).toContain(`/penelitian/${idPenelitian2}`);
    expect(third.calls).not.toContain(`/penelitian/${idPenelitian}`);
    expect(store.liveRecords("/penelitian").map((record) => record.itemKey)).toEqual([idPenelitian2]);
    expect(store.liveRecords("/penelitian/{id}").map((record) => record.parentId)).toEqual([
      idPenelitian2,
    ]);
    expect(store.liveRecords("/penelitian/{id}/bidang_ilmu")).toHaveLength(0);
    expect(result.deletedCount).toBe(3);

    // --refresh-children re-requests every detail.
    const fourth = fakeFetcher(responses);
    await runReplicaSync({ ...deps, fetcher: fourth.fetcher }, { ...options, refreshChildren: true });
    expect(fourth.calls).toContain(`/penelitian/${idPenelitian2}`);
  });

  it("follows pagination until a short page", async () => {
    const store = new MemoryReplicaStore();
    const responses = baseResponses();
    responses[`/publikasi?id_sdm=${idSdm}&per_page=100&page=1`] = Array.from({ length: 100 }, (_, index) => ({
      id: `p-${index}`,
    }));
    responses[`/publikasi?id_sdm=${idSdm}&per_page=100&page=2`] = [{ id: "p-100" }];
    const { fetcher, calls } = fakeFetcher(responses);

    await runReplicaSync({ fetcher, store, authorize: async () => ({ role: "r" }) }, {
      ...options,
      includeChildren: false,
    });

    expect(calls.filter((call) => call.startsWith("/publikasi?"))).toHaveLength(2);
    expect(store.liveRecords("/publikasi")).toHaveLength(101);
  });

  it("marks the run FAILED without requests when authorization fails", async () => {
    const store = new MemoryReplicaStore();
    const { fetcher, calls } = fakeFetcher(baseResponses());

    const result = await runReplicaSync(
      {
        fetcher,
        store,
        authorize: async () => {
          throw new Error("401");
        },
      },
      options,
    );

    expect(result.status).toBe("FAILED");
    expect(calls).toHaveLength(0);
    expect(store.runs.get(result.runId!)).toMatchObject({ status: "FAILED", errorCount: 1 });
  });

  it("limits the per-SDM phase to the requested SDM IDs", async () => {
    const store = new MemoryReplicaStore();
    const responses = baseResponses();
    responses["/referensi/sdm"] = [{ id_sdm: idSdm }, { id_sdm: "other-sdm" }];
    const { fetcher, calls } = fakeFetcher(responses);

    await runReplicaSync(
      { fetcher, store, authorize: async () => ({ role: "r" }) },
      { ...options, scope: "sdm", sdmIds: [idSdm] },
    );

    expect(calls.some((call) => call.includes("other-sdm"))).toBe(false);
    expect(calls.some((call) => call.startsWith("/referensi/agama"))).toBe(false);
  });

  it("waits out a 429 and repeats the same request instead of recording an error", async () => {
    const store = new MemoryReplicaStore();
    const { fetcher: base, calls } = fakeFetcher(baseResponses());
    let refused = 0;
    const fetcher: ReplicaFetcher = async (path, query) => {
      if (path === "/referensi/agama" && refused < 2) {
        refused += 1;
        calls.push(key(path, query));
        return rateLimited;
      }
      return base(path, query);
    };

    const result = await runReplicaSync(
      { fetcher, store, authorize: async () => ({ role: "r" }), rateGate: instantGate() },
      options,
    );

    expect(result.status).toBe("SUCCEEDED");
    expect(calls.filter((call) => call === "/referensi/agama")).toHaveLength(3);
    expect(store.liveRecords("/referensi/agama")).toHaveLength(2);
  });

  it("stops the whole run as FAILED when SISTER keeps answering 429", async () => {
    const store = new MemoryReplicaStore();
    let requests = 0;
    const fetcher: ReplicaFetcher = async () => {
      requests += 1;
      return rateLimited;
    };

    const result = await runReplicaSync(
      { fetcher, store, authorize: async () => ({ role: "r" }), rateGate: instantGate(2) },
      options,
    );

    expect(result.status).toBe("FAILED");
    expect(result.errors.at(-1)).toMatchObject({ code: "SYNC_ABORTED" });
    // Stops early instead of walking every endpoint and SDM.
    expect(requests).toBeLessThan(60);
    expect(store.liveRecords()).toHaveLength(0);
  });
});
