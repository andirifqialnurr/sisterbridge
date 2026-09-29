"use client";

import { useQuery } from "@tanstack/react-query";

import { Select } from "@/component/ui/select";
import { useTRPC } from "@/lib/trpc";

type BkdSemesterPickerProps = {
  sdmId: string;
  value: string;
  onChange: (semesterId: string) => void;
};

const emptySdmId = "00000000-0000-4000-8000-000000000000";
const semesterTerms: Record<string, string> = { "1": "Ganjil", "2": "Genap", "3": "Pendek" };

// SISTER semester IDs are `<tahun><1|2|3>`, e.g. 20231 = 2023/2024 Ganjil.
export function formatSemesterId(idSmt: string) {
  const year = Number(idSmt.slice(0, 4));
  const term = semesterTerms[idSmt.slice(4)];
  return Number.isInteger(year) && term && idSmt.length === 5
    ? `${year}/${year + 1} ${term}`
    : idSmt;
}

// `/referensi/semester` currently answers 500 on SISTER, so the options are
// the semesters that actually appear in the selected SDM's laporan akhir BKD,
// labelled with the reference names whenever that endpoint does answer.
export function BkdSemesterPicker({ onChange, sdmId, value }: BkdSemesterPickerProps) {
  const trpc = useTRPC();
  const semesterQuery = useQuery({
    ...trpc.referensi.get_semester.queryOptions({}),
    retry: false,
  });
  const laporanQuery = useQuery({
    ...trpc.bkd.laporan_akhir.queryOptions({ id_sdm: sdmId || emptySdmId }),
    enabled: Boolean(sdmId),
  });

  const referenceNames = new Map(
    (semesterQuery.data?.items ?? []).map((item) => [String(item.id), item.nama]),
  );
  const semesterIds = [
    ...new Set((laporanQuery.data?.items ?? []).map((item) => item.id_smt)),
  ].sort((a, b) => b.localeCompare(a));
  const optionIds = semesterIds.length > 0 ? semesterIds : [...referenceNames.keys()];

  const isLoading = Boolean(sdmId) && laporanQuery.isPending;
  const isEmpty = Boolean(sdmId) && !isLoading && optionIds.length === 0;

  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
      <Select
        ariaLabel="Pilih semester"
        disabled={!sdmId || isLoading || optionIds.length === 0}
        onValueChange={onChange}
        options={[
          { label: sdmId ? "Pilih semester" : "Pilih SDM dahulu", value: "" },
          ...optionIds.map((id) => ({
            label: `${referenceNames.get(id) ?? formatSemesterId(id)} (${id})`,
            value: id,
          })),
        ]}
        value={value}
      />
      {isEmpty && (
        <p className="text-xs text-[hsl(var(--color-muted))]">
          {laporanQuery.isError ? "Semester belum dapat dimuat." : "Belum ada semester BKD."}
        </p>
      )}
    </div>
  );
}
