import { useState } from 'react'

export type FieldErrors = Record<string, string[] | undefined>

export function useFieldErrors() {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  function clearFieldError(field: string) {
    if (fieldErrors[field]) {
      setFieldErrors({ ...fieldErrors, [field]: undefined })
    }
  }

  return { fieldErrors, setFieldErrors, clearFieldError }
}