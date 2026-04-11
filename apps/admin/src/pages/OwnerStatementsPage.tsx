import { useState, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Plus,
  Check,
  Send,
  Download,
  ChevronDown,
  ChevronRight,
  DollarSign,
  TrendingUp,
  Receipt,
} from 'lucide-react';
import { toast } from 'sonner';

type StatementStatus = 'DRAFT' | 'APPROVED' | 'SENT';

interface StatementProperty {
  propertyId: string;
  propertyName: string;
  bookings: { guestName: string; checkIn: string; checkOut: string; nights: number; revenue: number }[];
  totalRevenue: number;
  expenses: { category: string; description: string; amount: number }[];
  totalExpenses: number;
  managementFee: number;
  feeType: string;
  netIncome: number;
}

interface Statement {
  id: string;
  ownerId: string;
  ownerName: string;
  periodMonth: number;
  periodYear: number;
  properties: StatementProperty[];
  totalIncome: number;
  totalExpenses: number;
  totalManagementFees: number;
  netPayout: number;
  currency: string;
  status: StatementStatus;
  generatedAt: string;
}

const statusStyles: Record<StatementStatus, string> = {
  DRAFT: 'bg-outline-variant/20 text-on-surface-variant',
  APPROVED: 'bg-secondary/10 text-secondary',
  SENT: 'bg-success/10 text-success',
};

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const demoOwners = [
  { id: 'owner-1', name: 'Dimitris Papadopoulos' },
  { id: 'owner-2', name: 'Maria Konstantinou' },
  { id: 'owner-3', name: 'Yannis Alexiou' },
];

const demoStatements: Statement[] = [
  {
    id: 'stmt-1',
    ownerId: 'owner-1',
    ownerName: 'Dimitris Papadopoulos',
    periodMonth: 3,
    periodYear: 2026,
    properties: [
      {
        propertyId: 'prop-1', propertyName: 'Santorini Sunset Villa',
        bookings: [
          { guestName: 'Marcus Lindqvist', checkIn: '2026-03-01', checkOut: '2026-03-08', nights: 7, revenue: 1960 },
          { guestName: 'Sophie Dubois', checkIn: '2026-03-14', checkOut: '2026-03-21', nights: 7, revenue: 1820 },
        ],
        totalRevenue: 3780,
        expenses: [
          { category: 'Cleaning', description: 'Professional cleaning x2', amount: 180 },
          { category: 'Utilities', description: 'Electricity + Water', amount: 120 },
        ],
        totalExpenses: 300, managementFee: 378, feeType: '10%', netIncome: 3102,
      },
      {
        propertyId: 'prop-2', propertyName: 'Athens Central Loft',
        bookings: [
          { guestName: 'James Richardson', checkIn: '2026-03-05', checkOut: '2026-03-12', nights: 7, revenue: 980 },
        ],
        totalRevenue: 980,
        expenses: [
          { category: 'Cleaning', description: 'Deep clean', amount: 120 },
          { category: 'Maintenance', description: 'Plumbing repair', amount: 85 },
        ],
        totalExpenses: 205, managementFee: 400, feeType: 'Minimum', netIncome: 375,
      },
    ],
    totalIncome: 4760, totalExpenses: 505, totalManagementFees: 778, netPayout: 3477, currency: 'EUR',
    status: 'SENT', generatedAt: '2026-04-02',
  },
  {
    id: 'stmt-2',
    ownerId: 'owner-2',
    ownerName: 'Maria Konstantinou',
    periodMonth: 3,
    periodYear: 2026,
    properties: [
      {
        propertyId: 'prop-3', propertyName: 'Mykonos Beach House',
        bookings: [
          { guestName: 'Hans Weber', checkIn: '2026-03-10', checkOut: '2026-03-17', nights: 7, revenue: 2100 },
          { guestName: 'Anna Kowalski', checkIn: '2026-03-20', checkOut: '2026-03-27', nights: 7, revenue: 2100 },
        ],
        totalRevenue: 4200,
        expenses: [
          { category: 'Cleaning', description: 'Professional cleaning x2', amount: 200 },
          { category: 'Supplies', description: 'Guest amenities restock', amount: 75 },
        ],
        totalExpenses: 275, managementFee: 420, feeType: '10%', netIncome: 3505,
      },
    ],
    totalIncome: 4200, totalExpenses: 275, totalManagementFees: 420, netPayout: 3505, currency: 'EUR',
    status: 'APPROVED', generatedAt: '2026-04-03',
  },
  {
    id: 'stmt-3',
    ownerId: 'owner-3',
    ownerName: 'Yannis Alexiou',
    periodMonth: 3,
    periodYear: 2026,
    properties: [
      {
        propertyId: 'prop-5', propertyName: 'Rhodes Old Town Apt',
        bookings: [
          { guestName: 'Oliver Bennett', checkIn: '2026-03-08', checkOut: '2026-03-15', nights: 7, revenue: 1050 },
        ],
        totalRevenue: 1050,
        expenses: [{ category: 'Cleaning', description: 'Standard cleaning', amount: 80 }],
        totalExpenses: 80, managementFee: 300, feeType: 'Minimum', netIncome: 670,
      },
    ],
    totalIncome: 1050, totalExpenses: 80, totalManagementFees: 300, netPayout: 670, currency: 'EUR',
    status: 'DRAFT', generatedAt: '2026-04-05',
  },
];

