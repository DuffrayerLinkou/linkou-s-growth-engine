ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS internal_attendees uuid[] DEFAULT '{}';