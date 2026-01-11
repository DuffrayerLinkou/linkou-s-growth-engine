// ============= CENTRALIZED ENTITY TYPES =============
// Tipos centralizados para entidades do sistema
// Evita duplicações de interfaces em múltiplos arquivos

// ============= CLIENT TYPES =============
export interface ClientBasic {
  id: string;
  name: string;
}

export interface ClientFull extends ClientBasic {
  segment: string | null;
  status: string | null;
  phase: string;
  autonomy: boolean;
  created_at: string | null;
  updated_at: string | null;
  phase_diagnostico_start: string | null;
  phase_diagnostico_end: string | null;
  phase_diagnostico_completed_at: string | null;
  phase_estruturacao_start: string | null;
  phase_estruturacao_end: string | null;
  phase_estruturacao_completed_at: string | null;
  phase_operacao_guiada_start: string | null;
  phase_operacao_guiada_end: string | null;
  phase_operacao_guiada_completed_at: string | null;
  phase_transferencia_start: string | null;
  phase_transferencia_end: string | null;
  phase_transferencia_completed_at: string | null;
}

// Client with extra computed fields (for lists)
export interface ClientWithStats extends ClientFull {
  userCount?: number;
  hasFocalPoint?: boolean;
}

// ============= FILE TYPES =============
export interface FileRecord {
  id: string;
  name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  mime_type: string | null;
  category: string | null;
  description: string | null;
  client_id: string;
  project_id: string | null;
  task_id: string | null;
  uploaded_by: string | null;
  created_at: string | null;
}

// ============= USER/PROFILE TYPES =============
export interface ProfileBasic {
  id: string;
  email: string;
  full_name: string | null;
}

export interface ProfileFull extends ProfileBasic {
  avatar_url: string | null;
  phone: string | null;
  client_id: string | null;
  ponto_focal: boolean;
  user_type: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ============= PROJECT TYPES =============
export interface ProjectBasic {
  id: string;
  name: string;
  client_id: string;
}

export interface ProjectFull extends ProjectBasic {
  description: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
}

export interface ProjectWithClient extends ProjectFull {
  client?: ClientBasic;
}

// ============= TASK TYPES =============
export interface TaskBasic {
  id: string;
  title: string;
  status: string | null;
  client_id: string;
}

export interface TaskFull extends TaskBasic {
  description: string | null;
  priority: string | null;
  due_date: string | null;
  assigned_to: string | null;
  executor_type: string | null;
  journey_phase: string | null;
  project_id: string | null;
  visible_to_client: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
}

// ============= CAMPAIGN TYPES =============
export interface CampaignBasic {
  id: string;
  name: string;
  status: string | null;
  client_id: string;
}

export interface CampaignFull extends CampaignBasic {
  description: string | null;
  platform: string | null;
  objective: string | null;
  budget: number | null;
  daily_budget: number | null;
  start_date: string | null;
  end_date: string | null;
  project_id: string;
  approved_by_ponto_focal: boolean | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
}

// ============= LEAD TYPES =============
export interface LeadBasic {
  id: string;
  name: string;
  email: string;
  status: string | null;
}

export interface LeadFull extends LeadBasic {
  phone: string | null;
  segment: string | null;
  source: string | null;
  objective: string | null;
  investment: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ============= APPOINTMENT TYPES =============
export interface AppointmentBasic {
  id: string;
  title: string;
  appointment_date: string;
  client_id: string;
}

export interface AppointmentFull extends AppointmentBasic {
  description: string | null;
  type: string | null;
  status: string | null;
  location: string | null;
  duration_minutes: number | null;
  project_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
}
