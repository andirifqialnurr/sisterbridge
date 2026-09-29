import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SisterNotFoundError } from "@/server/sister/errors";

const getSisterConfigMock = vi.hoisted(() => vi.fn());
vi.mock("@/server/sister/config", () => ({ getSisterConfig: getSisterConfigMock }));

import { jelajahModules } from "./jelajah_catalog";
import type { JelajahFetcher } from "./jelajah_adapter";
import {
  clearJelajahOwnPtCache,
  getJelajahChild,
  getJelajahDetail,
  getJelajahList,
  JelajahUnavailableError,
  listJelajahModules,
} from "./jelajah_service";

const idSdm = "8fe6735c-6e28-43e7-9eb3-3ae092bbcd62";
const idPt = "22222222-3333-4444-8555-000000000001";

function recordingFetcher(responses: Record<string, unknown>) {
  const calls: string[] = [];
  const fetcher: JelajahFetcher = async (path, query) => {
    const search = new URLSearchParams(Object.entries(query ?? {})).toString();
    const key = search ? `${path}?${search}` : path;
    calls.push(key);
    return key in responses ? responses[key] : [];
  };
  return { fetcher, calls };
}

beforeEach(() => {
  getSisterConfigMock.mockReturnValue({ fixture_mode: false });
  clearJelajahOwnPtCache();
});

afterEach(() => {
  getSisterConfigMock.mockReset();
});

describe("jelajah catalog", () => {
  it("has unique keys and never exposes binary endpoints", () => {
    const keys = jelajahModules.map((module) => module.key);
    expect(new Set(keys).size).toBe(keys.length);

    const paths = jelajahModules.flatMap((module) => [
      module.path,
      module.detailPath ?? "",
      ...(module.children ?? []).map((child) => child.path),
    ]);
    // Binary endpoints go through /api/sister/file/*, never through JSON.
    const excludedPaths = ["/data_pribadi/foto/{id_sdm}", "/dokumen/{id}/download"];
    for (const excluded of excludedPaths) {
      expect(paths).not.toContain(excluded);
    }
  });

  it("lists modules without internal details", () => {
    const penelitian = listJelajahModules().find((module) => module.key === "penelitian");
    expect(penelitian).toMatchObject({
      endpoint: "/penelitian",
      has_detail: true,
      paginated: true,
      children: [{ key: "bidang_ilmu", endpoint: "/penelitian/{id}/bidang_ilmu" }],
    });
  });
});

