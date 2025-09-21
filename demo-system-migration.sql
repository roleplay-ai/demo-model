-- Demo System Database Migration (Improved Schema)
-- Run this SQL in your Supabase SQL editor to create the demo system tables

-- 1. Create demo_system_scenarios table
CREATE TABLE IF NOT EXISTS public.demo_system_scenarios (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    description text NOT NULL,
    detailed_description text,
    goals text,
    tags text[] DEFAULT '{}'::text[],
    difficulty integer DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 5),
    agent_id_male text NOT NULL,
    agent_id_female text NOT NULL,
    agent_name_male text,
    agent_name_female text,
    voice_id_male text,
    voice_id_female text,
    agent_avatar_male text,
    agent_avatar_female text,
    designation text,
    rubric jsonb DEFAULT '{}'::jsonb,
    report_system_prompt text NOT NULL,
    is_active boolean DEFAULT true,
    default_gender text CHECK (default_gender IN ('male','female')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Create demo_system_runs table
CREATE TABLE IF NOT EXISTS public.demo_system_runs (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    session_id text NOT NULL, -- Anonymous session identifier
    scenario_id bigint NOT NULL REFERENCES public.demo_system_scenarios(id) ON DELETE CASCADE,
    status text DEFAULT 'created' CHECK (status IN ('created','in_progress','completed','failed','abandoned')),
    selected_gender text CHECK (selected_gender IN ('male','female')),
    agent_id_used text,
    voice_id_used text,
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    metrics jsonb DEFAULT '{}'::jsonb,
    error_msg text
);

-- 3. Create demo_system_transcripts table
CREATE TABLE IF NOT EXISTS public.demo_system_transcripts (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    run_id bigint NOT NULL REFERENCES public.demo_system_runs(id) ON DELETE CASCADE,
    language text DEFAULT 'en',
    finalized boolean DEFAULT false,
    content jsonb NOT NULL DEFAULT jsonb_build_object('segments', jsonb '[]'),
    created_at timestamp with time zone DEFAULT now()
);

-- 4. Create demo_system_reports table
CREATE TABLE IF NOT EXISTS public.demo_system_reports (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    run_id bigint NOT NULL UNIQUE REFERENCES public.demo_system_runs(id) ON DELETE CASCADE,
    schema_version text NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    score_overall numeric(3,1),
    model_used text,
    created_at timestamp with time zone DEFAULT now()
);

-- 5. Create demo_system_sessions table for anonymous practice tracking
CREATE TABLE IF NOT EXISTS public.demo_system_sessions (
    id text PRIMARY KEY, -- Session ID (e.g., UUID or browser fingerprint)
    practice_count integer DEFAULT 0,
    max_practices integer DEFAULT 2,
    last_practice_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_demo_system_runs_session_id ON public.demo_system_runs(session_id);
CREATE INDEX IF NOT EXISTS idx_demo_system_runs_scenario_id ON public.demo_system_runs(scenario_id);
CREATE INDEX IF NOT EXISTS idx_demo_system_transcripts_run_id ON public.demo_system_transcripts(run_id);
CREATE INDEX IF NOT EXISTS idx_demo_system_reports_run_id ON public.demo_system_reports(run_id);
CREATE INDEX IF NOT EXISTS idx_demo_system_scenarios_active ON public.demo_system_scenarios(is_active);
CREATE INDEX IF NOT EXISTS idx_demo_system_scenarios_difficulty ON public.demo_system_scenarios(difficulty);
CREATE INDEX IF NOT EXISTS idx_demo_system_sessions_practice_count ON public.demo_system_sessions(practice_count);

-- 7. Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_demo_system_scenarios_updated_at ON public.demo_system_scenarios;
CREATE TRIGGER update_demo_system_scenarios_updated_at
    BEFORE UPDATE ON public.demo_system_scenarios
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_demo_system_sessions_updated_at ON public.demo_system_sessions;
CREATE TRIGGER update_demo_system_sessions_updated_at
    BEFORE UPDATE ON public.demo_system_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Enable Row Level Security (RLS) for demo tables
ALTER TABLE public.demo_system_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_system_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_system_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_system_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_system_sessions ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies for demo system
-- Public scenarios: anyone can SELECT active scenarios
CREATE POLICY "Public scenarios are viewable by everyone" ON public.demo_system_scenarios
    FOR SELECT TO anon USING (is_active = true);

-- Demo runs: anonymous users can manage runs by session_id
CREATE POLICY "Runs - select by session" ON public.demo_system_runs
    FOR SELECT TO anon USING (true);

CREATE POLICY "Runs - insert by anon" ON public.demo_system_runs
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Runs - update by session" ON public.demo_system_runs
    FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Runs - delete by session" ON public.demo_system_runs
    FOR DELETE TO anon USING (true);

-- Transcripts: anonymous users can manage transcripts
CREATE POLICY "Transcripts - select by anon" ON public.demo_system_transcripts
    FOR SELECT TO anon USING (true);

CREATE POLICY "Transcripts - insert by anon" ON public.demo_system_transcripts
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Transcripts - update by anon" ON public.demo_system_transcripts
    FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Transcripts - delete by anon" ON public.demo_system_transcripts
    FOR DELETE TO anon USING (true);

-- Reports: anonymous users can manage reports
CREATE POLICY "Reports - select by anon" ON public.demo_system_reports
    FOR SELECT TO anon USING (true);

CREATE POLICY "Reports - insert by anon" ON public.demo_system_reports
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Reports - update by anon" ON public.demo_system_reports
    FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Demo sessions: anonymous users can manage their own sessions
CREATE POLICY "Sessions - select by anon" ON public.demo_system_sessions
    FOR SELECT TO anon USING (true);

CREATE POLICY "Sessions - insert by anon" ON public.demo_system_sessions
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Sessions - update by anon" ON public.demo_system_sessions
    FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 11. Insert some sample demo system scenarios
INSERT INTO public.demo_system_scenarios (
    name,
    description,
    detailed_description,
    goals,
    tags,
    difficulty,
    agent_id_male,
    agent_id_female,
    agent_name_male,
    agent_name_female,
    voice_id_male,
    voice_id_female,
    agent_avatar_male,
    agent_avatar_female,
    designation,
    rubric,
    report_system_prompt,
    default_gender
) VALUES 
(
    'Customer Service Call',
    'Practice handling customer complaints and providing excellent service',
    'You are a customer service representative dealing with an upset customer who received a damaged product. Your goal is to resolve their issue while maintaining professionalism and ensuring customer satisfaction.',
    'Learn to handle difficult customers, practice active listening, and develop problem-solving skills in customer service scenarios.',
    ARRAY['customer-service', 'communication', 'problem-solving'],
    2,
    'agent_cs_male_001',
    'agent_cs_female_001',
    'Alex',
    'Sarah',
    'voice_male_001',
    'voice_female_001',
    '/avatars/customer-service-male-representative.jpg',
    '/avatars/customer-service-female-representative.jpg',
    'Customer Service Representative',
    '{"categories": [{"name": "Communication", "weight": 0.3}, {"name": "Problem Solving", "weight": 0.4}, {"name": "Professionalism", "weight": 0.3}]}',
    'You are evaluating a customer service interaction. Focus on communication skills, problem-solving ability, and professional demeanor. Provide specific feedback on how the representative handled the customer complaint.',
    'female'
),
(
    'Job Interview',
    'Practice answering common interview questions and presenting yourself professionally',
    'You are interviewing for a software engineering position at a tech company. The interviewer will ask you about your experience, technical skills, and behavioral questions.',
    'Improve interview skills, practice articulating your experience, and learn to handle common interview questions confidently.',
    ARRAY['interview', 'career', 'communication'],
    3,
    'agent_hr_male_001',
    'agent_hr_female_001',
    'Michael',
    'Jennifer',
    'voice_male_002',
    'voice_female_002',
    '/avatars/professional-male-interviewer.jpg',
    '/avatars/professional-female-interviewer.jpg',
    'HR Manager',
    '{"categories": [{"name": "Technical Knowledge", "weight": 0.4}, {"name": "Communication", "weight": 0.3}, {"name": "Confidence", "weight": 0.3}]}',
    'You are evaluating a job interview performance. Assess the candidate''s technical knowledge, communication skills, and overall confidence. Provide constructive feedback for improvement.',
    'male'
);

-- 12. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.demo_system_scenarios TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.demo_system_runs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.demo_system_transcripts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.demo_system_reports TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.demo_system_sessions TO anon;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO anon;

-- Migration completed successfully!
-- You can now use the demo system with the following tables:
-- - demo_system_scenarios: Store scenarios available for demo practice
-- - demo_system_runs: Track anonymous user practice sessions
-- - demo_system_transcripts: Store conversation transcripts
-- - demo_system_reports: Store AI-generated performance reports
-- - demo_system_sessions: Track anonymous session practice limits
