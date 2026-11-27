import { prisma } from '../config/db.js';
import { AnalyticsOverviewQuery } from '../validators/analytics.validator.js';

export interface AnalyticsOverviewResult {
  summary: {
    totalCreated: number;
    totalCompleted: number;
    totalValue: number;
    completionRate: number;
  };
  timeSeries: Array<{
    period: string;
    created: number;
    completed: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  categoryDistribution: Array<{
    categoryId: string;
    categoryName: string;
    categorySlug: string;
    iconName: string;
    count: number;
    totalValue: number;
  }>;
  turnaroundMetrics: {
    avgTurnaroundHours: number;
    medianTurnaroundHours: number;
    minTurnaroundHours: number;
    maxTurnaroundHours: number;
  };
  signerMetrics: {
    avgSignerResponseHours: number;
  };
}

export class AnalyticsService {
  /**
   * Generates comprehensive analytics metrics using native PostgreSQL aggregations.
   * Uses generate_series to zero-fill time series intervals.
   */
  public async getOverview(
    organizationId: string,
    query: AnalyticsOverviewQuery
  ): Promise<AnalyticsOverviewResult> {
    const toDate = query.to ? new Date(query.to) : new Date();
    const fromDate = query.from
      ? new Date(query.from)
      : new Date(toDate.getTime() - 365 * 24 * 60 * 60 * 1000); // 12 months default

    const granularity = query.granularity || 'month';
    const stepInterval =
      granularity === 'day' ? '1 day' : granularity === 'week' ? '1 week' : '1 month';

    // 1. Zero-filled Time Series using generate_series
    const timeSeriesRows: any[] = await prisma.$queryRaw`
      WITH date_series AS (
        SELECT generate_series(
          date_trunc(${granularity}, ${fromDate}::timestamptz),
          date_trunc(${granularity}, ${toDate}::timestamptz),
          ${stepInterval}::interval
        ) AS bucket
      ),
      created_counts AS (
        SELECT
          date_trunc(${granularity}, created_at) AS bucket,
          COUNT(*) AS count
        FROM agreements
        WHERE organization_id = ${organizationId}::uuid
          AND is_archived = false
          AND created_at >= ${fromDate}::timestamptz
          AND created_at <= ${toDate}::timestamptz
        GROUP BY 1
      ),
      completed_counts AS (
        SELECT
          date_trunc(${granularity}, completed_at) AS bucket,
          COUNT(*) AS count
        FROM agreements
        WHERE organization_id = ${organizationId}::uuid
          AND is_archived = false
          AND status = 'COMPLETED'
          AND completed_at >= ${fromDate}::timestamptz
          AND completed_at <= ${toDate}::timestamptz
        GROUP BY 1
      )
      SELECT
        to_char(ds.bucket, 'YYYY-MM-DD') AS period,
        COALESCE(cc.count, 0)::int AS created,
        COALESCE(comp.count, 0)::int AS completed
      FROM date_series ds
      LEFT JOIN created_counts cc ON ds.bucket = cc.bucket
      LEFT JOIN completed_counts comp ON ds.bucket = comp.bucket
      ORDER BY ds.bucket ASC;
    `;

    // 2. Status Distribution
    const statusRows: any[] = await prisma.$queryRaw`
      SELECT
        status,
        COUNT(*)::int AS count,
        ROUND((COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0)), 1)::float AS percentage
      FROM agreements
      WHERE organization_id = ${organizationId}::uuid
        AND is_archived = false
        AND created_at >= ${fromDate}::timestamptz
        AND created_at <= ${toDate}::timestamptz
      GROUP BY status
      ORDER BY count DESC;
    `;

    // 3. Category Distribution with Financial Totals
    const categoryRows: any[] = await prisma.$queryRaw`
      SELECT
        c.id AS "categoryId",
        c.name AS "categoryName",
        c.slug AS "categorySlug",
        c.icon_name AS "iconName",
        COUNT(a.id)::int AS count,
        COALESCE(SUM(pt.total_amount), 0)::float AS "totalValue"
      FROM agreements a
      JOIN agreement_categories c ON a.category_id = c.id
      LEFT JOIN agreement_payment_terms pt ON a.id = pt.agreement_id
      WHERE a.organization_id = ${organizationId}::uuid
        AND a.is_archived = false
        AND a.created_at >= ${fromDate}::timestamptz
        AND a.created_at <= ${toDate}::timestamptz
      GROUP BY c.id, c.name, c.slug, c.icon_name
      ORDER BY count DESC;
    `;

    // 4. Turnaround Time Metrics (Average, Median, Min, Max in hours)
    const turnaroundRows: any[] = await prisma.$queryRaw`
      SELECT
        ROUND(COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600.0), 0)::numeric, 1)::float AS "avgTurnaroundHours",
        ROUND(COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600.0)), 0)::numeric, 1)::float AS "medianTurnaroundHours",
        ROUND(COALESCE(MIN(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600.0), 0)::numeric, 1)::float AS "minTurnaroundHours",
        ROUND(COALESCE(MAX(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600.0), 0)::numeric, 1)::float AS "maxTurnaroundHours"
      FROM agreements
      WHERE organization_id = ${organizationId}::uuid
        AND is_archived = false
        AND status = 'COMPLETED'
        AND completed_at IS NOT NULL
        AND created_at >= ${fromDate}::timestamptz
        AND created_at <= ${toDate}::timestamptz;
    `;

    // 5. Signer Response Time Metrics (hours to sign from agreement creation)
    const signerRows: any[] = await prisma.$queryRaw`
      SELECT
        ROUND(COALESCE(AVG(EXTRACT(EPOCH FROM (p.signed_at - a.created_at)) / 3600.0), 0)::numeric, 1)::float AS "avgSignerResponseHours"
      FROM agreement_parties p
      JOIN agreements a ON p.agreement_id = a.id
      WHERE a.organization_id = ${organizationId}::uuid
        AND p.status = 'SIGNED'
        AND p.signed_at IS NOT NULL
        AND a.created_at >= ${fromDate}::timestamptz
        AND a.created_at <= ${toDate}::timestamptz;
    `;

    // 6. Summary Totals
    const summaryRows: any[] = await prisma.$queryRaw`
      SELECT
        COUNT(*)::int AS "totalCreated",
        COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS "totalCompleted",
        COALESCE(SUM(pt.total_amount), 0)::float AS "totalValue"
      FROM agreements a
      LEFT JOIN agreement_payment_terms pt ON a.id = pt.agreement_id
      WHERE a.organization_id = ${organizationId}::uuid
        AND a.is_archived = false
        AND a.created_at >= ${fromDate}::timestamptz
        AND a.created_at <= ${toDate}::timestamptz;
    `;

    const summary = summaryRows[0] || { totalCreated: 0, totalCompleted: 0, totalValue: 0 };
    const completionRate =
      summary.totalCreated > 0
        ? Number(((summary.totalCompleted / summary.totalCreated) * 100).toFixed(1))
        : 0;

    const turnaround = turnaroundRows[0] || {
      avgTurnaroundHours: 0,
      medianTurnaroundHours: 0,
      minTurnaroundHours: 0,
      maxTurnaroundHours: 0,
    };

    const signer = signerRows[0] || { avgSignerResponseHours: 0 };

    return {
      summary: {
        totalCreated: summary.totalCreated,
        totalCompleted: summary.totalCompleted,
        totalValue: summary.totalValue,
        completionRate,
      },
      timeSeries: timeSeriesRows,
      statusDistribution: statusRows,
      categoryDistribution: categoryRows,
      turnaroundMetrics: turnaround,
      signerMetrics: signer,
    };
  }

