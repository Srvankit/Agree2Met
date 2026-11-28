import { prisma } from '../config/db.js';

export interface DashboardStats {
  total: number;
  completed: number;
  running: number;
  pendingSignatures: number;
  expired: number;
  completionRate: number;
  avgTurnaroundHours: number;
  deltas: {
    total: number;
    completed: number;
    running: number;
    pendingSignatures: number;
    expired: number;
    completionRate: number;
    avgTurnaroundHours: number;
  };
}

export interface DeadlineItem {
  id: string;
  referenceNumber: string;
  title: string;
  status: string;
  expirationDate: string;
  categoryName: string;
  categorySlug: string;
  daysRemaining: number;
}

export class DashboardService {
  /**
   * Computes headline dashboard metrics via database SQL aggregations.
   * Compares current month vs prior month for percentage deltas.
   */
  public async getStats(organizationId: string): Promise<DashboardStats> {
    const rawResults: any[] = await prisma.$queryRaw`
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
        WHERE organization_id = ${organizationId}::uuid
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
        WHERE organization_id = ${organizationId}::uuid
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
        WHERE organization_id = ${organizationId}::uuid
      )
      SELECT
        COALESCE(a.total, 0)::int AS total,
        COALESCE(a.completed, 0)::int AS completed,
        COALESCE(a.running, 0)::int AS running,
        COALESCE(a.pending_signatures, 0)::int AS "pendingSignatures",
        COALESCE(a.expired, 0)::int AS expired,
        COALESCE(a.rejected, 0)::int AS rejected,
        COALESCE(a.cancelled, 0)::int AS cancelled,
        COALESCE(a.avg_turnaround::float, 0) AS "avgTurnaroundHours",
        COALESCE(cm.total, 0)::int AS cm_total,
        COALESCE(cm.completed, 0)::int AS cm_completed,
        COALESCE(cm.running, 0)::int AS cm_running,
        COALESCE(cm.pending_signatures, 0)::int AS cm_pending,
        COALESCE(cm.expired, 0)::int AS cm_expired,
        COALESCE(cm.rejected, 0)::int AS cm_rejected,
        COALESCE(cm.cancelled, 0)::int AS cm_cancelled,
        COALESCE(cm.avg_turnaround::float, 0) AS cm_avg_turnaround,
        COALESCE(pm.total, 0)::int AS pm_total,
        COALESCE(pm.completed, 0)::int AS pm_completed,
        COALESCE(pm.running, 0)::int AS pm_running,
        COALESCE(pm.pending_signatures, 0)::int AS pm_pending,
        COALESCE(pm.expired, 0)::int AS pm_expired,
        COALESCE(pm.rejected, 0)::int AS pm_rejected,
        COALESCE(pm.cancelled, 0)::int AS pm_cancelled,
        COALESCE(pm.avg_turnaround::float, 0) AS pm_avg_turnaround
      FROM all_time a, current_month cm, prior_month pm;
    `;

    const row = rawResults[0] || {
      total: 0,
      completed: 0,
      running: 0,
      pendingSignatures: 0,
      expired: 0,
      rejected: 0,
      cancelled: 0,
      avgTurnaroundHours: 0,
      cm_total: 0,
      cm_completed: 0,
      cm_running: 0,
      cm_pending: 0,
      cm_expired: 0,
      cm_rejected: 0,
      cm_cancelled: 0,
      cm_avg_turnaround: 0,
      pm_total: 0,
      pm_completed: 0,
      pm_running: 0,
      pm_pending: 0,
      pm_expired: 0,
      pm_rejected: 0,
      pm_cancelled: 0,
      pm_avg_turnaround: 0,
    };

    const total = row.total;
    const completed = row.completed;
    const running = row.running;
    const pendingSignatures = row.pendingSignatures;
    const expired = row.expired;
    const avgTurnaroundHours = Number(row.avgTurnaroundHours.toFixed(1));

    // completionRate = completed / (completed + rejected + cancelled + expired)
    // Evaluates to 0 when denominator is 0
    const terminalDenominator = completed + row.rejected + row.cancelled + expired;
    const completionRate = terminalDenominator > 0
      ? Number(((completed / terminalDenominator) * 100).toFixed(1))
      : 0;

    const cmTerminal = row.cm_completed + row.cm_rejected + row.cm_cancelled + row.cm_expired;
    const cmRate = cmTerminal > 0 ? (row.cm_completed / cmTerminal) * 100 : 0;

    const pmTerminal = row.pm_completed + row.pm_rejected + row.pm_cancelled + row.pm_expired;
    const pmRate = pmTerminal > 0 ? (row.pm_completed / pmTerminal) * 100 : 0;

    const calculateDelta = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Number((((curr - prev) / prev) * 100).toFixed(1));
    };

