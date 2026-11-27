import { useState, useEffect } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { deleteAccount } from '../services/account.functions';
import { useWorkspace } from '../context/Workspace';
import { Button, Input, Modal } from '../components/demo/ui';
import s from './pages.module.css';

export function Account() {
  const { user, profile, setProfile, update, toast, logout } = useWorkspace();
  const remove = useServerFn(deleteAccount);
  const [name, setName] = useState(profile?.display_name ?? user?.name ?? '');
  const [avatar, setAvatar] = useState(profile?.avatar_url ?? '');
  const [currentPassword, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');

  useEffect(() => {
    setName(profile?.display_name ?? user?.name ?? '');
    setAvatar(profile?.avatar_url ?? '');
  }, [profile, user]);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      update((d) => ({
        ...d,
        profile: { ...(d?.profile || {}), name },
      }));
      setProfile({ display_name: name, avatar_url: avatar || '' });
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
      if (password.length < 8) {
        throw new Error('New password must be at least 8 characters long.');
      }
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
            <Input
              label="Avatar URL (optional)"
              type="url"
              placeholder="https://…"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
            />
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
              minLength={8}
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
        <p>This permanently deletes your account and profile records. Browser-local demo agreements will be reset.</p>
        <Input
          label='Type "DELETE" to confirm'
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
        />
        <Button
          variant="danger"
          disabled={busy || confirmation !== 'DELETE'}
          onClick={async () => {
            setBusy(true);
            try {
              await remove({ data: { confirmation } });
              setOpen(false);
              await logout();
            } catch (e) {
              setError(e.message);
              setOpen(false);
            }
            setBusy(false);
          }}
        >
          Permanently delete account
        </Button>
      </Modal>
    </main>
  );
}
