import { z } from 'zod';
import { validatePassword } from '../utils/password.util.js';

export const registerSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters long')
    .max(128, 'Password must not exceed 128 characters')
    .refine((val) => validatePassword(val).valid, {
      message: 'Password is too common or easily guessed.',
    }),
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  organizationName: z.string().trim().min(1).max(255).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
  password: z.string().min(1, 'Password is required').max(128),
});

export const verifyEmailSchema = z.object({
  token: z.string().trim().min(1, 'Verification token is required').max(255),
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, 'Reset token is required').max(255),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters long')
    .max(128, 'Password must not exceed 128 characters')
    .refine((val) => validatePassword(val).valid, {
      message: 'Password is too common or easily guessed.',
    }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
