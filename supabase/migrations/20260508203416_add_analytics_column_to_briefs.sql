/*
  # Add analytics column to briefs table

  1. Modified Tables
    - `briefs`
      - Added `analytics` (jsonb, nullable) - stores opportunity/gap analytics scores

  2. Notes
    - Column is nullable so existing rows remain valid
    - Stores structured analytics: opportunityScore, gapSeverity, marketSaturation, etc.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'briefs' AND column_name = 'analytics'
  ) THEN
    ALTER TABLE briefs ADD COLUMN analytics jsonb DEFAULT NULL;
  END IF;
END $$;
