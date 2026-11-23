import { ValueTransformer } from 'typeorm';

/**
 * MySQL returns `decimal` columns as strings. This transformer keeps the
 * TypeScript side honest by exposing them as numbers while still writing
 * numbers back to the database.
 */
export const decimalTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | number | null) =>
    value === null || value === undefined ? value : Number(value),
};
