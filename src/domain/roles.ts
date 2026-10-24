/** The only two product roles. There is intentionally no admin role. */
export const ROLES = ['owner', 'contractor'] as const;
export type Role = (typeof ROLES)[number];

export const roleLabel: Record<Role, string> = {
  owner: 'Property Owner',
  contractor: 'Contractor',
};

export const roleHome: Record<Role, string> = {
  owner: '/owner',
  contractor: '/contractor',
};
