-- Create appointments table for scheduling
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  type TEXT DEFAULT 'meeting', -- meeting, call, review, kickoff, training
  status TEXT DEFAULT 'scheduled', -- scheduled, confirmed, completed, cancelled
  location TEXT, -- meeting link, address, etc
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appointments
CREATE POLICY "Admins can manage all appointments"
ON public.appointments
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Account managers can manage all appointments"
ON public.appointments
FOR ALL
USING (has_role(auth.uid(), 'account_manager'));

CREATE POLICY "Client users can view their client appointments"
ON public.appointments
FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);

-- Trigger for updated_at
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();