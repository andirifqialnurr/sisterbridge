-- AlterTable
ALTER TABLE "sister_sync_run" ADD COLUMN     "heartbeat_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "sister_sync_run_status_idx" ON "sister_sync_run"("status");

