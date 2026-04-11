
-- Projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  file_structure JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Project files table
CREATE TABLE public.project_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'Unknown',
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own project files" ON public.project_files FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_files.project_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can insert own project files" ON public.project_files FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_files.project_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can update own project files" ON public.project_files FOR UPDATE USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_files.project_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can delete own project files" ON public.project_files FOR DELETE USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_files.project_id AND p.user_id = auth.uid()));

-- Project chat history
CREATE TABLE public.project_chat_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.project_chat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own chat history" ON public.project_chat_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat history" ON public.project_chat_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat history" ON public.project_chat_history FOR DELETE USING (auth.uid() = user_id);

-- Project notes
CREATE TABLE public.project_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_path TEXT,
  line_number INTEGER,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notes" ON public.project_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON public.project_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON public.project_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON public.project_notes FOR DELETE USING (auth.uid() = user_id);

-- Add shareable columns to snippets
ALTER TABLE public.snippets ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.snippets ADD COLUMN share_slug TEXT UNIQUE;
CREATE INDEX idx_snippets_share_slug ON public.snippets(share_slug) WHERE share_slug IS NOT NULL;

-- Allow anonymous viewing of public snippets
CREATE POLICY "Anyone can view public snippets" ON public.snippets FOR SELECT USING (is_public = true);
