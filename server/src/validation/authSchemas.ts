import { z } from 'zod';

const email = z
    .string({ error: 'Email is required.' })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: 'Enter a valid email address.' }));

const newPassword = z
    .string({ error: 'Password is required.' })
    .min(8, { error: 'Password must be at least 8 characters.' })
    .max(72, { error: 'Password must be 72 characters or fewer.' });

const linkToken = z
    .string({ error: 'This link is missing its code.' })
    .regex(/^[a-f0-9]{64}$/, { error: 'This link is not valid.' });

export const signupSchema = z.object({
    email,
    password: newPassword,
    firstName: z
        .string({ error: 'First name is required.' })
        .trim()
        .min(1, { error: 'First name is required.' })
        .max(50, { error: 'First name must be 50 characters or fewer.' }),
    lastName: z
        .string({ error: 'Last name is required.' })
        .trim()
        .min(1, { error: 'Last name is required.' })
        .max(50, { error: 'Last name must be 50 characters or fewer.' }),
});

export const loginSchema = z.object({
    email,
    password: z
        .string({ error: 'Password is required.' })
        .min(1, { error: 'Password is required.' }),
});

export const verifyEmailSchema = z.object({
    token: linkToken,
});

export const forgotPasswordSchema = z.object({
    email,
});

export const resetPasswordSchema = z.object({
    token: linkToken,
    password: newPassword,
});