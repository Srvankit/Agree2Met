import { useState } from 'react';
import {
  User,
  Building,
  Shield,
  Palette,
  Database,
  Save,
  Download,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { Switch } from '../../components/ui/Form/Switch';
import { Avatar } from '../../components/ui/DataDisplay/Avatar';
import { Badge } from '../../components/ui/DataDisplay/Badge';
import { ConfirmDialog } from '../../components/ui/Overlay/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { agreementsService, usersService } from '../../services';
import styles from './SettingsPage.module.css';

export function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { currentOrg } = useOrganization();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'org' | 'security' | 'appearance' | 'data'

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [title, setTitle] = useState(user?.title || 'Principal Legal Counsel');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Org form
  const [orgName, setOrgName] = useState(currentOrg?.name || '');
  const [orgPlan] = useState(currentOrg?.plan || 'Enterprise');

  // Security form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Appearance
  const [reducedMotion, setReducedMotion] = useState(false);

  // Data reset modal
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // Save Profile Handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast({ title: 'Full name cannot be blank', variant: 'warning' });
      return;
    }

    try {
      setIsSavingProfile(true);
      const updated = await usersService.updateProfile({ name: name.trim(), title: title.trim() });
      if (updateUser) {
        updateUser(updated);
      }
      showToast({ title: 'Profile updated successfully', variant: 'success' });
    } catch {
      showToast({ title: 'Could not update profile', variant: 'danger' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Save Password Handler
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast({ title: 'Current password is required', variant: 'warning' });
      return;
    }
    if (newPassword.length < 8) {
      showToast({ title: 'New password must be at least 8 characters', variant: 'warning' });
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast({ title: 'Passwords do not match', variant: 'warning' });
      return;
    }

    try {
      await usersService.changePassword(currentPassword, newPassword);
      showToast({ title: 'Password changed successfully', variant: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      showToast({ title: 'Password update failed', variant: 'danger' });
    }
  };

  // Export JSON Archive
  const handleExportData = async () => {
    try {
      const res = await agreementsService.list({ orgId: currentOrg?.id });
      const exportObject = {
        exportedAt: new Date().toISOString(),
        organization: currentOrg,
        user: { id: user?.id, email: user?.email, name: user?.name, role: user?.role },
        agreements: res.items || [],
      };

      const blob = new Blob([JSON.stringify(exportObject, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agree2met_backup_${currentOrg?.id}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast({ title: 'Workspace data exported to JSON', variant: 'success' });
    } catch {
      showToast({ title: 'Export failed', variant: 'danger' });
    }
  };

  // Factory Reset Handler
  const handleResetDataConfirm = async () => {
    await agreementsService.resetDemoData();
    showToast({ title: 'Demo data restored to initial factory seed', variant: 'info' });
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Account & Workspace Settings</h1>
        <p className={styles.subtitle}>
          Configure your personal profile, organization preferences, authentication, and security.
        </p>
      </div>

      {/* Tabs */}
      <div className={styles.tabNav}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={16} />
          Profile
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'org' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('org')}
        >
          <Building size={16} />
          Organization
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'security' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <Shield size={16} />
          Security
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'appearance' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          <Palette size={16} />
          Appearance
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'data' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('data')}
        >
          <Database size={16} />
          Data & Privacy
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className={styles.card}>
          <div>
            <h3 className={styles.cardTitle}>Personal Profile</h3>
            <p className={styles.cardDesc}>Information visible to counterparties and team members.</p>
          </div>

          <div className={styles.avatarSection}>
            <Avatar name={name || 'User'} size="xl" />
            <div>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                {name || 'User'}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                Role: <Badge variant="primary">{user?.role || 'OWNER'}</Badge>
              </div>
            </div>
          </div>

          <div className={styles.sectionDivider} />

          <div className={styles.formGrid}>
            <div>
              <label
                htmlFor="profile-name"
                style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}
              >
                Full Name *
              </label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label
                htmlFor="profile-email"
                style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}
              >
                Email Address
              </label>
              <Input
                id="profile-email"
                value={user?.email || ''}
                disabled
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="profile-title"
              style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}
            >
              Job Title / Professional Role
            </label>
            <Input
              id="profile-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button
              type="submit"
              variant="primary"
              icon={<Save size={16} />}
              loading={isSavingProfile}
            >
              Save Changes
            </Button>
          </div>
        </form>
      )}

      {/* Organization Tab */}
      {activeTab === 'org' && (
        <div className={styles.card}>
          <div>
            <h3 className={styles.cardTitle}>Organization Profile</h3>
            <p className={styles.cardDesc}>Settings governing company legal entity identity.</p>
          </div>

          <div className={styles.formGrid}>
            <div>
              <label
                htmlFor="org-name-input"
                style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}
              >
                Organization Legal Name
              </label>
              <Input
                id="org-name-input"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="org-plan-badge"
                style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}
              >
                Subscription Plan
              </label>
              <div id="org-plan-badge" style={{ marginTop: '8px' }}>
                <Badge variant="primary">{orgPlan} Commercial</Badge>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button
              variant="primary"
              icon={<Save size={16} />}
              onClick={() => showToast({ title: 'Organization updated', variant: 'success' })}
            >
              Save Organization
            </Button>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Password Change */}
          <form onSubmit={handleSavePassword} className={styles.card}>
            <div>
              <h3 className={styles.cardTitle}>Change Password</h3>
              <p className={styles.cardDesc}>Ensure your account is protected by a strong password.</p>
            </div>

            <div className={styles.formGrid}>
              <div>
                <label
                  htmlFor="curr-pwd"
                  style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}
                >
                  Current Password
                </label>
                <Input
                  id="curr-pwd"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div />
              <div>
                <label
                  htmlFor="new-pwd"
                  style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}
                >
                  New Password
                </label>
                <Input
                  id="new-pwd"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="confirm-pwd"
                  style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}
                >
                  Confirm New Password
                </label>
                <Input
                  id="confirm-pwd"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <Button type="submit" variant="primary">
                Update Password
              </Button>
            </div>
          </form>

          {/* 2FA */}
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className={styles.cardTitle}>Two-Factor Authentication (2FA)</h3>
                <p className={styles.cardDesc}>Require an authenticator app code when signing in.</p>
              </div>
              <Switch
                checked={twoFactorEnabled}
                onChange={(checked) => {
                  setTwoFactorEnabled(checked);
                  showToast({
                    title: checked ? '2FA enabled' : '2FA disabled',
                    variant: checked ? 'success' : 'info',
                  });
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === 'appearance' && (
        <div className={styles.card}>
          <div>
            <h3 className={styles.cardTitle}>Theme & Visual Comfort</h3>
            <p className={styles.cardDesc}>Customize how Agree2Met looks on your device.</p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {['light', 'dark', 'system'].map((m) => (
              <Button
                key={m}
                variant={theme === m ? 'primary' : 'outline'}
                onClick={() => setTheme(m)}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)} Mode
              </Button>
            ))}
          </div>

          <div className={styles.sectionDivider} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                Reduced Motion
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                Minimize animated transitions throughout the application.
              </div>
            </div>
            <Switch
              checked={reducedMotion}
              onChange={(checked) => setReducedMotion(checked)}
            />
          </div>
        </div>
      )}

      {/* Data & Privacy Tab */}
      {activeTab === 'data' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Export Data */}
          <div className={styles.card}>
            <div>
              <h3 className={styles.cardTitle}>Export Workspace Data</h3>
              <p className={styles.cardDesc}>
                Download a complete JSON export of agreements, counterparties, cryptographic audit logs, and templates.
              </p>
            </div>
            <div>
              <Button
                variant="outline"
                icon={<Download size={16} />}
                onClick={handleExportData}
              >
                Download Complete JSON Archive
              </Button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className={`${styles.card} ${styles.dangerCard}`}>
            <div className={styles.dangerHeader}>
              <AlertTriangle size={20} />
              <h3 className={styles.cardTitle} style={{ color: 'var(--color-danger)' }}>
                Demo Environment Factory Reset
              </h3>
            </div>
            <p className={styles.cardDesc}>
              Restore all mock contracts, tamper flags, and notifications to their initial seeded state.
            </p>
            <div>
              <Button
                variant="danger"
                icon={<RotateCcw size={16} />}
                onClick={() => setResetDialogOpen(true)}
              >
                Reset Demo Workspace
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={resetDialogOpen}
        title="Reset Demo Data"
        message="This will overwrite all current changes, drafted agreements, and simulated audit records with the fresh starter dataset. Are you sure?"
        confirmLabel="Reset Everything"
        variant="danger"
        onConfirm={handleResetDataConfirm}
        onCancel={() => setResetDialogOpen(false)}
      />
    </div>
  );
}
