import type { Role, ContentType } from "@/lib/types";

/**
 * Filter options for the /builds listing. Kept in their own module so a test can
 * assert they cover every role/content type actually present in the catalog — a
 * new content type must not silently become unfilterable (that is exactly how
 * the pvp and overland builds were unreachable from the filter).
 */
export const ROLES: readonly Role[] = ["dps", "tank", "healer"];
export const CONTENT: readonly ContentType[] = ["trial", "dungeon", "overland", "pvp", "leveling"];
