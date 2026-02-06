
-- Add execution_guide field to task_templates
ALTER TABLE public.task_templates 
ADD COLUMN execution_guide TEXT;

-- Add execution_guide field to tasks
ALTER TABLE public.tasks 
ADD COLUMN execution_guide TEXT;

-- Allow attaching files to templates
ALTER TABLE public.files 
ADD COLUMN template_id UUID REFERENCES public.task_templates(id) ON DELETE SET NULL;
