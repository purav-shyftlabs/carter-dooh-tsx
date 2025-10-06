import { AccessLevel, PermissionType } from '@/types';
import type { IRootState } from '@/redux/reducers';

type PermissionAccessMapping = Partial<Record<PermissionType, AccessLevel[]>>;

const permissionAccessMapping: PermissionAccessMapping = {
  [PermissionType.AdInventoryPlacements]: [
    AccessLevel.NO_ACCESS,
    AccessLevel.VIEW_ACCESS,
    AccessLevel.FULL_ACCESS,
  ],
  [PermissionType.AudienceKeysValues]: [
    AccessLevel.NO_ACCESS,
    AccessLevel.VIEW_ACCESS,
    AccessLevel.FULL_ACCESS,
  ],
  [PermissionType.AllPublisherCampaigns]: [
    AccessLevel.NO_ACCESS,
    AccessLevel.VIEW_ACCESS,
    AccessLevel.FULL_ACCESS,
  ],
  [PermissionType.AllAdvertiserCampaigns]: [
    AccessLevel.NO_ACCESS,
    AccessLevel.VIEW_ACCESS,
    AccessLevel.FULL_ACCESS,
  ],
  [PermissionType.CreativeTemplate]: [
    AccessLevel.NO_ACCESS,
    AccessLevel.VIEW_ACCESS,
    AccessLevel.FULL_ACCESS,
  ],
  [PermissionType.ReportGeneration]: [
    AccessLevel.NO_ACCESS,
    AccessLevel.CAMPAIGN_LEVEL,
    AccessLevel.FULL_ACCESS,
    AccessLevel.COMPREHENSIVE_ACCESS,
  ],
  [PermissionType.AdvertiserManagement]: [
    AccessLevel.NO_ACCESS,
    AccessLevel.VIEW_ACCESS,
    AccessLevel.FULL_ACCESS,
  ],
  [PermissionType.UserManagement]: [
    AccessLevel.NO_ACCESS,
    AccessLevel.VIEW_ACCESS,
    AccessLevel.FULL_ACCESS,
  ],
  [PermissionType.ApprovalRequests]: [
    AccessLevel.NO_ACCESS,
    AccessLevel.CREATIVE_REQUESTS,
    AccessLevel.ALL_REQUESTS,
  ],
  [PermissionType.Wallet]: [
    AccessLevel.NO_ACCESS,
    AccessLevel.VIEW_ACCESS,
    AccessLevel.MANAGE_WALLET,
    AccessLevel.FULL_ACCESS,
  ],
  [PermissionType.InsightDashboard]: [
    AccessLevel.NO_ACCESS,
    AccessLevel.VIEW_ACCESS,
  ],
  [PermissionType.AccountSetup]: [
    AccessLevel.NO_ACCESS,
    AccessLevel.VIEW_ACCESS,
    AccessLevel.FULL_ACCESS,
  ],
  [PermissionType.PublicApiAccess]: [
    AccessLevel.NO_ACCESS,
    AccessLevel.FULL_ACCESS,
  ],
  [PermissionType.YieldManagement]: [
    AccessLevel.NO_ACCESS,
    AccessLevel.VIEW_ACCESS,
    AccessLevel.FULL_ACCESS,
  ],
  [PermissionType.OffsiteIntegrations]: [
    AccessLevel.NO_ACCESS,
    AccessLevel.VIEW_ACCESS,
    AccessLevel.FULL_ACCESS,
  ],
  [PermissionType.OffsiteCampaigns]: [
    AccessLevel.NO_ACCESS,
    AccessLevel.VIEW_ACCESS,
    AccessLevel.FULL_ACCESS,
  ],
};

