"use client";

import { useState } from "react";

import { PageShell } from "@/component/ui/page_shell";

import { BkdSdmPicker } from "../widget/bkd_sdm_picker";
import { BkdSemesterPicker } from "../widget/bkd_semester_picker";
import { BkdWorkspaceWidget } from "../widget/bkd_workspace_widget";

export function BkdPage() {
  const [sdmId, setSdmId] = useState("");
  const [semesterId, setSemesterId] = useState("");

  return (
    <PageShell
      actions={
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <BkdSdmPicker
            onChange={(nextSdmId) => {
              setSdmId(nextSdmId);
              setSemesterId("");
            }}
            value={sdmId}
          />
          <BkdSemesterPicker onChange={setSemesterId} sdmId={sdmId} value={semesterId} />
        </div>
      }
      activeLabel="BKD"
      breadcrumb={[{ href: "/", label: "Ikhtisar" }, { label: "BKD" }]}
    >
      <BkdWorkspaceWidget semesterId={semesterId} sdmId={sdmId} />
    </PageShell>
  );
}
