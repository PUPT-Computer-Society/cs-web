/**
 * Constitutional Role Hierarchy and Sorting Utilities.
 *
 * Strict 80-character line length limit enforced.
 */

export const ROLE_HIERARCHY_ORDER: readonly string[] = [
  // 1. Higher Executive Governance
  "President",
  "Vice President for Internal Affairs",
  "Vice President for External Affairs",
  "Vice President for Records",
  "Vice President for Finance",
  "Vice President for Audit",
  "Vice President for Research and Documentation",
  "Vice President for Communications",

  // 2. Lower Executive Governance
  "Assistant Vice President for Records",
  "Assistant Vice President for Finance",
  "Assistant Vice President for Research and Documentation",
  "Assistant Vice President for Communications",
  "Delegates Representative",

  // 3. Board of Directors
  "Director for Academics",
  "Co-Director for Academics",
  "Director for Creatives",
  "Co-Director for Creatives",
  "Director for Sports",
  "Co-Director for Sports",
] as const;

export const ROLE_HIERARCHY_MAP = new Map<string, number>(
  ROLE_HIERARCHY_ORDER.map((name, index) => [name.toLowerCase(), index + 1]),
);

export function getRoleRank(
  roleName?: string | null,
  tier?: string | null,
): number {
  if (!roleName) return 999;
  const normalized = roleName.trim().toLowerCase();
  const directRank = ROLE_HIERARCHY_MAP.get(normalized);
  if (directRank !== undefined) return directRank;

  // Fallback heuristic based on titles and tiers
  if (normalized === "president") return 1;
  if (normalized.startsWith("vice president")) return 50;
  if (normalized.startsWith("assistant vice president")) return 100;
  if (normalized.includes("representative")) return 150;
  if (normalized.startsWith("director")) return 200;
  if (normalized.startsWith("co-director")) return 250;

  if (tier === "executive") return 300;
  if (tier === "committee" || normalized.includes("committee")) return 400;
  if (tier === "apprentice" || normalized.includes("apprentice")) return 500;

  return 600;
}

export function sortUsersByRole<
  T extends {
    role?: { name: string; tier?: string } | null;
    fullName?: string | null;
    username?: string | null;
  },
>(users: T[]): T[] {
  return [...users].sort((a, b) => {
    const rankA = getRoleRank(a.role?.name, a.role?.tier);
    const rankB = getRoleRank(b.role?.name, b.role?.tier);

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    const nameA = (a.fullName || a.username || "").toLowerCase();
    const nameB = (b.fullName || b.username || "").toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

export function sortRolesByHierarchy<
  T extends { name: string; tier?: string | null },
>(roles: T[]): T[] {
  return [...roles].sort((a, b) => {
    const rankA = getRoleRank(a.name, a.tier);
    const rankB = getRoleRank(b.name, b.tier);

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    return a.name.localeCompare(b.name);
  });
}