export default function OwnerStatementsPage() {
  const { t } = useTranslation();
  const [statements, setStatements] = useState(demoStatements);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [genOwner, setGenOwner] = useState('owner-1');
  const [genMonth, setGenMonth] = useState('3');
  const [genYear, setGenYear] = useState('2026');

  const totalNetPayout = statements.reduce((sum, s) => sum + s.netPayout, 0);
  const totalIncome = statements.reduce((sum, s) => sum + s.totalIncome, 0);
  const totalFees = statements.reduce((sum, s) => sum + s.totalManagementFees, 0);

  const handleGenerate = () => {
    const owner = demoOwners.find((o) => o.id === genOwner);
    const newStmt: Statement = {
      id: `stmt-${Date.now()}`,
      ownerId: genOwner,
      ownerName: owner?.name || 'Unknown',
      periodMonth: Number(genMonth),
      periodYear: Number(genYear),
      properties: [{
        propertyId: 'prop-auto', propertyName: `${owner?.name} - Property A`,
        bookings: [{ guestName: 'Demo Guest', checkIn: `${genYear}-${genMonth.padStart(2, '0')}-05`, checkOut: `${genYear}-${genMonth.padStart(2, '0')}-12`, nights: 7, revenue: 1400 }],
        totalRevenue: 1400,
        expenses: [{ category: 'Cleaning', description: 'Standard clean', amount: 90 }],
        totalExpenses: 90, managementFee: 140, feeType: '10%', netIncome: 1170,
      }],
      totalIncome: 1400, totalExpenses: 90, totalManagementFees: 140, netPayout: 1170, currency: 'EUR',
      status: 'DRAFT', generatedAt: new Date().toISOString().split('T')[0],
    };
    setStatements((prev) => [newStmt, ...prev]);
    toast.success(t('ownerStatements.generated'));
  };

  const handleApprove = (id: string) => {
    setStatements((prev) => prev.map((s) => s.id === id ? { ...s, status: 'APPROVED' as StatementStatus } : s));
    toast.success(t('ownerStatements.approved'));
  };

  const handleSend = (id: string) => {
    setStatements((prev) => prev.map((s) => s.id === id ? { ...s, status: 'SENT' as StatementStatus } : s));
    toast.success(t('ownerStatements.sent'));
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
          {t('ownerStatements.label')}
        </p>
        <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
          {t('ownerStatements.title')}
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest rounded-xl px-5 py-4 ambient-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('ownerStatements.totalIncome')}</p>
            <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-success" />
            </div>
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">{'\u20AC'}{totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl px-5 py-4 ambient-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('ownerStatements.totalFees')}</p>
            <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5 text-warning" />
            </div>
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">{'\u20AC'}{totalFees.toLocaleString()}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl px-5 py-4 ambient-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('ownerStatements.totalPayout')}</p>
            <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 text-secondary" />
            </div>
          </div>
          <p className="font-headline text-xl font-bold text-secondary">{'\u20AC'}{totalNetPayout.toLocaleString()}</p>
        </div>
      </div>

      {/* Generate Form */}
      <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
        <h2 className="font-headline text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-secondary" />
          {t('ownerStatements.generateStatement')}
        </h2>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('owners.ownerName')}</label>
            <select value={genOwner} onChange={(e) => setGenOwner(e.target.value)} className="px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30">
              {demoOwners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('ownerStatements.month')}</label>
            <select value={genMonth} onChange={(e) => setGenMonth(e.target.value)} className="px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30">
              {months.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('ownerStatements.year')}</label>
            <select value={genYear} onChange={(e) => setGenYear(e.target.value)} className="px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30">
              {['2026', '2025', '2024'].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={handleGenerate} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all">
            <FileText className="w-4 h-4" />
            {t('ownerStatements.generate')}
          </button>
        </div>
      </div>

      {/* Statements Table */}
      <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/20">
                <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant w-8"></th>
                <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('owners.ownerName')}</th>
                <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('ownerStatements.period')}</th>
                <th className="text-end py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('finance.income')}</th>
                <th className="text-end py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('finance.expenses')}</th>
                <th className="text-end py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('ownerStatements.fees')}</th>
                <th className="text-end py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('ownerStatements.netPayout')}</th>
                <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('bookings.status')}</th>
                <th className="text-center py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('owners.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {statements.map((stmt) => (
                <Fragment key={stmt.id}>
                  <tr
                    className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === stmt.id ? null : stmt.id)}
                  >
                    <td className="py-3 px-4">
                      {expandedId === stmt.id ? <ChevronDown className="w-4 h-4 text-on-surface-variant" /> : <ChevronRight className="w-4 h-4 text-on-surface-variant" />}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-on-surface">{stmt.ownerName}</td>
                    <td className="py-3 px-4 text-sm text-on-surface-variant">{months[stmt.periodMonth - 1]} {stmt.periodYear}</td>
                    <td className="py-3 px-4 text-sm text-end text-on-surface">{'\u20AC'}{stmt.totalIncome.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-end text-error">{'\u20AC'}{stmt.totalExpenses.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-end text-warning">{'\u20AC'}{stmt.totalManagementFees.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-end font-bold text-secondary">{'\u20AC'}{stmt.netPayout.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusStyles[stmt.status]}`}>
                        {stmt.status}
                      </span>
                    </td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        {stmt.status === 'DRAFT' && (
                          <button onClick={() => handleApprove(stmt.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-secondary bg-secondary/10 hover:bg-secondary/20 transition-colors">
                            <Check className="w-3 h-3" /> {t('finance.approve')}
                          </button>
                        )}
                        {stmt.status === 'APPROVED' && (
                          <button onClick={() => handleSend(stmt.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-success bg-success/10 hover:bg-success/20 transition-colors">
                            <Send className="w-3 h-3" /> {t('ownerStatements.send')}
                          </button>
                        )}
                        <button onClick={() => toast.info(t('ownerStatements.downloadStarted'))} className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === stmt.id && (
                    <tr key={`${stmt.id}-detail`}>
                      <td colSpan={9} className="px-4 py-4 bg-surface-container-low/50">
                        <div className="space-y-4">
                          {stmt.properties.map((prop) => (
                            <div key={prop.propertyId} className="bg-surface-container-lowest rounded-lg p-4 ambient-shadow">
                              <h4 className="font-headline font-semibold text-on-surface mb-3">{prop.propertyName}</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Bookings */}
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-2">{t('bookings.title')}</p>
                                  {prop.bookings.length === 0 ? (
                                    <p className="text-xs text-on-surface-variant italic">{t('ownerStatements.noBookings')}</p>
                                  ) : (
                                    <div className="space-y-1">
                                      {prop.bookings.map((b, i) => (
                                        <div key={i} className="text-xs text-on-surface-variant flex justify-between">
                                          <span>{b.guestName} ({b.nights}n)</span>
                                          <span className="font-medium text-on-surface">{'\u20AC'}{b.revenue.toLocaleString()}</span>
                                        </div>
                                      ))}
                                      <div className="pt-1 border-t border-outline-variant/20 text-xs font-semibold text-on-surface flex justify-between">
                                        <span>{t('ownerStatements.totalRevenue')}</span>
                                        <span>{'\u20AC'}{prop.totalRevenue.toLocaleString()}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {/* Expenses */}
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-2">{t('finance.expenses')}</p>
                                  <div className="space-y-1">
                                    {prop.expenses.map((e, i) => (
                                      <div key={i} className="text-xs text-on-surface-variant flex justify-between">
                                        <span>{e.description}</span>
                                        <span className="font-medium text-error">-{'\u20AC'}{e.amount.toLocaleString()}</span>
                                      </div>
                                    ))}
                                    <div className="pt-1 border-t border-outline-variant/20 text-xs font-semibold text-error flex justify-between">
                                      <span>{t('ownerStatements.totalExpenses')}</span>
                                      <span>-{'\u20AC'}{prop.totalExpenses.toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                                {/* Summary */}
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-2">{t('ownerStatements.summary')}</p>
                                  <div className="space-y-1">
                                    <div className="text-xs flex justify-between">
                                      <span className="text-on-surface-variant">{t('ownerStatements.mgmtFee')} ({prop.feeType})</span>
                                      <span className="font-medium text-warning">-{'\u20AC'}{prop.managementFee.toLocaleString()}</span>
                                    </div>
                                    <div className="pt-1 border-t border-outline-variant/20 text-sm font-bold text-secondary flex justify-between">
                                      <span>{t('finance.netIncome')}</span>
                                      <span>{'\u20AC'}{prop.netIncome.toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
