-- Migration: Add unique constraint and seed data for admin_workflow_states
-- Fixes upsert ON CONFLICT and populates board

BEGIN;

-- Add unique constraint if missing (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS admin_workflow_states_entity_type_entity_id_key 
ON public.admin_workflow_states USING btree (entity_type, entity_id);

-- Clean demo data
DELETE FROM public.admin_workflow_states WHERE entity_id LIKE 'demo-%' OR entity_type IN ('announcement', 'promotion', 'ad');

-- Insert sample workflows (no 'title' column)
INSERT INTO public.admin_workflow_states (entity_type, entity_id, state, updated_by, updated_at)
VALUES 
  ('announcement', 'demo-ann-001', 'pending', gen_random_uuid(), NOW()),
  ('promotion', 'demo-promo-001', 'review', gen_random_uuid(), NOW()),
  ('ad', 'demo-ad-001', 'shipped', gen_random_uuid(), NOW())
ON CONFLICT (entity_type, entity_id) DO NOTHING;

COMMIT;

