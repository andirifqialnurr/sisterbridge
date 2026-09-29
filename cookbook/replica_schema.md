# Skema replika typed (`replica`)

Dihasilkan oleh `bun run replica:views` pada 2026-09-29T05:25:39.738Z dari payload di
`sister_replica_record`. Jangan diedit manual; jalankan ulang generator setelah
sync dengan data baru. Detail rancangan: [sister_replica.md](./sister_replica.md).

Setiap view memiliki kolom meta `r_integration_id`, `r_id_sdm`, `r_parent_id`,
`r_scope_key`, `r_item_key`, `r_fetched_at`, `r_changed_at`, dan `r_payload`
(JSON asli). Baris yang sudah hilang dari SISTER (`deleted_at`) tidak ikut.

| View | Sumber | Sampel | Kolom |
|---|---|---:|---:|
| [`replica.anggota_profesi`](#replicaanggotaprofesi) | `/anggota_profesi/{id}` | 13 | 10 |
| [`replica.anggota_profesi_dokumen`](#replicaanggotaprofesidokumen) | `/anggota_profesi/{id}` → `dokumen[]` | 12 | 8 |
| [`replica.anggota_profesi_list`](#replicaanggotaprofesilist) | `/anggota_profesi` | 13 | 7 |
| [`replica.bahan_ajar`](#replicabahanajar) | `/bahan_ajar/{id}` | 45 | 16 |
| [`replica.bahan_ajar_dokumen`](#replicabahanajardokumen) | `/bahan_ajar/{id}` → `dokumen[]` | 51 | 8 |
| [`replica.bahan_ajar_list`](#replicabahanajarlist) | `/bahan_ajar` | 46 | 7 |
| [`replica.bahan_ajar_penulis`](#replicabahanajarpenulis) | `/bahan_ajar/{id}` → `penulis[]` | 126 | 9 |
| [`replica.beasiswa`](#replicabeasiswa) | `/beasiswa/{id}` | 3 | 8 |
| [`replica.beasiswa_list`](#replicabeasiswalist) | `/beasiswa` | 3 | 6 |
| [`replica.bimbing_dosen`](#replicabimbingdosen) | `/bimbing_dosen/{id}` | 0 | 0 |
| [`replica.bimbing_dosen_list`](#replicabimbingdosenlist) | `/bimbing_dosen` | 0 | 0 |
| [`replica.bimbingan_mahasiswa`](#replicabimbinganmahasiswa) | `/bimbingan_mahasiswa/{id}` | 709 | 18 |
| [`replica.bimbingan_mahasiswa_bidang_ilmu`](#replicabimbinganmahasiswabidangilmu) | `/bimbingan_mahasiswa/{id}/bidang_ilmu` | 0 | 0 |
| [`replica.bimbingan_mahasiswa_dosen`](#replicabimbinganmahasiswadosen) | `/bimbingan_mahasiswa/{id}` → `dosen[]` | 1138 | 5 |
| [`replica.bimbingan_mahasiswa_list`](#replicabimbinganmahasiswalist) | `/bimbingan_mahasiswa` | 712 | 9 |
| [`replica.bimbingan_mahasiswa_mahasiswa`](#replicabimbinganmahasiswamahasiswa) | `/bimbingan_mahasiswa/{id}` → `mahasiswa[]` | 2454 | 5 |
| [`replica.bkd_ajar`](#replicabkdajar) | `/bkd/ajar` | 1111 | 10 |
| [`replica.bkd_laporan_akhir_bkd`](#replicabkdlaporanakhirbkd) | `/bkd/laporan_akhir_bkd` | 62 | 21 |
| [`replica.bkd_pendidikan`](#replicabkdpendidikan) | `/bkd/pendidikan` | 2 | 10 |
| [`replica.bkd_penelitian`](#replicabkdpenelitian) | `/bkd/penelitian` | 150 | 10 |
| [`replica.bkd_pengmas`](#replicabkdpengmas) | `/bkd/pengmas` | 170 | 10 |
| [`replica.bkd_tunjang`](#replicabkdtunjang) | `/bkd/tunjang` | 335 | 10 |
| [`replica.data_pribadi_alamat`](#replicadatapribadialamat) | `/data_pribadi/alamat/{id_sdm}` | 12 | 11 |
| [`replica.data_pribadi_bidang_ilmu`](#replicadatapribadibidangilmu) | `/data_pribadi/bidang_ilmu/{id_sdm}` | 11 | 3 |
| [`replica.data_pribadi_keluarga`](#replicadatapribadikeluarga) | `/data_pribadi/keluarga/{id_sdm}` | 12 | 6 |
| [`replica.data_pribadi_kepegawaian`](#replicadatapribadikepegawaian) | `/data_pribadi/kepegawaian/{id_sdm}` | 12 | 9 |
| [`replica.data_pribadi_kependudukan`](#replicadatapribadikependudukan) | `/data_pribadi/kependudukan/{id_sdm}` | 12 | 5 |
| [`replica.data_pribadi_lain`](#replicadatapribadilain) | `/data_pribadi/lain/{id_sdm}` | 12 | 2 |
| [`replica.data_pribadi_profil`](#replicadatapribadiprofil) | `/data_pribadi/profil/{id_sdm}` | 12 | 4 |
| [`replica.detasering`](#replicadetasering) | `/detasering/{id}` | 0 | 0 |
| [`replica.detasering_list`](#replicadetaseringlist) | `/detasering` | 0 | 0 |
| [`replica.diklat`](#replicadiklat) | `/diklat/{id}` | 23 | 19 |
| [`replica.diklat_dokumen`](#replicadiklatdokumen) | `/diklat/{id}` → `dokumen[]` | 32 | 8 |
| [`replica.diklat_list`](#replicadiklatlist) | `/diklat` | 23 | 8 |
| [`replica.dokumen`](#replicadokumen) | `/dokumen/{id}` | 170 | 9 |
| [`replica.dokumen_list`](#replicadokumenlist) | `/dokumen` | 170 | 10 |
| [`replica.inpassing`](#replicainpassing) | `/inpassing/{id}` | 11 | 13 |
| [`replica.inpassing_dokumen`](#replicainpassingdokumen) | `/inpassing/{id}` → `dokumen[]` | 10 | 8 |
| [`replica.inpassing_list`](#replicainpassinglist) | `/inpassing` | 11 | 5 |
| [`replica.jabatan_fungsional`](#replicajabatanfungsional) | `/jabatan_fungsional/{id}` | 17 | 12 |
| [`replica.jabatan_fungsional_ajuan`](#replicajabatanfungsionalajuan) | `/jabatan_fungsional/ajuan/{id}` | 16 | 24 |
| [`replica.jabatan_fungsional_ajuan_dokumen`](#replicajabatanfungsionalajuandokumen) | `/jabatan_fungsional/ajuan/{id}` → `dokumen[]` | 18 | 8 |
| [`replica.jabatan_fungsional_ajuan_list`](#replicajabatanfungsionalajuanlist) | `/jabatan_fungsional/ajuan` | 16 | 9 |
| [`replica.jabatan_fungsional_dokumen`](#replicajabatanfungsionaldokumen) | `/jabatan_fungsional/{id}` → `dokumen[]` | 18 | 8 |
| [`replica.jabatan_fungsional_list`](#replicajabatanfungsionallist) | `/jabatan_fungsional` | 17 | 6 |
| [`replica.jabatan_struktural`](#replicajabatanstruktural) | `/jabatan_struktural/{id}` | 0 | 0 |
| [`replica.jabatan_struktural_list`](#replicajabatanstrukturallist) | `/jabatan_struktural` | 0 | 0 |
| [`replica.kekayaan_intelektual`](#replicakekayaanintelektual) | `/kekayaan_intelektual/{id}` | 37 | 35 |
| [`replica.kekayaan_intelektual_bidang_ilmu`](#replicakekayaanintelektualbidangilmu) | `/kekayaan_intelektual/{id}/bidang_ilmu` | 1 | 3 |
| [`replica.kekayaan_intelektual_dokumen`](#replicakekayaanintelektualdokumen) | `/kekayaan_intelektual/{id}` → `dokumen[]` | 52 | 8 |
| [`replica.kekayaan_intelektual_list`](#replicakekayaanintelektuallist) | `/kekayaan_intelektual` | 37 | 11 |
| [`replica.kekayaan_intelektual_penulis`](#replicakekayaanintelektualpenulis) | `/kekayaan_intelektual/{id}` → `penulis[]` | 95 | 11 |
| [`replica.kelas_kuliah_dokumen`](#replicakelaskuliahdokumen) | `/kelas_kuliah/{id}/dokumen` | 1576 | 8 |
| [`replica.kepangkatan`](#replicakepangkatan) | `/kepangkatan/{id}` | 16 | 12 |
| [`replica.kepangkatan_list`](#replicakepangkatanlist) | `/kepangkatan` | 16 | 4 |
| [`replica.kesejahteraan`](#replicakesejahteraan) | `/kesejahteraan/{id}` | 1 | 8 |
| [`replica.kesejahteraan_list`](#replicakesejahteraanlist) | `/kesejahteraan` | 1 | 6 |
| [`replica.nilai_tes`](#replicanilaites) | `/nilai_tes/{id}` | 1 | 10 |
| [`replica.nilai_tes_ajuan`](#replicanilaitesajuan) | `/nilai_tes/ajuan/{id}` | 0 | 0 |
| [`replica.nilai_tes_ajuan_list`](#replicanilaitesajuanlist) | `/nilai_tes/ajuan` | 0 | 0 |
| [`replica.nilai_tes_dokumen`](#replicanilaitesdokumen) | `/nilai_tes/{id}` → `dokumen[]` | 1 | 8 |
| [`replica.nilai_tes_list`](#replicanilaiteslist) | `/nilai_tes` | 8 | 6 |
| [`replica.orasi_ilmiah`](#replicaorasiilmiah) | `/orasi_ilmiah/{id}` | 3 | 20 |
| [`replica.orasi_ilmiah_dokumen`](#replicaorasiilmiahdokumen) | `/orasi_ilmiah/{id}` → `dokumen[]` | 4 | 8 |
| [`replica.orasi_ilmiah_list`](#replicaorasiilmiahlist) | `/orasi_ilmiah` | 3 | 7 |
| [`replica.pembicara`](#replicapembicara) | `/pembicara/{id}` | 36 | 20 |
| [`replica.pembicara_dokumen`](#replicapembicaradokumen) | `/pembicara/{id}` → `dokumen[]` | 58 | 8 |
| [`replica.pembicara_list`](#replicapembicaralist) | `/pembicara` | 36 | 7 |
| [`replica.pendidikan_formal`](#replicapendidikanformal) | `/pendidikan_formal/{id}` | 31 | 25 |
| [`replica.pendidikan_formal_ajuan`](#replicapendidikanformalajuan) | `/pendidikan_formal/ajuan/{id}` | 12 | 40 |
| [`replica.pendidikan_formal_ajuan_dokumen`](#replicapendidikanformalajuandokumen) | `/pendidikan_formal/ajuan/{id}` → `dokumen[]` | 20 | 8 |
| [`replica.pendidikan_formal_ajuan_list`](#replicapendidikanformalajuanlist) | `/pendidikan_formal/ajuan` | 15 | 9 |
| [`replica.pendidikan_formal_dokumen`](#replicapendidikanformaldokumen) | `/pendidikan_formal/{id}` → `dokumen[]` | 1 | 8 |
| [`replica.pendidikan_formal_list`](#replicapendidikanformallist) | `/pendidikan_formal` | 31 | 7 |
| [`replica.penelitian`](#replicapenelitian) | `/penelitian/{id}` | 28 | 26 |
| [`replica.penelitian_anggota`](#replicapenelitiananggota) | `/penelitian/{id}` → `anggota[]` | 78 | 8 |
| [`replica.penelitian_bidang_ilmu`](#replicapenelitianbidangilmu) | `/penelitian/{id}/bidang_ilmu` | 6 | 3 |
| [`replica.penelitian_dokumen`](#replicapenelitiandokumen) | `/penelitian/{id}` → `dokumen[]` | 31 | 8 |
| [`replica.penelitian_list`](#replicapenelitianlist) | `/penelitian` | 30 | 5 |
| [`replica.pengabdian`](#replicapengabdian) | `/pengabdian/{id}` | 167 | 26 |
| [`replica.pengabdian_anggota`](#replicapengabdiananggota) | `/pengabdian/{id}` → `anggota[]` | 833 | 8 |
| [`replica.pengabdian_bidang_ilmu`](#replicapengabdianbidangilmu) | `/pengabdian/{id}/bidang_ilmu` | 11 | 3 |
| [`replica.pengabdian_dokumen`](#replicapengabdiandokumen) | `/pengabdian/{id}` → `dokumen[]` | 486 | 8 |
| [`replica.pengabdian_list`](#replicapengabdianlist) | `/pengabdian` | 197 | 5 |
| [`replica.pengabdian_mitra_litabmas`](#replicapengabdianmitralitabmas) | `/pengabdian/{id}` → `mitra_litabmas[]` | 1 | 2 |
| [`replica.pengajaran`](#replicapengajaran) | `/pengajaran/{id}` | 1480 | 23 |
| [`replica.pengajaran_bidang_ilmu`](#replicapengajaranbidangilmu) | `/pengajaran/{id}/bidang_ilmu` | 68 | 3 |
| [`replica.pengajaran_list`](#replicapengajaranlist) | `/pengajaran` | 1480 | 11 |
| [`replica.pengelola_jurnal`](#replicapengelolajurnal) | `/pengelola_jurnal/{id}` | 3 | 12 |
| [`replica.pengelola_jurnal_dokumen`](#replicapengelolajurnaldokumen) | `/pengelola_jurnal/{id}` → `dokumen[]` | 3 | 8 |
| [`replica.pengelola_jurnal_list`](#replicapengelolajurnallist) | `/pengelola_jurnal` | 3 | 7 |
| [`replica.penghargaan`](#replicapenghargaan) | `/penghargaan/{id}` | 5 | 12 |
| [`replica.penghargaan_dokumen`](#replicapenghargaandokumen) | `/penghargaan/{id}` → `dokumen[]` | 8 | 8 |
| [`replica.penghargaan_list`](#replicapenghargaanlist) | `/penghargaan` | 5 | 5 |
| [`replica.pengujian_mahasiswa`](#replicapengujianmahasiswa) | `/pengujian_mahasiswa/{id}` | 0 | 0 |
| [`replica.pengujian_mahasiswa_bidang_ilmu`](#replicapengujianmahasiswabidangilmu) | `/pengujian_mahasiswa/{id}/bidang_ilmu` | 0 | 0 |
| [`replica.pengujian_mahasiswa_list`](#replicapengujianmahasiswalist) | `/pengujian_mahasiswa` | 0 | 0 |
| [`replica.penugasan`](#replicapenugasan) | `/penugasan/{id}` | 33 | 20 |
| [`replica.penugasan_dokumen`](#replicapenugasandokumen) | `/penugasan/{id}` → `dokumen[]` | 5 | 8 |
| [`replica.penugasan_keaktifan`](#replicapenugasankeaktifan) | `/penugasan/{id}` → `keaktifan[]` | 176 | 2 |
| [`replica.penugasan_list`](#replicapenugasanlist) | `/penugasan` | 33 | 9 |
| [`replica.penunjang_lain`](#replicapenunjanglain) | `/penunjang_lain/{id}` | 366 | 13 |
| [`replica.penunjang_lain_anggota_dosen`](#replicapenunjanglainanggotadosen) | `/penunjang_lain/{id}` → `anggota_dosen[]` | 647 | 3 |
| [`replica.penunjang_lain_dokumen`](#replicapenunjanglaindokumen) | `/penunjang_lain/{id}` → `dokumen[]` | 511 | 8 |
| [`replica.penunjang_lain_list`](#replicapenunjanglainlist) | `/penunjang_lain` | 399 | 8 |
| [`replica.publikasi`](#replicapublikasi) | `/publikasi/{id}` | 272 | 35 |
| [`replica.publikasi_bidang_ilmu`](#replicapublikasibidangilmu) | `/publikasi/{id}/bidang_ilmu` | 3 | 3 |
| [`replica.publikasi_dokumen`](#replicapublikasidokumen) | `/publikasi/{id}` → `dokumen[]` | 479 | 8 |
| [`replica.publikasi_list`](#replicapublikasilist) | `/publikasi` | 300 | 11 |
| [`replica.publikasi_penulis`](#replicapublikasipenulis) | `/publikasi/{id}` → `penulis[]` | 865 | 11 |
| [`replica.referensi_agama`](#replicareferensiagama) | `/referensi/agama` | 9 | 2 |
| [`replica.referensi_bidang_studi`](#replicareferensibidangstudi) | `/referensi/bidang_studi` | 596 | 2 |
| [`replica.referensi_bidang_usaha`](#replicareferensibidangusaha) | `/referensi/bidang_usaha` | 21 | 2 |
| [`replica.referensi_detail_unit_kerja`](#replicareferensidetailunitkerja) | `/referensi/detail_unit_kerja` | 13 | 23 |
| [`replica.referensi_detail_unit_kerja_jurusan`](#replicareferensidetailunitkerjajurusan) | `/referensi/detail_unit_kerja` → `jurusan[]` | 13 | 6 |
| [`replica.referensi_detail_unit_kerja_wilayah`](#replicareferensidetailunitkerjawilayah) | `/referensi/detail_unit_kerja` → `wilayah[]` | 13 | 3 |
| [`replica.referensi_dudi`](#replicareferensidudi) | `/referensi/dudi` | 43339 | 2 |
| [`replica.referensi_gelar_akademik`](#replicareferensigelarakademik) | `/referensi/gelar_akademik` | 4898 | 3 |
| [`replica.referensi_golongan_pangkat`](#replicareferensigolonganpangkat) | `/referensi/golongan_pangkat` | 0 | 0 |
| [`replica.referensi_ikatan_kerja`](#replicareferensiikatankerja) | `/referensi/ikatan_kerja` | 9 | 2 |
| [`replica.referensi_jabatan_fungsional`](#replicareferensijabatanfungsional) | `/referensi/jabatan_fungsional` | 10 | 2 |
| [`replica.referensi_jabatan_negara`](#replicareferensijabatannegara) | `/referensi/jabatan_negara` | 13 | 2 |
| [`replica.referensi_jabatan_tugas_tambahan`](#replicareferensijabatantugastambahan) | `/referensi/jabatan_tugas_tambahan` | 0 | 0 |
| [`replica.referensi_jenis_bahan_ajar`](#replicareferensijenisbahanajar) | `/referensi/jenis_bahan_ajar` | 0 | 0 |
| [`replica.referensi_jenis_beasiswa`](#replicareferensijenisbeasiswa) | `/referensi/jenis_beasiswa` | 0 | 0 |
| [`replica.referensi_jenis_diklat`](#replicareferensijenisdiklat) | `/referensi/jenis_diklat` | 0 | 0 |
| [`replica.referensi_jenis_dokumen`](#replicareferensijenisdokumen) | `/referensi/jenis_dokumen` | 77 | 2 |
| [`replica.referensi_jenis_keluar`](#replicareferensijeniskeluar) | `/referensi/jenis_keluar` | 16 | 2 |
| [`replica.referensi_jenis_kepanitiaan`](#replicareferensijeniskepanitiaan) | `/referensi/jenis_kepanitiaan` | 7 | 2 |
| [`replica.referensi_jenis_kesejahteraan`](#replicareferensijeniskesejahteraan) | `/referensi/jenis_kesejahteraan` | 0 | 0 |
| [`replica.referensi_jenis_pekerjaan`](#replicareferensijenispekerjaan) | `/referensi/jenis_pekerjaan` | 19 | 2 |
| [`replica.referensi_jenis_penghargaan`](#replicareferensijenispenghargaan) | `/referensi/jenis_penghargaan` | 1 | 2 |
| [`replica.referensi_jenis_publikasi`](#replicareferensijenispublikasi) | `/referensi/jenis_publikasi` | 32 | 2 |
| [`replica.referensi_jenis_tes`](#replicareferensijenistes) | `/referensi/jenis_tes` | 0 | 0 |
| [`replica.referensi_jenis_tunjangan`](#replicareferensijenistunjangan) | `/referensi/jenis_tunjangan` | 15 | 2 |
| [`replica.referensi_jenjang_pendidikan`](#replicareferensijenjangpendidikan) | `/referensi/jenjang_pendidikan` | 13 | 2 |
| [`replica.referensi_kategori_capaian_luaran`](#replicareferensikategoricapaianluaran) | `/referensi/kategori_capaian_luaran` | 7 | 2 |
| [`replica.referensi_kategori_kegiatan`](#replicareferensikategorikegiatan) | `/referensi/kategori_kegiatan` | 308 | 3 |
| [`replica.referensi_kelompok_bidang`](#replicareferensikelompokbidang) | `/referensi/kelompok_bidang` | 2537 | 2 |
| [`replica.referensi_lembaga_sertifikasi`](#replicareferensilembagasertifikasi) | `/referensi/lembaga_sertifikasi` | 0 | 0 |
| [`replica.referensi_media_publikasi`](#replicareferensimediapublikasi) | `/referensi/media_publikasi` | 0 | 0 |
| [`replica.referensi_negara`](#replicareferensinegara) | `/referensi/negara` | 251 | 2 |
| [`replica.referensi_perguruan_tinggi`](#replicareferensiperguruantinggi) | `/referensi/perguruan_tinggi` | 0 | 0 |
| [`replica.referensi_profil_pt`](#replicareferensiprofilpt) | `/referensi/profil_pt` | 1 | 24 |
| [`replica.referensi_sdm`](#replicareferensisdm) | `/referensi/sdm` | 97 | 9 |
| [`replica.referensi_semester`](#replicareferensisemester) | `/referensi/semester` | 0 | 0 |
| [`replica.referensi_skim_kegiatan`](#replicareferensiskimkegiatan) | `/referensi/skim_kegiatan` | 0 | 0 |
| [`replica.referensi_status_kepegawaian`](#replicareferensistatuskepegawaian) | `/referensi/status_kepegawaian` | 6 | 2 |
| [`replica.referensi_sumber_gaji`](#replicareferensisumbergaji) | `/referensi/sumber_gaji` | 7 | 2 |
| [`replica.referensi_tingkat_penghargaan`](#replicareferensitingkatpenghargaan) | `/referensi/tingkat_penghargaan` | 7 | 2 |
| [`replica.referensi_unit_kerja`](#replicareferensiunitkerja) | `/referensi/unit_kerja` | 13 | 3 |
| [`replica.referensi_wilayah`](#replicareferensiwilayah) | `/referensi/wilayah` | 7819 | 3 |
| [`replica.riwayat_pekerjaan`](#replicariwayatpekerjaan) | `/riwayat_pekerjaan/{id}` | 3 | 14 |
| [`replica.riwayat_pekerjaan_dokumen`](#replicariwayatpekerjaandokumen) | `/riwayat_pekerjaan/{id}` → `dokumen[]` | 3 | 8 |
| [`replica.riwayat_pekerjaan_list`](#replicariwayatpekerjaanlist) | `/riwayat_pekerjaan` | 3 | 9 |
| [`replica.sertifikasi_dosen`](#replicasertifikasidosen) | `/sertifikasi_dosen/{id}` | 4 | 16 |
| [`replica.sertifikasi_dosen_ajuan`](#replicasertifikasidosenajuan) | `/sertifikasi_dosen/ajuan/{id}` | 2 | 12 |
| [`replica.sertifikasi_dosen_ajuan_dokumen`](#replicasertifikasidosenajuandokumen) | `/sertifikasi_dosen/ajuan/{id}` → `dokumen[]` | 2 | 8 |
| [`replica.sertifikasi_dosen_ajuan_list`](#replicasertifikasidosenajuanlist) | `/sertifikasi_dosen/ajuan` | 2 | 9 |
| [`replica.sertifikasi_dosen_dokumen`](#replicasertifikasidosendokumen) | `/sertifikasi_dosen/{id}` → `dokumen[]` | 2 | 8 |
| [`replica.sertifikasi_dosen_list`](#replicasertifikasidosenlist) | `/sertifikasi_dosen` | 4 | 10 |
| [`replica.sertifikasi_profesi`](#replicasertifikasiprofesi) | `/sertifikasi_profesi/{id}` | 5 | 16 |
| [`replica.sertifikasi_profesi_dokumen`](#replicasertifikasiprofesidokumen) | `/sertifikasi_profesi/{id}` → `dokumen[]` | 2 | 8 |
| [`replica.sertifikasi_profesi_list`](#replicasertifikasiprofesilist) | `/sertifikasi_profesi` | 5 | 10 |
| [`replica.tugas_tambahan`](#replicatugastambahan) | `/tugas_tambahan/{id}` | 14 | 15 |
| [`replica.tugas_tambahan_dokumen`](#replicatugastambahandokumen) | `/tugas_tambahan/{id}` → `dokumen[]` | 17 | 8 |
| [`replica.tugas_tambahan_list`](#replicatugastambahanlist) | `/tugas_tambahan` | 14 | 7 |
| [`replica.tunjangan`](#replicatunjangan) | `/tunjangan/{id}` | 0 | 0 |
| [`replica.tunjangan_list`](#replicatunjanganlist) | `/tunjangan` | 0 | 0 |
| [`replica.visiting_scientist`](#replicavisitingscientist) | `/visiting_scientist/{id}` | 0 | 0 |
| [`replica.visiting_scientist_list`](#replicavisitingscientistlist) | `/visiting_scientist` | 0 | 0 |

## replica.anggota_profesi

Sumber: `GET /anggota_profesi/{id}`; 13 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `peran` | text | 0% |
| `id_sdm` | uuid | 0% |
| `dokumen` | jsonb | 0% |
| `nama_organisasi` | text | 0% |
| `instansi_profesi` | text | 38% |
| `kategori_kegiatan` | text | 0% |
| `id_kategori_kegiatan` | bigint | 0% |
| `tanggal_mulai_keanggotaan` | date | 0% |
| `tanggal_selesai_keanggotaan` | date | 46% |

## replica.anggota_profesi_dokumen

Sumber: `GET /anggota_profesi/{id}`, elemen `dokumen[]`; 12 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `tautan` | text | 67% |
| `nama_file` | text | 0% |
| `jenis_file` | text | 0% |
| `keterangan` | text | 75% |
| `jenis_dokumen` | text | 0% |
| `tanggal_upload` | timestamp | 0% |

## replica.anggota_profesi_list

Sumber: `GET /anggota_profesi`; 13 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `peran` | text | 0% |
| `nama_organisasi` | text | 0% |
| `instansi_profesi` | text | 38% |
| `id_kategori_kegiatan` | bigint | 0% |
| `tanggal_mulai_keanggotaan` | date | 0% |
| `tanggal_selesai_keanggotaan` | date | 46% |

## replica.bahan_ajar

Sumber: `GET /bahan_ajar/{id}`; 45 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `isbn` | text | 73% |
| `judul` | text | 0% |
| `dokumen` | jsonb | 0% |
| `penulis` | jsonb | 0% |
| `nama_jenis` | text | 0% |
| `sk_penugasan` | text | 69% |
| `nama_penerbit` | text | 0% |
| `judul_litabmas` | text | 100% |
| `tanggal_terbit` | date | 20% |
| `id_jenis_bahan_ajar` | bigint | 0% |
| `id_kategori_kegiatan` | bigint | 0% |
| `tanggal_sk_penugasan` | date | 67% |
| `kategori_capaian_luaran` | text | 36% |
| `id_penelitian_pengabdian` | text | 100% |
| `id_kategori_capaian_luaran` | text | 36% |

## replica.bahan_ajar_dokumen

Sumber: `GET /bahan_ajar/{id}`, elemen `dokumen[]`; 51 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `tautan` | text | 61% |
| `nama_file` | text | 0% |
| `jenis_file` | text | 0% |
| `keterangan` | text | 84% |
| `jenis_dokumen` | text | 0% |
| `tanggal_upload` | timestamp | 0% |

## replica.bahan_ajar_list

Sumber: `GET /bahan_ajar`; 46 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `isbn` | text | 74% |
| `judul` | text | 0% |
| `nama_jenis` | text | 0% |
| `nama_penerbit` | text | 0% |
| `tanggal_terbit` | date | 20% |
| `id_kategori_kegiatan` | bigint | 0% |

## replica.bahan_ajar_penulis

Sumber: `GET /bahan_ajar/{id}`, elemen `penulis[]`; 126 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `nama` | text | 0% |
| `jenis` | text | 0% |
| `peran` | text | 0% |
| `id_sdm` | uuid | 0% |
| `urutan` | bigint | 0% |
| `afiliasi` | text | 9% |
| `id_orang` | text | 100% |
| `id_peserta_didik` | text | 100% |
| `nomor_induk_peserta_didik` | text | 100% |

## replica.beasiswa

Sumber: `GET /beasiswa/{id}`; 3 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `id_sdm` | uuid | 0% |
| `tahun_mulai` | bigint | 0% |
| `tahun_selesai` | bigint | 0% |
| `jenis_beasiswa` | text | 0% |
| `masih_menerima` | boolean | 0% |
| `id_jenis_beasiswa` | bigint | 0% |

## replica.beasiswa_list

Sumber: `GET /beasiswa`; 3 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `tahun_mulai` | bigint | 0% |
| `tahun_selesai` | bigint | 0% |
| `jenis_beasiswa` | text | 0% |
| `masih_menerima` | boolean | 0% |

## replica.bimbing_dosen

Sumber: `GET /bimbing_dosen/{id}`; 0 baris sampel.

Belum ada sampel; hanya kolom meta dan `r_payload`. Generate ulang setelah data tersedia.

## replica.bimbing_dosen_list

Sumber: `GET /bimbing_dosen`; 0 baris sampel.

Belum ada sampel; hanya kolom meta dan `r_payload`. Generate ulang setelah data tersedia.

## replica.bimbingan_mahasiswa

Sumber: `GET /bimbingan_mahasiswa/{id}`; 709 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `dosen` | jsonb | 0% |
| `id_pt` | uuid | 0% |
| `judul` | text | 0% |
| `lokasi` | text | 63% |
| `id_unit` | uuid | 0% |
| `komunal` | boolean | 0% |
| `flagship` | numeric | 0% |
| `semester` | text | 0% |
| `mahasiswa` | jsonb | 0% |
| `keterangan` | text | 96% |
| `sk_penugasan` | text | 35% |
| `program_studi` | text | 0% |
| `tanggal_mulai` | date | 99% |
| `jenis_bimbingan` | text | 0% |
| `tanggal_selesai` | date | 99% |
| `tanggal_sk_penugasan` | date | 36% |
| `nama_perguruan_tinggi` | text | 0% |

## replica.bimbingan_mahasiswa_bidang_ilmu

Sumber: `GET /bimbingan_mahasiswa/{id}/bidang_ilmu`; 0 baris sampel.

Belum ada sampel; hanya kolom meta dan `r_payload`. Generate ulang setelah data tersedia.

## replica.bimbingan_mahasiswa_dosen

Sumber: `GET /bimbingan_mahasiswa/{id}`, elemen `dosen[]`; 1138 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `nama` | text | 0% |
| `id_sdm` | uuid | 0% |
| `urutan` | bigint | 0% |
| `id_bimbing` | uuid | 0% |
| `kategori_kegiatan` | text | 0% |

## replica.bimbingan_mahasiswa_list

Sumber: `GET /bimbingan_mahasiswa`; 712 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `judul` | text | 0% |
| `id_smt` | text | 0% |
| `nm_kat` | text | 0% |
| `semester` | text | 0% |
| `id_katgiat` | bigint | 0% |
| `program_studi` | text | 0% |
| `jenis_bimbingan` | text | 0% |
| `nama_perguruan_tinggi` | text | 0% |

## replica.bimbingan_mahasiswa_mahasiswa

Sumber: `GET /bimbingan_mahasiswa/{id}`, elemen `mahasiswa[]`; 2454 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `nama` | text | 0% |
| `peran` | text | 0% |
| `nomor_induk` | text | 0% |
| `id_anggota_mahasiswa` | uuid | 0% |
| `id_registrasi_mahasiswa` | uuid | 0% |

## replica.bkd_ajar

Sumber: `GET /bkd/ajar`; 1111 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `nidn` | text | 11% |
| `nilai` | numeric | 10% |
| `nuptk` | text | 0% |
| `unsur` | text | 0% |
| `id_smt` | text | 0% |
| `nm_kat` | text | 0% |
| `nm_sdm` | text | 0% |
| `beban_sks` | numeric | 0% |
| `judul_keg` | text | 0% |
| `id_katgiat` | bigint | 0% |

## replica.bkd_laporan_akhir_bkd

Sumber: `GET /bkd/laporan_akhir_bkd`; 62 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `bkd` | bigint | 0% |
| `nuptk` | text | 0% |
| `id_smt` | text | 0% |
| `sks_lebih` | numeric | 0% |
| `id_jabfung` | text | 19% |
| `id_reg_ptk` | uuid | 0% |
| `stat_tugas` | text | 0% |
| `sks_kinerja` | numeric | 0% |
| `stat_belajar` | text | 0% |
| `sks_lebih_lit` | numeric | 0% |
| `sks_lebih_ajar` | numeric | 0% |
| `stat_kewajiban` | numeric | 21% |
| `simpulan_asesor` | text | 0% |
| `sks_kinerja_lit` | numeric | 0% |
| `sks_lebih_didik` | numeric | 0% |
| `sks_kinerja_ajar` | numeric | 0% |
| `sks_kinerja_didik` | numeric | 0% |
| `sks_lebih_pengmas` | numeric | 0% |
| `sks_lebih_tunjang` | numeric | 0% |
| `sks_kinerja_pengmas` | numeric | 0% |
| `sks_kinerja_penunjang` | numeric | 0% |

## replica.bkd_pendidikan

Sumber: `GET /bkd/pendidikan`; 2 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `nidn` | text | 0% |
| `nilai` | numeric | 0% |
| `nuptk` | text | 0% |
| `unsur` | text | 0% |
| `id_smt` | text | 0% |
| `nm_kat` | text | 0% |
| `nm_sdm` | text | 0% |
| `beban_sks` | numeric | 0% |
| `judul_keg` | text | 0% |
| `id_katgiat` | bigint | 0% |

## replica.bkd_penelitian

Sumber: `GET /bkd/penelitian`; 150 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `nidn` | text | 6% |
| `nilai` | numeric | 0% |
| `nuptk` | text | 0% |
| `unsur` | text | 0% |
| `id_smt` | text | 0% |
| `nm_kat` | text | 0% |
| `nm_sdm` | text | 0% |
| `beban_sks` | numeric | 0% |
| `judul_keg` | text | 0% |
| `id_katgiat` | bigint | 0% |

## replica.bkd_pengmas

Sumber: `GET /bkd/pengmas`; 170 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `nidn` | text | 5% |
| `nilai` | numeric | 0% |
| `nuptk` | text | 0% |
| `unsur` | text | 0% |
| `id_smt` | text | 0% |
| `nm_kat` | text | 0% |
| `nm_sdm` | text | 0% |
| `beban_sks` | numeric | 0% |
| `judul_keg` | text | 0% |
| `id_katgiat` | bigint | 0% |

## replica.bkd_tunjang

Sumber: `GET /bkd/tunjang`; 335 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `nidn` | text | 2% |
| `nilai` | numeric | 0% |
| `nuptk` | text | 0% |
| `unsur` | text | 0% |
| `id_smt` | text | 0% |
| `nm_kat` | text | 0% |
| `nm_sdm` | text | 0% |
| `beban_sks` | numeric | 0% |
| `judul_keg` | text | 0% |
| `id_katgiat` | bigint | 0% |

## replica.data_pribadi_alamat

Sumber: `GET /data_pribadi/alamat/{id_sdm}`; 12 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `rt` | bigint | 0% |
| `rw` | bigint | 0% |
| `dusun` | text | 75% |
| `email` | text | 25% |
| `alamat` | text | 0% |
| `kode_pos` | text | 67% |
| `kelurahan` | text | 0% |
| `telepon_hp` | text | 25% |
| `telepon_rumah` | text | 75% |
| `kota_kabupaten` | text | 0% |
| `id_kota_kabupaten` | text | 0% |

## replica.data_pribadi_bidang_ilmu

Sumber: `GET /data_pribadi/bidang_ilmu/{id_sdm}`; 11 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `urutan` | numeric | 0% |
| `kelompok_bidang` | text | 0% |
| `id_kelompok_bidang` | uuid | 0% |

## replica.data_pribadi_keluarga

Sumber: `GET /data_pribadi/keluarga/{id_sdm}`; 12 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `nip_pasangan` | text | 83% |
| `status_kawin` | text | 0% |
| `nama_pasangan` | text | 50% |
| `id_status_kawin` | bigint | 0% |
| `pekerjaan_pasangan` | text | 42% |
| `id_pekerjaan_pasangan` | bigint | 0% |

## replica.data_pribadi_kepegawaian

Sumber: `GET /data_pribadi/kepegawaian/{id_sdm}`; 12 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `nip` | text | 92% |
| `nidn` | text | 8% |
| `tmmd` | date | 0% |
| `nuptk` | text | 0% |
| `sk_cpns` | text | 92% |
| `sk_tmmd` | text | 8% |
| `sumber_gaji` | text | 0% |
| `id_sumber_gaji` | bigint | 0% |
| `tanggal_sk_cpns` | date | 92% |

## replica.data_pribadi_kependudukan

Sumber: `GET /data_pribadi/kependudukan/{id_sdm}`; 12 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `nik` | text | 0% |
| `agama` | text | 0% |
| `id_agama` | bigint | 0% |
| `kode_negara` | text | 0% |
| `kewarganegaraan` | text | 0% |

## replica.data_pribadi_lain

Sumber: `GET /data_pribadi/lain/{id_sdm}`; 12 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `npwp` | text | 33% |
| `nama_wp` | text | 33% |

## replica.data_pribadi_profil

Sumber: `GET /data_pribadi/profil/{id_sdm}`; 12 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `nama` | text | 0% |
| `tempat_lahir` | text | 0% |
| `jenis_kelamin` | text | 0% |
| `tanggal_lahir` | date | 0% |

## replica.detasering

Sumber: `GET /detasering/{id}`; 0 baris sampel.

Belum ada sampel; hanya kolom meta dan `r_payload`. Generate ulang setelah data tersedia.

## replica.detasering_list

Sumber: `GET /detasering`; 0 baris sampel.

Belum ada sampel; hanya kolom meta dan `r_payload`. Generate ulang setelah data tersedia.

## replica.diklat

Sumber: `GET /diklat/{id}`; 23 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `peran` | text | 4% |
| `tahun` | numeric | 0% |
| `id_sdm` | uuid | 0% |
| `lokasi` | text | 52% |
| `dokumen` | jsonb | 0% |
| `tingkat` | text | 0% |
| `jumlah_jam` | numeric | 9% |
| `jenis_diklat` | text | 0% |
| `sk_penugasan` | text | 65% |
| `no_sertifikat` | text | 9% |
| `penyelenggara` | text | 0% |
| `tanggal_mulai` | date | 0% |
| `id_jenis_diklat` | bigint | 0% |
| `tanggal_selesai` | date | 0% |
| `tanggal_sertifikat` | date | 0% |
| `id_kategori_kegiatan` | bigint | 0% |
| `tanggal_sk_penugasan` | date | 65% |

## replica.diklat_dokumen

Sumber: `GET /diklat/{id}`, elemen `dokumen[]`; 32 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `tautan` | text | 56% |
| `nama_file` | text | 0% |
| `jenis_file` | text | 0% |
| `keterangan` | text | 69% |
| `jenis_dokumen` | text | 0% |
| `tanggal_upload` | timestamp | 0% |

## replica.diklat_list

Sumber: `GET /diklat`; 23 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `tahun` | numeric | 0% |
| `asal_data` | numeric | 0% |
| `jenis_diklat` | text | 0% |
| `penyelenggara` | text | 0% |
| `tanggal_mulai` | date | 0% |
| `id_jenis_diklat` | bigint | 0% |

## replica.dokumen

Sumber: `GET /dokumen/{id}`; 170 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 52% |
| `tautan` | text | 99% |
| `nama_file` | text | 0% |
| `jenis_file` | text | 0% |
| `keterangan` | text | 90% |
| `jenis_dokumen` | text | 0% |
| `tanggal_upload` | timestamp | 0% |
| `id_jenis_dokumen` | bigint | 0% |

## replica.dokumen_list

Sumber: `GET /dokumen`; 170 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 52% |
| `tautan` | text | 99% |
| `nama_file` | text | 0% |
| `jenis_file` | text | 0% |
| `keterangan` | text | 90% |
| `last_update` | timestamp | 0% |
| `jenis_dokumen` | text | 0% |
| `tanggal_upload` | timestamp | 0% |
| `id_jenis_dokumen` | bigint | 0% |

## replica.inpassing

Sumber: `GET /inpassing/{id}`; 11 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `sk` | text | 0% |
| `id_sdm` | uuid | 0% |
| `dokumen` | jsonb | 0% |
| `pangkat` | text | 0% |
| `golongan` | text | 0% |
| `tanggal_sk` | date | 0% |
| `angka_kredit` | numeric | 0% |
| `tanggal_mulai` | date | 0% |
| `masa_kerja_bulan` | bigint | 0% |
| `masa_kerja_tahun` | bigint | 0% |
| `pangkat_golongan` | text | 0% |
| `id_pangkat_golongan` | bigint | 0% |

## replica.inpassing_dokumen

Sumber: `GET /inpassing/{id}`, elemen `dokumen[]`; 10 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `tautan` | text | 60% |
| `nama_file` | text | 0% |
| `jenis_file` | text | 0% |
| `keterangan` | text | 80% |
| `jenis_dokumen` | text | 0% |
| `tanggal_upload` | timestamp | 0% |

## replica.inpassing_list

Sumber: `GET /inpassing`; 11 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `sk` | text | 0% |
| `tanggal_sk` | date | 0% |
| `tanggal_mulai` | date | 0% |
| `pangkat_golongan` | text | 0% |

## replica.jabatan_fungsional

Sumber: `GET /jabatan_fungsional/{id}`; 17 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `sk` | text | 0% |
| `id_sdm` | uuid | 0% |
| `dokumen` | jsonb | 0% |
| `angka_kredit` | bigint | 0% |
| `tanggal_mulai` | date | 0% |
| `jabatan_fungsional` | text | 0% |
| `kelebihan_penunjang` | bigint | 0% |
| `kelebihan_penelitian` | bigint | 0% |
| `kelebihan_pengabdian` | bigint | 0% |
| `kelebihan_pengajaran` | numeric | 0% |
| `id_jabatan_fungsional` | bigint | 0% |

## replica.jabatan_fungsional_ajuan

Sumber: `GET /jabatan_fungsional/ajuan/{id}`; 16 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `id_sdm` | uuid | 0% |
| `dokumen` | jsonb | 0% |
| `jenis_ajuan` | text | 0% |
| `id_data_master` | uuid | 44% |
| `detail_perubahan` | jsonb | 0% |
| `detail_perubahan_sk_baru` | text | 44% |
| `detail_perubahan_sk_lama` | text | 0% |
| `detail_perubahan_jabfung_baru` | text | 44% |
| `detail_perubahan_jabfung_lama` | text | 44% |
| `detail_perubahan_lebihan_lit_baru` | numeric | 75% |
| `detail_perubahan_lebihan_lit_lama` | numeric | 94% |
| `detail_perubahan_angka_kredit_baru` | numeric | 44% |
| `detail_perubahan_angka_kredit_lama` | numeric | 44% |
| `detail_perubahan_lebihan_ajar_baru` | numeric | 75% |
| `detail_perubahan_lebihan_ajar_lama` | numeric | 94% |
| `detail_perubahan_tanggal_mulai_baru` | date | 56% |
| `detail_perubahan_tanggal_mulai_lama` | date | 44% |
| `detail_perubahan_lebihan_pengmas_baru` | numeric | 75% |
| `detail_perubahan_lebihan_pengmas_lama` | numeric | 94% |
| `detail_perubahan_lebihan_tunjang_baru` | numeric | 75% |
| `detail_perubahan_lebihan_tunjang_lama` | numeric | 94% |
| `detail_perubahan_stat_pegawai_baru` | bigint | 56% |
| `detail_perubahan_stat_pegawai_lama` | text | 100% |

## replica.jabatan_fungsional_ajuan_dokumen

Sumber: `GET /jabatan_fungsional/ajuan/{id}`, elemen `dokumen[]`; 18 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 56% |
| `tautan` | text | 100% |
| `nama_file` | text | 0% |
| `jenis_file` | text | 0% |
| `keterangan` | text | 100% |
| `jenis_dokumen` | text | 0% |
| `tanggal_upload` | timestamp | 0% |

## replica.jabatan_fungsional_ajuan_list

Sumber: `GET /jabatan_fungsional/ajuan`; 16 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `umur` | bigint | 0% |
| `id_sdm` | uuid | 0% |
| `status` | text | 0% |
| `keterangan` | text | 0% |
| `jenis_ajuan` | text | 0% |
| `tanggal_ajuan` | timestamp | 0% |
| `id_data_master` | uuid | 44% |
| `tanggal_verifikasi` | timestamp | 0% |

## replica.jabatan_fungsional_dokumen

Sumber: `GET /jabatan_fungsional/{id}`, elemen `dokumen[]`; 18 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 94% |
| `tautan` | text | 100% |
| `nama_file` | text | 0% |
| `jenis_file` | text | 0% |
| `keterangan` | text | 100% |
| `jenis_dokumen` | text | 0% |
| `tanggal_upload` | timestamp | 0% |

## replica.jabatan_fungsional_list

Sumber: `GET /jabatan_fungsional`; 17 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `sk` | text | 0% |
| `tanggal_mulai` | date | 0% |
| `id_stat_pegawai` | bigint | 29% |
| `nm_stat_pegawai` | text | 29% |
| `jabatan_fungsional` | text | 0% |

## replica.jabatan_struktural

Sumber: `GET /jabatan_struktural/{id}`; 0 baris sampel.

Belum ada sampel; hanya kolom meta dan `r_payload`. Generate ulang setelah data tersedia.

## replica.jabatan_struktural_list

Sumber: `GET /jabatan_struktural`; 0 baris sampel.

Belum ada sampel; hanya kolom meta dan `r_payload`. Generate ulang setelah data tersedia.

## replica.kekayaan_intelektual

Sumber: `GET /kekayaan_intelektual/{id}`; 37 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `doi` | text | 100% |
| `isbn` | text | 100% |
| `issn` | text | 100% |
| `edisi` | text | 100% |
| `judul` | text | 0% |
| `nomor` | bigint | 0% |
| `e_issn` | text | 100% |
| `tautan` | text | 46% |
| `volume` | bigint | 0% |
| `dokumen` | jsonb | 0% |
| `halaman` | text | 100% |
| `penulis` | jsonb | 0% |
| `seminar` | bigint | 0% |
| `tanggal` | date | 0% |
| `penerbit` | text | 43% |
| `quartile` | bigint | 0% |
| `asal_data` | text | 0% |
| `prosiding` | bigint | 0% |
| `judul_asli` | text | 100% |
| `keterangan` | text | 92% |
| `id_litabmas` | uuid | 95% |
| `nama_jurnal` | text | 100% |
| `nomor_paten` | text | 100% |
| `judul_artikel` | text | 100% |
| `pemberi_paten` | text | 100% |
| `judul_litabmas` | text | 95% |
| `jumlah_halaman` | bigint | 0% |
| `bidang_keilmuan` | jsonb | 0% |
| `jenis_publikasi` | text | 0% |
| `kategori_kegiatan` | text | 0% |
| `id_jenis_publikasi` | bigint | 0% |
| `id_kategori_kegiatan` | bigint | 0% |
| `kategori_capaian_luaran` | text | 32% |
| `id_kategori_capaian_luaran` | bigint | 0% |

## replica.kekayaan_intelektual_bidang_ilmu

Sumber: `GET /kekayaan_intelektual/{id}/bidang_ilmu`; 1 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `urutan` | numeric | 0% |
| `kelompok_bidang` | text | 0% |
| `id_kelompok_bidang` | uuid | 0% |

## replica.kekayaan_intelektual_dokumen

Sumber: `GET /kekayaan_intelektual/{id}`, elemen `dokumen[]`; 52 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `tautan` | text | 23% |
| `nama_file` | text | 0% |
| `jenis_file` | text | 0% |
| `keterangan` | text | 77% |
| `jenis_dokumen` | text | 0% |
| `tanggal_upload` | timestamp | 0% |

## replica.kekayaan_intelektual_list

Sumber: `GET /kekayaan_intelektual`; 37 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `judul` | text | 0% |
| `tanggal` | date | 0% |
| `quartile` | text | 100% |
| `asal_data` | text | 0% |
| `a_klaim_bkd` | numeric | 0% |
| `wkt_klaim_bkd` | timestamp | 57% |
| `bidang_keilmuan` | jsonb | 0% |
| `jenis_publikasi` | text | 0% |
| `kategori_kegiatan` | text | 0% |
| `id_kategori_kegiatan` | bigint | 0% |

## replica.kekayaan_intelektual_penulis

Sumber: `GET /kekayaan_intelektual/{id}`, elemen `penulis[]`; 95 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `nama` | text | 0% |
| `jenis` | text | 0% |
| `peran` | text | 0% |
| `id_sdm` | uuid | 1% |
| `urutan` | bigint | 0% |
| `afiliasi` | text | 9% |
| `id_orang` | uuid | 99% |
| `id_penulis` | uuid | 0% |
| `id_peserta_didik` | text | 100% |
| `corresponding_author` | bigint | 0% |
| `nomor_induk_peserta_didik` | text | 100% |

## replica.kelas_kuliah_dokumen

Sumber: `GET /kelas_kuliah/{id}/dokumen`; 1576 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `tautan` | text | 0% |
| `nama_file` | text | 100% |
| `jenis_file` | text | 100% |
| `keterangan` | text | 81% |
| `jenis_dokumen` | text | 0% |
| `tanggal_upload` | timestamp | 0% |

## replica.kepangkatan

Sumber: `GET /kepangkatan/{id}`; 16 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `sk` | text | 0% |
| `id_sdm` | uuid | 0% |
| `dokumen` | jsonb | 0% |
| `pangkat` | text | 0% |
| `golongan` | text | 0% |
| `tanggal_sk` | date | 0% |
| `tanggal_mulai` | date | 0% |
| `masa_kerja_bulan` | bigint | 0% |
| `masa_kerja_tahun` | bigint | 0% |
| `pangkat_golongan` | text | 0% |
| `id_pangkat_golongan` | bigint | 0% |

## replica.kepangkatan_list

Sumber: `GET /kepangkatan`; 16 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `sk` | text | 0% |
| `tanggal_mulai` | date | 0% |
| `pangkat_golongan` | text | 0% |

## replica.kesejahteraan

Sumber: `GET /kesejahteraan/{id}`; 1 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `id_sdm` | uuid | 0% |
| `tahun_mulai` | bigint | 0% |
| `penyelenggara` | text | 0% |
| `tahun_selesai` | bigint | 0% |
| `jenis_kesejahteraan` | text | 0% |
| `id_jenis_kesejahteraan` | bigint | 0% |

## replica.kesejahteraan_list

Sumber: `GET /kesejahteraan`; 1 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `tahun_mulai` | bigint | 0% |
| `penyelenggara` | text | 0% |
| `tahun_selesai` | bigint | 0% |
| `jenis_kesejahteraan` | text | 0% |

## replica.nilai_tes

Sumber: `GET /nilai_tes/{id}`; 1 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `skor` | bigint | 0% |
| `tahun` | bigint | 0% |
| `id_sdm` | uuid | 0% |
| `dokumen` | jsonb | 0% |
| `tanggal` | date | 0% |
| `jenis_tes` | text | 0% |
| `id_jenis_tes` | bigint | 0% |
| `penyelenggara` | text | 0% |

## replica.nilai_tes_ajuan

Sumber: `GET /nilai_tes/ajuan/{id}`; 0 baris sampel.

Belum ada sampel; hanya kolom meta dan `r_payload`. Generate ulang setelah data tersedia.

## replica.nilai_tes_ajuan_list

Sumber: `GET /nilai_tes/ajuan`; 0 baris sampel.

Belum ada sampel; hanya kolom meta dan `r_payload`. Generate ulang setelah data tersedia.

## replica.nilai_tes_dokumen

Sumber: `GET /nilai_tes/{id}`, elemen `dokumen[]`; 1 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `tautan` | text | 100% |
| `nama_file` | text | 0% |
| `jenis_file` | text | 0% |
| `keterangan` | text | 0% |
| `jenis_dokumen` | text | 0% |
| `tanggal_upload` | timestamp | 0% |

## replica.nilai_tes_list

Sumber: `GET /nilai_tes`; 8 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `skor` | bigint | 0% |
| `tahun` | bigint | 0% |
| `jenis_tes` | text | 0% |
| `penyelenggara` | text | 0% |

## replica.orasi_ilmiah

Sumber: `GET /orasi_ilmiah/{id}`; 3 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `bahasa` | text | 67% |
| `id_sdm` | uuid | 0% |
| `dokumen` | jsonb | 0% |
| `sk_penugasan` | text | 67% |
| `judul_makalah` | text | 0% |
| `penyelenggara` | text | 0% |
| `judul_litabmas` | text | 100% |
| `nama_pertemuan` | text | 0% |
| `kategori_kegiatan` | text | 0% |
| `tingkat_pertemuan` | text | 0% |
| `kategori_pembicara` | text | 0% |
| `tanggal_pelaksanaan` | date | 0% |
| `id_kategori_kegiatan` | bigint | 0% |
| `id_tingkat_pertemuan` | text | 0% |
| `tanggal_sk_penugasan` | date | 67% |
| `id_kategori_pembicara` | bigint | 0% |
| `kategori_capaian_luaran` | text | 0% |
| `id_penelitian_pengabdian` | text | 100% |
| `id_kategori_capaian_luaran` | bigint | 0% |

## replica.orasi_ilmiah_dokumen

Sumber: `GET /orasi_ilmiah/{id}`, elemen `dokumen[]`; 4 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `tautan` | text | 50% |
| `nama_file` | text | 0% |
| `jenis_file` | text | 0% |
| `keterangan` | text | 100% |
| `jenis_dokumen` | text | 0% |
| `tanggal_upload` | timestamp | 0% |

## replica.orasi_ilmiah_list

Sumber: `GET /orasi_ilmiah`; 3 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `judul_makalah` | text | 0% |
| `penyelenggara` | text | 0% |
| `nama_pertemuan` | text | 0% |
| `kategori_kegiatan` | text | 0% |
| `tanggal_pelaksanaan` | date | 0% |
| `id_kategori_kegiatan` | bigint | 0% |

## replica.pembicara

Sumber: `GET /pembicara/{id}`; 36 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `bahasa` | text | 61% |
| `id_sdm` | uuid | 0% |
| `dokumen` | jsonb | 0% |
| `sk_penugasan` | text | 25% |
| `judul_makalah` | text | 0% |
| `penyelenggara` | text | 0% |
| `judul_litabmas` | text | 94% |
| `nama_pertemuan` | text | 0% |
| `kategori_kegiatan` | text | 0% |
| `tingkat_pertemuan` | text | 25% |
| `kategori_pembicara` | text | 0% |
| `tanggal_pelaksanaan` | date | 0% |
| `id_kategori_kegiatan` | bigint | 0% |
| `id_tingkat_pertemuan` | text | 22% |
| `tanggal_sk_penugasan` | date | 39% |
| `id_kategori_pembicara` | bigint | 0% |
| `kategori_capaian_luaran` | text | 11% |
| `id_penelitian_pengabdian` | uuid | 94% |
| `id_kategori_capaian_luaran` | bigint | 0% |

## replica.pembicara_dokumen

Sumber: `GET /pembicara/{id}`, elemen `dokumen[]`; 58 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `tautan` | text | 33% |
| `nama_file` | text | 0% |
| `jenis_file` | text | 0% |
| `keterangan` | text | 69% |
| `jenis_dokumen` | text | 0% |
| `tanggal_upload` | timestamp | 0% |

## replica.pembicara_list

Sumber: `GET /pembicara`; 36 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `judul_makalah` | text | 0% |
| `penyelenggara` | text | 0% |
| `nama_pertemuan` | text | 0% |
| `kategori_kegiatan` | text | 0% |
| `tanggal_pelaksanaan` | date | 0% |
| `id_kategori_kegiatan` | bigint | 0% |

## replica.pendidikan_formal

Sumber: `GET /pendidikan_formal/{id}`; 31 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `ipk` | numeric | 0% |
| `id_sdm` | uuid | 0% |
| `dokumen` | jsonb | 0% |
| `jumlah_sks` | bigint | 0% |
| `jenis_ajuan` | text | 42% |
| `nomor_induk` | text | 0% |
| `tahun_lulus` | bigint | 0% |
| `tahun_masuk` | bigint | 0% |
| `bidang_studi` | text | 0% |
| `nomor_ijazah` | text | 32% |
| `tanggal_lulus` | date | 39% |
| `gelar_akademik` | text | 0% |
| `sk_penyetaraan` | text | 100% |
| `id_bidang_studi` | bigint | 0% |
| `jumlah_semester` | bigint | 0% |
| `id_program_studi` | uuid | 0% |
| `id_gelar_akademik` | bigint | 0% |
| `judul_tugas_akhir` | text | 52% |
| `kategori_kegiatan` | text | 0% |
| `jenjang_pendidikan` | text | 0% |
| `nama_program_studi` | text | 0% |
| `id_jenjang_pendidikan` | bigint | 0% |
| `nama_perguruan_tinggi` | text | 0% |
| `tanggal_sk_penyetaraan` | text | 100% |

## replica.pendidikan_formal_ajuan

Sumber: `GET /pendidikan_formal/ajuan/{id}`; 12 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `id_sdm` | uuid | 0% |
| `dokumen` | jsonb | 0% |
| `jenis_ajuan` | text | 0% |
| `id_data_master` | uuid | 25% |
| `detail_perubahan` | jsonb | 0% |
| `detail_perubahan_ipk_baru` | numeric | 8% |
| `detail_perubahan_ipk_lama` | numeric | 25% |
| `detail_perubahan_gelar_akad_baru` | text | 67% |
| `detail_perubahan_gelar_akad_lama` | text | 42% |
| `detail_perubahan_jenj_didik_baru` | text | 75% |
| `detail_perubahan_jenj_didik_lama` | text | 58% |
| `detail_perubahan_jumlah_sks_baru` | numeric | 17% |
| `detail_perubahan_jumlah_sks_lama` | numeric | 42% |
| `detail_perubahan_nomor_induk_baru` | text | 50% |
| `detail_perubahan_nomor_induk_lama` | text | 33% |
| `detail_perubahan_tahun_lulus_baru` | numeric | 67% |
| `detail_perubahan_tahun_lulus_lama` | numeric | 50% |
| `detail_perubahan_tahun_masuk_baru` | numeric | 67% |
| `detail_perubahan_tahun_masuk_lama` | numeric | 25% |
| `detail_perubahan_bidang_studi_baru` | text | 67% |
| `detail_perubahan_bidang_studi_lama` | text | 25% |
| `detail_perubahan_tanggal_lulus_baru` | date | 33% |
| `detail_perubahan_tanggal_lulus_lama` | date | 92% |
| `detail_perubahan_judul_tugas_akhir_baru` | text | 50% |
| `detail_perubahan_judul_tugas_akhir_lama` | text | 92% |
| `detail_perubahan_nama_perguruan_tinggi_baru` | text | 67% |
| `detail_perubahan_nama_perguruan_tinggi_lama` | text | 25% |
| `detail_perubahan_nomor_ijazah_baru` | text | 33% |
| `detail_perubahan_nomor_ijazah_lama` | boolean | 92% |
| `detail_perubahan_fak_baru` | text | 58% |
| `detail_perubahan_fak_lama` | text | 92% |
| `detail_perubahan_sms_baru` | text | 75% |
| `detail_perubahan_sms_lama` | text | 100% |
| `detail_perubahan_tahun_baru` | numeric | 75% |
| `detail_perubahan_tahun_lama` | text | 100% |
| `detail_perubahan_stat_kul_baru` | text | 67% |
| `detail_perubahan_stat_kul_lama` | numeric | 92% |
| `detail_perubahan_jumlah_semester_baru` | numeric | 67% |
| `detail_perubahan_jumlah_semester_lama` | numeric | 92% |

## replica.pendidikan_formal_ajuan_dokumen

Sumber: `GET /pendidikan_formal/ajuan/{id}`, elemen `dokumen[]`; 20 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 15% |
| `tautan` | text | 100% |
| `nama_file` | text | 0% |
| `jenis_file` | text | 0% |
| `keterangan` | text | 100% |
| `jenis_dokumen` | text | 0% |
| `tanggal_upload` | timestamp | 0% |

## replica.pendidikan_formal_ajuan_list

Sumber: `GET /pendidikan_formal/ajuan`; 15 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `umur` | bigint | 0% |
| `id_sdm` | uuid | 0% |
| `status` | text | 0% |
| `keterangan` | text | 27% |
| `jenis_ajuan` | text | 0% |
| `tanggal_ajuan` | timestamp | 0% |
| `id_data_master` | uuid | 20% |
| `tanggal_verifikasi` | timestamp | 0% |

## replica.pendidikan_formal_dokumen

Sumber: `GET /pendidikan_formal/{id}`, elemen `dokumen[]`; 1 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `tautan` | text | 100% |
| `nama_file` | text | 0% |
| `jenis_file` | text | 0% |
| `keterangan` | text | 100% |
| `jenis_dokumen` | text | 0% |
| `tanggal_upload` | timestamp | 0% |

## replica.pendidikan_formal_list

Sumber: `GET /pendidikan_formal`; 31 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `jenis_ajuan` | text | 42% |
| `tahun_lulus` | bigint | 0% |
| `bidang_studi` | text | 0% |
| `gelar_akademik` | text | 0% |
| `jenjang_pendidikan` | text | 0% |
| `nama_perguruan_tinggi` | text | 0% |

## replica.penelitian

Sumber: `GET /penelitian/{id}`; 28 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `judul` | text | 0% |
| `lokasi` | text | 61% |
| `anggota` | jsonb | 0% |
| `dokumen` | jsonb | 0% |
| `in_kind` | text | 96% |
| `afiliasi` | text | 0% |
| `dana_dikti` | numeric | 0% |
| `jenis_skim` | text | 54% |
| `id_afiliasi` | uuid | 0% |
| `sk_penugasan` | text | 57% |
| `tahun_usulan` | bigint | 0% |
| `id_jenis_skim` | uuid | 54% |
| `lama_kegiatan` | bigint | 0% |
| `mitra_litabmas` | jsonb | 0% |
| `tahun_kegiatan` | bigint | 0% |
| `kelompok_bidang` | text | 29% |
| `tahun_pelaksanaan` | bigint | 0% |
| `id_kelompok_bidang` | uuid | 29% |
| `dana_institusi_lain` | numeric | 0% |
| `litabmas_sebelumnya` | text | 89% |
| `id_kategori_kegiatan` | bigint | 0% |
| `tahun_pelaksanaan_ke` | bigint | 0% |
| `tanggal_sk_penugasan` | date | 61% |
| `dana_perguruan_tinggi` | bigint | 0% |
| `id_litabmas_sebelumnya` | uuid | 89% |

## replica.penelitian_anggota

Sumber: `GET /penelitian/{id}`, elemen `anggota[]`; 78 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `nama` | text | 0% |
| `nipd` | text | 99% |
| `id_pd` | uuid | 99% |
| `jenis` | text | 0% |
| `peran` | text | 0% |
| `id_sdm` | uuid | 1% |
| `id_orang` | text | 100% |
| `stat_aktif` | boolean | 0% |

## replica.penelitian_bidang_ilmu

Sumber: `GET /penelitian/{id}/bidang_ilmu`; 6 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `urutan` | numeric | 0% |
| `kelompok_bidang` | text | 0% |
| `id_kelompok_bidang` | uuid | 0% |

## replica.penelitian_dokumen

Sumber: `GET /penelitian/{id}`, elemen `dokumen[]`; 31 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `tautan` | text | 71% |
| `nama_file` | text | 0% |
| `jenis_file` | text | 0% |
| `keterangan` | text | 84% |
| `jenis_dokumen` | text | 0% |
| `tanggal_upload` | timestamp | 0% |

## replica.penelitian_list

Sumber: `GET /penelitian`; 30 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `judul` | text | 0% |
| `lama_kegiatan` | bigint | 0% |
| `bidang_keilmuan` | jsonb | 0% |
| `tahun_pelaksanaan` | bigint | 0% |

## replica.pengabdian

Sumber: `GET /pengabdian/{id}`; 167 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `judul` | text | 0% |
| `lokasi` | text | 47% |
| `anggota` | jsonb | 0% |
| `dokumen` | jsonb | 0% |
| `in_kind` | numeric | 97% |
| `afiliasi` | text | 0% |
| `dana_dikti` | numeric | 0% |
| `jenis_skim` | text | 81% |
| `id_afiliasi` | uuid | 0% |
| `sk_penugasan` | text | 4% |
| `tahun_usulan` | bigint | 0% |
| `id_jenis_skim` | uuid | 81% |
| `lama_kegiatan` | bigint | 0% |
| `mitra_litabmas` | jsonb | 0% |
| `tahun_kegiatan` | bigint | 0% |
| `kelompok_bidang` | text | 44% |
| `tahun_pelaksanaan` | bigint | 0% |
| `id_kelompok_bidang` | uuid | 44% |
| `dana_institusi_lain` | numeric | 0% |
| `litabmas_sebelumnya` | text | 96% |
| `id_kategori_kegiatan` | bigint | 0% |
| `tahun_pelaksanaan_ke` | bigint | 0% |
| `tanggal_sk_penugasan` | date | 5% |
| `dana_perguruan_tinggi` | numeric | 0% |
| `id_litabmas_sebelumnya` | uuid | 96% |

## replica.pengabdian_anggota

Sumber: `GET /pengabdian/{id}`, elemen `anggota[]`; 833 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `nama` | text | 0% |
| `nipd` | text | 99% |
| `id_pd` | uuid | 99% |
| `jenis` | text | 0% |
| `peran` | text | 0% |
| `id_sdm` | uuid | 1% |
| `id_orang` | uuid | 100% |
| `stat_aktif` | boolean | 0% |

## replica.pengabdian_bidang_ilmu

Sumber: `GET /pengabdian/{id}/bidang_ilmu`; 11 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `urutan` | numeric | 0% |
| `kelompok_bidang` | text | 0% |
| `id_kelompok_bidang` | uuid | 0% |

## replica.pengabdian_dokumen

Sumber: `GET /pengabdian/{id}`, elemen `dokumen[]`; 486 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `tautan` | text | 33% |
| `nama_file` | text | 0% |
| `jenis_file` | text | 0% |
| `keterangan` | text | 83% |
| `jenis_dokumen` | text | 0% |
| `tanggal_upload` | timestamp | 0% |

## replica.pengabdian_list

Sumber: `GET /pengabdian`; 197 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `judul` | text | 0% |
| `lama_kegiatan` | bigint | 0% |
| `bidang_keilmuan` | jsonb | 0% |
| `tahun_pelaksanaan` | bigint | 0% |

## replica.pengabdian_mitra_litabmas

Sumber: `GET /pengabdian/{id}`, elemen `mitra_litabmas[]`; 1 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |

## replica.pengajaran

Sumber: `GET /pengajaran/{id}`; 1480 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `sks` | numeric | 0% |
| `id_pt` | uuid | 0% |
| `kelas` | text | 0% |
| `id_unit` | uuid | 0% |
| `id_kelas` | uuid | 0% |
| `semester` | text | 0% |
| `id_semester` | text | 0% |
| `mata_kuliah` | text | 0% |
| `sks_praktik` | bigint | 0% |
| `sks_simulasi` | bigint | 0% |
| `id_mata_kuliah` | uuid | 0% |
| `jenis_evaluasi` | text | 0% |
| `nama_substansi` | text | 100% |
| `sks_tatap_muka` | bigint | 0% |
| `sks_mata_kuliah` | bigint | 0% |
| `jumlah_mahasiswa` | bigint | 0% |
| `jenjang_pendidikan` | text | 0% |
| `nama_program_studi` | text | 0% |
| `tatap_muka_rencana` | bigint | 0% |
| `sks_praktik_lapangan` | bigint | 0% |
| `tatap_muka_realisasi` | bigint | 0% |
| `nama_perguruan_tinggi` | text | 0% |

## replica.pengajaran_bidang_ilmu

Sumber: `GET /pengajaran/{id}/bidang_ilmu`; 68 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `urutan` | numeric | 0% |
| `kelompok_bidang` | text | 0% |
| `id_kelompok_bidang` | uuid | 0% |

## replica.pengajaran_list

Sumber: `GET /pengajaran`; 1480 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `sks` | numeric | 0% |
| `kelas` | text | 0% |
| `jns_mk` | text | 6% |
| `semester` | text | 0% |
| `id_katgiat` | bigint | 0% |
| `mata_kuliah` | text | 0% |
| `sks_mata_kuliah` | numeric | 0% |
| `jumlah_mahasiswa` | bigint | 0% |
| `kode_mata_kuliah` | text | 0% |
| `nama_perguruan_tinggi` | text | 0% |

## replica.pengelola_jurnal

Sumber: `GET /pengelola_jurnal/{id}`; 3 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `aktif` | bigint | 0% |
| `peran` | text | 0% |
| `id_sdm` | uuid | 0% |
| `dokumen` | jsonb | 0% |
| `sk_penugasan` | text | 0% |
| `tanggal_mulai` | date | 0% |
| `media_publikasi` | text | 0% |
| `tanggal_selesai` | date | 67% |
| `kategori_kegiatan` | text | 0% |
| `id_media_publikasi` | uuid | 0% |
| `id_kategori_kegiatan` | bigint | 0% |

## replica.pengelola_jurnal_dokumen

Sumber: `GET /pengelola_jurnal/{id}`, elemen `dokumen[]`; 3 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `tautan` | text | 0% |
| `nama_file` | text | 0% |
| `jenis_file` | text | 0% |
| `keterangan` | text | 100% |
| `jenis_dokumen` | text | 0% |
| `tanggal_upload` | timestamp | 0% |

## replica.pengelola_jurnal_list

Sumber: `GET /pengelola_jurnal`; 3 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `aktif` | bigint | 0% |
| `peran` | text | 0% |
| `sk_penugasan` | text | 0% |
| `tanggal_mulai` | date | 0% |
| `media_publikasi` | text | 0% |
| `tanggal_selesai` | date | 67% |

## replica.penghargaan

Sumber: `GET /penghargaan/{id}`; 5 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `tahun` | bigint | 0% |
| `id_sdm` | uuid | 0% |
| `dokumen` | jsonb | 0% |
| `instansi_pemberi` | text | 0% |
| `jenis_penghargaan` | text | 0% |
| `kategori_kegiatan` | text | 0% |
| `tingkat_penghargaan` | text | 0% |
| `id_jenis_penghargaan` | bigint | 0% |
| `id_kategori_kegiatan` | bigint | 0% |
| `id_tingkat_penghargaan` | bigint | 0% |

## replica.penghargaan_dokumen

Sumber: `GET /penghargaan/{id}`, elemen `dokumen[]`; 8 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `tautan` | text | 63% |
| `nama_file` | text | 0% |
| `jenis_file` | text | 0% |
| `keterangan` | text | 75% |
| `jenis_dokumen` | text | 0% |
| `tanggal_upload` | timestamp | 0% |

## replica.penghargaan_list

Sumber: `GET /penghargaan`; 5 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `tahun` | bigint | 0% |
| `instansi_pemberi` | text | 0% |
| `jenis_penghargaan` | text | 0% |

## replica.pengujian_mahasiswa

Sumber: `GET /pengujian_mahasiswa/{id}`; 0 baris sampel.

Belum ada sampel; hanya kolom meta dan `r_payload`. Generate ulang setelah data tersedia.

## replica.pengujian_mahasiswa_bidang_ilmu

Sumber: `GET /pengujian_mahasiswa/{id}/bidang_ilmu`; 0 baris sampel.

Belum ada sampel; hanya kolom meta dan `r_payload`. Generate ulang setelah data tersedia.

## replica.pengujian_mahasiswa_list

Sumber: `GET /pengujian_mahasiswa`; 0 baris sampel.

Belum ada sampel; hanya kolom meta dan `r_payload`. Generate ulang setelah data tersedia.

## replica.penugasan

Sumber: `GET /penugasan/{id}`; 33 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `id_sdm` | uuid | 0% |
| `dokumen` | jsonb | 0% |
| `keaktifan` | jsonb | 0% |
| `id_updater` | uuid | 0% |
| `unit_kerja` | text | 33% |
| `surat_tugas` | text | 3% |
| `ikatan_kerja` | text | 0% |
| `jenis_keluar` | text | 70% |
| `id_unit_kerja` | uuid | 33% |
| `tanggal_mulai` | date | 0% |
| `tanggal_keluar` | date | 70% |
| `id_ikatan_kerja` | text | 0% |
| `id_jenis_keluar` | text | 70% |
| `perguruan_tinggi` | text | 0% |
| `jenjang_pendidikan` | text | 33% |
| `status_kepegawaian` | text | 0% |
| `id_perguruan_tinggi` | uuid | 0% |
| `tanggal_surat_tugas` | date | 0% |
| `id_status_kepegawaian` | bigint | 0% |

## replica.penugasan_dokumen

Sumber: `GET /penugasan/{id}`, elemen `dokumen[]`; 5 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 80% |
| `tautan` | text | 100% |
| `nama_file` | text | 0% |
| `jenis_file` | text | 0% |
| `keterangan` | text | 100% |
| `jenis_dokumen` | text | 0% |
| `tanggal_upload` | timestamp | 0% |

## replica.penugasan_keaktifan

Sumber: `GET /penugasan/{id}`, elemen `keaktifan[]`; 176 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id_thn_ajaran` | text | 0% |
| `apakah_pt_homebase` | numeric | 0% |

## replica.penugasan_list

Sumber: `GET /penugasan`; 33 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `unit_kerja` | text | 33% |
| `ikatan_kerja` | text | 0% |
| `tanggal_mulai` | date | 0% |
| `tanggal_keluar` | date | 70% |
| `perguruan_tinggi` | text | 0% |
| `jenjang_pendidikan` | text | 33% |
| `status_kepegawaian` | text | 0% |
| `apakah_penugasan_homebase` | text | 0% |

## replica.penunjang_lain

Sumber: `GET /penunjang_lain/{id}`; 366 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `dokumen` | jsonb | 0% |
| `tingkat` | text | 0% |
| `instansi` | text | 0% |
| `sk_penugasan` | text | 0% |
| `anggota_dosen` | jsonb | 0% |
| `tanggal_mulai` | date | 0% |
| `tanggal_selesai` | date | 45% |
| `jenis_kepanitiaan` | text | 0% |
| `kategori_kegiatan` | text | 0% |
| `id_jenis_kepanitiaan` | bigint | 0% |
| `id_kategori_kegiatan` | bigint | 0% |

## replica.penunjang_lain_anggota_dosen

Sumber: `GET /penunjang_lain/{id}`, elemen `anggota_dosen[]`; 647 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `nama` | text | 0% |
| `peran` | text | 0% |
| `id_sdm` | uuid | 0% |

## replica.penunjang_lain_dokumen

Sumber: `GET /penunjang_lain/{id}`, elemen `dokumen[]`; 511 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `tautan` | text | 34% |
| `nama_file` | text | 0% |
| `jenis_file` | text | 0% |
| `keterangan` | text | 84% |
| `jenis_dokumen` | text | 0% |
| `tanggal_upload` | timestamp | 0% |

## replica.penunjang_lain_list

Sumber: `GET /penunjang_lain`; 399 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `peran` | text | 0% |
| `instansi` | text | 0% |
| `sk_penugasan` | text | 0% |
| `tanggal_mulai` | date | 0% |
| `tanggal_selesai` | date | 43% |
| `id_kategori_kegiatan` | bigint | 0% |

## replica.publikasi

Sumber: `GET /publikasi/{id}`; 272 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `doi` | text | 64% |
| `isbn` | text | 77% |
| `issn` | text | 68% |
| `edisi` | text | 100% |
| `judul` | text | 0% |
| `nomor` | bigint | 0% |
| `e_issn` | text | 100% |
| `tautan` | text | 60% |
| `volume` | bigint | 0% |
| `dokumen` | jsonb | 0% |
| `halaman` | text | 62% |
| `penulis` | jsonb | 0% |
| `seminar` | bigint | 0% |
| `tanggal` | date | 9% |
| `penerbit` | text | 44% |
| `quartile` | bigint | 0% |
| `asal_data` | text | 0% |
| `prosiding` | bigint | 0% |
| `judul_asli` | text | 99% |
| `keterangan` | text | 97% |
| `id_litabmas` | uuid | 97% |
| `nama_jurnal` | text | 26% |
| `nomor_paten` | text | 100% |
| `judul_artikel` | text | 96% |
| `pemberi_paten` | text | 100% |
| `judul_litabmas` | text | 97% |
| `jumlah_halaman` | bigint | 0% |
| `bidang_keilmuan` | jsonb | 0% |
| `jenis_publikasi` | text | 0% |
| `kategori_kegiatan` | text | 0% |
| `id_jenis_publikasi` | bigint | 0% |
| `id_kategori_kegiatan` | bigint | 0% |
| `kategori_capaian_luaran` | text | 40% |
| `id_kategori_capaian_luaran` | bigint | 0% |

## replica.publikasi_bidang_ilmu

Sumber: `GET /publikasi/{id}/bidang_ilmu`; 3 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `urutan` | numeric | 0% |
| `kelompok_bidang` | text | 0% |
| `id_kelompok_bidang` | uuid | 0% |

## replica.publikasi_dokumen

Sumber: `GET /publikasi/{id}`, elemen `dokumen[]`; 479 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 1% |
| `tautan` | text | 34% |
| `nama_file` | text | 0% |
| `jenis_file` | text | 0% |
| `keterangan` | text | 82% |
| `jenis_dokumen` | text | 0% |
| `tanggal_upload` | timestamp | 0% |

## replica.publikasi_list

Sumber: `GET /publikasi`; 300 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `judul` | text | 0% |
| `tanggal` | date | 8% |
| `quartile` | numeric | 95% |
| `asal_data` | text | 0% |
| `a_klaim_bkd` | numeric | 0% |
| `wkt_klaim_bkd` | timestamp | 62% |
| `bidang_keilmuan` | jsonb | 0% |
| `jenis_publikasi` | text | 0% |
| `kategori_kegiatan` | text | 0% |
| `id_kategori_kegiatan` | bigint | 0% |

## replica.publikasi_penulis

Sumber: `GET /publikasi/{id}`, elemen `penulis[]`; 865 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `nama` | text | 0% |
| `jenis` | text | 0% |
| `peran` | text | 0% |
| `id_sdm` | uuid | 5% |
| `urutan` | bigint | 0% |
| `afiliasi` | text | 21% |
| `id_orang` | uuid | 99% |
| `id_penulis` | uuid | 0% |
| `id_peserta_didik` | uuid | 97% |
| `corresponding_author` | bigint | 0% |
| `nomor_induk_peserta_didik` | text | 97% |

## replica.referensi_agama

Sumber: `GET /referensi/agama`; 9 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | bigint | 0% |
| `nama` | text | 0% |

## replica.referensi_bidang_studi

Sumber: `GET /referensi/bidang_studi`; 596 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | bigint | 0% |
| `nama` | text | 0% |

## replica.referensi_bidang_usaha

Sumber: `GET /referensi/bidang_usaha`; 21 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | bigint | 0% |
| `nama` | text | 0% |

## replica.referensi_detail_unit_kerja

Sumber: `GET /referensi/detail_unit_kerja`; 13 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `id_pt` | uuid | 0% |
| `jurusan` | jsonb | 0% |
| `kode_pt` | text | 0% |
| `nama_pt` | text | 0% |
| `wilayah` | jsonb | 0% |
| `kode_unit` | text | 0% |
| `sks_lulus` | bigint | 0% |
| `id_jenjang` | text | 0% |
| `status_unit` | text | 0% |
| `gelar_lulusan` | text | 100% |
| `id_induk_unit` | text | 100% |
| `id_jenis_unit` | bigint | 0% |
| `tanggal_tutup` | text | 100% |
| `semester_mulai` | numeric | 0% |
| `tanggal_berdiri` | date | 0% |
| `sk_penyelenggara` | text | 0% |
| `waktu_data_update` | timestamp | 0% |
| `id_lembaga_penerbit` | text | 100% |
| `tanggal_sk_penyelenggara` | date | 0% |
| `terhitung_mulai_tanggal_penyelenggara` | date | 0% |
| `terhitung_sampai_tanggal_penyelenggara` | text | 100% |

## replica.referensi_detail_unit_kerja_jurusan

Sumber: `GET /referensi/detail_unit_kerja`, elemen `jurusan[]`; 13 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | text | 0% |
| `nama` | text | 0% |
| `id_induk_jurusan` | text | 100% |
| `kode_nomenklatur` | text | 100% |
| `id_kelompok_bidang` | uuid | 0% |
| `id_jenjang_pendidikan` | text | 0% |

## replica.referensi_detail_unit_kerja_wilayah

Sumber: `GET /referensi/detail_unit_kerja`, elemen `wilayah[]`; 13 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | text | 0% |
| `nama` | text | 0% |
| `id_induk_wilayah` | text | 0% |

## replica.referensi_dudi

Sumber: `GET /referensi/dudi`; 43339 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |

## replica.referensi_gelar_akademik

Sumber: `GET /referensi/gelar_akademik`; 4898 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | bigint | 0% |
| `nama` | text | 0% |
| `singkatan` | text | 64% |

## replica.referensi_golongan_pangkat

Sumber: `GET /referensi/golongan_pangkat`; 0 baris sampel.

Belum ada sampel; hanya kolom meta dan `r_payload`. Generate ulang setelah data tersedia.

## replica.referensi_ikatan_kerja

Sumber: `GET /referensi/ikatan_kerja`; 9 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | text | 0% |
| `nama` | text | 0% |

## replica.referensi_jabatan_fungsional

Sumber: `GET /referensi/jabatan_fungsional`; 10 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | bigint | 0% |
| `nama` | text | 0% |

## replica.referensi_jabatan_negara

Sumber: `GET /referensi/jabatan_negara`; 13 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | text | 0% |
| `nama` | text | 0% |

## replica.referensi_jabatan_tugas_tambahan

Sumber: `GET /referensi/jabatan_tugas_tambahan`; 0 baris sampel.

Belum ada sampel; hanya kolom meta dan `r_payload`. Generate ulang setelah data tersedia.

## replica.referensi_jenis_bahan_ajar

Sumber: `GET /referensi/jenis_bahan_ajar`; 0 baris sampel.

Belum ada sampel; hanya kolom meta dan `r_payload`. Generate ulang setelah data tersedia.

## replica.referensi_jenis_beasiswa

Sumber: `GET /referensi/jenis_beasiswa`; 0 baris sampel.

Belum ada sampel; hanya kolom meta dan `r_payload`. Generate ulang setelah data tersedia.

## replica.referensi_jenis_diklat

Sumber: `GET /referensi/jenis_diklat`; 0 baris sampel.

Belum ada sampel; hanya kolom meta dan `r_payload`. Generate ulang setelah data tersedia.

## replica.referensi_jenis_dokumen

Sumber: `GET /referensi/jenis_dokumen`; 77 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | bigint | 0% |
| `nama` | text | 0% |

## replica.referensi_jenis_keluar

Sumber: `GET /referensi/jenis_keluar`; 16 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | text | 0% |
| `nama` | text | 0% |

## replica.referensi_jenis_kepanitiaan

Sumber: `GET /referensi/jenis_kepanitiaan`; 7 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | bigint | 0% |
| `nama` | text | 0% |

## replica.referensi_jenis_kesejahteraan

Sumber: `GET /referensi/jenis_kesejahteraan`; 0 baris sampel.

Belum ada sampel; hanya kolom meta dan `r_payload`. Generate ulang setelah data tersedia.

## replica.referensi_jenis_pekerjaan

Sumber: `GET /referensi/jenis_pekerjaan`; 19 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | bigint | 0% |
| `nama` | text | 0% |

## replica.referensi_jenis_penghargaan

Sumber: `GET /referensi/jenis_penghargaan`; 1 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | bigint | 0% |
| `nama` | text | 0% |

## replica.referensi_jenis_publikasi

Sumber: `GET /referensi/jenis_publikasi`; 32 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | bigint | 0% |
| `nama` | text | 0% |

## replica.referensi_jenis_tes

Sumber: `GET /referensi/jenis_tes`; 0 baris sampel.

Belum ada sampel; hanya kolom meta dan `r_payload`. Generate ulang setelah data tersedia.

## replica.referensi_jenis_tunjangan

Sumber: `GET /referensi/jenis_tunjangan`; 15 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | bigint | 0% |
| `nama` | text | 0% |

## replica.referensi_jenjang_pendidikan

Sumber: `GET /referensi/jenjang_pendidikan`; 13 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | text | 0% |
| `nama` | text | 0% |

## replica.referensi_kategori_capaian_luaran

Sumber: `GET /referensi/kategori_capaian_luaran`; 7 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | bigint | 0% |
| `nama` | text | 0% |

## replica.referensi_kategori_kegiatan

Sumber: `GET /referensi/kategori_kegiatan`; 308 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | bigint | 0% |
| `nama` | text | 0% |
| `parent_id` | bigint | 2% |

## replica.referensi_kelompok_bidang

Sumber: `GET /referensi/kelompok_bidang`; 2537 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |

## replica.referensi_lembaga_sertifikasi

Sumber: `GET /referensi/lembaga_sertifikasi`; 0 baris sampel.

Belum ada sampel; hanya kolom meta dan `r_payload`. Generate ulang setelah data tersedia.

## replica.referensi_media_publikasi

Sumber: `GET /referensi/media_publikasi`; 0 baris sampel.

Belum ada sampel; hanya kolom meta dan `r_payload`. Generate ulang setelah data tersedia.

## replica.referensi_negara

Sumber: `GET /referensi/negara`; 251 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | text | 0% |
| `nama` | text | 0% |

## replica.referensi_perguruan_tinggi

Sumber: `GET /referensi/perguruan_tinggi`; 0 baris sampel.

Belum ada sampel; hanya kolom meta dan `r_payload`. Generate ulang setelah data tersedia.

## replica.referensi_profil_pt

Sumber: `GET /referensi/profil_pt`; 1 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `rt` | bigint | 0% |
| `rw` | bigint | 0% |
| `bujur` | numeric | 0% |
| `dusun` | text | 100% |
| `email` | text | 0% |
| `jalan` | text | 100% |
| `lintang` | numeric | 0% |
| `telepon` | text | 0% |
| `website` | text | 0% |
| `faximile` | text | 100% |
| `kode_pos` | text | 100% |
| `kelurahan` | text | 0% |
| `id_wilayah` | text | 0% |
| `nama_wilayah` | text | 0% |
| `sk_pendirian` | text | 0% |
| `id_status_milik` | text | 0% |
| `nama_status_milik` | text | 0% |
| `id_perguruan_tinggi` | uuid | 0% |
| `sk_izin_operasional` | text | 100% |
| `tanggal_sk_pendirian` | date | 0% |
| `kode_perguruan_tinggi` | text | 0% |
| `nama_perguruan_tinggi` | text | 0% |
| `status_perguruan_tinggi` | text | 0% |
| `tanggal_izin_operasional` | text | 100% |

## replica.referensi_sdm

Sumber: `GET /referensi/sdm`; 97 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `nip` | text | 94% |
| `nidn` | text | 11% |
| `nuptk` | text | 5% |
| `id_sdm` | uuid | 0% |
| `nama_sdm` | text | 0% |
| `jenis_sdm` | text | 0% |
| `nama_status_aktif` | text | 0% |
| `waktu_data_update` | timestamp | 0% |
| `nama_status_pegawai` | text | 0% |

## replica.referensi_semester

Sumber: `GET /referensi/semester`; 0 baris sampel.

Belum ada sampel; hanya kolom meta dan `r_payload`. Generate ulang setelah data tersedia.

## replica.referensi_skim_kegiatan

Sumber: `GET /referensi/skim_kegiatan`; 0 baris sampel.

Belum ada sampel; hanya kolom meta dan `r_payload`. Generate ulang setelah data tersedia.

## replica.referensi_status_kepegawaian

Sumber: `GET /referensi/status_kepegawaian`; 6 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | bigint | 0% |
| `nama` | text | 0% |

## replica.referensi_sumber_gaji

Sumber: `GET /referensi/sumber_gaji`; 7 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | bigint | 0% |
| `nama` | text | 0% |

## replica.referensi_tingkat_penghargaan

Sumber: `GET /referensi/tingkat_penghargaan`; 7 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | bigint | 0% |
| `nama` | text | 0% |

## replica.referensi_unit_kerja

Sumber: `GET /referensi/unit_kerja`; 13 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `id_jenis_unit` | bigint | 0% |

## replica.referensi_wilayah

Sumber: `GET /referensi/wilayah`; 7819 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | text | 0% |
| `nama` | text | 0% |
| `id_induk_wilayah` | text | 0% |

## replica.riwayat_pekerjaan

Sumber: `GET /riwayat_pekerjaan/{id}`; 3 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `divisi` | text | 33% |
| `id_sdm` | uuid | 0% |
| `dokumen` | jsonb | 0% |
| `instansi` | text | 0% |
| `luar_negeri` | boolean | 0% |
| `bidang_usaha` | text | 0% |
| `nama_jabatan` | text | 0% |
| `mulai_bekerja` | date | 0% |
| `deskripsi_kerja` | text | 100% |
| `id_bidang_usaha` | bigint | 0% |
| `jenis_pekerjaan` | text | 0% |
| `selesai_bekerja` | date | 33% |
| `id_jenis_pekerjaan` | bigint | 0% |

## replica.riwayat_pekerjaan_dokumen

Sumber: `GET /riwayat_pekerjaan/{id}`, elemen `dokumen[]`; 3 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `tautan` | text | 100% |
| `nama_file` | text | 0% |
| `jenis_file` | text | 0% |
| `keterangan` | text | 100% |
| `jenis_dokumen` | text | 0% |
| `tanggal_upload` | timestamp | 0% |

## replica.riwayat_pekerjaan_list

Sumber: `GET /riwayat_pekerjaan`; 3 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `divisi` | text | 33% |
| `instansi` | text | 0% |
| `luar_negeri` | boolean | 0% |
| `bidang_usaha` | text | 0% |
| `nama_jabatan` | text | 0% |
| `mulai_bekerja` | date | 0% |
| `jenis_pekerjaan` | text | 0% |
| `selesai_bekerja` | date | 33% |

## replica.sertifikasi_dosen

Sumber: `GET /sertifikasi_dosen/{id}`; 4 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `id_sdm` | uuid | 0% |
| `dokumen` | jsonb | 0% |
| `tmt_sert` | text | 100% |
| `tst_sert` | text | 100% |
| `bidang_studi` | text | 0% |
| `id_lemb_sert` | text | 100% |
| `nm_lemb_sert` | text | 100% |
| `nomor_peserta` | text | 0% |
| `id_sumber_data` | text | 100% |
| `nm_sumber_data` | text | 100% |
| `sk_sertifikasi` | text | 0% |
| `id_bidang_studi` | bigint | 0% |
| `nomor_registrasi` | text | 0% |
| `jenis_sertifikasi` | text | 0% |
| `tahun_sertifikasi` | bigint | 0% |

## replica.sertifikasi_dosen_ajuan

Sumber: `GET /sertifikasi_dosen/ajuan/{id}`; 2 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `id_sdm` | uuid | 0% |
| `dokumen` | jsonb | 0% |
| `jenis_ajuan` | text | 0% |
| `id_data_master` | uuid | 50% |
| `detail_perubahan` | jsonb | 0% |
| `detail_perubahan_bidang_studi_baru` | text | 50% |
| `detail_perubahan_bidang_studi_lama` | text | 50% |
| `detail_perubahan_sk_sertifikasi_baru` | text | 50% |
| `detail_perubahan_sk_sertifikasi_lama` | boolean | 50% |
| `detail_perubahan_tahun_sertifikasi_baru` | numeric | 50% |
| `detail_perubahan_tahun_sertifikasi_lama` | text | 100% |

## replica.sertifikasi_dosen_ajuan_dokumen

Sumber: `GET /sertifikasi_dosen/ajuan/{id}`, elemen `dokumen[]`; 2 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 50% |
| `tautan` | text | 100% |
| `nama_file` | text | 0% |
| `jenis_file` | text | 0% |
| `keterangan` | text | 50% |
| `jenis_dokumen` | text | 0% |
| `tanggal_upload` | timestamp | 0% |

## replica.sertifikasi_dosen_ajuan_list

Sumber: `GET /sertifikasi_dosen/ajuan`; 2 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `umur` | bigint | 0% |
| `id_sdm` | uuid | 0% |
| `status` | text | 0% |
| `keterangan` | text | 0% |
| `jenis_ajuan` | text | 0% |
| `tanggal_ajuan` | timestamp | 0% |
| `id_data_master` | uuid | 50% |
| `tanggal_verifikasi` | timestamp | 0% |

## replica.sertifikasi_dosen_dokumen

Sumber: `GET /sertifikasi_dosen/{id}`, elemen `dokumen[]`; 2 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 50% |
| `tautan` | text | 100% |
| `nama_file` | text | 0% |
| `jenis_file` | text | 0% |
| `keterangan` | text | 50% |
| `jenis_dokumen` | text | 0% |
| `tanggal_upload` | timestamp | 0% |

## replica.sertifikasi_dosen_list

Sumber: `GET /sertifikasi_dosen`; 4 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `tmt_sert` | text | 100% |
| `tst_sert` | text | 100% |
| `bidang_studi` | text | 0% |
| `id_lemb_sert` | text | 100% |
| `nm_lemb_sert` | text | 100% |
| `sk_sertifikasi` | text | 0% |
| `nomor_registrasi` | text | 0% |
| `jenis_sertifikasi` | text | 0% |
| `tahun_sertifikasi` | bigint | 0% |

## replica.sertifikasi_profesi

Sumber: `GET /sertifikasi_profesi/{id}`; 5 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `id_sdm` | uuid | 0% |
| `dokumen` | jsonb | 0% |
| `bidang_studi` | text | 0% |
| `id_sumber_data` | text | 60% |
| `nm_sumber_data` | text | 60% |
| `sk_sertifikasi` | text | 0% |
| `id_bidang_studi` | bigint | 0% |
| `nomor_registrasi` | text | 60% |
| `jenis_sertifikasi` | text | 0% |
| `tahun_sertifikasi` | bigint | 0% |
| `id_jenis_sertifikasi` | bigint | 0% |
| `id_lembaga_sertifikasi` | text | 80% |
| `terhitung_mulai_tanggal` | date | 60% |
| `nama_lembaga_sertifikasi` | text | 80% |
| `terhitung_sampai_tanggal` | date | 60% |

## replica.sertifikasi_profesi_dokumen

Sumber: `GET /sertifikasi_profesi/{id}`, elemen `dokumen[]`; 2 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `tautan` | text | 100% |
| `nama_file` | text | 0% |
| `jenis_file` | text | 0% |
| `keterangan` | text | 100% |
| `jenis_dokumen` | text | 0% |
| `tanggal_upload` | timestamp | 0% |

## replica.sertifikasi_profesi_list

Sumber: `GET /sertifikasi_profesi`; 5 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `bidang_studi` | text | 0% |
| `sk_sertifikasi` | text | 0% |
| `nomor_registrasi` | text | 60% |
| `jenis_sertifikasi` | text | 0% |
| `tahun_sertifikasi` | bigint | 0% |
| `id_lembaga_sertifikasi` | text | 80% |
| `terhitung_mulai_tanggal` | date | 60% |
| `nama_lembaga_sertifikasi` | text | 80% |
| `terhitung_sampai_tanggal` | date | 60% |

## replica.tugas_tambahan

Sumber: `GET /tugas_tambahan/{id}`; 14 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `id_sdm` | uuid | 0% |
| `dokumen` | jsonb | 0% |
| `jumlah_jam` | bigint | 0% |
| `unit_kerja` | text | 21% |
| `jenis_tugas` | text | 0% |
| `sk_penugasan` | text | 0% |
| `id_unit_kerja` | uuid | 21% |
| `id_jenis_tugas` | bigint | 0% |
| `perguruan_tinggi` | text | 0% |
| `kategori_kegiatan` | text | 0% |
| `id_perguruan_tinggi` | uuid | 0% |
| `tanggal_mulai_tugas` | date | 0% |
| `id_kategori_kegiatan` | bigint | 0% |
| `tanggal_selesai_tugas` | date | 7% |

## replica.tugas_tambahan_dokumen

Sumber: `GET /tugas_tambahan/{id}`, elemen `dokumen[]`; 17 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `nama` | text | 0% |
| `tautan` | text | 47% |
| `nama_file` | text | 0% |
| `jenis_file` | text | 0% |
| `keterangan` | text | 65% |
| `jenis_dokumen` | text | 0% |
| `tanggal_upload` | timestamp | 0% |

## replica.tugas_tambahan_list

Sumber: `GET /tugas_tambahan`; 14 baris sampel.

| Kolom | Tipe | Null/kosong |
|---|---|---:|
| `id` | uuid | 0% |
| `unit_kerja` | text | 21% |
| `jenis_tugas` | text | 0% |
| `perguruan_tinggi` | text | 0% |
| `tanggal_mulai_tugas` | date | 0% |
| `id_kategori_kegiatan` | bigint | 0% |
| `tanggal_selesai_tugas` | date | 7% |

## replica.tunjangan

Sumber: `GET /tunjangan/{id}`; 0 baris sampel.

Belum ada sampel; hanya kolom meta dan `r_payload`. Generate ulang setelah data tersedia.

## replica.tunjangan_list

Sumber: `GET /tunjangan`; 0 baris sampel.

Belum ada sampel; hanya kolom meta dan `r_payload`. Generate ulang setelah data tersedia.

## replica.visiting_scientist

Sumber: `GET /visiting_scientist/{id}`; 0 baris sampel.

Belum ada sampel; hanya kolom meta dan `r_payload`. Generate ulang setelah data tersedia.

## replica.visiting_scientist_list

Sumber: `GET /visiting_scientist`; 0 baris sampel.

Belum ada sampel; hanya kolom meta dan `r_payload`. Generate ulang setelah data tersedia.
