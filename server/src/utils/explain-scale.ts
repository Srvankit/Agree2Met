import { prisma } from '../config/db.js';

async function main() {
  const perfOrg = await prisma.organization.findFirst({ where: { slug: 'perf-corp' } });
  if (!perfOrg) {
    console.error('perf-corp not found. Please run: npm run prisma:seed -- --scale=large');
    process.exit(1);
  }

  const count = await prisma.agreement.count({ where: { organizationId: perfOrg.id } });
  console.log(`========================================================================`);
  console.log(`EXPLAIN (ANALYZE, BUFFERS) BENCHMARK ON 25,000 AGREEMENTS (perf-corp: ${count} rows)`);
  console.log(`========================================================================\n`);

  // 1. Dashboard Stats Query
  console.log('--- 1. Dashboard Stats Aggregation Query ---');
  const statsExplain: any[] = await prisma.$queryRawUnsafe(`
    EXPLAIN (ANALYZE, BUFFERS)
    WITH current_month AS (
      SELECT
        COUNT(*) FILTER (WHERE is_archived = false) AS total,
        COUNT(*) FILTER (WHERE is_archived = false AND status = 'COMPLETED') AS completed,
        COUNT(*) FILTER (WHERE is_archived = false AND status IN ('SENT', 'AWAITING_SIGNATURES', 'PARTIALLY_SIGNED')) AS running,
        COUNT(*) FILTER (WHERE is_archived = false AND status = 'AWAITING_SIGNATURES') AS pending_signatures,
        COUNT(*) FILTER (WHERE is_archived = false AND status = 'EXPIRED') AS expired,
        COUNT(*) FILTER (WHERE is_archived = false AND status = 'REJECTED') AS rejected,
        COUNT(*) FILTER (WHERE is_archived = false AND status = 'CANCELLED') AS cancelled,
        ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600.0) FILTER (WHERE is_archived = false AND status = 'COMPLETED' AND completed_at IS NOT NULL), 1) AS avg_turnaround
      FROM agreements
      WHERE organization_id = '${perfOrg.id}'::uuid
        AND created_at >= date_trunc('month', CURRENT_TIMESTAMP)
    ),
    prior_month AS (
      SELECT
        COUNT(*) FILTER (WHERE is_archived = false) AS total,
        COUNT(*) FILTER (WHERE is_archived = false AND status = 'COMPLETED') AS completed,
        COUNT(*) FILTER (WHERE is_archived = false AND status IN ('SENT', 'AWAITING_SIGNATURES', 'PARTIALLY_SIGNED')) AS running,
        COUNT(*) FILTER (WHERE is_archived = false AND status = 'AWAITING_SIGNATURES') AS pending_signatures,
        COUNT(*) FILTER (WHERE is_archived = false AND status = 'EXPIRED') AS expired,
        COUNT(*) FILTER (WHERE is_archived = false AND status = 'REJECTED') AS rejected,
        COUNT(*) FILTER (WHERE is_archived = false AND status = 'CANCELLED') AS cancelled,
        ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600.0) FILTER (WHERE is_archived = false AND status = 'COMPLETED' AND completed_at IS NOT NULL), 1) AS avg_turnaround
      FROM agreements
      WHERE organization_id = '${perfOrg.id}'::uuid
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
        COUNT(*) FILTER (WHERE is_archived = false AND status = 'REJECTED') AS rejected,
        COUNT(*) FILTER (WHERE is_archived = false AND status = 'CANCELLED') AS cancelled,
        ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600.0) FILTER (WHERE is_archived = false AND status = 'COMPLETED' AND completed_at IS NOT NULL), 1) AS avg_turnaround
      FROM agreements
      WHERE organization_id = '${perfOrg.id}'::uuid
    )
    SELECT
      COALESCE(a.total, 0)::int AS total,
      COALESCE(a.completed, 0)::int AS completed,
      COALESCE(a.running, 0)::int AS running,
      COALESCE(a.pending_signatures, 0)::int AS "pendingSignatures",
      COALESCE(a.expired, 0)::int AS expired,
      COALESCE(a.rejected, 0)::int AS rejected,
      COALESCE(a.cancelled, 0)::int AS cancelled,
      COALESCE(a.avg_turnaround::float, 0) AS "avgTurnaroundHours"
    FROM all_time a, current_month cm, prior_month pm;
  `);
  statsExplain.forEach((line) => console.log(line['QUERY PLAN']));
  console.log('\n');

  // 2. Analytics Overview Time Series Query
  console.log('--- 2. Analytics Time Series Aggregation Query ---');
  const fromDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
  const toDate = new Date().toISOString();
  const analyticsExplain: any[] = await prisma.$queryRawUnsafe(`
    EXPLAIN (ANALYZE, BUFFERS)
    WITH intervals AS (
      SELECT generate_series(
        date_trunc('month', '${fromDate}'::timestamptz),
        date_trunc('month', '${toDate}'::timestamptz),
        interval '1 month'
      ) AS interval_start
    ),
    grouped AS (
      SELECT
        date_trunc('month', a.created_at) AS interval_start,
        COUNT(*)::int AS created_count,
        COUNT(*) FILTER (WHERE a.status = 'COMPLETED')::int AS completed_count,
        COALESCE(SUM(pt.total_amount), 0)::float AS total_value
      FROM agreements a
      LEFT JOIN agreement_payment_terms pt ON a.id = pt.agreement_id
      WHERE a.organization_id = '${perfOrg.id}'::uuid
        AND a.is_archived = false
        AND a.created_at >= '${fromDate}'::timestamptz
        AND a.created_at <= '${toDate}'::timestamptz
      GROUP BY date_trunc('month', a.created_at)
    )
    SELECT
      i.interval_start AS "intervalStart",
      COALESCE(g.created_count, 0)::int AS "createdCount",
      COALESCE(g.completed_count, 0)::int AS "completedCount",
      COALESCE(g.total_value, 0)::float AS "totalValue"
    FROM intervals i
    LEFT JOIN grouped g ON i.interval_start = g.interval_start
    ORDER BY i.interval_start ASC;
  `);
  analyticsExplain.forEach((line) => console.log(line['QUERY PLAN']));
  console.log('\n');

  // 3. Agreements List Query (Search + Filter + Sort + Pagination)
  console.log('--- 3. Agreements List with Search, Filter & Sort Query ---');
  const listExplain: any[] = await prisma.$queryRawUnsafe(`
    EXPLAIN (ANALYZE, BUFFERS)
    SELECT id, reference_number, title, status, created_at
    FROM agreements
    WHERE organization_id = '${perfOrg.id}'::uuid
      AND is_archived = false
      AND status = 'COMPLETED'
      AND title ILIKE '%Agreement%'
    ORDER BY created_at DESC
    LIMIT 20 OFFSET 0;
  `);
  listExplain.forEach((line) => console.log(line['QUERY PLAN']));
  console.log('\n');

  // 4. Upcoming Deadlines Query
  console.log('--- 4. Upcoming Deadlines Windowing Query ---');
  const deadlinesExplain: any[] = await prisma.$queryRawUnsafe(`
    EXPLAIN (ANALYZE, BUFFERS)
    SELECT id, reference_number, title, status, expiration_date
    FROM agreements
    WHERE organization_id = '${perfOrg.id}'::uuid
      AND is_archived = false
      AND status IN ('SENT', 'AWAITING_SIGNATURES', 'PARTIALLY_SIGNED')
      AND expiration_date IS NOT NULL
      AND expiration_date <= CURRENT_DATE + interval '14 days'
    ORDER BY expiration_date ASC
    LIMIT 20;
  `);
  deadlinesExplain.forEach((line) => console.log(line['QUERY PLAN']));
  console.log(`\n========================================================================`);

  await prisma.$disconnect();
}

main().catch(console.error);
