-- CreateEnum
CREATE TYPE "sister_sync_status" AS ENUM ('RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED');

-- CreateTable
CREATE TABLE "sister_sync_run" (
    "id" UUID NOT NULL,
    "integration_id" UUID NOT NULL,
    "base_url" VARCHAR(2048) NOT NULL,
    "scope" VARCHAR(64) NOT NULL,
    "status" "sister_sync_status" NOT NULL DEFAULT 'RUNNING',
    "request_count" INTEGER NOT NULL DEFAULT 0,
    "record_count" INTEGER NOT NULL DEFAULT 0,
    "changed_count" INTEGER NOT NULL DEFAULT 0,
    "deleted_count" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "stats_json" JSONB,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "sister_sync_run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sister_replica_record" (
    "integration_id" UUID NOT NULL,
    "endpoint" VARCHAR(255) NOT NULL,
    "scope_key" VARCHAR(512) NOT NULL,
    "item_key" VARCHAR(255) NOT NULL,
    "id_sdm" VARCHAR(64),
    "parent_id" VARCHAR(128),
    "payload_json" JSONB NOT NULL,
    "payload_hash" VARCHAR(64) NOT NULL,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "last_sync_run_id" UUID,

    CONSTRAINT "sister_replica_record_pkey" PRIMARY KEY ("integration_id","endpoint","scope_key","item_key")
);

-- CreateTable
CREATE TABLE "sister_replica_scope" (
    "integration_id" UUID NOT NULL,
    "endpoint" VARCHAR(255) NOT NULL,
    "scope_key" VARCHAR(512) NOT NULL,
    "id_sdm" VARCHAR(64),
    "item_count" INTEGER NOT NULL DEFAULT 0,
    "last_status" INTEGER NOT NULL,
    "last_error_code" VARCHAR(64),
    "last_fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_success_at" TIMESTAMP(3),
    "last_sync_run_id" UUID,

    CONSTRAINT "sister_replica_scope_pkey" PRIMARY KEY ("integration_id","endpoint","scope_key")
);

-- CreateIndex
CREATE INDEX "sister_sync_run_integration_id_started_at_idx" ON "sister_sync_run"("integration_id", "started_at");

-- CreateIndex
CREATE INDEX "sister_replica_record_integration_id_id_sdm_endpoint_idx" ON "sister_replica_record"("integration_id", "id_sdm", "endpoint");

-- CreateIndex
CREATE INDEX "sister_replica_record_integration_id_endpoint_deleted_at_idx" ON "sister_replica_record"("integration_id", "endpoint", "deleted_at");

-- CreateIndex
CREATE INDEX "sister_replica_scope_integration_id_last_status_idx" ON "sister_replica_scope"("integration_id", "last_status");

-- AddForeignKey
ALTER TABLE "sister_sync_run" ADD CONSTRAINT "sister_sync_run_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "sister_integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sister_replica_record" ADD CONSTRAINT "sister_replica_record_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "sister_integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sister_replica_scope" ADD CONSTRAINT "sister_replica_scope_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "sister_integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

