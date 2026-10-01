"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Select } from "@/component/ui/select";
import { State } from "@/component/ui/state";
import { StatusBadge } from "@/component/ui/status_badge";
import type { DataTableColumn } from "@/component/widget/data_table";
import { getJelajahModule } from "@/modules/jelajah/api/jelajah_catalog";
import { useTRPC } from "@/lib/trpc";

export type BusinessRow = { id: string; values: Record<string, unknown> };
export type BusinessColumn = { key: string; type: string };
export type BusinessSource = { status: number; error_code: string | null; item_count: number; last_fetched_at: string; last_success_at: string | null } | null;
export type BusinessSection = { key: string; label: string; endpoint: string; columns: BusinessColumn[]; rows: BusinessRow[]; source: BusinessSource; total: number; page: number; per_page: number };
export type UrlState = { values: Record<string, string>; ready: boolean; set: (values: Record<string, string | null>) => void };

const labels: Record<string, string> = {
  nama: "Nama", nama_sdm: "Nama SDM", jenis_sdm: "Jenis SDM", jenis_kelamin: "Jenis kelamin", nip: "NIP", nidn: "NIDN", nuptk: "NUPTK", nik: "NIK",
  nama_status_aktif: "Status aktif", nama_status_pegawai: "Status kepegawaian", status: "Status", status_ajuan: "Status ajuan", status_usulan: "Status usulan",
  simpulan: "Simpulan BKD", status_simpulan: "Simpulan BKD", id_smt: "Semester", nama_semester: "Semester", tahun_semester: "Tahun semester",
  nama_perguruan_tinggi: "Perguruan tinggi", perguruan_tinggi: "Perguruan tinggi", nama_unit_kerja: "Unit kerja", nama_program_studi: "Program studi",
  judul: "Judul", judul_kegiatan: "Judul kegiatan", nama_kegiatan: "Nama kegiatan", nama_jabatan: "Jabatan", nama_jabatan_fungsional: "Jabatan fungsional",
  nama_jenjang_pendidikan: "Jenjang pendidikan", jenjang_pendidikan: "Jenjang pendidikan", nama_institusi: "Institusi", nama_lembaga: "Lembaga", nama_organisasi: "Organisasi",
  tahun: "Tahun", tahun_lulus: "Tahun lulus", tanggal_mulai: "Tanggal mulai", tanggal_selesai: "Tanggal selesai", tgl_mulai: "Tanggal mulai", tgl_selesai: "Tanggal selesai",
  tanggal_sk: "Tanggal SK", nomor_sk: "Nomor SK", no_sk: "Nomor SK", sk_cpns: "SK CPNS", nama_jenis: "Jenis", nama_peran: "Peran", peran: "Peran",
  jumlah_sks: "Jumlah SKS", sks: "SKS", sks_wajib: "SKS wajib", sks_diajukan: "SKS diajukan", sks_diterima: "SKS diterima", nilai: "Nilai",
  nama_dokumen: "Dokumen", nama_file: "Nama file", url_dokumen: "Dokumen", tanggal_pengajuan: "Tanggal pengajuan", tanggal_tes: "Tanggal tes",
};

