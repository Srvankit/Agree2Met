import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Search, LayoutGrid, List, Plus, Download, Archive, ChevronLeft, ChevronRight } from 'lucide-react';
import { useWorkspace } from '../context/Workspace';
import { Button, IconButton, Input, Select, Badge, Tabs, EmptyState, Skeleton } from '../components/demo/ui';
import { AgreementTable, AgreementActions } from '../components/demo/AgreementTable';
import { AgreementLink } from '../components/demo/Shell';
import { statuses, canWrite } from '../domain/lifecycle';
import { download as mockDownload, money, dateLabel } from '../services/mock';
import { isServiceReal } from '../services/serviceMode';
import { agreementsService } from '../services/agreementsService';
import { analyticsService } from '../services/analyticsService';
import s from './pages.module.css';

export function Agreements({ archive = false }) {
  const { data, update, toast } = useWorkspace();
  const navigate = useNavigate();
  const isReal = isServiceReal('agreements') || isServiceReal('agreements-read');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All statuses');
  const [category, setCategory] = useState('All categories');
  const [sort, setSort] = useState('Newest first');
  const [period, setPeriod] = useState('All dates');
  const [view, setView] = useState('table');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [tab, setTab] = useState('All agreements');

  // Real backend state
  const [realAgreements, setRealAgreements] = useState([]);
  const [realCategories, setRealCategories] = useState([]);
  const [realTotal, setRealTotal] = useState(0);
  const [realTotalPages, setRealTotalPages] = useState(1);
  const [loading, setLoading] = useState(isReal);

  const loadRealAgreements = useCallback(async () => {
    if (!isReal) return;
    setLoading(true);
    try {
      const [agreementsRes, categoriesRes] = await Promise.all([
        agreementsService.getAgreements(
          {
            page,
            limit: 8,
            search: search.trim() || undefined,
            status: status !== 'All statuses' ? status.toUpperCase().replace(/\s+/g, '_') : undefined,
            sortBy: sort === 'Name A–Z' ? 'title' : 'createdAt',
            sortOrder: sort === 'Name A–Z' ? 'asc' : 'desc',
          },
          data.org
        ),
        agreementsService.getCategories(data.org),
      ]);

      const mapped = agreementsRes.data.map((a) => ({
        id: a.id,
        referenceNumber: a.referenceNumber,
        title: a.title,
        client: a.parties?.[0]?.companyName || a.parties?.[0]?.name || 'Counterparty',
        category: a.category?.name || 'General',
        status: a.status === 'COMPLETED' ? 'Completed' : a.status === 'DRAFT' ? 'Draft' : a.status === 'AWAITING_SIGNATURES' ? 'Awaiting Signatures' : a.status === 'PARTIALLY_SIGNED' ? 'Partially Signed' : a.status === 'EXPIRED' ? 'Expired' : 'Sent',
        value: a.paymentTerms?.totalAmount ? Number(a.paymentTerms.totalAmount) : 25000,
        deadline: a.expirationDate ? String(a.expirationDate).split('T')[0] : '2026-12-31',
        created: String(a.createdAt).split('T')[0],
      }));

      setRealAgreements(mapped);
      setRealTotal(agreementsRes.meta?.total || mapped.length);
      setRealTotalPages(agreementsRes.meta?.totalPages || 1);
      setRealCategories(categoriesRes);
    } catch (err) {
      console.warn('Failed to load real agreements:', err);
    } finally {
      setLoading(false);
    }
  }, [isReal, page, search, status, sort, data.org]);

  useEffect(() => {
    loadRealAgreements();
  }, [loadRealAgreements]);

  // Mock filtering fallback
  const mockRows = useMemo(
    () =>
      data.agreements
        .filter(
          (a) =>
            a.org === data.org &&
            Boolean(a.archived) === archive &&
            (a.title + ' ' + a.id + ' ' + a.client).toLowerCase().includes(search.toLowerCase()) &&
            (status === 'All statuses' || a.status === status) &&
            (category === 'All categories' || a.category === category) &&
            (period === 'All dates' || a.created >= '2026-11-20') &&
            (tab === 'All agreements' ||
              (tab === 'Completed' && a.status === 'Completed') ||
              (tab === 'Drafts' && a.status === 'Draft') ||
              (tab === 'Needs action' &&
                ['Pending Review', 'Awaiting Signatures', 'Partially Signed'].includes(a.status)))
        )
        .sort((a, b) =>
          sort === 'Name A–Z'
            ? a.title.localeCompare(b.title)
            : sort === 'Highest value'
              ? b.value - a.value
              : b.created.localeCompare(a.created)
        ),
    [data, search, status, category, sort, archive, tab, period]
  );

  const totalPages = isReal ? realTotalPages : Math.max(1, Math.ceil(mockRows.length / 8));
  const current = Math.min(page, totalPages);
  const visible = isReal ? realAgreements : mockRows.slice((current - 1) * 8, current * 8);
  const totalCount = isReal ? realTotal : mockRows.length;

  const filter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
    setSelected([]);
  };

  async function exportRows() {
    if (isReal) {
      try {
        const blob = await analyticsService.exportCsv({}, data.org);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agree2met-agreements-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast('Agreements exported successfully.');
      } catch {
        toast('Failed to export agreements CSV.');
      }
    } else {
      const csv = [
        'Reference,Title,Category,Status,Value,Deadline',
        ...(selected.length ? mockRows.filter((a) => selected.includes(a.id)) : mockRows).map((a) =>
          [a.id, a.title, a.category, a.status, a.value, a.deadline]
            .map((v) => `"${String(v).replaceAll('"', '""')}"`)
            .join(',')
        ),
      ].join('\n');
      mockDownload('agree2met-agreements.csv', csv, 'text/csv');
    }
  }

  const handleNewAgreement = () => {
    if (isReal) {
      toast('Agreement authoring will be available in an upcoming release (Phase 5).');
    } else {
      navigate({ to: '/app/new' });
    }
  };

  const handleArchiveSelected = () => {
    if (isReal) {
      toast('Agreement archiving will be available in an upcoming release (Phase 5).');
    } else {
      update((d) => ({
        ...d,
        agreements: d.agreements.map((a) =>
          selected.includes(a.id) ? { ...a, archived: !archive } : a
        ),
      }));
      setSelected([]);
      toast(archive ? 'Agreements restored' : 'Agreements archived');
    }
  };

  return (
    <main className={s.page}>
      <div className={s.heading}>
        <div>
          <h1>{archive ? 'Archive' : 'Agreements'}</h1>
          <p>
            {archive
              ? 'Your archived agreements, safely out of the way.'
              : isReal
                ? `Live organization repository · ${totalCount} agreements`
                : 'Every agreement. One organized workspace.'}
          </p>
        </div>
        <div className={s.headingActions}>
          <Button icon={Download} onClick={exportRows}>
            Export
          </Button>
          {!archive && canWrite(data.demoRole) && (
            <Button variant="primary" icon={Plus} onClick={handleNewAgreement}>
              New Agreement
            </Button>
          )}
        </div>
      </div>

      {!archive && (
        <Tabs
          items={['All agreements', 'Needs action', 'Drafts', 'Completed']}
          value={tab}
          onChange={(v) => {
            setTab(v);
            setPage(1);
            setSelected([]);
          }}
        />
      )}

      <div className={s.toolbar}>
        <div className={s.search}>
          <Search />
          <Input
            aria-label="Search agreements"
            placeholder="Search by name, reference, or party…"
            value={search}
            onChange={filter(setSearch)}
          />
        </div>
        <div className={s.filters}>
          <Select
            aria-label="Status filter"
            options={['All statuses', ...statuses]}
            value={status}
            onChange={filter(setStatus)}
          />
          <Select
            aria-label="Category filter"
            options={
              isReal && realCategories.length > 0
                ? ['All categories', ...realCategories.map((c) => c.name)]
                : ['All categories', ...data.categories]
            }
            value={category}
            onChange={filter(setCategory)}
          />
          <Select
            aria-label="Date filter"
            options={['All dates', 'Last 7 days']}
            value={period}
            onChange={filter(setPeriod)}
          />
          <Select
            aria-label="Sort agreements"
            options={['Newest first', 'Name A–Z', 'Highest value']}
            value={sort}
            onChange={filter(setSort)}
          />
        </div>
        <IconButton
          icon={List}
          label="Table view"
          aria-pressed={view === 'table'}
          onClick={() => setView('table')}
        />
        <IconButton
          icon={LayoutGrid}
          label="Card view"
          aria-pressed={view === 'cards'}
          onClick={() => setView('cards')}
        />
      </div>

      {selected.length > 0 && (
        <div className={s.toolbar}>
          <b>{selected.length} selected</b>
          <Button icon={Download} onClick={exportRows}>
            Export selected
          </Button>
          {canWrite(data.demoRole) && (
            <Button icon={Archive} onClick={handleArchiveSelected}>
              {archive ? 'Restore selected' : 'Archive selected'}
            </Button>
          )}
        </div>
      )}

      {loading ? (
        <Skeleton />
      ) : view === 'table' ? (
        <section className={s.panel}>
          <AgreementTable
            rows={visible}
            selectable
            selected={selected}
            onSelect={setSelected}
          />
        </section>
      ) : visible.length ? (
        <div className={s.listCards}>
          {visible.map((a) => (
            <article className={s.agreementCard} key={a.id}>
              <div className={s.between}>
                <Badge status={a.status} />
                <AgreementActions agreement={a} />
              </div>
              <AgreementLink id={a.id}>
                <h3>{a.title}</h3>
                <p className={s.reference}>{a.referenceNumber || a.id}</p>
              </AgreementLink>
              <p>
                {a.client} · {a.category}
              </p>
              <div className={s.between}>
                <b>{money(a.value)}</b>
                <span className={s.muted}>{dateLabel(a.deadline)}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No agreements found"
          text="Try adjusting your search or filters."
        />
      )}

      <div className={s.tableFooter}>
        <span>
          {totalCount
            ? `${(current - 1) * 8 + 1}–${Math.min(current * 8, totalCount)}`
            : '0'}{' '}
          of {totalCount} agreements
        </span>
        <div className={s.flex}>
          <IconButton
            icon={ChevronLeft}
            label="Previous page"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
          />
          <span>
            Page {current} of {totalPages}
          </span>
          <IconButton
            icon={ChevronRight}
            label="Next page"
            disabled={current === totalPages}
            onClick={() => setPage(current + 1)}
          />
        </div>
      </div>
    </main>
  );
}
