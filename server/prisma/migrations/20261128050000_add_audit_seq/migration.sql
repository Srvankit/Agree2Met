-- AlterTable
ALTER TABLE "audit_events" ADD COLUMN "seq" INTEGER NOT NULL DEFAULT 1;

-- Populate seq sequentially for existing records per agreement ordered by created_at, id
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY agreement_id ORDER BY created_at ASC, id ASC) as row_seq
  FROM audit_events
)
UPDATE audit_events
SET seq = numbered.row_seq
FROM numbered
WHERE audit_events.id = numbered.id;

-- CreateIndex
CREATE UNIQUE INDEX "uq_audit_agreement_seq" ON "audit_events"("agreement_id", "seq");

-- CreateIndex
CREATE INDEX "idx_audit_events_agreement_seq" ON "audit_events"("agreement_id", "seq");
