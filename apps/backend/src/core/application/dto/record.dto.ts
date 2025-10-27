/**
 * Generic record identifier containing both internal and external IDs.
 */
export interface RecordIdDTO {
  /** Internal database identifier. */
  id: number
  /** External identifier for API responses. */
  idExt: string
}
