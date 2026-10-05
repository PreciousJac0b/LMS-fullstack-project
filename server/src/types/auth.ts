import { z } from 'zod';
import { loginSchema, signupSchema } from '../validation/authSchemas';

export type signUpInput = z.infer<typeof signupSchema>;
export type loginInput = z.infer<typeof loginSchema>;