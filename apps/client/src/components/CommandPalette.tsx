import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Building2,
  CalendarCheck,
  DollarSign,
  Calendar,
  Wrench,
  Mail,
  Heart,
  Settings,
  FileText,
  Briefcase,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  category: 'pages' | 'properties' | 'bookings';
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords?: string[];
}

const demoProperties = [
  { id: 'p1', name: 'Rothschild Residence 45', location: 'Tel Aviv' },
  { id: 'p2', name: 'Carmel Vista Suite', location: 'Haifa' },
  { id: 'p3', name: 'Jaffa Heritage Loft', location: 'Jaffa' },
];

const demoBookings = [
  { id: 'b1', guest: 'John Smith', property: 'Rothschild Residence 45' },
  { id: 'b2', guest: 'Emma Wilson', property: 'Carmel Vista Suite' },
];

const RECENT_KEY = 'sivan-client-cmd-recent';
const MAX_RECENT = 5;

function fuzzyMatch(text: string, query: string): boolean {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  if (lowerText.includes(lowerQuery)) return true;
  let qi = 0;
  for (let ti = 0; ti < lowerText.length && qi < lowerQuery.length; ti++) {
    if (lowerText[ti] === lowerQuery[qi]) qi++;
  }
  return qi === lowerQuery.length;
}

const categoryConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  pages: { label: 'Pages', icon: LayoutDashboard },
  properties: { label: 'Properties', icon: Building2 },
  bookings: { label: 'Bookings', icon: CalendarCheck },
};

export default function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allItems = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];
    const pages = [
      { label: 'Dashboard', path: '/', icon: LayoutDashboard, keywords: ['home'] },
      { label: 'Portfolio', path: '/portfolio', icon: Briefcase, keywords: ['overview'] },
      { label: 'Properties', path: '/properties', icon: Building2, keywords: ['listings'] },
      { label: 'Bookings', path: '/bookings', icon: CalendarCheck, keywords: ['reservations'] },
      { label: 'Calendar', path: '/calendar', icon: Calendar, keywords: ['schedule'] },
      { label: 'Financial Summary', path: '/financials', icon: DollarSign, keywords: ['money'] },
      { label: 'Documents', path: '/documents', icon: FileText, keywords: ['files'] },
      { label: 'Maintenance', path: '/maintenance', icon: Wrench, keywords: ['repairs'] },
      { label: 'Messages', path: '/messages', icon: Mail, keywords: ['inbox'] },
      { label: 'Loyalty', path: '/loyalty', icon: Heart, keywords: ['rewards'] },
      { label: 'Settings', path: '/settings', icon: Settings, keywords: ['preferences'] },
    ];
    pages.forEach((p) => {
      items.push({
        id: `page-${p.path}`,
        label: p.label,
        description: `Go to ${p.label}`,
        category: 'pages',
        icon: p.icon,
        action: () => navigate(p.path),
        keywords: p.keywords,
      });
    });
    demoProperties.forEach((p) => {
      items.push({
        id: `prop-${p.id}`,
        label: p.name,
        description: p.location,
        category: 'properties',
        icon: Building2,
        action: () => navigate(`/properties`),
        keywords: [p.location],
      });
    });
    demoBookings.forEach((b) => {
      items.push({
        id: `booking-${b.id}`,
        label: `${b.guest} - ${b.property}`,
        description: `Booking by ${b.guest}`,
        category: 'bookings',
        icon: CalendarCheck,
        action: () => navigate(`/bookings`),
        keywords: [b.guest, b.property],
      });
    });
    return items;
  }, [navigate]);

  const filtered = useMemo(() => {
    if (!query.trim()) {
      const recent = recentIds
        .map((id) => allItems.find((i) => i.id === id))
        .filter(Boolean) as CommandItem[];
      const pages = allItems.filter((i) => i.category === 'pages').slice(0, 6);
      return { recent, results: pages };
    }
    const matches = allItems.filter((item) => {
      if (fuzzyMatch(item.label, query)) return true;
      if (item.description && fuzzyMatch(item.description, query)) return true;
      if (item.keywords?.some((kw) => fuzzyMatch(kw, query))) return true;
      return false;
    });
    return { recent: [], results: matches };
  }, [query, allItems, recentIds]);

  const flatList = useMemo(() => {
    return [...filtered.recent, ...filtered.results.filter((r) => !filtered.recent.find((rc) => rc.id === r.id))];
  }, [filtered]);

  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    flatList.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [flatList]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatList.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = flatList[selectedIndex];
        if (item) selectItem(item);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    },
    [flatList, selectedIndex],
  );

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const selectItem = (item: CommandItem) => {
    const newRecent = [item.id, ...recentIds.filter((id) => id !== item.id)].slice(0, MAX_RECENT);
    setRecentIds(newRecent);
    localStorage.setItem(RECENT_KEY, JSON.stringify(newRecent));
    setOpen(false);
    item.action();
  };

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-command-palette', handler);
    return () => window.removeEventListener('open-command-palette', handler);
  }, []);

  if (!open) return null;

  let globalIndex = 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div
        className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: 'rgba(3, 3, 3, 0.95)', backdropFilter: 'blur(40px)' }}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
          <Search className="w-5 h-5 text-white/40 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, properties, bookings..."
            className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 outline-none"
          />
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.06] text-white/30 text-[10px] font-mono">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
          {filtered.recent.length > 0 && !query && (
            <div className="px-5 py-1.5 flex items-center gap-2 text-[10px] font-semibold tracking-[0.15em] text-white/25 uppercase">
              <Clock className="w-3 h-3" />
              <span>Recent</span>
            </div>
          )}

          {Object.entries(grouped).length === 0 && (
            <div className="px-5 py-8 text-center text-white/30 text-sm">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {Object.entries(grouped).map(([category, items]) => {
            const config = categoryConfig[category];
            return (
              <div key={category}>
                {query && (
                  <div className="px-5 py-1.5 flex items-center gap-2 text-[10px] font-semibold tracking-[0.15em] text-white/25 uppercase mt-1">
                    {config && <config.icon className="w-3 h-3" />}
                    <span>{config?.label || category}</span>
                  </div>
                )}
                {items.map((item) => {
                  const idx = globalIndex++;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      data-index={idx}
                      onClick={() => selectItem(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center gap-3 px-5 py-2.5 text-start transition-colors ${
                        isSelected ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
                      }`}
                    >
                      <item.icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-secondary-container' : 'text-white/30'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${isSelected ? 'text-white' : 'text-white/70'}`}>{item.label}</p>
                        {item.description && (
                          <p className="text-xs text-white/25 truncate">{item.description}</p>
                        )}
                      </div>
                      {isSelected && <ArrowRight className="w-4 h-4 text-secondary-container flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 px-5 py-3 border-t border-white/[0.06] text-[10px] text-white/20">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] font-mono">&uarr;&darr;</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] font-mono">&crarr;</kbd>
            Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] font-mono">Esc</kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