    return {
      total,
      completed,
      running,
      pendingSignatures,
      expired,
      completionRate,
      avgTurnaroundHours,
      deltas: {
        total: calculateDelta(row.cm_total, row.pm_total),
        completed: calculateDelta(row.cm_completed, row.pm_completed),
        running: calculateDelta(row.cm_running, row.pm_running),
        pendingSignatures: calculateDelta(row.cm_pending, row.pm_pending),
        expired: calculateDelta(row.cm_expired, row.pm_expired),
        completionRate: calculateDelta(cmRate, pmRate),
        avgTurnaroundHours: calculateDelta(row.cm_avg_turnaround, row.pm_avg_turnaround),
      },
    };
  }

  /**
   * Retrieves paginated activity feed for the organization.
   */
  public async getActivity(organizationId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [total, activities] = await Promise.all([
      prisma.activityLog.count({
        where: { organizationId },
      }),
      prisma.activityLog.findMany({
        where: { organizationId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const formatted = activities.map((act) => {
      const actorName = act.user?.profile?.displayName || act.user?.email || 'System';
      const metadata = (act.metadata || {}) as Record<string, any>;
      let summary = `${actorName} performed ${act.action.toLowerCase().replace(/_/g, ' ')}`;

      if (act.action === 'AGREEMENT_CREATED' && metadata.title) {
        summary = `${actorName} created "${metadata.title}"`;
      } else if (act.action === 'SIGNATURE_RECORDED' && metadata.party) {
        summary = `${metadata.party} signed agreement`;
      } else if (act.action === 'AGREEMENT_SENT' && metadata.recipient) {
        summary = `${actorName} sent agreement to ${metadata.recipient}`;
      } else if (act.action === 'TEAM_MEMBER_INVITED' && metadata.invitedEmail) {
        summary = `${actorName} invited ${metadata.invitedEmail} (${metadata.role || 'MEMBER'})`;
      } else if (act.action === 'AGREEMENT_COMPLETED' && metadata.referenceNumber) {
        summary = `Agreement ${metadata.referenceNumber} completed successfully`;
      } else if (act.action === 'DEADLINE_REMINDER_SENT' && metadata.recipient) {
        summary = `Automated reminder sent to ${metadata.recipient}`;
      }

      return {
        id: act.id,
        action: act.action,
        summary,
        actor: {
          id: act.userId,
          name: actorName,
          email: act.user?.email,
          avatarUrl: act.user?.profile?.avatarUrl,
        },
        entityType: act.entityType,
        entityId: act.entityId,
        metadata: act.metadata,
        createdAt: act.createdAt,
      };
    });

    return {
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves upcoming agreement deadlines within N days via SQL.
   */
  public async getDeadlines(organizationId: string, days = 30): Promise<DeadlineItem[]> {
    const rows: any[] = await prisma.$queryRaw`
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
      WHERE a.organization_id = ${organizationId}::uuid
        AND a.is_archived = false
        AND a.status NOT IN ('COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED')
        AND a.expiration_date IS NOT NULL
        AND a.expiration_date >= CURRENT_DATE
        AND a.expiration_date <= CURRENT_DATE + (${days} || ' days')::interval
      ORDER BY a.expiration_date ASC
    `;

    return rows;
  }

  /**
   * Retrieves recent agreements for dashboard display.
   */
  public async getRecent(organizationId: string, limit = 5) {
    const agreements = await prisma.agreement.findMany({
      where: {
        organizationId,
        isArchived: false,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            iconName: true,
          },
        },
        parties: {
          select: {
            id: true,
            name: true,
            companyName: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return agreements.map((a) => ({
      id: a.id,
      referenceNumber: a.referenceNumber,
      title: a.title,
      status: a.status,
      category: a.category,
      parties: a.parties,
      totalSignersCount: a.totalSignersCount,
      completedSignersCount: a.completedSignersCount,
      effectiveDate: a.effectiveDate,
      expirationDate: a.expirationDate,
      createdAt: a.createdAt,
    }));
  }
}

export const dashboardService = new DashboardService();
