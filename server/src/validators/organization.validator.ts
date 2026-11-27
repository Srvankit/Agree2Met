import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(1, 'Organization name is required').max(255),
  billingEmail: z.string().trim().email('Invalid billing email').max(255).optional(),
  defaultCurrency: z.string().trim().length(3).default('USD'),
  defaultTimezone: z.string().trim().min(1).max(50).default('UTC'),
});

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  billingEmail: z.string().trim().email().max(255).optional(),
  defaultCurrency: z.string().trim().length(3).optional(),
  defaultTimezone: z.string().trim().min(1).max(50).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER'),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']),
});

export const acceptInvitationSchema = z.object({
  token: z.string().trim().min(1, 'Invitation token is required'),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
