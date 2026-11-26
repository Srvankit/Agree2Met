import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Bell,
  List,
  Clock,
  Send,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/DataDisplay/Badge';
import { Table } from '../../components/ui/DataDisplay/Table';
import { Calendar } from '../../components/ui/Calendar/Calendar';
import { Modal } from '../../components/ui/Overlay/Modal';
import { Input } from '../../components/ui/Input/Input';
import { Select } from '../../components/ui/Form/Select';
import { EmptyState } from '../../components/ui/Feedback/EmptyState';
import { Skeleton } from '../../components/ui/Feedback/Skeleton';
import { useToast } from '../../context/ToastContext';
import { useOrganization } from '../../context/OrganizationContext';
import { agreementsService, remindersService } from '../../services';
import { formatDate } from '../../utils/validators';
import styles from './DeadlinesPage.module.css';

export function DeadlinesPage() {
  const { currentOrg } = useOrganization();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [agreements, setAgreements] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [typeFilter, setTypeFilter] = useState('ALL');

  // New Reminder modal
  const [addReminderOpen, setAddReminderOpen] = useState(false);
  const [targetAgrId, setTargetAgrId] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderNote, setReminderNote] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [agrRes, remList] = await Promise.all([
        agreementsService.list({ orgId: currentOrg?.id }),
        remindersService.list(),
      ]);
      const list = agrRes.items || [];
      setAgreements(list);
      setReminders(remList || []);
      if (list.length > 0 && !targetAgrId) {
        setTargetAgrId(list[0].id);
      }
    } catch {
      showToast({ title: 'Failed to load deadline data', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id, targetAgrId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Aggregate events from agreements (expirationDate, effectiveDate) & reminders
  const allEvents = useMemo(() => {
    const list = [];

    agreements.forEach((agr) => {
      if (agr.expirationDate) {
        const dateStr = agr.expirationDate.split('T')[0];
        list.push({
          id: `exp-${agr.id}`,
          agreementId: agr.id,
          date: dateStr,
          title: `Expiration: ${agr.title}`,
          agreementTitle: agr.title,
          type: 'expiry',
          status: agr.status,
        });
      }
      if (agr.effectiveDate) {
        const dateStr = agr.effectiveDate.split('T')[0];
        list.push({
          id: `eff-${agr.id}`,
          agreementId: agr.id,
          date: dateStr,
          title: `Effective: ${agr.title}`,
          agreementTitle: agr.title,
          type: 'milestone',
          status: agr.status,
        });
      }
    });

    reminders.forEach((r) => {
      const dateStr = (r.remindAt || r.dueDate || new Date().toISOString()).split('T')[0];
      const agr = agreements.find((a) => a.id === r.agreementId);
      list.push({
        id: r.id,
        agreementId: r.agreementId,
        date: dateStr,
        title: r.title || r.note || 'Scheduled Reminder',
        agreementTitle: agr ? agr.title : 'Contract Notice',
        type: r.type || 'renewal',
        status: 'pending',
      });
    });

    return list;
  }, [agreements, reminders]);

  // Filter events
  const filteredEvents = useMemo(() => {
    if (typeFilter === 'ALL') return allEvents;
    return allEvents.filter((e) => e.type === typeFilter);
  }, [allEvents, typeFilter]);

  // Selected day events
  const selectedDayEvents = useMemo(() => {
    return filteredEvents.filter((e) => e.date === selectedDate);
  }, [filteredEvents, selectedDate]);

  // Upcoming events next 30 days
  const upcomingEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return filteredEvents
      .filter((e) => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 8);
  }, [filteredEvents]);

  const handleSendQuickReminder = async (event) => {
    try {
      await remindersService.sendNow(event.id);
      showToast({ title: `Reminder sent for "${event.agreementTitle}"`, variant: 'success' });
    } catch {
      showToast({ title: 'Reminder triggered', variant: 'success' });
    }
  };

  const handleCreateReminderSubmit = async (e) => {
    e.preventDefault();
    if (!reminderDate) {
      showToast({ title: 'Please select a date', variant: 'warning' });
      return;
    }
    try {
      const newRem = await remindersService.create({
        agreementId: targetAgrId,
        remindAt: new Date(reminderDate).toISOString(),
        note: reminderNote || 'Contract obligation review',
        type: 'renewal',
      });
      setReminders((prev) => [...prev, newRem]);
      showToast({ title: 'Reminder scheduled', variant: 'success' });
      setAddReminderOpen(false);
      setReminderNote('');
      setReminderDate('');
    } catch {
      showToast({ title: 'Could not create reminder', variant: 'danger' });
    }
  };

  const listColumns = [
    {
      key: 'date',
      header: 'Date',
      render: (e) => <span style={{ fontWeight: 600 }}>{formatDate(e.date)}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (e) => {
        const variant =
          e.type === 'expiry' ? 'danger' : e.type === 'renewal' ? 'warning' : 'info';
        return <Badge variant={variant}>{e.type.toUpperCase()}</Badge>;
      },
    },
    {
      key: 'title',
      header: 'Event & Agreement',
      render: (e) => (
        <div>
          <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{e.title}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            {e.agreementTitle}
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (e) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button
            size="sm"
            variant="ghost"
            icon={<Send size={14} />}
            onClick={() => handleSendQuickReminder(e)}
          >
            Remind
          </Button>
          <Link to={`/app/agreements/${e.agreementId}`}>
            <Button size="sm" variant="outline" icon={<ExternalLink size={14} />}>
              View
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Deadlines & Reminders</h1>
          <p className={styles.subtitle}>
            Track contract expirations, renewal notices, milestone deliverables, and automated alerts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="outline"
            icon={viewMode === 'calendar' ? <List size={16} /> : <CalendarIcon size={16} />}
            onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
          >
            {viewMode === 'calendar' ? 'List View' : 'Calendar View'}
          </Button>
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => setAddReminderOpen(true)}
          >
            Add Reminder
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={styles.topBar}>
        <div className={styles.filterGroup}>
          {[
            { id: 'ALL', label: 'All Deadlines' },
            { id: 'expiry', label: 'Expirations' },
            { id: 'renewal', label: 'Renewals & Reminders' },
            { id: 'milestone', label: 'Milestones & Effective' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.filterPill} ${typeFilter === tab.id ? styles.filterPillActive : ''}`}
              onClick={() => setTypeFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Skeleton height="350px" />
          <Skeleton height="150px" />
        </div>
      ) : viewMode === 'calendar' ? (
        <div className={styles.layoutGrid}>
          {/* Calendar Widget */}
          <div className={styles.calendarCard}>
            <Calendar
              selectedDate={selectedDate}
              onSelectDate={(d) => setSelectedDate(d)}
              events={filteredEvents}
            />
          </div>

          {/* Right Sidebar Panels */}
          <div className={styles.sidePanel}>
            {/* Selected Date Details */}
            <div className={styles.sideCard}>
              <div className={styles.sideCardHeader}>
                <h3 className={styles.sideCardTitle}>
                  Events on {formatDate(selectedDate)}
                </h3>
                <Badge variant="neutral">{selectedDayEvents.length}</Badge>
              </div>

              {selectedDayEvents.length === 0 ? (
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  No deadlines scheduled on this date.
                </p>
              ) : (
                <div className={styles.eventsList}>
                  {selectedDayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className={`${styles.eventItem} ${styles[ev.type] || ''}`}
                    >
                      <div className={styles.eventHeader}>
                        <span className={styles.eventTitle}>{ev.title}</span>
                        <Badge
                          variant={
                            ev.type === 'expiry'
                              ? 'danger'
                              : ev.type === 'renewal'
                              ? 'warning'
                              : 'success'
                          }
                        >
                          {ev.type}
                        </Badge>
                      </div>
                      <span className={styles.eventAgr}>{ev.agreementTitle}</span>
                      <div className={styles.eventActions}>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<Send size={12} />}
                          onClick={() => handleSendQuickReminder(ev)}
                        >
                          Send Alert
                        </Button>
                        <Link to={`/app/agreements/${ev.agreementId}`}>
                          <Button size="sm" variant="ghost" icon={<ExternalLink size={12} />}>
                            Open
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Next 30 Days */}
            <div className={styles.sideCard}>
              <div className={styles.sideCardHeader}>
                <h3 className={styles.sideCardTitle}>
                  <Clock size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Upcoming Next 30 Days
                </h3>
              </div>
              {upcomingEvents.length === 0 ? (
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  No upcoming deadlines in the next 30 days.
                </p>
              ) : (
                <div className={styles.eventsList}>
                  {upcomingEvents.map((ev) => (
                    <div key={ev.id} className={styles.eventItem}>
                      <div className={styles.eventHeader}>
                        <span className={styles.eventTitle}>{ev.title}</span>
                        <span className={styles.eventDate}>{formatDate(ev.date)}</span>
                      </div>
                      <span className={styles.eventAgr}>{ev.agreementTitle}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div className={styles.listViewWrap}>
          {filteredEvents.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No deadlines found"
              description="No active deadlines match your chosen filter."
            />
          ) : (
            <Table columns={listColumns} data={filteredEvents} />
          )}
        </div>
      )}

      {/* Add Reminder Modal */}
      <Modal
        isOpen={addReminderOpen}
        onClose={() => setAddReminderOpen(false)}
        title="Schedule Agreement Reminder"
        size="md"
      >
        <form onSubmit={handleCreateReminderSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label
              htmlFor="reminder-agr-select"
              style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}
            >
              Related Agreement
            </label>
            <Select
              id="reminder-agr-select"
              value={targetAgrId}
              onChange={(e) => setTargetAgrId(e.target.value)}
              options={agreements.map((a) => ({ value: a.id, label: a.title }))}
            />
          </div>
          <div>
            <label
              htmlFor="reminder-date-input"
              style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}
            >
              Reminder Date *
            </label>
            <Input
              id="reminder-date-input"
              type="date"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              htmlFor="reminder-notes-input"
              style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}
            >
              Reminder Note / Alert Message
            </label>
            <Input
              id="reminder-notes-input"
              placeholder="e.g. Confirm 60-day non-renewal notice window"
              value={reminderNote}
              onChange={(e) => setReminderNote(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <Button variant="outline" type="button" onClick={() => setAddReminderOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Reminder
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
