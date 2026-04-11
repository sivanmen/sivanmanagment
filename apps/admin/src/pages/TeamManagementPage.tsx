import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Plus,
  Edit3,
  Trash2,
  Shield,
  UserPlus,
  UserMinus,
  ChevronRight,
  Building2,
  Eye,
  Search,
  Crown,
  User,
  Check,
  X,
  Lock,
  Unlock,
} from 'lucide-react';

// ── Types & Demo Data ──────────────────────────────────────────────────────

interface TeamMember {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'LEAD' | 'MEMBER' | 'VIEWER';
  joinedAt: string;
}

interface TeamPermission {
  module: string;
  actions: ('read' | 'create' | 'update' | 'delete')[];
}

interface Team {
  id: string;
  name: string;
  description: string;
  leaderId: string;
  members: TeamMember[];
  permissions: TeamPermission[];
  properties: { id: string; name: string }[];
  isActive: boolean;
  createdAt: string;
}

const allModules = [
  'properties',
  'bookings',
  'calendar',
  'guests',
  'finance',
  'maintenance',
  'communications',
  'documents',
  'tasks',
  'reports',
  'channels',
  'loyalty',
] as const;

const demoTeams: Team[] = [
  {
    id: 'team1',
    name: 'Operations Team',
    description: 'Handles day-to-day property operations including bookings, check-ins, and maintenance coordination.',
    leaderId: 'u1',
    members: [
      { userId: 'u1', name: 'Sivan Menahem', email: 'sivan@sivanmanagment.com', role: 'LEAD', joinedAt: '2024-01-15' },
      { userId: 'u2', name: 'Maya Cohen', email: 'maya@sivanmanagment.com', role: 'MEMBER', joinedAt: '2024-02-01' },
      { userId: 'u3', name: 'Nikos Papadopoulos', email: 'nikos@sivanmanagment.com', role: 'MEMBER', joinedAt: '2024-03-15' },
      { userId: 'u4', name: 'Elena Stavrou', email: 'elena@sivanmanagment.com', role: 'VIEWER', joinedAt: '2024-06-01' },
    ],
    permissions: [
      { module: 'properties', actions: ['read', 'create', 'update', 'delete'] },
      { module: 'bookings', actions: ['read', 'create', 'update', 'delete'] },
      { module: 'calendar', actions: ['read', 'create', 'update'] },
      { module: 'guests', actions: ['read', 'create', 'update'] },
      { module: 'maintenance', actions: ['read', 'create', 'update', 'delete'] },
      { module: 'tasks', actions: ['read', 'create', 'update'] },
      { module: 'communications', actions: ['read', 'create'] },
    ],
    properties: [
      { id: 'p1', name: 'Villa Elounda Royale' },
      { id: 'p2', name: 'Chania Harbor Suite' },
      { id: 'p3', name: 'Rethymno Beach House' },
      { id: 'p4', name: 'Heraklion City Loft' },
      { id: 'p5', name: 'Agios Nikolaos Villa' },
      { id: 'p6', name: 'Plakias Seaside' },
      { id: 'p7', name: 'Sitia Countryside' },
    ],
    isActive: true,
    createdAt: '2024-01-10',
  },
  {
    id: 'team2',
    name: 'Finance Team',
    description: 'Manages all financial operations including income tracking, expense approval, and owner payouts.',
    leaderId: 'u5',
    members: [
      { userId: 'u5', name: 'Daniel Levy', email: 'daniel@sivanmanagment.com', role: 'LEAD', joinedAt: '2024-01-20' },
      { userId: 'u1', name: 'Sivan Menahem', email: 'sivan@sivanmanagment.com', role: 'MEMBER', joinedAt: '2024-01-15' },
      { userId: 'u6', name: 'Ruth Goldstein', email: 'ruth@sivanmanagment.com', role: 'MEMBER', joinedAt: '2024-04-01' },
    ],
    permissions: [
      { module: 'finance', actions: ['read', 'create', 'update', 'delete'] },
      { module: 'bookings', actions: ['read'] },
      { module: 'properties', actions: ['read'] },
      { module: 'documents', actions: ['read', 'create'] },
      { module: 'reports', actions: ['read'] },
    ],
    properties: [
      { id: 'p1', name: 'Villa Elounda Royale' },
      { id: 'p2', name: 'Chania Harbor Suite' },
      { id: 'p3', name: 'Rethymno Beach House' },
      { id: 'p4', name: 'Heraklion City Loft' },
      { id: 'p5', name: 'Agios Nikolaos Villa' },
      { id: 'p6', name: 'Plakias Seaside' },
      { id: 'p7', name: 'Sitia Countryside' },
    ],
    isActive: true,
    createdAt: '2024-01-20',
  },
  {
    id: 'team3',
    name: 'Guest Relations',
    description: 'Manages guest communications, reviews, loyalty program, and guest experience.',
    leaderId: 'u2',
    members: [
      { userId: 'u2', name: 'Maya Cohen', email: 'maya@sivanmanagment.com', role: 'LEAD', joinedAt: '2024-02-01' },
      { userId: 'u4', name: 'Elena Stavrou', email: 'elena@sivanmanagment.com', role: 'MEMBER', joinedAt: '2024-06-01' },
      { userId: 'u7', name: 'Yiannis Katsarakis', email: 'yiannis@sivanmanagment.com', role: 'MEMBER', joinedAt: '2024-05-10' },
    ],
    permissions: [
      { module: 'guests', actions: ['read', 'create', 'update', 'delete'] },
      { module: 'bookings', actions: ['read', 'update'] },
      { module: 'communications', actions: ['read', 'create', 'update'] },
      { module: 'loyalty', actions: ['read', 'create', 'update'] },
    ],
    properties: [
      { id: 'p1', name: 'Villa Elounda Royale' },
      { id: 'p2', name: 'Chania Harbor Suite' },
      { id: 'p3', name: 'Rethymno Beach House' },
    ],
    isActive: true,
    createdAt: '2024-02-15',
  },
];

