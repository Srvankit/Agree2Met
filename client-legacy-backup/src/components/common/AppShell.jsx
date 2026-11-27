import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Layers,
  Calendar,
  BarChart3,
  Sparkles,
  Archive,
  Users,
  Settings,
  Menu,
  X,
  Search,
  Plus,
  Bell,
  Moon,
  Sun,
  ChevronDown,
  LogOut,
  RotateCcw,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { Logo } from './Logo';
import { Avatar } from '../ui/DataDisplay/Avatar';
import { Dropdown } from '../ui/Overlay/Dropdown';
import { CommandPalette } from './CommandPalette';
import { AIDrawer } from './AIDrawer';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { useNotifications } from '../../context/NotificationContext';
import { useAIAssistant } from '../../context/AIAssistantContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { agreementsService } from '../../services';
import styles from './AppShell.module.css';

export function AppShell() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [activeAgreementsCount, setActiveAgreementsCount] = useState(0);

  const { user, logout, switchRole } = useAuth();
  const { currentOrg, organizations, switchOrg } = useOrganization();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { toggle: toggleAI } = useAIAssistant();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update agreement count on location change
  useEffect(() => {
    agreementsService.list({ pageSize: 1 }).then((res) => {
      setActiveAgreementsCount(res.total || 0);
    });
  }, [location.pathname]);

  const handleResetData = async () => {
    await agreementsService.resetDemoData();
    addToast({
      title: 'Demo Data Reset',
      message: 'Workspace restored to clean factory state.',
      type: 'info',
    });
    window.location.reload();
  };

  const navItems = [
    { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/app/agreements', label: 'Agreements', icon: FileText, badge: activeAgreementsCount },
    { to: '/app/documents', label: 'Documents', icon: FolderOpen },
    { to: '/app/templates', label: 'Templates', icon: Layers },
    { to: '/app/deadlines', label: 'Deadlines', icon: Calendar },
    { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/app/ai', label: 'AI Assistant', icon: Sparkles, highlight: true },
    { to: '/app/archive', label: 'Archive', icon: Archive },
    { to: '/app/team', label: 'Team', icon: Users },
    { to: '/app/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className={styles.layout}>
      {/* Top Demo Banner */}
      <div className={styles.demoBanner}>
        <span>
          <strong>DEMO ENVIRONMENT</strong> — Simulated local database with realistic contracts & cryptographic audit trails.
        </span>
        <button
          type="button"
          className={styles.bannerResetBtn}
          onClick={handleResetData}
        >
          <RotateCcw size={12} />
          <span>Reset Demo Data</span>
        </button>
      </div>

      <div className={styles.mainContainer}>
        {/* Sidebar */}
        <aside
          className={`${styles.sidebar} ${isSidebarCollapsed ? styles.collapsed : ''} ${isMobileMenuOpen ? styles.mobileOpen : ''}`}
        >
          <div className={styles.sidebarHeader}>
            <div className={styles.logoWrapper}>
              <Logo size="md" showMarkOnly={isSidebarCollapsed} />
            </div>
            <button
              type="button"
              className={styles.mobileCloseBtn}
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Organization Switcher */}
          <div className={styles.orgSwitcherWrapper}>
            <Dropdown
              align="left"
              trigger={
                <button
                  type="button"
                  className={styles.orgButton}
                  title={currentOrg?.name}
                >
                  <span className={styles.orgIcon}>{currentOrg?.logo || '🏢'}</span>
                  {!isSidebarCollapsed && (
                    <div className={styles.orgInfo}>
                      <span className={styles.orgName}>{currentOrg?.name}</span>
                      <span className={styles.orgPlan}>{currentOrg?.plan} Plan</span>
                    </div>
                  )}
                  {!isSidebarCollapsed && <ChevronDown size={14} className={styles.chevron} />}
                </button>
              }
              items={[
                ...(organizations || []).map((org) => ({
                  id: org.id,
                  label: `${org.name} (${org.plan})`,
                  icon: Users,
                  onClick: () => {
                    switchOrg(org.id);
                    addToast({ title: `Switched to ${org.name}`, type: 'success' });
                  },
                })),
                { divider: true },
                {
                  id: 'org-settings',
                  label: 'Manage Organizations',
                  icon: Settings,
                  onClick: () => navigate('/app/settings'),
                },
              ]}
            />
          </div>

          {/* Navigation Links */}
          <nav className={styles.nav}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.navActive : ''} ${item.highlight ? styles.navHighlight : ''}`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                  title={item.label}
                >
                  <Icon size={18} className={styles.navIcon} />
                  {!isSidebarCollapsed && (
                    <span className={styles.navLabel}>{item.label}</span>
                  )}
                  {!isSidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className={styles.navBadge}>{item.badge}</span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Sidebar Footer with User Profile */}
          <div className={styles.sidebarFooter}>
            <Dropdown
              align="left"
              trigger={
                <button type="button" className={styles.userProfileBtn}>
                  <Avatar name={user?.name || 'User'} size="sm" src={user?.avatarUrl} />
                  {!isSidebarCollapsed && (
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{user?.name}</span>
                      <span className={styles.userRoleBadge}>{user?.role}</span>
                    </div>
                  )}
                </button>
              }
              items={[
                {
                  id: 'prof-settings',
                  label: 'Account & Profile',
                  icon: Settings,
                  onClick: () => navigate('/app/settings'),
                },
                {
                  id: 'prof-status',
                  label: 'System Diagnostic Status',
                  icon: ExternalLink,
                  onClick: () => navigate('/status'),
                },
                { divider: true },
                {
                  id: 'role-owner',
                  label: 'Role: OWNER (All Permissions)',
                  icon: Shield,
                  onClick: () => {
                    switchRole('OWNER');
                    addToast({ title: 'Role switched to OWNER', type: 'info' });
                  },
                },
                {
                  id: 'role-admin',
                  label: 'Role: ADMIN (Legal & Approvals)',
                  icon: Shield,
                  onClick: () => {
                    switchRole('ADMIN');
                    addToast({ title: 'Role switched to ADMIN', type: 'info' });
                  },
                },
                {
                  id: 'role-member',
                  label: 'Role: MEMBER (Standard Editor)',
                  icon: Shield,
                  onClick: () => {
                    switchRole('MEMBER');
                    addToast({ title: 'Role switched to MEMBER', type: 'info' });
                  },
                },
                {
                  id: 'role-viewer',
                  label: 'Role: VIEWER (Read-Only)',
                  icon: Shield,
                  onClick: () => {
                    switchRole('VIEWER');
                    addToast({ title: 'Role switched to VIEWER', type: 'warning' });
                  },
                },
                { divider: true },
                {
                  id: 'prof-reset',
                  label: 'Reset Demo Data',
                  icon: RotateCcw,
                  onClick: handleResetData,
                },
                {
                  id: 'prof-logout',
                  label: 'Sign Out',
                  icon: LogOut,
                  danger: true,
                  onClick: async () => {
                    await logout();
                    navigate('/login');
                  },
                },
              ]}
            />
            <button
              type="button"
              className={styles.collapseToggle}
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? '→' : '←'}
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <div className={styles.contentWrapper}>
          {/* Topbar */}
          <header className={styles.topbar}>
            <div className={styles.topbarLeft}>
              <button
                type="button"
                className={styles.mobileHamburger}
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open navigation menu"
              >
                <Menu size={20} />
              </button>

              {/* Global search trigger */}
              <button
                type="button"
                className={styles.searchTrigger}
                onClick={() => setIsPaletteOpen(true)}
              >
                <Search size={16} className={styles.searchIcon} />
                <span className={styles.searchText}>Quick search or action...</span>
                <kbd className={styles.cmdK}>⌘K</kbd>
              </button>
            </div>

            <div className={styles.topbarRight}>
              {/* AI Assistant drawer button */}
              <button
                type="button"
                className={styles.aiButton}
                onClick={toggleAI}
                title="AI Legal Copilot"
              >
                <Sparkles size={16} />
                <span className={styles.aiBtnText}>AI Copilot</span>
              </button>

              {/* Notifications Dropdown */}
              <Dropdown
                align="right"
                trigger={
                  <button
                    type="button"
                    className={styles.iconBtn}
                    aria-label="Notifications"
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className={styles.notifBadge}>{unreadCount}</span>
                    )}
                  </button>
                }
                items={[
                  ...(notifications || []).slice(0, 4).map((n) => ({
                    id: n.id,
                    label: n.title,
                    icon: Bell,
                    onClick: () => {
                      markAsRead(n.id);
                      if (n.link) navigate(n.link);
                    },
                  })),
                  { divider: true },
                  {
                    id: 'mark-all-read',
                    label: 'Mark all as read',
                    onClick: markAllAsRead,
                  },
                  {
                    id: 'view-all-notifs',
                    label: 'View all notifications',
                    onClick: () => navigate('/app/notifications'),
                  },
                ]}
              />

              {/* Theme toggle */}
              <button
                type="button"
                className={styles.iconBtn}
                onClick={toggleTheme}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                aria-label="Toggle color theme"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* New Agreement CTA */}
              <button
                type="button"
                className={styles.newAgreementBtn}
                onClick={() => navigate('/app/agreements/new')}
              >
                <Plus size={16} />
                <span>New Agreement</span>
              </button>
            </div>
          </header>

          {/* Main page content */}
          <main className={styles.pageContent}>
            <Outlet />
          </main>
        </div>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
      />

      {/* Global AI Assistant Drawer */}
      <AIDrawer />
    </div>
  );
}
