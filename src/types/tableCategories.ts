// src/types/tableCategories.ts

/**
 * Table category enum matching backend values
 */
export const TableCategory = {
  NONE: 0,
  BRIDE_FAMILY: 1,
  GROOM_FAMILY: 2,
  BRIDE_RELATIVES: 3,
  GROOM_RELATIVES: 4,
  FRIENDS: 5,
  COLLEAGUES: 6,
  FAMILY_FRIENDS: 7,
  NEIGHBORS: 8,
  VIP: 9,
} as const;
export type TableCategory = typeof TableCategory[keyof typeof TableCategory];

/**
 * Display labels for table categories
 */
export const TableCategoryLabels: Record<TableCategory, string> = {
  [TableCategory.NONE]: "None",
  [TableCategory.BRIDE_FAMILY]: "Bride Family",
  [TableCategory.GROOM_FAMILY]: "Groom Family",
  [TableCategory.BRIDE_RELATIVES]: "Bride Relatives",
  [TableCategory.GROOM_RELATIVES]: "Groom Relatives",
  [TableCategory.FRIENDS]: "Friends",
  [TableCategory.COLLEAGUES]: "Colleagues",
  [TableCategory.FAMILY_FRIENDS]: "Family Friends",
  [TableCategory.NEIGHBORS]: "Neighbors",
  [TableCategory.VIP]: "VIP",
};

/**
 * Professional prefixes used for auto-naming tables
 * e.g., VIP tables become "vip1", "vip2", etc.
 */
export const TableCategoryPrefixes: Record<TableCategory, string> = {
  [TableCategory.NONE]: "table",
  [TableCategory.BRIDE_FAMILY]: "bridefamily",
  [TableCategory.GROOM_FAMILY]: "groomfamily",
  [TableCategory.BRIDE_RELATIVES]: "briderelatives",
  [TableCategory.GROOM_RELATIVES]: "groomrelatives",
  [TableCategory.FRIENDS]: "friends",
  [TableCategory.COLLEAGUES]: "colleagues",
  [TableCategory.FAMILY_FRIENDS]: "familyfriends",
  [TableCategory.NEIGHBORS]: "neighbors",
  [TableCategory.VIP]: "vip",
};

/**
 * Get all selectable categories (excluding NONE)
 */
export function getSelectableCategories(): TableCategory[] {
  return [
    TableCategory.VIP,
    TableCategory.BRIDE_FAMILY,
    TableCategory.GROOM_FAMILY,
    TableCategory.BRIDE_RELATIVES,
    TableCategory.GROOM_RELATIVES,
    TableCategory.FRIENDS,
    TableCategory.COLLEAGUES,
    TableCategory.FAMILY_FRIENDS,
    TableCategory.NEIGHBORS,
  ];
}

/**
 * Get common categories for quick setup (most frequently used)
 */
export function getCommonCategories(): TableCategory[] {
  return [
    TableCategory.VIP,
    TableCategory.BRIDE_FAMILY,
    TableCategory.GROOM_FAMILY,
    TableCategory.FRIENDS,
    TableCategory.COLLEAGUES,
  ];
}
