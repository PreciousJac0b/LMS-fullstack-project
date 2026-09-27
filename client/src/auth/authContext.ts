import { createContext } from "react";

export type UserRole = 'learner' | 'instructor' | 'admin'

export type User = {
  _id: string
  email: string
  firstName?: string
  lastName?: string
  role: UserRole
  enrollments?: string[]
}

export type AuthContextValue = {
  user: User | null
  isRestoring: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)