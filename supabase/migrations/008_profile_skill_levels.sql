-- Add skill_levels column to profiles table to store sports skill levels
ALTER TABLE public.profiles
ADD COLUMN skill_levels JSONB DEFAULT '{}'::jsonb;
