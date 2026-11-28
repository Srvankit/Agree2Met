import { prisma } from '../config/db.js';

async function runExplain() {
  const org = await prisma.organization.findFirst({ where: { slug: 'acme-corp' } });
  if (!org) {
    console.error('Acme org not found');
    process.exit(1);
  }
  const orgId = org.id;

  console.log('=== 1. EXPLAIN ANALYZE: Dashboard Stats Aggregation ===');
  const q1: any[] = await prisma.$queryRawUnsafe(`
    EXPLAIN ANALYZE
    WITH current_month AS (
      SELECT
        COUNT(*) FILTER (WHERE is_archived = false) AS total,
        COUNT(*) FILTER (WHERE is_archived = false AND status = 'COMPLETED') AS completed,
        COUNT(*) FILTER (WHERE is_archived = false AND status IN ('SENT', 'AWAITING_SIGNATURES', 'PARTIALLY_SIGNED')) AS running,
        COUNT(*) FILTER (WHERE is_archived = false AND status = 'AWAITING_SIGNATURES') AS pending_signatures,
        COUNT(*) FILTER (WHERE is_archived = false AND status = 'EXPIRED') AS expired,
        ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600.0) FILTER (WHERE is_archived = false AND status = 'COMPLETED' AND completed_at IS NOT NULL), 1) AS avg_turnaround
      FROM agreements
      WHERE organization_id = '${orgId}'::uuid
        AND created_at >= date_trunc('month', CURRENT_TIMESTAMP)
    ),
    prior_month AS (
      SELECT
        COUNT(*) FILTER (WHERE is_archived = false) AS total,
        COUNT(*) FILTER (WHERE is_archived = false AND status = 'COMPLETED') AS completed,
        COUNT(*) FILTER (WHERE is_archived = false AND status IN ('SENT', 'AWAITING_SIGNATURES', 'PARTIALLY_SIGNED')) AS running,
        COUNT(*) FILTER (WHERE is_archived = false AND status = 'AWAITING_SIGNATURES') AS pending_signatures,
        COUNT(*) FILTER (WHERE is_archived = false AND status = 'EXPIRED') AS expired,
        ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600.0) FILTER (WHERE is_archived = false AND status = 'COMPLETED' AND completed_at IS NOT NULL), 1) AS avg_turnaround
      FROM agreements
      WHERE organization_id = '${orgId}'::uuid
        AND created_at >= date_trunc('month', CURRENT_TIMESTAMP - interval '1 month')
        AND created_at < date_trunc('month', CURRENT_TIMESTAMP)
    ),
    all_time AS (
      SELECT
        COUNT(*) FILTER (WHERE is_archived = false) AS total,
        COUNT(*) FILTER (WHERE is_archived = false AND status = 'COMPLETED') AS completed,
        COUNT(*) FILTER (WHERE is_archived = false AND status IN ('SENT', 'AWAITING_SIGNATURES', 'PARTIALLY_SIGNED')) AS running,
        COUNT(*) FILTER (WHERE is_archived = false AND status = 'AWAITING_SIGNATURES') AS pending_signatures,
        COUNT(*) FILTER (WHERE is_archived = false AND status = 'EXPIRED') AS expired,
        ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600.0) FILTER (WHERE is_archived = false AND status = 'COMPLETED' AND completed_at IS NOT NULL), 1) AS avg_turnaround
      FROM agreements
      WHERE organization_id = '${orgId}'::uuid
    )
    SELECT * FROM all_time a, current_month cm, prior_month pm;
  `);
  console.log(q1.map((r) => r['QUERY PLAN']).join('\n'));

  console.log('\n=== 2. EXPLAIN ANALYZE: Upcoming Deadlines Query ===');
  const q2: any[] = await prisma.$queryRawUnsafe(`
    EXPLAIN ANALYZE
    SELECT
      a.id,
      a.reference_number AS "referenceNumber",
      a.title,
      a.status,
      to_char(a.expiration_date, 'YYYY-MM-DD') AS "expirationDate",
      c.name AS "categoryName",
      c.slug AS "categorySlug",
      CEIL(EXTRACT(EPOCH FROM (a.expiration_date::timestamp - CURRENT_DATE::timestamp)) / 86400.0)::int AS "daysRemaining"
    FROM agreements a
    JOIN agreement_categories c ON a.category_id = c.id
    WHERE a.organization_id = '${orgId}'::uuid
      AND a.is_archived = false
      AND a.status NOT IN ('COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED')
      AND a.expiration_date IS NOT NULL
      AND a.expiration_date >= CURRENT_DATE
      AND a.expiration_date <= CURRENT_DATE + (30 || ' days')::interval
    ORDER BY a.expiration_date ASC;
  `);
  console.log(q2.map((r) => r['QUERY PLAN']).join('\n'));

  console.log('\n=== 3. EXPLAIN ANALYZE: Category Financial Totals ===');
  const q3: any[] = await prisma.$queryRawUnsafe(`
    EXPLAIN ANALYZE
    SELECT
      c.id, c.name,
      COUNT(a.id)::int AS count,
      COALESCE(SUM(pt.total_amount), 0)::float AS "totalValue"
    FROM agreements a
    JOIN agreement_categories c ON a.category_id = c.id
    LEFT JOIN agreement_payment_terms pt ON a.id = pt.agreement_id
    WHERE a.organization_id = '${orgId}'::uuid
      AND a.is_archived = false
    GROUP BY c.id, c.name;
  `);
  console.log(q3.map((r) => r['QUERY PLAN']).join('\n'));

  await prisma.$disconnect();
}

runExplain().catch(console.error);