export function isValidPermissionAccess(
  permissionType: PermissionType,
  requiredAccessLevel: AccessLevel,
  inputAccessLevel: AccessLevel
): boolean {
  const allowedAccessLevels = permissionAccessMapping[permissionType];
  if (!allowedAccessLevels) {
    console.warn('[ACL] No access level mapping for', permissionType);
    return false;
  }
  const requiredIndex = allowedAccessLevels.indexOf(requiredAccessLevel);
  const inputIndex = allowedAccessLevels.indexOf(inputAccessLevel);
  if (requiredIndex === -1 || inputIndex === -1) {
    console.warn('[ACL] Invalid level(s)', { requiredAccessLevel, inputAccessLevel, allowedAccessLevels });
    return false;
  }
  return inputIndex >= requiredIndex;
}

export function canUserAssignPermission(
  permissionType: PermissionType,
  userAccessLevel: AccessLevel,
  inputAccessLevel: AccessLevel
): boolean {
  const allowedAccessLevels = permissionAccessMapping[permissionType];
  if (!allowedAccessLevels) return false;
  const userIndex = allowedAccessLevels.indexOf(userAccessLevel);
  const inputIndex = allowedAccessLevels.indexOf(inputAccessLevel);
  if (inputIndex === -1) return false;
  const validUserIndex = userIndex !== -1 ? userIndex : 0;
  return validUserIndex >= inputIndex;
}

export function checkUserPermission(
  userPermissions: Array<{ permissionType: PermissionType; accessLevel: AccessLevel }> | undefined | null,
  requiredPermissionType: PermissionType,
  requiredAccessLevel: AccessLevel
): { hasAccess: boolean; userAccessLevel: AccessLevel | null } {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return { hasAccess: false, userAccessLevel: null };
  }
  const userPermission = userPermissions.find((p) => p.permissionType === requiredPermissionType);
  if (!userPermission) return { hasAccess: false, userAccessLevel: null };
  const hasAccess = isValidPermissionAccess(
    requiredPermissionType,
    requiredAccessLevel,
    userPermission.accessLevel
  );
  return { hasAccess, userAccessLevel: userPermission.accessLevel };
}

export function checkMultiplePermissions(
  userPermissions: Array<{ permissionType: PermissionType; accessLevel: AccessLevel }> | undefined | null,
  requiredPermissions: Array<{ permissionType: PermissionType; accessLevel: AccessLevel }> | undefined | null
): { allValid: boolean; results: Array<{ permissionType: PermissionType; requiredAccessLevel: AccessLevel; hasAccess: boolean; userAccessLevel: AccessLevel | null }> } {
  if (!requiredPermissions || !Array.isArray(requiredPermissions)) {
    return { allValid: false, results: [] };
  }
  const results = requiredPermissions.map((required) => {
    const result = checkUserPermission(userPermissions, required.permissionType, required.accessLevel);
    return {
      permissionType: required.permissionType,
      requiredAccessLevel: required.accessLevel,
      ...result,
    };
  });
  const allValid = results.every((r) => r.hasAccess);
  return { allValid, results };
}

// -----------------------------
// Flags and Redux helpers
// -----------------------------

const accessLevelFlagKey: Record<AccessLevel, string> = {
  [AccessLevel.NO_ACCESS]: 'noAccess',
  [AccessLevel.VIEW_ACCESS]: 'viewAccess',
  [AccessLevel.FULL_ACCESS]: 'fullAccess',
  [AccessLevel.CAMPAIGN_LEVEL]: 'campaignLevel',
  [AccessLevel.COMPREHENSIVE_ACCESS]: 'comprehensiveAccess',
  [AccessLevel.MANAGE_WALLET]: 'manageWallet',
  [AccessLevel.CREATIVE_REQUESTS]: 'creativeRequests',
  [AccessLevel.ALL_REQUESTS]: 'allRequests',
};

export function deriveAccessLevelFromFlags(
  permissionType: PermissionType,
  flags: Record<string, unknown> | null | undefined
): AccessLevel | null {
  if (!flags) return null;
  const allowed = permissionAccessMapping[permissionType];
  if (!allowed || allowed.length === 0) return null;

  for (let i = allowed.length - 1; i >= 0; i -= 1) {
    const level = allowed[i];
    const key = accessLevelFlagKey[level];
    if (key && Boolean((flags as Record<string, unknown>)[key])) {
      return level;
    }
  }
  return allowed.includes(AccessLevel.NO_ACCESS) ? AccessLevel.NO_ACCESS : null;
}

