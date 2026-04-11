import { ApiError } from '../../utils/api-error';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TeamMember {
  userId: string;
  role: 'LEAD' | 'MEMBER' | 'VIEWER';
  joinedAt: Date;
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
  properties: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TeamFilters {
  search?: string;
  isActive?: boolean;
}

type CreateTeamInput = Omit<Team, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateTeamInput = Partial<Omit<Team, 'id' | 'createdAt' | 'updatedAt'>>;

// ─── In-memory store ────────────────────────────────────────────────────────

const teams: Map<string, Team> = new Map();

// ─── Seed demo data ─────────────────────────────────────────────────────────

const demoTeams: Team[] = [
  {
    id: 'team_ops_001',
    name: 'Operations Team',
    description: 'Handles day-to-day property operations including check-ins, cleanings, and maintenance coordination across all properties.',
    leaderId: 'user_admin_001',
    members: [
      { userId: 'user_admin_001', role: 'LEAD', joinedAt: new Date('2025-06-01') },
      { userId: 'user_staff_002', role: 'MEMBER', joinedAt: new Date('2025-06-15') },
      { userId: 'user_staff_003', role: 'MEMBER', joinedAt: new Date('2025-07-01') },
      { userId: 'user_staff_004', role: 'VIEWER', joinedAt: new Date('2025-09-10') },
    ],
    permissions: [
      { module: 'properties', actions: ['read', 'create', 'update', 'delete'] },
      { module: 'bookings', actions: ['read', 'create', 'update', 'delete'] },
      { module: 'maintenance', actions: ['read', 'create', 'update', 'delete'] },
      { module: 'guests', actions: ['read', 'update'] },
    ],
    properties: ['prop_santorini_001', 'prop_mykonos_002', 'prop_athens_003', 'prop_crete_004', 'prop_corfu_005'],
    isActive: true,
    createdAt: new Date('2025-06-01'),
    updatedAt: new Date('2026-03-15'),
  },
  {
    id: 'team_fin_002',
    name: 'Finance Team',
    description: 'Manages all financial operations including invoicing, owner statements, expense tracking, and revenue reporting.',
    leaderId: 'user_finance_005',
    members: [
      { userId: 'user_finance_005', role: 'LEAD', joinedAt: new Date('2025-06-01') },
      { userId: 'user_finance_006', role: 'MEMBER', joinedAt: new Date('2025-08-01') },
      { userId: 'user_admin_001', role: 'VIEWER', joinedAt: new Date('2025-06-01') },
    ],
    permissions: [
      { module: 'finance', actions: ['read', 'create', 'update', 'delete'] },
      { module: 'bookings', actions: ['read'] },
      { module: 'properties', actions: ['read'] },
    ],
    properties: ['prop_santorini_001', 'prop_mykonos_002', 'prop_athens_003', 'prop_crete_004', 'prop_corfu_005'],
    isActive: true,
    createdAt: new Date('2025-06-01'),
    updatedAt: new Date('2026-02-28'),
  },
  {
    id: 'team_gr_003',
    name: 'Guest Relations',
    description: 'Dedicated to guest communication, reviews management, concierge services, and ensuring exceptional guest experiences.',
    leaderId: 'user_guest_007',
    members: [
      { userId: 'user_guest_007', role: 'LEAD', joinedAt: new Date('2025-07-01') },
      { userId: 'user_guest_008', role: 'MEMBER', joinedAt: new Date('2025-07-15') },
      { userId: 'user_guest_009', role: 'MEMBER', joinedAt: new Date('2025-10-01') },
    ],
    permissions: [
      { module: 'guests', actions: ['read', 'create', 'update', 'delete'] },
      { module: 'bookings', actions: ['read', 'update'] },
      { module: 'communications', actions: ['read', 'create', 'update', 'delete'] },
    ],
    properties: ['prop_santorini_001', 'prop_mykonos_002', 'prop_athens_003'],
    isActive: true,
    createdAt: new Date('2025-07-01'),
    updatedAt: new Date('2026-04-01'),
  },
];

demoTeams.forEach((t) => teams.set(t.id, t));

// ─── Service ─────────────────────────────────────────────────────────────────

export class TeamsService {
  getAllTeams(filters: TeamFilters): Team[] {
    let result = Array.from(teams.values());

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search),
      );
    }

    if (filters.isActive !== undefined) {
      result = result.filter((t) => t.isActive === filters.isActive);
    }

    return result;
  }

  getTeamById(id: string): Team {
    const team = teams.get(id);
    if (!team) {
      throw ApiError.notFound('Team');
    }
    return team;
  }

  createTeam(data: CreateTeamInput): Team {
    // Check for duplicate name
    const existing = Array.from(teams.values()).find(
      (t) => t.name.toLowerCase() === data.name.toLowerCase(),
    );
    if (existing) {
      throw ApiError.conflict('A team with this name already exists', 'DUPLICATE_NAME');
    }

    const now = new Date();
    const team: Team = {
      id: 'team_' + Date.now().toString(36),
      name: data.name,
      description: data.description,
      leaderId: data.leaderId,
      members: data.members || [
        { userId: data.leaderId, role: 'LEAD', joinedAt: now },
      ],
      permissions: data.permissions || [],
      properties: data.properties || [],
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: now,
      updatedAt: now,
    };

    teams.set(team.id, team);
    return team;
  }

  updateTeam(id: string, data: UpdateTeamInput): Team {
    const team = teams.get(id);
    if (!team) {
      throw ApiError.notFound('Team');
    }

    // Check name uniqueness if changing
    if (data.name && data.name.toLowerCase() !== team.name.toLowerCase()) {
      const duplicate = Array.from(teams.values()).find(
        (t) => t.name.toLowerCase() === data.name!.toLowerCase() && t.id !== id,
      );
      if (duplicate) {
        throw ApiError.conflict('A team with this name already exists', 'DUPLICATE_NAME');
      }
    }

    if (data.name !== undefined) team.name = data.name;
    if (data.description !== undefined) team.description = data.description;
    if (data.leaderId !== undefined) team.leaderId = data.leaderId;
    if (data.permissions !== undefined) team.permissions = data.permissions;
    if (data.properties !== undefined) team.properties = data.properties;
    if (data.isActive !== undefined) team.isActive = data.isActive;
    team.updatedAt = new Date();

    teams.set(id, team);
    return team;
  }

  deleteTeam(id: string): { message: string } {
    const team = teams.get(id);
    if (!team) {
      throw ApiError.notFound('Team');
    }
    teams.delete(id);
    return { message: 'Team deleted successfully' };
  }

  addMember(teamId: string, userId: string, role: 'LEAD' | 'MEMBER' | 'VIEWER'): Team {
    const team = teams.get(teamId);
    if (!team) {
      throw ApiError.notFound('Team');
    }

    const existingMember = team.members.find((m) => m.userId === userId);
    if (existingMember) {
      throw ApiError.conflict('User is already a member of this team', 'ALREADY_MEMBER');
    }

    team.members.push({
      userId,
      role,
      joinedAt: new Date(),
    });
    team.updatedAt = new Date();

    teams.set(teamId, team);
    return team;
  }

  removeMember(teamId: string, userId: string): Team {
    const team = teams.get(teamId);
    if (!team) {
      throw ApiError.notFound('Team');
    }

    const memberIndex = team.members.findIndex((m) => m.userId === userId);
    if (memberIndex === -1) {
      throw ApiError.notFound('Team member');
    }

    // Prevent removing the team leader
    if (userId === team.leaderId) {
      throw ApiError.badRequest(
        'Cannot remove the team leader. Assign a new leader first.',
        'CANNOT_REMOVE_LEADER',
      );
    }

    team.members.splice(memberIndex, 1);
    team.updatedAt = new Date();

    teams.set(teamId, team);
    return team;
  }

  updateMemberRole(teamId: string, userId: string, role: 'LEAD' | 'MEMBER' | 'VIEWER'): Team {
    const team = teams.get(teamId);
    if (!team) {
      throw ApiError.notFound('Team');
    }

    const member = team.members.find((m) => m.userId === userId);
    if (!member) {
      throw ApiError.notFound('Team member');
    }

    // If promoting to LEAD, demote current lead to MEMBER
    if (role === 'LEAD' && userId !== team.leaderId) {
      const currentLead = team.members.find((m) => m.userId === team.leaderId);
      if (currentLead) {
        currentLead.role = 'MEMBER';
      }
      team.leaderId = userId;
    }

    member.role = role;
    team.updatedAt = new Date();

    teams.set(teamId, team);
    return team;
  }

  assignProperties(teamId: string, propertyIds: string[]): Team {
    const team = teams.get(teamId);
    if (!team) {
      throw ApiError.notFound('Team');
    }

    team.properties = propertyIds;
    team.updatedAt = new Date();

    teams.set(teamId, team);
    return team;
  }

  getTeamsByUser(userId: string): Team[] {
    return Array.from(teams.values()).filter((t) =>
      t.members.some((m) => m.userId === userId),
    );
  }

  checkPermission(
    teamId: string,
    module: string,
    action: 'read' | 'create' | 'update' | 'delete',
  ): { hasPermission: boolean; team: string; module: string; action: string } {
    const team = teams.get(teamId);
    if (!team) {
      throw ApiError.notFound('Team');
    }

    const permission = team.permissions.find((p) => p.module === module);
    const hasPermission = permission ? permission.actions.includes(action) : false;

    return {
      hasPermission,
      team: team.name,
      module,
      action,
    };
  }
}

export const teamsService = new TeamsService();
