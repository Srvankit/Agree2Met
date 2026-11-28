-- AlterTable agreements
ALTER TABLE "agreements" ADD COLUMN "row_version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "agreements" ADD COLUMN "deleted_at" TIMESTAMPTZ;
ALTER TABLE "agreements" ADD COLUMN "archived_at" TIMESTAMPTZ;

-- Constraints on agreements
ALTER TABLE "agreements" ADD CONSTRAINT "chk_agreements_expiration_after_effective" CHECK ("expiration_date" IS NULL OR "effective_date" IS NULL OR "expiration_date" > "effective_date");
ALTER TABLE "agreements" ADD CONSTRAINT "chk_agreements_row_version" CHECK ("row_version" >= 1);

-- Index on agreements
CREATE INDEX "idx_agreements_org_deleted_at" ON "agreements"("organization_id", "deleted_at");

-- Constraints on agreement_parties
CREATE UNIQUE INDEX "uq_agreement_party_email" ON "agreement_parties"("agreement_id", "email");
ALTER TABLE "agreement_parties" ADD CONSTRAINT "chk_parties_email_format" CHECK ("email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- CreateTable agreement_versions
CREATE TABLE "agreement_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agreement_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "content_hash" VARCHAR(64) NOT NULL,
    "created_by" UUID NOT NULL,
    "change_summary" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agreement_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_agreement_version" ON "agreement_versions"("agreement_id", "version_number");
CREATE INDEX "idx_agreement_versions_num" ON "agreement_versions"("agreement_id", "version_number");

-- CreateTable agreement_category_clauses
CREATE TABLE "agreement_category_clauses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category_id" UUID NOT NULL,
    "section_number" VARCHAR(20) NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "content" TEXT NOT NULL,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agreement_category_clauses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_cat_clauses_order" ON "agreement_category_clauses"("category_id", "display_order");

-- CreateTable organization_reference_counters
CREATE TABLE "organization_reference_counters" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_reference_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_org_reference_counter" ON "organization_reference_counters"("organization_id", "year");

-- CreateTable idempotency_keys
CREATE TABLE "idempotency_keys" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(255) NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "request_hash" VARCHAR(64) NOT NULL,
    "response_status" INTEGER NOT NULL,
    "response_body" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_org_idempotency_key" ON "idempotency_keys"("organization_id", "key");
CREATE INDEX "idx_idempotency_expires_at" ON "idempotency_keys"("expires_at");

-- AddForeignKey
ALTER TABLE "agreement_versions" ADD CONSTRAINT "agreement_versions_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "agreements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agreement_versions" ADD CONSTRAINT "agreement_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_category_clauses" ADD CONSTRAINT "agreement_category_clauses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "agreement_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_reference_counters" ADD CONSTRAINT "organization_reference_counters_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
