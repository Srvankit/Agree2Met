import { useState } from 'react';
import {
  Plus,
  Trash2,
  Download,
  Share2,
  Shield,
  Clock,
  Sparkles,
  Info,
  Moon,
  Sun,
  LayoutDashboard,
  Layers,
} from 'lucide-react';
import {
  Button,
  IconButton,
  Input,
  PasswordInput,
  Textarea,
  CopyField,
  Field,
  Select,
  Checkbox,
  Radio,
  Switch,
  Combobox,
  DatePicker,
  DateRangePicker,
  FileDropzone,
  Card,
  StatusBadge,
  Avatar,
  AvatarGroup,
  KeyValue,
  Timeline,
  Table,
  Banner,
  EmptyState,
  Skeleton,
  ProgressBar,
  Modal,
  ConfirmDialog,
  Drawer,
  Dropdown,
  Popover,
  Tooltip,
  Tabs,
  Stepper,
  Pagination,
  FilterBar,
  SignaturePad,
  LineChart,
  BarChart,
  DonutChart,
  Sparkline,
  Calendar,
} from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import styles from './ComponentShowcase.module.css';

export function ComponentShowcase() {
  const { addToast } = useToast();
  const { theme, toggleTheme } = useTheme();

  // State for interactive widgets
  const [btnLoading, setBtnLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('overview');
  const [currentStep, setCurrentStep] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [searchVal, setSearchVal] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [signatureData, setSignatureData] = useState(null);
  const [switchChecked, setSwitchChecked] = useState(true);
  const [checkboxVal, setCheckboxVal] = useState(true);
  const [radioVal, setRadioVal] = useState('org');
  const [comboboxVal, setComboboxVal] = useState('');
  const [dateVal, setDateVal] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  // Table sample data
  const tableData = [
    { id: '1', title: 'Master Services Agreement', party: 'Acme Corp', status: 'signed', value: '$45,000' },
    { id: '2', title: 'Non-Disclosure Agreement', party: 'Starlight Ventures', status: 'draft', value: '—' },
    { id: '3', title: 'Software License SOW', party: 'Globex Ltd', status: 'awaiting_signatures', value: '$12,500' },
    { id: '4', title: 'Consulting Addendum', party: 'Initech Systems', status: 'in_review', value: '$8,000' },
    { id: '5', title: 'Vendor Security Terms', party: 'Cyberdyne AI', status: 'active', value: '$30,000' },
    { id: '6', title: 'Freelance Design Contract', party: 'Jane Doe', status: 'completed', value: '$4,200' },
  ];

  const tableColumns = [
    { key: 'title', label: 'Agreement Title', sortable: true },
    { key: 'party', label: 'Counterparty', sortable: true },
    {
      key: 'status',
      label: 'Status',
      render: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    { key: 'value', label: 'Value', sortable: true },
    {
      key: 'actions',
      label: 'Actions',
      render: (item) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          <IconButton
            icon={Share2}
            size="sm"
            variant="ghost"
            aria-label="Share"
            onClick={() => addToast({ title: `Shared ${item.title}`, type: 'info' })}
          />
          <IconButton
            icon={Download}
            size="sm"
            variant="ghost"
            aria-label="Download"
            onClick={() => addToast({ title: `Downloaded ${item.title}`, type: 'success' })}
          />
        </div>
      ),
    },
  ];

  // Chart data
  const lineData = [
    { label: 'Jan', value: 12 },
    { label: 'Feb', value: 18 },
    { label: 'Mar', value: 24 },
    { label: 'Apr', value: 20 },
    { label: 'May', value: 32 },
    { label: 'Jun', value: 45 },
  ];

  const barData = [
    { label: 'Draft', value: 6, color: 'var(--color-status-draft-text)' },
    { label: 'Review', value: 4, color: 'var(--color-status-in-review-text)' },
    { label: 'Signing', value: 8, color: 'var(--color-status-awaiting-signatures-text)' },
    { label: 'Active', value: 15, color: 'var(--color-status-active-text)' },
  ];

  const donutData = [
    { label: 'Active', value: 15, color: '#16a34a' },
    { label: 'Signing', value: 8, color: '#f59e0b' },
    { label: 'Review', value: 4, color: '#0284c7' },
    { label: 'Draft', value: 6, color: '#64748b' },
  ];

  const calendarEvents = [
    { id: '1', date: new Date().toISOString().slice(0, 10), title: 'MSA Renewal Due', type: 'deadline' },
    { id: '2', date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10), title: 'Payment Milestone 2', type: 'milestone' },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Component Showcase & Design System</h1>
          <p className={styles.pageDesc}>
            Living UI library reference for Agree2Met SaaS platform.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button
            variant="secondary"
            onClick={toggleTheme}
            leftIcon={theme === 'dark' ? Sun : Moon}
          >
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </Button>
          <Button
            variant="primary"
            leftIcon={Sparkles}
            onClick={() => addToast({ title: 'Design System Verified', message: 'All tokens and CSS variables are operational.', type: 'success' })}
          >
            Trigger Toast
          </Button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Core Elements', icon: LayoutDashboard },
          { id: 'forms', label: 'Forms & Inputs', icon: Layers },
          { id: 'overlays', label: 'Overlays & Feedback', icon: Info },
          { id: 'charts', label: 'Charts & Canvas', icon: Sparkles },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="line"
      />

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className={styles.sectionGrid}>
          {/* Typography & Colors */}
          <Card title="Brand & Typography">
            <div className={styles.stack}>
              <div>
                <span className={styles.label}>Heading 1 (Display Serif / Sans)</span>
                <h1 style={{ margin: '4px 0', fontSize: 'var(--text-3xl)' }}>
                  Agree2Met Agreement Platform
                </h1>
              </div>
              <div>
                <span className={styles.label}>Legal Document Body (Source Serif 4)</span>
                <p className="document-body" style={{ margin: '4px 0', fontSize: 'var(--text-base)' }}>
                  &ldquo;This Master Services Agreement is entered into by and between the Client and Provider...&rdquo;
                </p>
              </div>
              <div>
                <span className={styles.label}>Monospace Code / Hashes (JetBrains Mono)</span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-primary)' }}>
                  SHA256: 3a7bd3e218204b7fc148ffb8f1547ec1f163b469f372134599580ef11bc7fa48
                </div>
              </div>
            </div>
          </Card>

          {/* Buttons */}
          <Card title="Buttons & Actions">
            <div className={styles.stack}>
              <div className={styles.row}>
                <Button variant="primary" leftIcon={Plus}>Primary</Button>
                <Button variant="secondary" leftIcon={Share2}>Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger" leftIcon={Trash2}>Danger</Button>
              </div>
              <div className={styles.row}>
                <Button
                  variant="primary"
                  isLoading={btnLoading}
                  onClick={() => {
                    setBtnLoading(true);
                    setTimeout(() => setBtnLoading(false), 1500);
                  }}
                >
                  {btnLoading ? 'Processing...' : 'Click for Loading State'}
                </Button>
                <Button variant="secondary" disabled>Disabled</Button>
                <IconButton icon={Share2} aria-label="Share" variant="outline" />
                <IconButton icon={Trash2} aria-label="Delete" variant="danger" />
              </div>
            </div>
          </Card>

          {/* Badges & Statuses */}
          <Card title="Lifecycle Status Badges">
            <div className={styles.badgeGrid}>
              <StatusBadge status="draft" />
              <StatusBadge status="in_review" />
              <StatusBadge status="approved" />
              <StatusBadge status="awaiting_signatures" />
              <StatusBadge status="partially_signed" />
              <StatusBadge status="signed" />
              <StatusBadge status="active" />
              <StatusBadge status="completed" />
              <StatusBadge status="expired" />
              <StatusBadge status="terminated" />
              <StatusBadge status="disputed" />
              <StatusBadge status="cancelled" />
            </div>
          </Card>

          {/* Avatars & Users */}
          <Card title="Avatars & Key Value">
            <div className={styles.stack}>
              <div className={styles.row}>
                <Avatar name="Alex Rivera" size="lg" />
                <Avatar name="Sarah Connor" size="md" />
                <Avatar name="David Miller" size="sm" />
                <AvatarGroup
                  users={[
                    { name: 'Alex Rivera' },
                    { name: 'Sarah Connor' },
                    { name: 'David Miller' },
                    { name: 'Elena Rostova' },
                    { name: 'Kenji Sato' },
                  ]}
                  max={3}
                />
              </div>
              <KeyValue label="Contract Value" value="$125,000 USD" />
              <KeyValue label="Signer Consent Verified" value="Yes (IP: 198.51.100.42)" copyable />
            </div>
          </Card>

          {/* Table Component */}
          <div style={{ gridColumn: '1 / -1' }}>
            <Card title="Interactive Data Table">
              <FilterBar
                searchValue={searchVal}
                onSearchChange={setSearchVal}
                searchPlaceholder="Search agreements..."
                filters={[
                  {
                    id: 'status',
                    label: 'All Statuses',
                    value: filterStatus,
                    options: [
                      { label: 'Draft', value: 'draft' },
                      { label: 'In Review', value: 'in_review' },
                      { label: 'Awaiting Signatures', value: 'awaiting_signatures' },
                      { label: 'Signed', value: 'signed' },
                    ],
                    onChange: setFilterStatus,
                  },
                ]}
                activeCount={filterStatus ? 1 : 0}
                onClearAll={() => setFilterStatus('')}
              />
              <Table
                columns={tableColumns}
                data={tableData.filter((d) =>
                  d.title.toLowerCase().includes(searchVal.toLowerCase())
                )}
                selectable
                onSelectRows={(ids) => console.log('Selected rows:', ids)}
              />
              <Pagination
                currentPage={currentPage}
                totalPages={4}
                totalItems={24}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </Card>
          </div>
        </div>
      )}

      {/* FORMS TAB */}
      {activeTab === 'forms' && (
        <div className={styles.sectionGrid}>
          <Card title="Text Inputs & Password Policy">
            <div className={styles.stack}>
              <Field label="Agreement Name" required hint="Legal commercial title">
                <Input placeholder="e.g. Master Services Agreement 2026" />
              </Field>
              <Field label="New Password" hint="Type to test 4-level strength meter">
                <PasswordInput placeholder="Enter secure password" />
              </Field>
              <Field label="Agreement Description">
                <Textarea placeholder="Brief summary of contract terms..." rows={3} />
              </Field>
              <Field label="Invite Deep Link">
                <CopyField value="https://agree2met.io/sign/token_984fbc9a81e3" />
              </Field>
            </div>
          </Card>

          <Card title="Selection & Dropdowns">
            <div className={styles.stack}>
              <Field label="Contract Category">
                <Select
                  options={[
                    { label: 'Vendor Agreements', value: 'vendor' },
                    { label: 'Employment & Freelance', value: 'employment' },
                    { label: 'Non-Disclosure (NDA)', value: 'nda' },
                    { label: 'Real Estate Lease', value: 'lease' },
                  ]}
                />
              </Field>
              <Field label="Counterparty Autocomplete">
                <Combobox
                  value={comboboxVal}
                  onChange={setComboboxVal}
                  placeholder="Search existing partners..."
                  options={[
                    { label: 'Acme Global Corp (contact@acme.com)', value: 'acme' },
                    { label: 'Starlight Ventures LLC (invest@starlight.io)', value: 'starlight' },
                    { label: 'Initech Solutions (admin@initech.net)', value: 'initech' },
                  ]}
                />
              </Field>
              <div className={styles.row}>
                <Switch
                  checked={switchChecked}
                  onChange={(e) => setSwitchChecked(e.target.checked)}
                  label="Email reminders on deadline"
                />
              </div>
              <div className={styles.row}>
                <Checkbox
                  checked={checkboxVal}
                  onChange={(e) => setCheckboxVal(e.target.checked)}
                  label="I consent to electronic signing records"
                />
              </div>
              <div className={styles.row}>
                <Radio
                  name="scope"
                  value="org"
                  checked={radioVal === 'org'}
                  onChange={() => setRadioVal('org')}
                  label="Organization Workspace"
                />
                <Radio
                  name="scope"
                  value="personal"
                  checked={radioVal === 'personal'}
                  onChange={() => setRadioVal('personal')}
                  label="Personal Scope"
                />
              </div>
            </div>
          </Card>

          <Card title="Pickers & Dropzone">
            <div className={styles.stack}>
              <Field label="Execution Date">
                <DatePicker value={dateVal} onChange={setDateVal} />
              </Field>
              <Field label="Contract Term Window">
                <DateRangePicker
                  startDate={dateRange.startDate}
                  endDate={dateRange.endDate}
                  onChange={setDateRange}
                />
              </Field>
              <Field label="Attachment Document">
                <FileDropzone
                  accept="application/pdf,image/png,image/jpeg"
                  maxSize={10 * 1024 * 1024}
                  onDrop={(files) =>
                    addToast({
                      title: 'File Uploaded',
                      message: `Received ${files[0].name} (${(files[0].size / 1024).toFixed(0)} KB)`,
                      type: 'success',
                    })
                  }
                />
              </Field>
            </div>
          </Card>

          <Card title="Stepper Progress Component">
            <div className={styles.stack}>
              <Stepper
                currentStep={currentStep}
                onStepClick={setCurrentStep}
                steps={[
                  { title: 'Details', description: 'Basic info' },
                  { title: 'Parties', description: 'Counterparties' },
                  { title: 'Terms', description: 'Clauses' },
                  { title: 'Review', description: 'Sign & send' },
                ]}
              />
              <div className={styles.row} style={{ marginTop: '16px' }}>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentStep === 0}
                  onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                >
                  Previous Step
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={currentStep === 3}
                  onClick={() => setCurrentStep((s) => Math.min(3, s + 1))}
                >
                  Next Step
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* OVERLAYS TAB */}
      {activeTab === 'overlays' && (
        <div className={styles.sectionGrid}>
          <Card title="Modals, Dialogs & Drawers">
            <div className={styles.stack}>
              <div className={styles.row}>
                <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                  Open Modal
                </Button>
                <Button variant="danger" onClick={() => setIsConfirmOpen(true)}>
                  Open Confirm Dialog
                </Button>
                <Button variant="secondary" onClick={() => setIsDrawerOpen(true)}>
                  Open Slide Drawer
                </Button>
              </div>

              {/* Toast Triggers */}
              <div>
                <span className={styles.label}>Toast Notifications</span>
                <div className={styles.row} style={{ marginTop: '6px' }}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addToast({ title: 'Operation Successful', message: 'Agreement archived safely.', type: 'success' })}
                  >
                    Success Toast
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addToast({ title: 'Attention Required', message: 'Expiration date is within 3 days.', type: 'warning' })}
                  >
                    Warning Toast
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addToast({ title: 'Request Failed', message: 'Network request timed out.', type: 'error' })}
                  >
                    Error Toast
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addToast({ title: 'New Audit Event', message: 'Document viewed by Acme Corp.', type: 'info' })}
                  >
                    Info Toast
                  </Button>
                </div>
              </div>

              {/* Dropdowns & Popovers */}
              <div>
                <span className={styles.label}>Dropdowns & Tooltips</span>
                <div className={styles.row} style={{ marginTop: '6px' }}>
                  <Dropdown
                    trigger={<Button variant="outline">Options Menu ▾</Button>}
                    items={[
                      { id: '1', label: 'View Audit Trail', icon: Shield },
                      { id: '2', label: 'Send Reminder', icon: Clock },
                      { divider: true },
                      { id: '3', label: 'Delete Agreement', icon: Trash2, danger: true },
                    ]}
                  />
                  <Popover
                    trigger={<Button variant="outline">Open Popover</Button>}
                  >
                    <div style={{ padding: '4px' }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-sm)' }}>Quick Audit Record</h4>
                      <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                        Hash verified with blockchain-grade SHA-256 chain.
                      </p>
                    </div>
                  </Popover>
                  <Tooltip content="Quick action tooltip">
                    <Button variant="ghost">Hover me for Tooltip</Button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Feedback & States">
            <div className={styles.stack}>
              <Banner
                variant="info"
                title="Electronic Signature Notice"
                message="Agree2Met provides simple electronic signature workflows. Verify legal requirements for your specific jurisdiction."
              />
              <Banner
                variant="warning"
                title="Approaching Renewal"
                message="This agreement expires in 7 business days."
              />
              <div>
                <span className={styles.label}>Progress Bars</span>
                <ProgressBar value={75} max={100} label="Signatures Collected (3 of 4)" />
              </div>
              <div>
                <span className={styles.label}>Skeleton Loading States</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  <Skeleton height="16px" width="80%" />
                  <Skeleton height="16px" width="50%" />
                  <Skeleton height="32px" width="100%" />
                </div>
              </div>
            </div>
          </Card>

          <Card title="Timeline Activity Display">
            <Timeline
              items={[
                {
                  id: '1',
                  title: 'Agreement Created',
                  description: 'Draft initialized by Alex Rivera',
                  timestamp: '2 hours ago',
                  status: 'completed',
                },
                {
                  id: '2',
                  title: 'Sent for Signatures',
                  description: 'Invitations dispatched to 2 counterparties',
                  timestamp: '1 hour ago',
                  status: 'completed',
                },
                {
                  id: '3',
                  title: 'Awaiting Counterparty Signature',
                  description: 'Pending signature from legal@acme.com',
                  timestamp: 'Current',
                  status: 'current',
                },
              ]}
            />
          </Card>

          <Card title="Empty & Error States">
            <EmptyState
              title="No archived agreements"
              description="Archived agreements will appear here for 90 days before permanent deletion."
              action={<Button variant="outline" size="sm">Create Agreement</Button>}
            />
          </Card>
        </div>
      )}

      {/* CHARTS & CANVAS TAB */}
      {activeTab === 'charts' && (
        <div className={styles.sectionGrid}>
          <Card title="Custom HTML5 Canvas Signature Pad">
            <SignaturePad
              signerName="Alex Rivera"
              onChange={setSignatureData}
            />
            {signatureData && (
              <div style={{ marginTop: '12px' }}>
                <span className={styles.label}>Generated Signature Output:</span>
                <div style={{ marginTop: '4px', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: '#fff' }}>
                  <img src={signatureData} alt="Captured Signature" style={{ maxHeight: '60px' }} />
                </div>
              </div>
            )}
          </Card>

          <Card title="Deadline Calendar">
            <Calendar
              events={calendarEvents}
              onSelectDate={(date, events) => {
                addToast({
                  title: `Selected ${date}`,
                  message: events.length ? events.map((e) => e.title).join(', ') : 'No scheduled deadlines.',
                  type: 'info',
                });
              }}
            />
          </Card>

          <Card title="Agreements Creation Trend (Line Chart)">
            <LineChart data={lineData} valueSuffix=" contracts" />
          </Card>

          <Card title="Lifecycle Distribution (Bar Chart)">
            <BarChart data={barData} />
          </Card>

          <Card title="Status Portfolio Share (Donut Chart)">
            <DonutChart data={donutData} centerLabel="Agreements" />
          </Card>

          <Card title="Metric Sparklines">
            <div className={styles.stack}>
              <div className={styles.row} style={{ justifyContent: 'space-between' }}>
                <span>Completion Velocity (+24%)</span>
                <Sparkline data={[10, 14, 18, 22, 28, 35, 42]} trend="up" />
              </div>
              <div className={styles.row} style={{ justifyContent: 'space-between' }}>
                <span>Dispute Frequency (-12%)</span>
                <Sparkline data={[8, 7, 6, 5, 4, 3, 2]} trend="down" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL DIALOG */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Agreement Details Modal"
        description="Verify or edit metadata before signing"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setIsModalOpen(false);
                addToast({ title: 'Saved successfully', type: 'success' });
              }}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          This dialog is accessible, manages tab focus, supports Esc to dismiss, and traps focus cleanly.
        </p>
      </Modal>

      {/* CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          setIsConfirmOpen(false);
          addToast({ title: 'Agreement deleted', type: 'error' });
        }}
        title="Permanently Delete Agreement?"
        message="This action cannot be undone. All audit history and cryptographic hashes associated with this draft will be erased."
        confirmText="Delete Contract"
        isDanger
      />

      {/* DRAWER */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Audit Trail Inspection"
        description="Tamper-evident log entries"
        footer={
          <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>
            Close Panel
          </Button>
        }
      >
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Audit trail events with cryptographic hash chains are listed here.
        </p>
      </Drawer>
    </div>
  );
}
