import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { seed, load, persist, appendAudit, MOCK_STORAGE_KEY } from '../services/mock';
import { authService } from '../services/authService';
import { transition } from '../domain/lifecycle';
import { uiStyles, IconButton } from '../components/demo/ui';
import { X, CheckCircle2 } from 'lucide-react';

const Context = createContext(null);

export function WorkspaceProvider({ children }) {
  const [data, setData] = useState(seed);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [theme, setThemeState] = useState('system');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const router = useRouter();
  const query = useQueryClient();
  const navigate = useNavigate();
  const currentData = useRef(data);

  useEffect(() => {
    try {
      const loaded = load();
      setData(loaded);
      setThemeState(localStorage.getItem('agree2met-theme') ?? 'system');
      if (loaded.profile) {
        setUser({
          id: 'usr-demo-01',
          name: loaded.profile.name || 'Alex Morgan',
          email: loaded.profile.email || 'alex@agree2met.com',
          role: loaded.demoRole || 'Owner',
        });
        setProfile({
          display_name: loaded.profile.name || 'Alex Morgan',
          avatar_url: '',
        });
      }
    } catch (e) {
      setError(e.message);
    }
    setReady(true);

    // If real session exists, restore it seamlessly
    authService.getSession().then((session) => {
      if (session) {
        setUser(session);
        setProfile({
          display_name: session.display_name || session.name,
          avatar_url: session.avatar_url || '',
        });
        setData((d) => ({
          ...d,
          profile: { name: session.name, email: session.email },
          demoRole: session.role || 'Owner',
          org: session.organizations?.[0]?.id || d.org,
          orgName: session.organizations?.[0]?.name || d.orgName,
        }));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (ready && !error) {
      try {
        persist(data);
      } catch {
        setError('Your browser storage is full or unavailable. Export your demo data, then reset it.');
      }
    }
  }, [data, ready, error]);

  useEffect(() => {
    if (!ready) return;
    const apply = () => {
      document.documentElement.dataset.theme =
        theme === 'system'
          ? matchMedia('(prefers-color-scheme:dark)').matches
            ? 'dark'
            : 'light'
          : theme;
    };
    apply();
    try {
      localStorage.setItem('agree2met-theme', theme);
    } catch {}
    const m = matchMedia('(prefers-color-scheme:dark)');
    m.addEventListener('change', apply);
    return () => m.removeEventListener('change', apply);
  }, [theme, ready]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  currentData.current = data;

  const update = useCallback((fn) => {
    const next = fn(currentData.current);
    currentData.current = next;
    setData(next);
  }, []);

  async function editAgreement(id, changes, action = 'Agreement updated') {
    const a = currentData.current.agreements?.find((x) => x.id === id);
    if (!a) return;
    if (changes.status && changes.status !== a.status) transition(a.status, changes.status);
    const event = await appendAudit(a, action);
    update((d) => ({
      ...d,
      agreements: (d.agreements || []).map((x) =>
        x.id === id ? { ...x, ...changes, audit: [...(x.audit || []), event] } : x
      ),
    }));
    setToast(action);
  }

  async function login(email, password) {
    const res = await authService.login(email, password);
    const session = await authService.getSession().catch(() => null);
    const activeUser = session || res.user;
    setUser(activeUser);
    setProfile({
      display_name: activeUser.display_name || activeUser.name,
      avatar_url: activeUser.avatar_url || '',
    });
    update((d) => ({
      ...d,
      profile: { name: activeUser.name, email: activeUser.email },
      demoRole: activeUser.role || 'Owner',
      org: activeUser.organizations?.[0]?.id || d.org,
      orgName: activeUser.organizations?.[0]?.name || d.orgName,
    }));
    setToast('Signed in successfully');
    return activeUser;
  }

  async function logout() {
    await query.cancelQueries();
    query.clear();
    await authService.logout();
    setUser(null);
    setProfile(null);
    navigate({ to: '/auth', replace: true });
  }

  function switchRole(newRole) {
    update((d) => ({
      ...d,
      demoRole: newRole,
    }));
    if (user) {
      setUser({ ...user, role: newRole });
    }
    setToast(`Role switched to ${newRole}`);
  }

  function reset() {
    try {
      localStorage.removeItem(MOCK_STORAGE_KEY);
    } catch {}
    setError('');
    const fresh = seed();
    setData(fresh);
    setUser({
      id: 'usr-demo-01',
      name: fresh.profile.name,
      email: fresh.profile.email,
      role: fresh.demoRole,
    });
    setProfile({ display_name: fresh.profile.name, avatar_url: '' });
    setToast('Demo data reset');
  }

  return (
    <Context.Provider
      value={{
        data,
        update,
        ready,
        error,
        toast: setToast,
        theme,
        setTheme: setThemeState,
        user,
        profile,
        setProfile,
        login,
        logout,
        switchRole,
        editAgreement,
        reset,
      }}
    >
      {children}
      {toast && (
        <div role="status" className={uiStyles.toast}>
          <CheckCircle2 size={18} />
          {toast}
          <IconButton icon={X} label="Dismiss" onClick={() => setToast('')} />
        </div>
      )}
    </Context.Provider>
  );
}

export const useWorkspace = () => useContext(Context);
