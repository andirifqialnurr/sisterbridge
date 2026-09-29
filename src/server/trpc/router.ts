import { createTRPCRouter } from "./init";
import { pegawaiRouter } from "@/modules/pegawai/api/pegawai_router";
import { overviewRouter } from "@/modules/overview/api/overview_router";
import { penugasanRouter } from "@/modules/penugasan/api/penugasan_router";
import { pendidikanFormalRouter } from "@/modules/pendidikan_formal/api/pendidikan_formal_router";
import { referensiRouter } from "@/modules/referensi/api/referensi_router";
import { riwayatPekerjaanRouter } from "@/modules/riwayat_pekerjaan/api/riwayat_pekerjaan_router";
import { securityRouter } from "@/modules/security/api/security_router";
import { bkdRouter } from "@/modules/bkd/api/bkd_router";
import { jelajahRouter } from "@/modules/jelajah/api/jelajah_router";
import { replikaRouter } from "@/modules/replika/api/replika_router";

export const appRouter = createTRPCRouter({
  overview: overviewRouter,
  pegawai: pegawaiRouter,
  penugasan: penugasanRouter,
  pendidikan_formal: pendidikanFormalRouter,
  referensi: referensiRouter,
  riwayat_pekerjaan: riwayatPekerjaanRouter,
  bkd: bkdRouter,
  jelajah: jelajahRouter,
  replika: replikaRouter,
  security: securityRouter,
});

export type AppRouter = typeof appRouter;