export const preferredFields: Record<string, string[]> = {
  anggota_profesi: ["nama_organisasi", "nama_profesi", "peran", "tanggal_mulai", "tanggal_selesai"],
  bahan_ajar: ["judul", "nama_jenis_bahan_ajar", "jenis_bahan_ajar", "tahun"], beasiswa: ["nama_beasiswa", "nama_jenis_beasiswa", "nama_lembaga", "tanggal_mulai", "tanggal_selesai"],
  bimbingan_mahasiswa: ["nama_mahasiswa", "nama_program_studi", "peran", "tanggal_mulai"], detasering: ["nama_perguruan_tinggi", "nama_unit_kerja", "tanggal_mulai", "tanggal_selesai"],
  diklat: ["nama_diklat", "nama_jenis_diklat", "nama_lembaga", "tanggal_mulai", "tanggal_selesai"], dokumen: ["nama_dokumen", "nama_file", "nama_jenis_dokumen", "tanggal_dokumen"],
  pendidikan_formal: ["nama_jenjang_pendidikan", "nama_perguruan_tinggi", "nama_program_studi", "tahun_lulus"], pendidikan_formal_ajuan: ["status_ajuan", "nama_jenjang_pendidikan", "nama_perguruan_tinggi", "tanggal_pengajuan"],
  penelitian: ["judul", "tahun", "nama_jenis_penelitian", "nama_skema"], pengabdian: ["judul", "tahun", "nama_jenis_pengabdian", "nama_skema"], pengajaran: ["nama_mata_kuliah", "nama_kelas", "semester", "sks"],
  penghargaan: ["nama_penghargaan", "nama_tingkat_penghargaan", "tahun", "nama_lembaga"], penugasan: ["nama_perguruan_tinggi", "nama_unit_kerja", "tanggal_mulai", "tanggal_selesai"],
  penunjang_lain: ["nama_kegiatan", "peran", "tanggal_mulai", "tanggal_selesai"], publikasi: ["judul", "nama_jenis_publikasi", "tahun", "media_publikasi"],
  riwayat_pekerjaan: ["nama_perusahaan", "nama_instansi", "nama_jabatan", "tanggal_mulai", "tanggal_selesai"], sertifikasi_profesi: ["nama_sertifikasi", "nama_lembaga", "tanggal_mulai", "tanggal_selesai"],
  nilai_tes: ["nama_jenis_tes", "nilai", "tanggal_tes"], tunjangan: ["nama_jenis_tunjangan", "jumlah", "tanggal_mulai", "tanggal_selesai"],
};

export function useUrlState(): UrlState {
  const [values, setValues] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const read = () => setValues(Object.fromEntries(new URLSearchParams(window.location.search).entries()));
    read(); setReady(true); window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);
  const set = useCallback((next: Record<string, string | null>) => {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(next)) { if (value) params.set(key, value); else params.delete(key); }
    const query = params.toString();
    window.history.pushState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    setValues(Object.fromEntries(params.entries()));
  }, []);
  return { values, ready, set };
}

export function labelFor(field: string) {
  return labels[field] ?? field.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  if (typeof value === "number") return value.toLocaleString("id-ID");
  if (Array.isArray(value)) return `${value.length.toLocaleString("id-ID")} data terkait`;
  if (typeof value === "object") return Object.entries(value as Record<string, unknown>).map(([key, item]) => `${labelFor(key)}: ${formatValue(item)}`).join(" · ");
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return new Date(text + "T12:00:00Z").toLocaleDateString("id-ID", { timeZone: "UTC" });
  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) return new Date(text).toLocaleString("id-ID");
  return text;
}

export function asBusinessRows(value: unknown): BusinessRow[] {
  const input = Array.isArray(value) ? value : value && typeof value === "object" ? [value] : [];
  return input.map((item, index) => {
    const values = (item && typeof item === "object" ? item : { data: item }) as Record<string, unknown>;
    return { id: String(values.id ?? values.id_sdm ?? values.id_kolaborator ?? values.id_mahasiswa ?? index), values };
  });
}

export function SourceLine({ source }: { source: BusinessSource }) {
  const text = !source
    ? { label: "Belum tersinkron", tone: "neutral" as const, detail: "Belum ada status fetch untuk scope ini." }
    : source.status === 404
      ? { label: "SISTER HTTP 404", tone: "warning" as const, detail: `SISTER menjawab 404 · ${source.last_success_at ? "snapshot terakhir " + new Date(source.last_success_at).toLocaleString("id-ID") : "belum ada snapshot sukses"}.` }
      : source.status !== 200
        ? { label: `Pembaruan gagal · HTTP ${source.status}`, tone: "danger" as const, detail: source.last_success_at ? `Snapshot terakhir berhasil ${new Date(source.last_success_at).toLocaleString("id-ID")}.` : `Fetch terakhir ${new Date(source.last_fetched_at).toLocaleString("id-ID")}; belum ada fetch sukses.` }
        : source.item_count === 0
          ? { label: "Tersinkron · tanpa data", tone: "neutral" as const, detail: `Terakhir diperiksa ${new Date(source.last_fetched_at).toLocaleString("id-ID")}.` }
          : { label: "Replika tersedia", tone: "success" as const, detail: `${source.item_count.toLocaleString("id-ID")} data · ${new Date(source.last_fetched_at).toLocaleString("id-ID")}.` };
  return <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[hsl(var(--color-muted))]"><StatusBadge tone={text.tone}>{text.label}</StatusBadge><span>{text.detail}</span></div>;
}