// ── Component ──────────────────────────────────────────────────────────────

function roleBadge(role: 'LEAD' | 'MEMBER' | 'VIEWER') {
  const map = {
    LEAD: { label: 'Lead', cls: 'bg-secondary/15 text-secondary', icon: Crown },
    MEMBER: { label: 'Member', cls: 'bg-blue-500/15 text-blue-400', icon: User },
    VIEWER: { label: 'Viewer', cls: 'bg-white/10 text-on-surface-variant', icon: Eye },
  };
  const { label, cls, icon: Icon } = map[role];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cls}`}>
      <Icon className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}

export default function TeamManagementPage() {
  const { t } = useTranslation();
  const [teams] = useState(demoTeams);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>('team1');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-secondary" />
            Team Management
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Manage teams, roles, permissions, and property assignments
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-white text-sm hover:bg-secondary/90"
        >
          <Plus className="w-4 h-4" />
          Create Team
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl">
          <p className="text-xs text-on-surface-variant">Active Teams</p>
          <p className="text-2xl font-headline font-bold mt-1">{teams.filter((t) => t.isActive).length}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <p className="text-xs text-on-surface-variant">Total Members</p>
          <p className="text-2xl font-headline font-bold mt-1">
            {new Set(teams.flatMap((t) => t.members.map((m) => m.userId))).size}
          </p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <p className="text-xs text-on-surface-variant">Total Permissions</p>
          <p className="text-2xl font-headline font-bold mt-1">
            {teams.reduce((s, t) => s + t.permissions.reduce((ps, p) => ps + p.actions.length, 0), 0)}
          </p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <p className="text-xs text-on-surface-variant">Properties Covered</p>
          <p className="text-2xl font-headline font-bold mt-1">7/7</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teams..."
              className="w-full ps-9 pe-3 py-2 rounded-lg border border-white/10 bg-surface text-sm placeholder:text-on-surface-variant/50"
            />
          </div>

          {teams
            .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
            .map((team) => (
              <button
                key={team.id}
                onClick={() => setSelectedTeamId(team.id)}
                className={`w-full text-start p-4 rounded-xl transition-all
                  ${selectedTeamId === team.id
                    ? 'glass-card ring-1 ring-secondary/40'
                    : 'glass-card hover:bg-white/[0.04]'
                  }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold">{team.name}</h4>
                  <span className={`w-2 h-2 rounded-full ${team.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                </div>
                <p className="text-xs text-on-surface-variant line-clamp-2 mb-2">{team.description}</p>
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {team.members.length} members
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {team.properties.length} properties
                  </span>
                </div>
              </button>
            ))}
        </div>

        {/* Team Detail */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTeam ? (
            <>
              {/* Team Header */}
              <div className="glass-card p-5 rounded-xl">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-headline font-bold">{selectedTeam.name}</h2>
                    <p className="text-sm text-on-surface-variant mt-0.5">{selectedTeam.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                  <span>Created {new Date(selectedTeam.createdAt).toLocaleDateString()}</span>
                  <span className={`flex items-center gap-1 ${selectedTeam.isActive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selectedTeam.isActive ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {selectedTeam.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Members */}
              <div className="glass-card p-5 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">Members ({selectedTeam.members.length})</h3>
                  <button className="flex items-center gap-1 text-xs text-secondary hover:text-secondary/80">
                    <UserPlus className="w-3.5 h-3.5" />
                    Add Member
                  </button>
                </div>
                <div className="space-y-2">
                  {selectedTeam.members.map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-xs font-bold text-secondary">
                          {member.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-on-surface-variant">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {roleBadge(member.role)}
                        <button className="p-1 rounded hover:bg-red-500/10 text-on-surface-variant hover:text-red-400 transition-colors">
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Permissions Matrix */}
              <div className="glass-card p-5 rounded-xl">
                <h3 className="text-sm font-semibold mb-4">Permission Matrix</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-start px-3 py-2 text-xs font-semibold text-on-surface-variant uppercase">Module</th>
                        <th className="text-center px-3 py-2 text-xs font-semibold text-on-surface-variant uppercase">Read</th>
                        <th className="text-center px-3 py-2 text-xs font-semibold text-on-surface-variant uppercase">Create</th>
                        <th className="text-center px-3 py-2 text-xs font-semibold text-on-surface-variant uppercase">Update</th>
                        <th className="text-center px-3 py-2 text-xs font-semibold text-on-surface-variant uppercase">Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allModules.map((mod) => {
                        const perm = selectedTeam.permissions.find((p) => p.module === mod);
                        return (
                          <tr key={mod} className="border-b border-white/5 hover:bg-white/[0.02]">
                            <td className="px-3 py-2 font-medium capitalize">{mod}</td>
                            {(['read', 'create', 'update', 'delete'] as const).map((action) => (
                              <td key={action} className="px-3 py-2 text-center">
                                {perm?.actions.includes(action) ? (
                                  <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                                ) : (
                                  <X className="w-4 h-4 text-white/10 mx-auto" />
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Assigned Properties */}
              <div className="glass-card p-5 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">Assigned Properties ({selectedTeam.properties.length})</h3>
                  <button className="flex items-center gap-1 text-xs text-secondary hover:text-secondary/80">
                    <Plus className="w-3.5 h-3.5" />
                    Assign Property
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedTeam.properties.map((prop) => (
                    <span
                      key={prop.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-sm hover:bg-white/10 transition-colors cursor-default"
                    >
                      <Building2 className="w-3.5 h-3.5 text-secondary" />
                      {prop.name}
                      <button className="ms-1 text-on-surface-variant hover:text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="glass-card p-12 rounded-xl text-center">
              <Shield className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
              <p className="text-on-surface-variant">Select a team to manage</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