describe("jelajah service", () => {
  it("refuses to run in fixture mode", async () => {
    getSisterConfigMock.mockReturnValue({ fixture_mode: true });
    await expect(
      getJelajahList({ module: "ref_agama" }, recordingFetcher({}).fetcher),
    ).rejects.toBeInstanceOf(JelajahUnavailableError);
  });

  it("requires an SDM for SDM-scoped modules", async () => {
    await expect(
      getJelajahList({ module: "penugasan" }, recordingFetcher({}).fetcher),
    ).rejects.toThrow("Pilih SDM");
  });

  it("reads SDM lists, objects, and referensi variants through catalog paths", async () => {
    const { fetcher, calls } = recordingFetcher({
      [`/penugasan?id_sdm=${idSdm}`]: [{ id: "p-1" }, { id: "p-2" }],
      [`/data_pribadi/profil/${idSdm}`]: { nama: "Dosen" },
    });

    const list = await getJelajahList({ module: "penugasan", id_sdm: idSdm }, fetcher);
    const profil = await getJelajahList({ module: "profil", id_sdm: idSdm }, fetcher);
    const wilayah = await getJelajahList({ module: "ref_wilayah_2" }, fetcher);

    expect(list).toMatchObject({ endpoint: "/penugasan", shape: "array", item_count: 2 });
    expect(profil).toMatchObject({ endpoint: "/data_pribadi/profil/{id_sdm}", shape: "object", item_count: 1 });
    expect(wilayah).toMatchObject({ shape: "array", item_count: 0, query: { id_level_wilayah: "2" } });
    expect(calls).toContain("/referensi/wilayah?id_level_wilayah=2");
  });

  it("follows pagination and fills the own PT for unit_kerja", async () => {
    const { fetcher, calls } = recordingFetcher({
      [`/publikasi?id_sdm=${idSdm}&per_page=100&page=1`]: Array.from({ length: 100 }, (_, index) => ({ id: index })),
      [`/publikasi?id_sdm=${idSdm}&per_page=100&page=2`]: [{ id: 100 }],
      "/referensi/profil_pt": { id_perguruan_tinggi: idPt },
      [`/referensi/unit_kerja?id_perguruan_tinggi=${idPt}`]: [{ id: "u-1" }],
    });

    const publikasi = await getJelajahList({ module: "publikasi", id_sdm: idSdm }, fetcher);
    const unit = await getJelajahList({ module: "ref_unit_kerja" }, fetcher);

    expect(publikasi.item_count).toBe(101);
    expect(unit.item_count).toBe(1);
    expect(calls.filter((call) => call.startsWith("/publikasi"))).toHaveLength(2);
  });

  it("reads details and children, and maps a missing detail to not found", async () => {
    const { fetcher, calls } = recordingFetcher({
      "/pengajaran/a-1": { id: "a-1", id_kelas: "k-1" },
      "/pengajaran/missing": null,
      "/kelas_kuliah/k-1/dokumen": [{ id: "d-1" }],
      "/referensi/detail_unit_kerja?id_unit_kerja=u-1": [{ id: "u-1" }],
    });

    await expect(getJelajahDetail({ module: "pengajaran", id: "a-1" }, fetcher)).resolves.toMatchObject({
      shape: "object",
    });
    await expect(getJelajahDetail({ module: "pengajaran", id: "missing" }, fetcher)).rejects.toBeInstanceOf(
      SisterNotFoundError,
    );
    await expect(
      getJelajahChild({ module: "pengajaran", child: "kelas_dokumen", id: "k-1" }, fetcher),
    ).resolves.toMatchObject({ item_count: 1 });
    await expect(
      getJelajahChild({ module: "ref_unit_kerja", child: "detail_unit_kerja", id: "u-1" }, fetcher),
    ).resolves.toMatchObject({ item_count: 1 });
    await expect(
      getJelajahChild({ module: "penugasan", child: "bidang_ilmu", id: "a-1" }, fetcher),
    ).rejects.toBeInstanceOf(JelajahUnavailableError);
    expect(calls).toContain("/referensi/detail_unit_kerja?id_unit_kerja=u-1");
  });

  it("forwards only declared search fields and enforces required inputs", async () => {
    const { fetcher, calls } = recordingFetcher({
      "/kolaborator_eksternal?nama=Budi": [{ id: "k-1", nama: "Budi" }],
      "/referensi/profil_pt": { id_perguruan_tinggi: idPt },
    });

    const kolaborator = await getJelajahList({ module: "kolaborator_eksternal", search: { nama: "Budi" } }, fetcher);
    expect(kolaborator.item_count).toBe(1);

    await expect(getJelajahList({ module: "kolaborator_eksternal", search: {} }, fetcher)).rejects.toThrow(
      "nama atau nik",
    );
    await expect(
      getJelajahList({ module: "mahasiswa_pddikti", search: { keyword: "andi" } }, fetcher),
    ).rejects.toThrow("Program studi");

    const prodi = "33333333-3333-4333-8333-333333333333";
    await getJelajahList(
      { module: "mahasiswa_pddikti", search: { keyword: "andi", id_program_studi: prodi, nama: "ignored" } },
      fetcher,
    );
    expect(calls).toContain(
      `/referensi/mahasiswa_pddikti?id_program_studi=${prodi}&keyword=andi&id_perguruan_tinggi=${idPt}`,
    );
  });
});
