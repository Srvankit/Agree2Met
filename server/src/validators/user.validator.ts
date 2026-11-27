import { z } from 'zod';
import { validatePassword } from '../utils/password.util.js';

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name cannot be empty').max(100).optional(),
  lastName: z.string().trim().min(1, 'Last name cannot be empty').max(100).optional(),
  displayName: z.string().trim().min(1).max(200).optional(),
  phoneNumber: z.string().trim().max(50).optional().nullable(),
  jobTitle: z.string().trim().max(150).optional().nullable(),
  themePreference: z.enum(['light', 'dark', 'system']).optional(),
  emailNotificationPreferences: z
    .object({
      on_signature_requested: z.boolean().optional(),
      on_agreement_signed: z.boolean().optional(),
      on_agreement_completed: z.boolean().optional(),
      on_reminder: z.boolean().optional(),
    })
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(10, 'New password must be at least 10 characters long')
    .max(128, 'Password must not exceed 128 characters')
    .refine((val) => validatePassword(val).valid, {
      message: 'Password is too common or easily guessed.',
    }),
});

export const deleteAccountSchema = z.object({
  confirmation: z.literal('DELETE', {
    errorMap: () => ({ message: 'Please type DELETE to confirm account deletion.' }),
  }),
  password: z.string().min(1, 'Password is required to confirm deletion'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
