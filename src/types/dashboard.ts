// src/types/dashboard.ts

// API Response Types (Backend)
export type ApiEventStats = {
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  noOfTable: number;
};

export type ApiRsvpStats = {
  totalRsvpsReceived: number;
  comingCount: number;
  notComingCount: number;
  pendingCount: number;
  totalGuestsConfirmed: number;
  responseRate: number;
  newConfirmationsToday: number;
};

export type ApiTableStats = {
  totalTables: number;
  arrangedTables: number;
  assignedGuests: number;
  unassignedGuests: number;
  totalSeats: number;
  occupiedSeats: number;
};

export type ApiBudgetStats = {
  totalBudget: number;
  spentAmount: number;
  remainingAmount: number;
  spentPercentage: number;
  status: number;
};

export type ApiRecentActivity = {
  activityType: string;
  description: string;
  details: string;
  timestamp: string;
  icon: string;
};

export type ApiDashboardSummary = {
  eventStats: ApiEventStats;
  rsvpStats: ApiRsvpStats;
  tableStats: ApiTableStats;
  budgetStats: ApiBudgetStats;
  recentActivity: ApiRecentActivity[];
};

// Frontend Types
export type EventStats = {
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  noOfTable: number;
};

export type RsvpStats = {
  totalRsvpsReceived: number;
  comingCount: number;
  notComingCount: number;
  pendingCount: number;
  totalGuestsConfirmed: number;
  responseRate: number;
  newConfirmationsToday: number;
};

export type TableStats = {
  totalTables: number;
  arrangedTables: number;
  assignedGuests: number;
  unassignedGuests: number;
  totalSeats: number;
  occupiedSeats: number;
};

export type BudgetStats = {
  totalBudget: number;
  spentAmount: number;
  remainingAmount: number;
  spentPercentage: number;
  status: 'under_budget' | 'on_budget' | 'over_budget';
};

export type RecentActivity = {
  activityType: string;
  description: string;
  details: string;
  timestamp: string;
  icon: string;
};

export type DashboardSummary = {
  eventStats: EventStats;
  rsvpStats: RsvpStats;
  tableStats: TableStats;
  budgetStats: BudgetStats;
  recentActivity: RecentActivity[];
};

// Transformation function
export function toDashboardSummary(api: ApiDashboardSummary): DashboardSummary {
  // Map budget status number to enum
  const budgetStatusMap: Record<number, 'under_budget' | 'on_budget' | 'over_budget'> = {
    0: 'under_budget',
    1: 'on_budget',
    2: 'over_budget',
  };

  return {
    eventStats: {
      eventName: api.eventStats.eventName,
      eventDate: api.eventStats.eventDate,
      eventTime: api.eventStats.eventTime,
      eventLocation: api.eventStats.eventLocation,
      noOfTable: api.eventStats.noOfTable,
    },
    rsvpStats: {
      totalRsvpsReceived: api.rsvpStats.totalRsvpsReceived,
      comingCount: api.rsvpStats.comingCount,
      notComingCount: api.rsvpStats.notComingCount,
      pendingCount: api.rsvpStats.pendingCount,
      totalGuestsConfirmed: api.rsvpStats.totalGuestsConfirmed,
      responseRate: api.rsvpStats.responseRate,
      newConfirmationsToday: api.rsvpStats.newConfirmationsToday,
    },
    tableStats: {
      totalTables: api.tableStats.totalTables,
      arrangedTables: api.tableStats.arrangedTables,
      assignedGuests: api.tableStats.assignedGuests,
      unassignedGuests: api.tableStats.unassignedGuests,
      totalSeats: api.tableStats.totalSeats,
      occupiedSeats: api.tableStats.occupiedSeats,
    },
    budgetStats: {
      totalBudget: api.budgetStats.totalBudget,
      spentAmount: api.budgetStats.spentAmount,
      remainingAmount: api.budgetStats.remainingAmount,
      spentPercentage: api.budgetStats.spentPercentage,
      status: budgetStatusMap[api.budgetStats.status] || 'under_budget',
    },
    recentActivity: api.recentActivity.map((activity) => ({
      activityType: activity.activityType,
      description: activity.description,
      details: activity.details,
      timestamp: activity.timestamp,
      icon: activity.icon,
    })),
  };
}