  /**
   * Generates a CSV export of agreements with strict formula injection escaping.
   * Any cell value starting with '=', '+', '-', '@', '\t', or '\r' is prepended with a single quote.
   */
  public async exportCsv(organizationId: string, from?: string, to?: string): Promise<string> {
    const where: any = { organizationId, isArchived: false };

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const agreements = await prisma.agreement.findMany({
      where,
      include: {
        category: true,
        paymentTerms: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const escapeCsvValue = (val: any): string => {
      if (val === null || val === undefined) return '""';
      let str = String(val);
      // Neutralize CSV/formula injection
      if (/^[=+\-@\t\r]/.test(str)) {
        str = "'" + str;
      }
      return '"' + str.replace(/"/g, '""') + '"';
    };

    const headers = [
      'Reference Number',
      'Title',
      'Category',
      'Status',
      'Total Value (USD)',
      'Total Signers',
      'Completed Signers',
      'Turnaround Hours',
      'Created Date',
      'Completed Date',
      'Expiration Date',
    ];

    const rows = agreements.map((a) => {
      let turnaroundHours: string = 'N/A';
      if (a.completedAt && a.createdAt) {
        const diffHrs = (a.completedAt.getTime() - a.createdAt.getTime()) / (1000 * 60 * 60);
        turnaroundHours = diffHrs.toFixed(1);
      }

      return [
        escapeCsvValue(a.referenceNumber),
        escapeCsvValue(a.title),
        escapeCsvValue(a.category.name),
        escapeCsvValue(a.status),
        escapeCsvValue(a.paymentTerms?.totalAmount ? Number(a.paymentTerms.totalAmount) : 0),
        escapeCsvValue(a.totalSignersCount),
        escapeCsvValue(a.completedSignersCount),
        escapeCsvValue(turnaroundHours),
        escapeCsvValue(a.createdAt.toISOString()),
        escapeCsvValue(a.completedAt ? a.completedAt.toISOString() : ''),
        escapeCsvValue(a.expirationDate ? a.expirationDate.toISOString().split('T')[0] : ''),
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\r\n');
  }
}

export const analyticsService = new AnalyticsService();
