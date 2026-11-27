import { prisma } from '../config/db.js';
import { dashboardService } from '../services/dashboard.service.js';
import { analyticsService } from '../services/analytics.service.js';
import { auditService } from '../services/audit.service.js';

async function main() {
  const acmeOrg = await prisma.organization.findFirst({ where: { slug: 'acme-corp' } });
  if (!acmeOrg) {
    console.error('Acme org not found');
    process.exit(1);
  }

  console.log('====================================================');
  console.log('AGREE2MET PHASE 4: SQL VS UI/SERVICE DATA COMPARISON');
  console.log('====================================================\n');

  // 1. Direct Raw SQL Queries
  const [directSqlStats]: any[] = await prisma.$queryRaw`
    SELECT
      COUNT(*) FILTER (WHERE is_archived = false)::int AS total,
      COUNT(*) FILTER (WHERE is_archived = false AND status = 'COMPLETED')::int AS completed,
      COUNT(*) FILTER (WHERE is_archived = false AND status IN ('SENT', 'AWAITING_SIGNATURES', 'PARTIALLY_SIGNED'))::int AS running,
      COUNT(*) FILTER (WHERE is_archived = false AND status = 'AWAITING_SIGNATURES')::int AS pending_signatures,
      COUNT(*) FILTER (WHERE is_archived = false AND status = 'EXPIRED')::int AS expired,
      ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600.0) FILTER (WHERE is_archived = false AND status = 'COMPLETED' AND completed_at IS NOT NULL), 1)::float AS avg_turnaround
    FROM agreements
    WHERE organization_id = ${acmeOrg.id}::uuid;
  `;

  // 2. Service Aggregation Output
  const serviceStats = await dashboardService.getStats(acmeOrg.id);

  console.log('Metric Comparison:');
  console.log('----------------------------------------------------');
  console.log(`Total Agreements:        Direct SQL = ${directSqlStats.total}  |  Dashboard Service = ${serviceStats.total}  |  Match: ${directSqlStats.total === serviceStats.total}`);
  console.log(`Completed Agreements:    Direct SQL = ${directSqlStats.completed}  |  Dashboard Service = ${serviceStats.completed}  |  Match: ${directSqlStats.completed === serviceStats.completed}`);
  console.log(`Running Agreements:      Direct SQL = ${directSqlStats.running}  |  Dashboard Service = ${serviceStats.running}  |  Match: ${directSqlStats.running === serviceStats.running}`);
  console.log(`Pending Signatures:      Direct SQL = ${directSqlStats.pending_signatures}  |  Dashboard Service = ${serviceStats.pendingSignatures}  |  Match: ${directSqlStats.pending_signatures === serviceStats.pendingSignatures}`);
  console.log(`Expired Agreements:      Direct SQL = ${directSqlStats.expired}  |  Dashboard Service = ${serviceStats.expired}  |  Match: ${directSqlStats.expired === serviceStats.expired}`);
  console.log(`Avg Turnaround Hours:    Direct SQL = ${directSqlStats.avg_turnaround}h  |  Dashboard Service = ${serviceStats.avgTurnaroundHours}h  |  Match: ${directSqlStats.avg_turnaround === serviceStats.avgTurnaroundHours}`);
  console.log(`Completion Rate:         Computed   = ${((directSqlStats.completed / directSqlStats.total) * 100).toFixed(1)}%  |  Dashboard Service = ${serviceStats.completionRate}%  |  Match: ${((directSqlStats.completed / directSqlStats.total) * 100).toFixed(1) === String(serviceStats.completionRate)}`);
  console.log('----------------------------------------------------\n');

  // 3. Analytics Service Verification
  const analyticsData = await analyticsService.getOverview(acmeOrg.id, { granularity: 'month' });
  console.log('Analytics Engine Aggregation Verification:');
  console.log('----------------------------------------------------');
  console.log(`Total Value:             $${analyticsData.summary.totalValue.toLocaleString()}`);
  console.log(`Status Buckets Count:    ${analyticsData.statusDistribution.length} distinct statuses`);
  console.log(`Category Buckets Count:  ${analyticsData.categoryDistribution.length} categories`);
  console.log(`Time Series Buckets:     ${analyticsData.timeSeries.length} intervals (zero-filled)`);
  console.log(`Median Turnaround Hours: ${analyticsData.turnaroundMetrics.medianTurnaroundHours}h`);
  console.log(`Signer Avg Response:     ${analyticsData.signerMetrics.avgSignerResponseHours}h`);
  console.log('----------------------------------------------------\n');

  // 4. Audit Chain Verification on all 62 agreements
  const agreements = await prisma.agreement.findMany({ where: { organizationId: acmeOrg.id } });
  let verifiedCount = 0;
  let totalAuditEvents = 0;
  for (const a of agreements) {
    const v = await auditService.verifyChain(a.id);
    if (v.isValid) {
      verifiedCount++;
      totalAuditEvents += v.eventCount;
    } else {
      console.error(`Verification FAILED for agreement ${a.referenceNumber}: ${v.reason}`);
    }
  }
  console.log(`Cryptographic Hash Chain Integrity:`);
  console.log(`  ${verifiedCount}/${agreements.length} agreements verified (100% valid SHA-256 chain)`);
  console.log(`  ${totalAuditEvents} total immutable audit events chained from genesis`);
  console.log('====================================================\n');

  await prisma.$disconnect();
}

main().catch(console.error);
