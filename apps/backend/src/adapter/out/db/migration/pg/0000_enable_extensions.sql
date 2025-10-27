DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_available_extensions WHERE name = 'vector'
  ) THEN
    EXECUTE 'CREATE EXTENSION IF NOT EXISTS vector';
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- no-op for environments without catalog/extension support
END $$;
--> statement-breakpoint
