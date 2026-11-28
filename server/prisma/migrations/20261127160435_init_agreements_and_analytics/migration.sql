-- CreateTable
CREATE TABLE "agreement_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "icon_name" VARCHAR(50) NOT NULL DEFAULT 'FileText',
    "is_system_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agreement_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agreements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reference_number" VARCHAR(100) NOT NULL,
    "organization_id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    "signing_order" VARCHAR(20) NOT NULL DEFAULT 'PARALLEL',
    "current_signer_sequence" INTEGER NOT NULL DEFAULT 1,
    "total_signers_count" INTEGER NOT NULL DEFAULT 0,
    "completed_signers_count" INTEGER NOT NULL DEFAULT 0,
    "effective_date" DATE,
    "expiration_date" DATE,
    "completed_at" TIMESTAMPTZ,
    "cancelled_at" TIMESTAMPTZ,
    "cancellation_reason" TEXT,
    "rejection_reason" TEXT,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agreement_parties" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agreement_id" UUID NOT NULL,
    "party_type" VARCHAR(50) NOT NULL DEFAULT 'COUNTERPARTY',
    "name" VARCHAR(255) NOT NULL,
    "company_name" VARCHAR(255),
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "role" VARCHAR(50) NOT NULL DEFAULT 'SIGNER',
    "signing_sequence" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "signed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agreement_parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agreement_clauses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agreement_id" UUID NOT NULL,
    "section_number" VARCHAR(20) NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "content" TEXT NOT NULL,
    "is_standard_clause" BOOLEAN NOT NULL DEFAULT true,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agreement_clauses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agreement_payment_terms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agreement_id" UUID NOT NULL,
    "total_amount" DECIMAL(14,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "payment_schedule" VARCHAR(50) NOT NULL DEFAULT 'MILESTONE',
    "billing_notes" TEXT,
    "milestones" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agreement_payment_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agreement_id" UUID NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "actor_type" VARCHAR(50) NOT NULL,
    "actor_id" UUID,
    "actor_name" VARCHAR(255) NOT NULL,
    "actor_email" VARCHAR(255) NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "previous_event_hash" VARCHAR(64) NOT NULL,
    "event_hash" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "user_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50),
    "entity_id" UUID,
    "ip_address" VARCHAR(45),
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_categories_slug" ON "agreement_categories"("slug");

-- CreateIndex
CREATE INDEX "idx_categories_org" ON "agreement_categories"("organization_id");

-- CreateIndex
CREATE INDEX "idx_agreements_org_status" ON "agreements"("organization_id", "status");

-- CreateIndex
CREATE INDEX "idx_agreements_org_created_at" ON "agreements"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_agreements_expiration" ON "agreements"("expiration_date");

-- CreateIndex
CREATE INDEX "idx_agreements_category" ON "agreements"("category_id");

-- CreateIndex
CREATE INDEX "idx_agreements_creator" ON "agreements"("creator_id");

-- CreateIndex
CREATE UNIQUE INDEX "agreements_organization_id_reference_number_key" ON "agreements"("organization_id", "reference_number");

-- CreateIndex
CREATE INDEX "idx_agreement_parties_agreement" ON "agreement_parties"("agreement_id");

-- CreateIndex
CREATE INDEX "idx_agreement_parties_email" ON "agreement_parties"("email");

-- CreateIndex
CREATE INDEX "idx_clauses_agreement_order" ON "agreement_clauses"("agreement_id", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "agreement_payment_terms_agreement_id_key" ON "agreement_payment_terms"("agreement_id");

-- CreateIndex
CREATE INDEX "idx_audit_events_agreement" ON "audit_events"("agreement_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_activity_logs_org_date" ON "activity_logs"("organization_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "agreement_categories" ADD CONSTRAINT "agreement_categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "agreement_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_parties" ADD CONSTRAINT "agreement_parties_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "agreements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_clauses" ADD CONSTRAINT "agreement_clauses_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "agreements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_payment_terms" ADD CONSTRAINT "agreement_payment_terms_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "agreements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