export function getPermissionFlagsFromState(
  state: IRootState,
  permissionType: PermissionType
): Record<string, unknown> | null {
  const permissions = (state?.auth?.user as unknown as { permissions?: unknown })?.permissions as
    | Record<string, unknown>
    | Array<{ permissionType?: string; accessLevel?: string }>
    | null
    | undefined;

  if (!permissions) return null;

  // Object map shape: permissions[PermissionType] = { fullAccess, viewAccess, ... }
  if (typeof permissions === 'object' && !Array.isArray(permissions)) {
    const flags = (permissions as Record<string, unknown>)[permissionType];
    return (flags && typeof flags === 'object') ? (flags as Record<string, unknown>) : null;
  }

  // Array shape: [{ permissionType, accessLevel }]
  if (Array.isArray(permissions)) {
    const entry = permissions.find(p => p && p.permissionType === permissionType);
    if (entry && entry.accessLevel && typeof entry.accessLevel === 'string') {
      const levelStr = entry.accessLevel as keyof typeof AccessLevel;
      const level = (AccessLevel as unknown as Record<string, string>)[levelStr]
        ? (AccessLevel[levelStr] as AccessLevel)
        : null;
      if (level) {
        // Synthesize flags object from access level
        return {
          fullAccess: level === AccessLevel.FULL_ACCESS,
          viewAccess: level === AccessLevel.VIEW_ACCESS,
          noAccess: level === AccessLevel.NO_ACCESS,
          campaignLevel: level === AccessLevel.CAMPAIGN_LEVEL,
          comprehensiveAccess: level === AccessLevel.COMPREHENSIVE_ACCESS,
          manageWallet: level === AccessLevel.MANAGE_WALLET,
          creativeRequests: level === AccessLevel.CREATIVE_REQUESTS,
          allRequests: level === AccessLevel.ALL_REQUESTS,
        } as Record<string, unknown>;
      }
    }
  }

  return null;
}

export function getAccessLevelFromState(
  state: IRootState,
  permissionType: PermissionType
): AccessLevel | null {
  const flags = getPermissionFlagsFromState(state, permissionType);
  const userLevel = deriveAccessLevelFromFlags(permissionType, flags);
  return userLevel;
}

/**
 * Primary entry: pass minimum required and permission type; we fetch user's current level from Redux and log details.
 */
export function checkAclFromState(
  state: IRootState,
  permissionType: PermissionType,
  requiredAccessLevel: AccessLevel
): boolean {
  const flags = getPermissionFlagsFromState(state, permissionType);
  const userLevel = deriveAccessLevelFromFlags(permissionType, flags);

  if (!userLevel) return false;
  const result = isValidPermissionAccess(permissionType, requiredAccessLevel, userLevel);
  return result;
}

export const aclCheck = {
  checkAcl: isValidPermissionAccess,
  canUserAssignPermission,
  checkUserPermission,
  checkMultiplePermissions,
  checkAclFromState,
  deriveAccessLevelFromFlags,
  getPermissionFlagsFromState,
};

// Memoized selector helpers (optional usage with reselect)
// Consumers can import these to avoid recomputation on unrelated state changes
export const selectPermissionFlags = (permissionType: PermissionType) => (state: IRootState) =>
  getPermissionFlagsFromState(state, permissionType);

export const selectHasAccess = (
  permissionType: PermissionType,
  requiredAccessLevel: AccessLevel
) => (state: IRootState) => {
  const flags = getPermissionFlagsFromState(state, permissionType);
  const userLevel = deriveAccessLevelFromFlags(permissionType, flags);
  return userLevel ? isValidPermissionAccess(permissionType, requiredAccessLevel, userLevel) : false;
};

export default aclCheck;


