import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Sparkles,
  Layers,
  FileText,
  Clock,
  TrendingUp,
  Settings,
  Users,
  Archive,
  ArrowRight,
  Sun,
  Moon,
  RotateCcw,
} from 'lucide-react';
import { useOrganization } from '../../context/OrganizationContext';
import { useAIAssistant } from '../../context/AIAssistantContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { agreementsService } from '../../services';
import styles from './CommandPalette.module.css';

export function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [agreements, setAgreements] = useState([]);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { currentOrg, switchOrg, organizations } = useOrganization();
  const { toggle: toggleAI } = useAIAssistant();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      agreementsService.list({ pageSize: 40 }).then((res) => {
        setAgreements(res.items || []);
      });
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Static action items
  const staticActions = [
    {
      id: 'act-new-agr',
      category: 'Quick Actions',
      title: 'Create New Agreement',
      icon: Plus,
      run: () => navigate('/app/agreements/new'),
    },
    {
      id: 'act-ai',
      category: 'Quick Actions',
      title: 'Open AI Assistant',
      icon: Sparkles,
      run: () => toggleAI(),
    },
    {
      id: 'act-theme',
      category: 'Quick Actions',
      title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      icon: theme === 'dark' ? Sun : Moon,
      run: () => toggleTheme(),
    },
    {
      id: 'act-reset',
      category: 'Quick Actions',
      title: 'Reset Demo Data to Factory Defaults',
      icon: RotateCcw,
      run: async () => {
        await agreementsService.resetDemoData();
        addToast({ title: 'Demo Data Reset', message: 'Storage re-initialized with fresh sample contracts.', type: 'info' });
        window.location.reload();
      },
    },
    {
      id: 'nav-dashboard',
      category: 'Pages',
      title: 'Dashboard Overview',
      icon: Layers,
      run: () => navigate('/app/dashboard'),
    },
    {
      id: 'nav-agreements',
      category: 'Pages',
      title: 'Agreements Repository',
      icon: FileText,
      run: () => navigate('/app/agreements'),
    },
    {
      id: 'nav-templates',
      category: 'Pages',
      title: 'Contract Templates',
      icon: FileText,
      run: () => navigate('/app/templates'),
    },
    {
      id: 'nav-deadlines',
      category: 'Pages',
      title: 'Deadlines & Renewal Calendar',
      icon: Clock,
      run: () => navigate('/app/deadlines'),
    },
    {
      id: 'nav-analytics',
      category: 'Pages',
      title: 'Analytics & Reports',
      icon: TrendingUp,
      run: () => navigate('/app/analytics'),
    },
    {
      id: 'nav-team',
      category: 'Pages',
      title: 'Team & Members',
      icon: Users,
      run: () => navigate('/app/team'),
    },
    {
      id: 'nav-archive',
      category: 'Pages',
      title: 'Archived Agreements',
      icon: Archive,
      run: () => navigate('/app/archive'),
    },
    {
      id: 'nav-settings',
      category: 'Pages',
      title: 'Organization Settings',
      icon: Settings,
      run: () => navigate('/app/settings'),
    },
  ];

  // Org switcher actions
  const orgActions = organizations
    .filter((o) => o.id !== currentOrg?.id)
    .map((org) => ({
      id: `switch-${org.id}`,
      category: 'Workspaces',
      title: `Switch to ${org.name}`,
      icon: Users,
      run: () => {
        switchOrg(org.id);
        addToast({ title: 'Workspace Changed', message: `Now viewing ${org.name}`, type: 'success' });
      },
    }));

  // Dynamic agreement search
  const filteredAgreements = agreements
    .filter((a) =>
      query.trim() === ''
        ? false
        : a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.number.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 6)
    .map((a) => ({
      id: a.id,
      category: 'Agreements',
      title: `${a.number} — ${a.title}`,
      subtitle: `${a.status.replace(/_/g, ' ')} • $${(a.value || 0).toLocaleString()} USD`,
      icon: FileText,
      run: () => navigate(`/app/agreements/${a.id}`),
    }));

  const allItems = [
    ...filteredAgreements,
    ...orgActions.filter((o) =>
      query.trim() === '' ? true : o.title.toLowerCase().includes(query.toLowerCase())
    ),
    ...staticActions.filter((a) =>
      query.trim() === '' ? true : a.title.toLowerCase().includes(query.toLowerCase())
    ),
  ];

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((idx) => (idx + 1) % (allItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((idx) => (idx - 1 + (allItems.length || 1)) % (allItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        allItems[selectedIndex].run();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Command palette"
      >
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            placeholder="Search contracts, actions, or pages... (↑↓ to select)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <kbd className={styles.escBadge}>Esc</kbd>
        </div>

        <div className={styles.resultsList}>
          {allItems.length === 0 ? (
            <div className={styles.empty}>No matching commands or contracts found.</div>
          ) : (
            allItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`${styles.item} ${isSelected ? styles.selected : ''}`}
                  onClick={() => {
                    item.run();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className={styles.itemLeft}>
                    {Icon && <Icon size={16} className={styles.itemIcon} />}
                    <div>
                      <div className={styles.itemTitle}>{item.title}</div>
                      {item.subtitle && (
                        <div className={styles.itemSubtitle}>{item.subtitle}</div>
                      )}
                    </div>
                  </div>
                  <div className={styles.itemRight}>
                    <span className={styles.itemCategory}>{item.category}</span>
                    <ArrowRight size={14} className={styles.arrowIcon} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
