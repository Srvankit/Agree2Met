import { useState, useEffect, useRef } from 'react';
import { deleteAccount } from '../services/account.functions';
import { userService } from '../services/userService';
import { useWorkspace } from '../context/Workspace';
import { Button, Input, Modal } from '../components/demo/ui';
import s from './pages.module.css';

export function Account() {
  const { user, profile, setProfile, update, toast, logout } = useWorkspace();
  const fileInputRef = useRef(null);

  const [name, setName] = useState(profile?.display_name ?? user?.name ?? '');
  const [avatar, setAvatar] = useState(profile?.avatar_url ?? '');
  const [currentPassword, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  // Load real profile on mount
  useEffect(() => {
    let active = true;
    async function loadRealProfile() {
      try {
        const data = await userService.getProfile();
        if (!active || !data) return;
        const p = data.profile || data;
        const u = data.user;
        const displayName = p?.displayName || (p?.firstName ? `${p.firstName} ${p.lastName || ''}`.trim() : user?.name || '');
        const avatarUrl = p?.avatarUrl || '';
        setName(displayName);
        setAvatar(avatarUrl);
        setProfile({ display_name: displayName, avatar_url: avatarUrl });
      } catch (e) {
        // Fall back to context profile
        if (active && profile) {
          setName(profile.display_name ?? user?.name ?? '');
          setAvatar(profile.avatar_url ?? '');
        }
      }
    }
    loadRealProfile();
    return () => {
      active = false;
    };
  }, []);

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Avatar must be an image (PNG, JPEG, or WebP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Avatar file size must be less than 2MB.');
      return;
    }

    setUploadingAvatar(true);
    setError('');
    try {
      const res = await userService.uploadAvatar(file);
      const newAvatarUrl = res.avatarUrl || res.avatar_url || '';
      setAvatar(newAvatarUrl);
      setProfile((prev) => ({ ...(prev || {}), avatar_url: newAvatarUrl }));
      toast('Avatar updated successfully');
    } catch (err) {
      setError(err?.message || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const parts = name.trim().split(' ');
      const firstName = parts[0] || name.trim();
      const lastName = parts.slice(1).join(' ') || undefined;

      await userService.updateProfile({
        displayName: name.trim(),
        firstName,
        lastName,
      });

      update((d) => ({
        ...d,
        profile: { ...(d?.profile || {}), name: name.trim() },
      }));
      setProfile({ display_name: name.trim(), avatar_url: avatar || '' });
      toast('Your profile has been saved');
    } catch (err) {
      setError(err?.message || 'Failed to save profile');
    } finally {
      setBusy(false);
    }
  }

  async function change(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (password.length < 10) {
        throw new Error('New password must be at least 10 characters long.');
      }
      await userService.changePassword(currentPassword, password);
      setPassword('');
      setCurrent('');
      toast('Password changed successfully');
    } catch (err) {
      setError(err?.message || 'Failed to change password');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={s.page}>
      <div className={s.heading}>
        <div>
          <h1>Your account</h1>
          <p>Your Agree2Met profile and workspace security settings.</p>
        </div>
        <Button onClick={logout}>Sign out</Button>
      </div>

      {error && <div role="alert" className={s.error}>{error}</div>}

      <div className={s.formGrid}>
        <section className={s.panel}>
          <div className={s.panelHead}>
            <h2>Account profile</h2>
          </div>
          <form className={`${s.panelBody} ${s.stack}`} onSubmit={save}>
            <Input label="Display name" value={name} required onChange={(e) => setName(e.target.value)} />
            
            <div>
              <label className={s.label}>Avatar</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                {avatar ? (
                  <img
                    src={avatar}
                    alt="User avatar"
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'var(--muted, #eee)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                    }}
                  >
                    {name?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleAvatarUpload}
                  />
                  <Button
                    type="button"
                    disabled={uploadingAvatar}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadingAvatar ? 'Uploading…' : 'Upload photo'}
                  </Button>
                </div>
              </div>
            </div>

            <Input label="Email" value={user?.email ?? 'alex@agree2met.com'} readOnly />
            <Button type="submit" variant="primary" disabled={busy}>
              Save profile
            </Button>
          </form>
        </section>

        <section className={s.panel}>
          <div className={s.panelHead}>
            <h2>Change password</h2>
          </div>
          <form className={`${s.panelBody} ${s.stack}`} onSubmit={change}>
            <Input
              label="Current password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrent(e.target.value)}
            />
            <Input
              label="New password"
              type="password"
              required
              minLength={10}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" disabled={busy}>
              Update password
            </Button>
          </form>
        </section>
      </div>

      <section className={s.quickActions}>
        <Button variant="danger" onClick={() => setOpen(true)}>
          Delete account
        </Button>
      </section>

      <Modal open={open} onClose={() => setOpen(false)} title="Delete your account">
        <p>This permanently deletes your account and profile records. This action cannot be undone.</p>
        <Input
          label='Type "DELETE" to confirm'
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
        />
        <Input
          label="Enter your password to confirm"
          type="password"
          required
          value={deletePassword}
          onChange={(e) => setDeletePassword(e.target.value)}
        />
        <Button
          variant="danger"
          disabled={busy || confirmation !== 'DELETE' || !deletePassword}
          onClick={async () => {
            setBusy(true);
            setError('');
            try {
              await deleteAccount({ confirmation, password: deletePassword });
              setOpen(false);
              await logout();
            } catch (e) {
              if (e?.code === 'SOLE_OWNER_CANNOT_DELETE' || e?.message?.includes('sole owner')) {
                setError(e.message || 'You are the sole owner of an organization. Transfer ownership before deleting your account.');
              } else {
                setError(e?.message || 'Failed to delete account');
              }
              setOpen(false);
            } finally {
              setBusy(false);
            }
          }}
        >
          Permanently delete account
        </Button>
      </Modal>
    </main>
  );
}
