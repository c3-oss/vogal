/**
 * Type representing values that can be safely serialized to JSON.
 * Includes primitive types, dates, errors, arrays, and plain objects.
 */
export type Jsonifiable =
  | undefined
  | null
  | boolean
  | number
  | string
  | Date
  | Error
  | Jsonifiable[]
  | { [key: string]: Jsonifiable }

/**
 * Type representing a matrix of values.
 */
export type Matrix<T> = T[][]