export function emptyDescription(source: BusinessSource) {
  if (!source) return "Belum ada scope sinkronisasi untuk data ini.";
  if (source.status === 404) return "SISTER menjawab HTTP 404 untuk scope ini.";
  if (source.status !== 200) return `Fetch terakhir gagal dengan HTTP ${source.status}; replika sebelumnya tetap dipertahankan bila tersedia.`;
  return "Scope berhasil diperiksa dan tidak memiliki record.";
}
export function ErrorState({ message, title }: { message: string; title: string }) {
  const lower = message.toLowerCase();
  const tone = lower.includes("forbidden") || lower.includes("akses") ? "forbidden" : lower.includes("belum") || lower.includes("replika") || lower.includes("sinkron") || lower.includes("pilih") ? "unavailable" : "error";
  return <State description={message} title={title} tone={tone} />;
}

export function PageError({ pending, error, title }: { pending: boolean; error: { message: string } | null; title: string }) {
  if (pending) return <State description="Mengambil snapshot lokal." title="Memuat data..." tone="loading" />;
  return error ? <ErrorState message={error.message} title={title} /> : null;
}

export function SdmPicker({ value, onChange, enabled = true }: { value: string; onChange: (id: string) => void; enabled?: boolean }) {
  const trpc = useTRPC();
  const [search, setSearch] = useState("");
  const query = useQuery({ ...trpc.business.sdm.queryOptions({ search, page: 1, per_page: 100 }), enabled });
  const options = (query.data?.rows ?? []).map((row) => {
    const id = String(row.values.id_sdm ?? row.id);
    const name = String(row.values.nama_sdm ?? row.values.nama ?? "SDM tanpa nama");
    const identity = row.values.nidn ?? row.values.nip;
    return { value: id, label: `${name}${identity ? ` · ${String(identity)}` : ""}` };
  });
  if (value && !options.some((item) => item.value === value)) options.unshift({ value, label: value });
  return <div className="flex min-w-0 flex-col gap-2 sm:flex-row"><label className="min-w-0"><span className="sr-only">Cari SDM</span><input className="h-10 w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-3 text-sm outline-none focus:border-[hsl(var(--color-primary))] sm:w-44" onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama / NIDN" type="search" value={search} /></label><Select ariaLabel="Pilih SDM" disabled={!enabled || query.isPending || query.isError} onValueChange={onChange} options={[{ label: "Pilih SDM", value: "" }, ...options]} value={value} /></div>;
}

export function rowColumns(moduleKey: string, columns: BusinessColumn[], idSdm?: string): DataTableColumn<BusinessRow>[] {
  const catalogEntry = getJelajahModule(moduleKey);
  const hasDetail = Boolean(catalogEntry?.detailPath || catalogEntry?.children?.length);
  const fields = columns.map((column) => column.key);
  const summaryFields = hasDetail ? columns.filter((column) => column.type !== "jsonb" && column.key !== "id" && column.key !== "id_sdm" && !column.key.startsWith("id_")).map((column) => column.key) : fields;
  const preferred = preferredFields[moduleKey] ?? [];
  const keys = hasDetail
    ? [...preferred.filter((key) => summaryFields.includes(key)), ...summaryFields.filter((key) => !preferred.includes(key))].slice(0, 5)
    : summaryFields;
  const result: DataTableColumn<BusinessRow>[] = keys.map((key) => ({ key, header: labelFor(key), render: (row) => <span className="whitespace-normal">{formatValue(row.values[key])}</span> }));
  if (catalogEntry && hasDetail) result.push({
    key: "detail", header: "", className: "w-28 text-right",
    render: (row) => {
      const href = catalogEntry.detailPath ? catalogEntry.detailPath.replace("{id}", encodeURIComponent(row.id)) : `${catalogEntry.path}/${encodeURIComponent(row.id)}`;
      const query = new URLSearchParams(idSdm ? { id_sdm: idSdm } : {}).toString();
      return <Link className="font-semibold text-[hsl(var(--color-primary))] hover:underline" href={`${href}${query ? `?${query}` : ""}`}>Lihat detail</Link>;
    },
  });
  return result;
}
