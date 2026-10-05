import { createContext } from "react";

export type UserRole = 'learner' | 'instructor' | 'admin'

export type User = {
  _id: string
  email: string
  firstName?: string
  lastName?: string
  role: UserRole
  isEmailVerified: boolean
}

export type SignupInput = {
  email: string
  password: string
  firstName: string
  lastName: string
}

export type AuthContextValue = {
  user: User | null
  isRestoring: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (input: SignupInput) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)