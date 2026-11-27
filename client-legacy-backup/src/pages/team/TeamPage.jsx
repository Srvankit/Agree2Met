import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Trash2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { Select } from '../../components/ui/Form/Select';
import { Avatar } from '../../components/ui/DataDisplay/Avatar';
import { Badge } from '../../components/ui/DataDisplay/Badge';
import { Table } from '../../components/ui/DataDisplay/Table';
import { Modal } from '../../components/ui/Overlay/Modal';
import { ConfirmDialog } from '../../components/ui/Overlay/ConfirmDialog';
import { Banner } from '../../components/ui/Feedback/Banner';
import { EmptyState } from '../../components/ui/Feedback/EmptyState';
import { Skeleton } from '../../components/ui/Feedback/Skeleton';
import { useToast } from '../../context/ToastContext';
import { useOrganization } from '../../context/OrganizationContext';
import { useAuth } from '../../context/AuthContext';
import { organizationsService } from '../../services';
import styles from './TeamPage.module.css';

export function TeamPage() {
  const { currentOrg } = useOrganization();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Invite modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviteTitle, setInviteTitle] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  // Remove dialog
  const [removeTarget, setRemoveTarget] = useState(null);

  const isOwnerOrAdmin = ['OWNER', 'ADMIN'].includes((user?.role || '').toUpperCase());

  const loadMembers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await organizationsService.getMembers(currentOrg?.id);
      setMembers(res || []);
    } catch {
      showToast({ title: 'Failed to load team members', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id, showToast]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        m.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.email?.toLowerCase().includes(search.toLowerCase()) ||
        m.title?.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;

      if (roleFilter === 'ALL') return true;
      return m.role?.toUpperCase() === roleFilter;
    });
  }, [members, search, roleFilter]);

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes('@')) {
      showToast({ title: 'Please provide a valid email address', variant: 'warning' });
      return;
    }

    try {
      setIsInviting(true);
      const newMember = await organizationsService.inviteMember({
        email: inviteEmail.trim(),
        role: inviteRole,
        title: inviteTitle.trim() || 'Team Member',
      });
      setMembers((prev) => [...prev, newMember]);
      showToast({ title: `Invitation sent to ${inviteEmail}`, variant: 'success' });
      setInviteModalOpen(false);
      setInviteEmail('');
      setInviteTitle('');
      setInviteRole('MEMBER');
    } catch {
      showToast({ title: 'Failed to invite team member', variant: 'danger' });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await organizationsService.updateMemberRole(memberId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
      showToast({ title: 'Member role updated', variant: 'success' });
    } catch {
      showToast({ title: 'Could not change member role', variant: 'danger' });
    }
  };

  const handleRemoveConfirm = async () => {
    if (!removeTarget) return;
    try {
      await organizationsService.removeMember(removeTarget.id);
      setMembers((prev) => prev.filter((m) => m.id !== removeTarget.id));
      showToast({ title: `${removeTarget.name} removed from organization`, variant: 'success' });
      setRemoveTarget(null);
    } catch {
      showToast({ title: 'Failed to remove member', variant: 'danger' });
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Member',
      render: (m) => (
        <div className={styles.userCell}>
          <Avatar name={m.name || m.email} size="md" />
          <div>
            <div className={styles.userName}>{m.name || m.email.split('@')[0]}</div>
            <div className={styles.userTitle}>{m.title || 'Team Member'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (m) => <span className={styles.userEmail}>{m.email}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      render: (m) => {
        if (!isOwnerOrAdmin || m.id === user?.id) {
          const roleVariants = {
            OWNER: 'primary',
            ADMIN: 'info',
            MEMBER: 'success',
            VIEWER: 'neutral',
          };
          return (
            <Badge variant={roleVariants[m.role?.toUpperCase()] || 'neutral'}>
              {m.role}
            </Badge>
          );
        }

        return (
          <div style={{ maxWidth: '140px' }}>
            <Select
              value={m.role?.toUpperCase()}
              onChange={(e) => handleRoleChange(m.id, e.target.value)}
              options={[
                { value: 'OWNER', label: 'OWNER' },
                { value: 'ADMIN', label: 'ADMIN' },
                { value: 'MEMBER', label: 'MEMBER' },
                { value: 'VIEWER', label: 'VIEWER' },
              ]}
            />
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (m) => {
        if (!isOwnerOrAdmin || m.id === user?.id) {
          return null;
        }

        return (
          <div className={styles.actionsCell}>
            <Button
              size="sm"
              variant="ghost"
              icon={<Trash2 size={14} />}
              onClick={() => setRemoveTarget(m)}
              ariaLabel={`Remove ${m.name}`}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Team & Access Control</h1>
          <p className={styles.subtitle}>
            Manage workspace members, roles, and authorization for {currentOrg?.name}.
          </p>
        </div>
        {isOwnerOrAdmin && (
          <Button
            variant="primary"
            icon={<UserPlus size={16} />}
            onClick={() => setInviteModalOpen(true)}
          >
            Invite Member
          </Button>
        )}
      </div>

      {!isOwnerOrAdmin && (
        <Banner
          variant="info"
          title="Read-Only Team View"
          message={`You are currently signed in as a ${user?.role || 'MEMBER'}. Role assignments and member invitations require OWNER or ADMIN privileges.`}
        />
      )}

      {/* Filter and Search */}
      <div className={styles.filterControls}>
        <div className={styles.searchWrap}>
          <Input
            placeholder="Search team members by name, email, or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startIcon={<Search size={16} />}
          />
        </div>
        <div className={styles.rolePills}>
          {['ALL', 'OWNER', 'ADMIN', 'MEMBER', 'VIEWER'].map((r) => (
            <button
              key={r}
              type="button"
              className={`${styles.rolePill} ${roleFilter === r ? styles.rolePillActive : ''}`}
              onClick={() => setRoleFilter(r)}
            >
              {r === 'ALL' ? 'All Roles' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Member Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Skeleton height="50px" />
          <Skeleton height="60px" />
          <Skeleton height="60px" />
          <Skeleton height="60px" />
        </div>
      ) : filteredMembers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team members found"
          description="Try modifying your search or invite a new colleague to your workspace."
          actionLabel={isOwnerOrAdmin ? 'Invite First Member' : undefined}
          onAction={isOwnerOrAdmin ? () => setInviteModalOpen(true) : undefined}
        />
      ) : (
        <div className={styles.tableWrap}>
          <Table columns={columns} data={filteredMembers} />
        </div>
      )}

      {/* Invite Member Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite New Team Member"
        size="md"
      >
        <form onSubmit={handleInviteSubmit} className={styles.modalBody}>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Send an invitation to join <strong>{currentOrg?.name}</strong>. An email notification will be dispatched.
          </p>

          <div>
            <label
              htmlFor="invite-email"
              style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}
            >
              Corporate Email Address *
            </label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              htmlFor="invite-role"
              style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}
            >
              Workspace Role
            </label>
            <Select
              id="invite-role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              options={[
                { value: 'OWNER', label: 'OWNER (Full control + billing)' },
                { value: 'ADMIN', label: 'ADMIN (Create, sign, manage agreements)' },
                { value: 'MEMBER', label: 'MEMBER (Draft and review agreements)' },
                { value: 'VIEWER', label: 'VIEWER (Read-only access)' },
              ]}
            />
          </div>

          <div>
            <label
              htmlFor="invite-title"
              style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}
            >
              Job Title / Department
            </label>
            <Input
              id="invite-title"
              placeholder="e.g. Legal Counsel, Head of Procurement"
              value={inviteTitle}
              onChange={(e) => setInviteTitle(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <Button variant="outline" type="button" onClick={() => setInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={isInviting}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remove Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(removeTarget)}
        title="Remove Team Member"
        message={`Are you sure you want to remove ${removeTarget?.name} (${removeTarget?.email}) from this workspace? They will lose access to all agreements immediately.`}
        confirmLabel="Remove Member"
        variant="danger"
        onConfirm={handleRemoveConfirm}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}
