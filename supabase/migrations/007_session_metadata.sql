-- Add metadata column to sessions table for storing custom team names, etc.
ALTER TABLE public.sessions
ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
