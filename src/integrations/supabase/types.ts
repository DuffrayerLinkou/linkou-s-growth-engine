export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      acknowledgements: {
        Row: {
          acknowledged_by: string
          client_id: string
          created_at: string
          id: string
          note: string | null
          phase: string
        }
        Insert: {
          acknowledged_by: string
          client_id: string
          created_at?: string
          id?: string
          note?: string | null
          phase: string
        }
        Update: {
          acknowledged_by?: string
          client_id?: string
          created_at?: string
          id?: string
          note?: string | null
          phase?: string
        }
        Relationships: [
          {
            foreignKeyName: "acknowledgements_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acknowledgements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          client_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          internal_attendees: string[] | null
          lead_id: string | null
          location: string | null
          project_id: string | null
          status: string | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          internal_attendees?: string[] | null
          lead_id?: string | null
          location?: string | null
          project_id?: string | null
          status?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          internal_attendees?: string[] | null
          lead_id?: string | null
          location?: string | null
          project_id?: string | null
          status?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_conversations: {
        Row: {
          client_id: string | null
          created_at: string
          current_client_id: string | null
          current_objective: string | null
          current_topic: string | null
          id: string
          last_action: Json | null
          last_message_at: string
          last_recommendation: Json | null
          messages: Json
          mode: string
          pending_items: Json
          state_updated_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          current_client_id?: string | null
          current_objective?: string | null
          current_topic?: string | null
          id?: string
          last_action?: Json | null
          last_message_at?: string
          last_recommendation?: Json | null
          messages?: Json
          mode?: string
          pending_items?: Json
          state_updated_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          current_client_id?: string | null
          current_objective?: string | null
          current_topic?: string | null
          id?: string
          last_action?: Json | null
          last_message_at?: string
          last_recommendation?: Json | null
          messages?: Json
          mode?: string
          pending_items?: Json
          state_updated_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_conversations_current_client_id_fkey"
            columns: ["current_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          client_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          client_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          client_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      briefings: {
        Row: {
          budget_mensal: number | null
          client_id: string
          concorrentes: string | null
          content: Json | null
          created_at: string | null
          created_by: string | null
          diferenciais: string | null
          id: string
          nicho: string | null
          objetivos: string | null
          observacoes: string | null
          publico_alvo: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          budget_mensal?: number | null
          client_id: string
          concorrentes?: string | null
          content?: Json | null
          created_at?: string | null
          created_by?: string | null
          diferenciais?: string | null
          id?: string
          nicho?: string | null
          objetivos?: string | null
          observacoes?: string | null
          publico_alvo?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          budget_mensal?: number | null
          client_id?: string
          concorrentes?: string | null
          content?: Json | null
          created_at?: string | null
          created_by?: string | null
          diferenciais?: string | null
          id?: string
          nicho?: string | null
          objetivos?: string | null
          observacoes?: string | null
          publico_alvo?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          ad_copy: string | null
          approved_at: string | null
          approved_by: string | null
          approved_by_ponto_focal: boolean | null
          bidding_strategy: string | null
          budget: number | null
          call_to_action: string | null
          campaign_type: string | null
          client_id: string
          created_at: string | null
          created_by: string | null
          creatives: Json | null
          daily_budget: number | null
          description: string | null
          end_date: string | null
          headline: string | null
          id: string
          metrics: Json | null
          name: string
          objective: string | null
          objective_detail: string | null
          placements: Json | null
          platform: string | null
          project_id: string
          results: string | null
          start_date: string | null
          status: string | null
          strategy: string | null
          target_cpa: number | null
          target_roas: number | null
          targeting: Json | null
          updated_at: string | null
        }
        Insert: {
          ad_copy?: string | null
          approved_at?: string | null
          approved_by?: string | null
          approved_by_ponto_focal?: boolean | null
          bidding_strategy?: string | null
          budget?: number | null
          call_to_action?: string | null
          campaign_type?: string | null
          client_id: string
          created_at?: string | null
          created_by?: string | null
          creatives?: Json | null
          daily_budget?: number | null
          description?: string | null
          end_date?: string | null
          headline?: string | null
          id?: string
          metrics?: Json | null
          name: string
          objective?: string | null
          objective_detail?: string | null
          placements?: Json | null
          platform?: string | null
          project_id: string
          results?: string | null
          start_date?: string | null
          status?: string | null
          strategy?: string | null
          target_cpa?: number | null
          target_roas?: number | null
          targeting?: Json | null
          updated_at?: string | null
        }
        Update: {
          ad_copy?: string | null
          approved_at?: string | null
          approved_by?: string | null
          approved_by_ponto_focal?: boolean | null
          bidding_strategy?: string | null
          budget?: number | null
          call_to_action?: string | null
          campaign_type?: string | null
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          creatives?: Json | null
          daily_budget?: number | null
          description?: string | null
          end_date?: string | null
          headline?: string | null
          id?: string
          metrics?: Json | null
          name?: string
          objective?: string | null
          objective_detail?: string | null
          placements?: Json | null
          platform?: string | null
          project_id?: string
          results?: string | null
          start_date?: string | null
          status?: string | null
          strategy?: string | null
          target_cpa?: number | null
          target_roas?: number | null
          targeting?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiments_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      capture_pages: {
        Row: {
          background_color: string | null
          background_image_url: string | null
          benefits: Json | null
          button_text: string | null
          created_at: string
          created_by: string | null
          form_fields: Json | null
          headline: string
          id: string
          is_active: boolean
          layout_type: string | null
          logo_url: string | null
          meta_description: string | null
          meta_title: string | null
          primary_color: string | null
          slug: string
          subheadline: string | null
          text_color: string | null
          thank_you_message: string | null
          thank_you_redirect_url: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          background_color?: string | null
          background_image_url?: string | null
          benefits?: Json | null
          button_text?: string | null
          created_at?: string
          created_by?: string | null
          form_fields?: Json | null
          headline?: string
          id?: string
          is_active?: boolean
          layout_type?: string | null
          logo_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          primary_color?: string | null
          slug: string
          subheadline?: string | null
          text_color?: string | null
          thank_you_message?: string | null
          thank_you_redirect_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          background_color?: string | null
          background_image_url?: string | null
          benefits?: Json | null
          button_text?: string | null
          created_at?: string
          created_by?: string | null
          form_fields?: Json | null
          headline?: string
          id?: string
          is_active?: boolean
          layout_type?: string | null
          logo_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          primary_color?: string | null
          slug?: string
          subheadline?: string | null
          text_color?: string | null
          thank_you_message?: string | null
          thank_you_redirect_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      client_actions: {
        Row: {
          action_type: string
          client_id: string
          created_at: string
          error_message: string | null
          executed_at: string
          executed_by: string | null
          id: string
          payload: Json
          status: string
          triggered_by_conversation_id: string | null
        }
        Insert: {
          action_type: string
          client_id: string
          created_at?: string
          error_message?: string | null
          executed_at?: string
          executed_by?: string | null
          id?: string
          payload?: Json
          status?: string
          triggered_by_conversation_id?: string | null
        }
        Update: {
          action_type?: string
          client_id?: string
          created_at?: string
          error_message?: string | null
          executed_at?: string
          executed_by?: string | null
          id?: string
          payload?: Json
          status?: string
          triggered_by_conversation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_actions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_actions_triggered_by_conversation_id_fkey"
            columns: ["triggered_by_conversation_id"]
            isOneToOne: false
            referencedRelation: "assistant_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_channels: {
        Row: {
          account_id: string | null
          channel: string
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          last_activity_at: string | null
          monthly_budget: number | null
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          channel: string
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          last_activity_at?: string | null
          monthly_budget?: number | null
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          channel?: string
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          last_activity_at?: string | null
          monthly_budget?: number | null
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_channels_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_constraints: {
        Row: {
          active: boolean
          client_id: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          severity: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          client_id: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          severity?: string
          type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          client_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          severity?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_constraints_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_decisions: {
        Row: {
          client_id: string
          created_at: string
          decided_at: string
          decided_by: string | null
          decision: string
          id: string
          rationale: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
        }
        Insert: {
          client_id: string
          created_at?: string
          decided_at?: string
          decided_by?: string | null
          decision: string
          id?: string
          rationale?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
        }
        Update: {
          client_id?: string
          created_at?: string
          decided_at?: string
          decided_by?: string | null
          decision?: string
          id?: string
          rationale?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_decisions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_goals: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          deadline: string | null
          description: string | null
          id: string
          priority: string
          status: string
          target_metric: string | null
          target_value: number | null
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: string
          status?: string
          target_metric?: string | null
          target_value?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: string
          status?: string
          target_metric?: string | null
          target_value?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_goals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_offers: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          description: string | null
          differentiators: Json
          id: string
          name: string
          price: number | null
          status: string
          target_audience: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          differentiators?: Json
          id?: string
          name: string
          price?: number | null
          status?: string
          target_audience?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          differentiators?: Json
          id?: string
          name?: string
          price?: number | null
          status?: string
          target_audience?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_offers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_users: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          role: string | null
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          role?: string | null
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          autonomy: boolean
          created_at: string | null
          id: string
          name: string
          phase: string
          phase_dates: Json
          phase_diagnostico_completed_at: string | null
          phase_diagnostico_end: string | null
          phase_diagnostico_start: string | null
          phase_estruturacao_completed_at: string | null
          phase_estruturacao_end: string | null
          phase_estruturacao_start: string | null
          phase_operacao_guiada_completed_at: string | null
          phase_operacao_guiada_end: string | null
          phase_operacao_guiada_start: string | null
          phase_transferencia_completed_at: string | null
          phase_transferencia_end: string | null
          phase_transferencia_start: string | null
          segment: string | null
          service_type: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          autonomy?: boolean
          created_at?: string | null
          id?: string
          name: string
          phase?: string
          phase_dates?: Json
          phase_diagnostico_completed_at?: string | null
          phase_diagnostico_end?: string | null
          phase_diagnostico_start?: string | null
          phase_estruturacao_completed_at?: string | null
          phase_estruturacao_end?: string | null
          phase_estruturacao_start?: string | null
          phase_operacao_guiada_completed_at?: string | null
          phase_operacao_guiada_end?: string | null
          phase_operacao_guiada_start?: string | null
          phase_transferencia_completed_at?: string | null
          phase_transferencia_end?: string | null
          phase_transferencia_start?: string | null
          segment?: string | null
          service_type?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          autonomy?: boolean
          created_at?: string | null
          id?: string
          name?: string
          phase?: string
          phase_dates?: Json
          phase_diagnostico_completed_at?: string | null
          phase_diagnostico_end?: string | null
          phase_diagnostico_start?: string | null
          phase_estruturacao_completed_at?: string | null
          phase_estruturacao_end?: string | null
          phase_estruturacao_start?: string | null
          phase_operacao_guiada_completed_at?: string | null
          phase_operacao_guiada_end?: string | null
          phase_operacao_guiada_start?: string | null
          phase_transferencia_completed_at?: string | null
          phase_transferencia_end?: string | null
          phase_transferencia_start?: string | null
          segment?: string | null
          service_type?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          client_id: string
          content: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          content: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          content?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          client_id: string
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          manager_name: string | null
          sent_at: string | null
          sent_to_email: string | null
          signed_at: string | null
          status: string | null
          template_name: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          manager_name?: string | null
          sent_at?: string | null
          sent_to_email?: string | null
          signed_at?: string | null
          status?: string | null
          template_name?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          manager_name?: string | null
          sent_at?: string | null
          sent_to_email?: string | null
          signed_at?: string | null
          status?: string | null
          template_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      creative_deliverable_versions: {
        Row: {
          client_id: string
          content: string | null
          created_at: string
          created_by: string | null
          deliverable_id: string
          file_path: string | null
          file_url: string | null
          id: string
          notes: string | null
          version_number: number
        }
        Insert: {
          client_id: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          deliverable_id: string
          file_path?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          version_number: number
        }
        Update: {
          client_id?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          deliverable_id?: string
          file_path?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "creative_deliverable_versions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_deliverable_versions_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "creative_deliverables"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_deliverables: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approved_by_ponto_focal: boolean
          client_id: string
          content: string | null
          created_at: string
          created_by: string | null
          current_version: number
          demand_id: string
          feedback: string | null
          id: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_ponto_focal?: boolean
          client_id: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          current_version?: number
          demand_id: string
          feedback?: string | null
          id?: string
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_ponto_focal?: boolean
          client_id?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          current_version?: number
          demand_id?: string
          feedback?: string | null
          id?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_deliverables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_deliverables_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "creative_demands"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_demands: {
        Row: {
          assigned_to: string | null
          briefing: string | null
          campaign_id: string | null
          client_id: string
          created_at: string
          deadline: string | null
          format: string | null
          id: string
          objective: string | null
          platform: string | null
          priority: string
          requested_by: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          briefing?: string | null
          campaign_id?: string | null
          client_id: string
          created_at?: string
          deadline?: string | null
          format?: string | null
          id?: string
          objective?: string | null
          platform?: string | null
          priority?: string
          requested_by?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          briefing?: string | null
          campaign_id?: string | null
          client_id?: string
          created_at?: string
          deadline?: string | null
          format?: string | null
          id?: string
          objective?: string | null
          platform?: string | null
          priority?: string
          requested_by?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_demands_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_demands_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          chunk_index: number
          client_id: string
          content: string
          created_at: string
          file_id: string
          id: string
          metadata: Json
          page_number: number | null
          token_count: number | null
        }
        Insert: {
          chunk_index: number
          client_id: string
          content: string
          created_at?: string
          file_id: string
          id?: string
          metadata?: Json
          page_number?: number | null
          token_count?: number | null
        }
        Update: {
          chunk_index?: number
          client_id?: string
          content?: string
          created_at?: string
          file_id?: string
          id?: string
          metadata?: Json
          page_number?: number | null
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunks_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      document_embeddings: {
        Row: {
          chunk_id: string
          client_id: string
          created_at: string
          embedding: string
          id: string
          model: string
        }
        Insert: {
          chunk_id: string
          client_id: string
          created_at?: string
          embedding: string
          id?: string
          model?: string
        }
        Update: {
          chunk_id?: string
          client_id?: string
          created_at?: string
          embedding?: string
          id?: string
          model?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_embeddings_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "document_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_embeddings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      document_permissions: {
        Row: {
          can_be_used_by_ai: boolean
          created_at: string
          file_id: string
          id: string
          role: string | null
          user_id: string | null
        }
        Insert: {
          can_be_used_by_ai?: boolean
          created_at?: string
          file_id: string
          id?: string
          role?: string | null
          user_id?: string | null
        }
        Update: {
          can_be_used_by_ai?: boolean
          created_at?: string
          file_id?: string
          id?: string
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_permissions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      email_funnel_steps: {
        Row: {
          created_at: string
          delay_days: number
          funnel_id: string
          html_body: string
          id: string
          step_number: number
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delay_days?: number
          funnel_id: string
          html_body?: string
          id?: string
          step_number?: number
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delay_days?: number
          funnel_id?: string
          html_body?: string
          id?: string
          step_number?: number
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_funnel_steps_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "email_funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      email_funnels: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      files: {
        Row: {
          category: string | null
          client_id: string
          created_at: string | null
          description: string | null
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          mime_type: string | null
          name: string
          project_id: string | null
          task_id: string | null
          template_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          client_id: string
          created_at?: string | null
          description?: string | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          mime_type?: string | null
          name: string
          project_id?: string | null
          task_id?: string | null
          template_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          client_id?: string
          created_at?: string | null
          description?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          mime_type?: string | null
          name?: string
          project_id?: string | null
          task_id?: string | null
          template_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "files_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      insights: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          body: string
          category: string
          client_id: string
          created_at: string
          created_by: string | null
          evidence: Json
          generated_by: string
          id: string
          status: string
          title: string
          updated_at: string
          urgency: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          body: string
          category?: string
          client_id: string
          created_at?: string
          created_by?: string | null
          evidence?: Json
          generated_by?: string
          id?: string
          status?: string
          title: string
          updated_at?: string
          urgency?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          body?: string
          category?: string
          client_id?: string
          created_at?: string
          created_by?: string | null
          evidence?: Json
          generated_by?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "insights_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_clusters: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          intent: string | null
          name: string
          pillar_url: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          intent?: string | null
          name: string
          pillar_url?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          intent?: string | null
          name?: string
          pillar_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "keyword_clusters_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_rankings: {
        Row: {
          checked_at: string
          client_id: string
          id: string
          keyword_id: string
          notes: string | null
          position: number
          source: string
        }
        Insert: {
          checked_at?: string
          client_id: string
          id?: string
          keyword_id: string
          notes?: string | null
          position: number
          source?: string
        }
        Update: {
          checked_at?: string
          client_id?: string
          id?: string
          keyword_id?: string
          notes?: string | null
          position?: number
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "keyword_rankings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keyword_rankings_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      keywords: {
        Row: {
          campaign_id: string | null
          client_id: string
          cluster_id: string | null
          cpc: number | null
          created_at: string
          created_by: string | null
          current_position: number | null
          difficulty: number | null
          id: string
          intent: string | null
          notes: string | null
          search_volume: number | null
          status: string
          tags: string[]
          target_url: string | null
          task_id: string | null
          term: string
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          client_id: string
          cluster_id?: string | null
          cpc?: number | null
          created_at?: string
          created_by?: string | null
          current_position?: number | null
          difficulty?: number | null
          id?: string
          intent?: string | null
          notes?: string | null
          search_volume?: number | null
          status?: string
          tags?: string[]
          target_url?: string | null
          task_id?: string | null
          term: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          client_id?: string
          cluster_id?: string | null
          cpc?: number | null
          created_at?: string
          created_by?: string | null
          current_position?: number | null
          difficulty?: number | null
          id?: string
          intent?: string | null
          notes?: string | null
          search_volume?: number | null
          status?: string
          tags?: string[]
          target_url?: string | null
          task_id?: string | null
          term?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "keywords_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keywords_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keywords_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "keyword_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_settings: {
        Row: {
          body_scripts: string | null
          chat_widget_enabled: boolean | null
          chat_widget_script: string | null
          created_at: string | null
          favicon_url: string | null
          ga4_enabled: boolean | null
          ga4_measurement_id: string | null
          google_ads_conversion_id: string | null
          google_ads_enabled: boolean | null
          google_ads_id: string | null
          gtm_enabled: boolean | null
          gtm_id: string | null
          head_scripts: string | null
          hotjar_enabled: boolean | null
          hotjar_id: string | null
          id: string
          linkedin_enabled: boolean | null
          linkedin_partner_id: string | null
          meta_app_secret: string | null
          meta_capi_access_token: string | null
          meta_capi_crm_events_enabled: boolean | null
          meta_capi_enabled: boolean | null
          meta_capi_test_event_code: string | null
          meta_page_access_token: string | null
          meta_pixel_enabled: boolean | null
          meta_pixel_id: string | null
          meta_webhook_verify_token: string | null
          og_image_url: string | null
          robots_txt: string | null
          search_console_verification: string | null
          search_console_verified: boolean | null
          site_description: string | null
          site_title: string | null
          tiktok_access_token: string | null
          tiktok_capi_enabled: boolean | null
          tiktok_pixel_enabled: boolean | null
          tiktok_pixel_id: string | null
          tiktok_test_event_code: string | null
          updated_at: string | null
          updated_by: string | null
          whatsapp_message: string | null
          whatsapp_number: string | null
        }
        Insert: {
          body_scripts?: string | null
          chat_widget_enabled?: boolean | null
          chat_widget_script?: string | null
          created_at?: string | null
          favicon_url?: string | null
          ga4_enabled?: boolean | null
          ga4_measurement_id?: string | null
          google_ads_conversion_id?: string | null
          google_ads_enabled?: boolean | null
          google_ads_id?: string | null
          gtm_enabled?: boolean | null
          gtm_id?: string | null
          head_scripts?: string | null
          hotjar_enabled?: boolean | null
          hotjar_id?: string | null
          id?: string
          linkedin_enabled?: boolean | null
          linkedin_partner_id?: string | null
          meta_app_secret?: string | null
          meta_capi_access_token?: string | null
          meta_capi_crm_events_enabled?: boolean | null
          meta_capi_enabled?: boolean | null
          meta_capi_test_event_code?: string | null
          meta_page_access_token?: string | null
          meta_pixel_enabled?: boolean | null
          meta_pixel_id?: string | null
          meta_webhook_verify_token?: string | null
          og_image_url?: string | null
          robots_txt?: string | null
          search_console_verification?: string | null
          search_console_verified?: boolean | null
          site_description?: string | null
          site_title?: string | null
          tiktok_access_token?: string | null
          tiktok_capi_enabled?: boolean | null
          tiktok_pixel_enabled?: boolean | null
          tiktok_pixel_id?: string | null
          tiktok_test_event_code?: string | null
          updated_at?: string | null
          updated_by?: string | null
          whatsapp_message?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          body_scripts?: string | null
          chat_widget_enabled?: boolean | null
          chat_widget_script?: string | null
          created_at?: string | null
          favicon_url?: string | null
          ga4_enabled?: boolean | null
          ga4_measurement_id?: string | null
          google_ads_conversion_id?: string | null
          google_ads_enabled?: boolean | null
          google_ads_id?: string | null
          gtm_enabled?: boolean | null
          gtm_id?: string | null
          head_scripts?: string | null
          hotjar_enabled?: boolean | null
          hotjar_id?: string | null
          id?: string
          linkedin_enabled?: boolean | null
          linkedin_partner_id?: string | null
          meta_app_secret?: string | null
          meta_capi_access_token?: string | null
          meta_capi_crm_events_enabled?: boolean | null
          meta_capi_enabled?: boolean | null
          meta_capi_test_event_code?: string | null
          meta_page_access_token?: string | null
          meta_pixel_enabled?: boolean | null
          meta_pixel_id?: string | null
          meta_webhook_verify_token?: string | null
          og_image_url?: string | null
          robots_txt?: string | null
          search_console_verification?: string | null
          search_console_verified?: boolean | null
          site_description?: string | null
          site_title?: string | null
          tiktok_access_token?: string | null
          tiktok_capi_enabled?: boolean | null
          tiktok_pixel_enabled?: boolean | null
          tiktok_pixel_id?: string | null
          tiktok_test_event_code?: string | null
          updated_at?: string | null
          updated_by?: string | null
          whatsapp_message?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          lead_id: string
          metadata: Json | null
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_follow_ups: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          lead_id: string
          message: string | null
          scheduled_at: string
          status: string
          type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id: string
          message?: string | null
          scheduled_at: string
          status?: string
          type?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string
          message?: string | null
          scheduled_at?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_funnel_emails_sent: {
        Row: {
          enrollment_id: string
          id: string
          sent_at: string
          step_id: string
        }
        Insert: {
          enrollment_id: string
          id?: string
          sent_at?: string
          step_id: string
        }
        Update: {
          enrollment_id?: string
          id?: string
          sent_at?: string
          step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_funnel_emails_sent_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "lead_funnel_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_funnel_emails_sent_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "email_funnel_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_funnel_enrollments: {
        Row: {
          created_at: string
          enrolled_at: string
          funnel_id: string
          id: string
          lead_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enrolled_at?: string
          funnel_id: string
          id?: string
          lead_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enrolled_at?: string
          funnel_id?: string
          id?: string
          lead_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_funnel_enrollments_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "email_funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_funnel_enrollments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string | null
          email: string
          id: string
          investment: string | null
          name: string
          objective: string | null
          phone: string | null
          segment: string | null
          service_interest: string | null
          source: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          investment?: string | null
          name: string
          objective?: string | null
          phone?: string | null
          segment?: string | null
          service_interest?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          investment?: string | null
          name?: string
          objective?: string | null
          phone?: string | null
          segment?: string | null
          service_interest?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      learnings: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approved_by_ponto_focal: boolean | null
          category: string | null
          client_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          experiment_id: string | null
          id: string
          impact: string | null
          project_id: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_ponto_focal?: boolean | null
          category?: string | null
          client_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          experiment_id?: string | null
          id?: string
          impact?: string | null
          project_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_ponto_focal?: boolean | null
          category?: string | null
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          experiment_id?: string | null
          id?: string
          impact?: string | null
          project_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learnings_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learnings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learnings_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learnings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          message: string
          read: boolean
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          client_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          invoice_number: string | null
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          client_id: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          ponto_focal: boolean
          updated_at: string | null
          user_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          client_id?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          ponto_focal?: boolean
          updated_at?: string | null
          user_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          client_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          ponto_focal?: boolean
          updated_at?: string | null
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          client_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          client_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          client_name: string
          client_segment: string | null
          created_at: string
          created_by: string | null
          id: string
          lead_id: string | null
          service_type: string
          slides: Json
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          client_name: string
          client_segment?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string | null
          service_type: string
          slides?: Json
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          client_name?: string
          client_segment?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string | null
          service_type?: string
          slides?: Json
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      strategic_plans: {
        Row: {
          budget_allocation: Json | null
          campaign_types: string[] | null
          client_id: string
          created_at: string | null
          created_by: string | null
          diagnostic: Json | null
          execution_plan: Json | null
          executive_summary: string | null
          funnel_strategy: Json | null
          id: string
          kpis: Json | null
          objectives: Json | null
          personas: Json | null
          status: string | null
          timeline_end: string | null
          timeline_start: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          budget_allocation?: Json | null
          campaign_types?: string[] | null
          client_id: string
          created_at?: string | null
          created_by?: string | null
          diagnostic?: Json | null
          execution_plan?: Json | null
          executive_summary?: string | null
          funnel_strategy?: Json | null
          id?: string
          kpis?: Json | null
          objectives?: Json | null
          personas?: Json | null
          status?: string | null
          timeline_end?: string | null
          timeline_start?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          budget_allocation?: Json | null
          campaign_types?: string[] | null
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          diagnostic?: Json | null
          execution_plan?: Json | null
          executive_summary?: string | null
          funnel_strategy?: Json | null
          id?: string
          kpis?: Json | null
          objectives?: Json | null
          personas?: Json | null
          status?: string | null
          timeline_end?: string | null
          timeline_start?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      task_templates: {
        Row: {
          created_at: string | null
          description: string | null
          execution_guide: string | null
          id: string
          is_active: boolean | null
          journey_phase: string
          order_index: number | null
          priority: string | null
          service_type: string
          title: string
          updated_at: string | null
          visible_to_client: boolean | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          execution_guide?: string | null
          id?: string
          is_active?: boolean | null
          journey_phase: string
          order_index?: number | null
          priority?: string | null
          service_type?: string
          title: string
          updated_at?: string | null
          visible_to_client?: boolean | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          execution_guide?: string | null
          id?: string
          is_active?: boolean | null
          journey_phase?: string
          order_index?: number | null
          priority?: string | null
          service_type?: string
          title?: string
          updated_at?: string | null
          visible_to_client?: boolean | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          client_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          execution_guide: string | null
          executor_type: string | null
          id: string
          journey_phase: string | null
          priority: string | null
          project_id: string | null
          status: string | null
          title: string
          updated_at: string | null
          visible_to_client: boolean | null
        }
        Insert: {
          assigned_to?: string | null
          client_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          execution_guide?: string | null
          executor_type?: string | null
          id?: string
          journey_phase?: string | null
          priority?: string | null
          project_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          visible_to_client?: boolean | null
        }
        Update: {
          assigned_to?: string | null
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          execution_guide?: string | null
          executor_type?: string | null
          id?: string
          journey_phase?: string | null
          priority?: string | null
          project_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          visible_to_client?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      traffic_metrics: {
        Row: {
          alcance: number | null
          client_id: string
          cliques: number | null
          created_at: string | null
          created_by: string | null
          custo_por_clique: number | null
          custo_por_lead: number | null
          custo_por_sql: number | null
          custo_por_venda: number | null
          frequencia: number | null
          id: string
          impressoes: number | null
          investimento: number | null
          month: number
          quantidade_leads: number | null
          quantidade_sql: number | null
          quantidade_vendas: number | null
          updated_at: string | null
          updated_by: string | null
          year: number
        }
        Insert: {
          alcance?: number | null
          client_id: string
          cliques?: number | null
          created_at?: string | null
          created_by?: string | null
          custo_por_clique?: number | null
          custo_por_lead?: number | null
          custo_por_sql?: number | null
          custo_por_venda?: number | null
          frequencia?: number | null
          id?: string
          impressoes?: number | null
          investimento?: number | null
          month: number
          quantidade_leads?: number | null
          quantidade_sql?: number | null
          quantidade_vendas?: number | null
          updated_at?: string | null
          updated_by?: string | null
          year: number
        }
        Update: {
          alcance?: number | null
          client_id?: string
          cliques?: number | null
          created_at?: string | null
          created_by?: string | null
          custo_por_clique?: number | null
          custo_por_lead?: number | null
          custo_por_sql?: number | null
          custo_por_venda?: number | null
          frequencia?: number | null
          id?: string
          impressoes?: number | null
          investimento?: number | null
          month?: number
          quantidade_leads?: number | null
          quantidade_sql?: number | null
          quantidade_vendas?: number | null
          updated_at?: string | null
          updated_by?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "traffic_metrics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traffic_metrics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traffic_metrics_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_config: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          last_synced_at: string | null
          updated_at: string
          verify_token: string
          webhook_configured: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_synced_at?: string | null
          updated_at?: string
          verify_token?: string
          webhook_configured?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_synced_at?: string | null
          updated_at?: string
          verify_token?: string
          webhook_configured?: boolean
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          content: string | null
          created_at: string
          created_by: string | null
          direction: string
          id: string
          lead_id: string | null
          metadata: Json | null
          phone: string
          status: string
          template_name: string | null
          type: string
          wa_message_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          direction: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          phone: string
          status?: string
          template_name?: string | null
          type?: string
          wa_message_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          direction?: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          phone?: string
          status?: string
          template_name?: string | null
          type?: string
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      landing_settings_safe: {
        Row: {
          body_scripts: string | null
          chat_widget_enabled: boolean | null
          chat_widget_script: string | null
          created_at: string | null
          favicon_url: string | null
          ga4_enabled: boolean | null
          ga4_measurement_id: string | null
          google_ads_conversion_id: string | null
          google_ads_enabled: boolean | null
          google_ads_id: string | null
          gtm_enabled: boolean | null
          gtm_id: string | null
          head_scripts: string | null
          hotjar_enabled: boolean | null
          hotjar_id: string | null
          id: string | null
          linkedin_enabled: boolean | null
          linkedin_partner_id: string | null
          meta_app_secret_configured: boolean | null
          meta_capi_access_token_configured: boolean | null
          meta_capi_crm_events_enabled: boolean | null
          meta_capi_enabled: boolean | null
          meta_capi_test_event_code: string | null
          meta_page_access_token_configured: boolean | null
          meta_pixel_enabled: boolean | null
          meta_pixel_id: string | null
          meta_webhook_verify_token_configured: boolean | null
          og_image_url: string | null
          robots_txt: string | null
          search_console_verification: string | null
          search_console_verified: boolean | null
          site_description: string | null
          site_title: string | null
          tiktok_access_token_configured: boolean | null
          tiktok_capi_enabled: boolean | null
          tiktok_pixel_enabled: boolean | null
          tiktok_pixel_id: string | null
          tiktok_test_event_code: string | null
          updated_at: string | null
          updated_by: string | null
          whatsapp_message: string | null
          whatsapp_number: string | null
        }
        Insert: {
          body_scripts?: string | null
          chat_widget_enabled?: boolean | null
          chat_widget_script?: string | null
          created_at?: string | null
          favicon_url?: string | null
          ga4_enabled?: boolean | null
          ga4_measurement_id?: string | null
          google_ads_conversion_id?: string | null
          google_ads_enabled?: boolean | null
          google_ads_id?: string | null
          gtm_enabled?: boolean | null
          gtm_id?: string | null
          head_scripts?: string | null
          hotjar_enabled?: boolean | null
          hotjar_id?: string | null
          id?: string | null
          linkedin_enabled?: boolean | null
          linkedin_partner_id?: string | null
          meta_app_secret_configured?: never
          meta_capi_access_token_configured?: never
          meta_capi_crm_events_enabled?: boolean | null
          meta_capi_enabled?: boolean | null
          meta_capi_test_event_code?: string | null
          meta_page_access_token_configured?: never
          meta_pixel_enabled?: boolean | null
          meta_pixel_id?: string | null
          meta_webhook_verify_token_configured?: never
          og_image_url?: string | null
          robots_txt?: string | null
          search_console_verification?: string | null
          search_console_verified?: boolean | null
          site_description?: string | null
          site_title?: string | null
          tiktok_access_token_configured?: never
          tiktok_capi_enabled?: boolean | null
          tiktok_pixel_enabled?: boolean | null
          tiktok_pixel_id?: string | null
          tiktok_test_event_code?: string | null
          updated_at?: string | null
          updated_by?: string | null
          whatsapp_message?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          body_scripts?: string | null
          chat_widget_enabled?: boolean | null
          chat_widget_script?: string | null
          created_at?: string | null
          favicon_url?: string | null
          ga4_enabled?: boolean | null
          ga4_measurement_id?: string | null
          google_ads_conversion_id?: string | null
          google_ads_enabled?: boolean | null
          google_ads_id?: string | null
          gtm_enabled?: boolean | null
          gtm_id?: string | null
          head_scripts?: string | null
          hotjar_enabled?: boolean | null
          hotjar_id?: string | null
          id?: string | null
          linkedin_enabled?: boolean | null
          linkedin_partner_id?: string | null
          meta_app_secret_configured?: never
          meta_capi_access_token_configured?: never
          meta_capi_crm_events_enabled?: boolean | null
          meta_capi_enabled?: boolean | null
          meta_capi_test_event_code?: string | null
          meta_page_access_token_configured?: never
          meta_pixel_enabled?: boolean | null
          meta_pixel_id?: string | null
          meta_webhook_verify_token_configured?: never
          og_image_url?: string | null
          robots_txt?: string | null
          search_console_verification?: string | null
          search_console_verified?: boolean | null
          site_description?: string | null
          site_title?: string | null
          tiktok_access_token_configured?: never
          tiktok_capi_enabled?: boolean | null
          tiktok_pixel_enabled?: boolean | null
          tiktok_pixel_id?: string | null
          tiktok_test_event_code?: string | null
          updated_at?: string | null
          updated_by?: string | null
          whatsapp_message?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_upload_files: {
        Args: { _client_id: string; _user_id: string }
        Returns: boolean
      }
      client_has_ponto_focal: { Args: { _client_id: string }; Returns: boolean }
      count_client_users: { Args: { _client_id: string }; Returns: number }
      get_capture_page_by_slug: { Args: { _slug: string }; Returns: Json }
      get_dashboard_kpis: {
        Args: { _from: string; _to: string }
        Returns: Json
      }
      get_project_stats: {
        Args: { _client_id?: string }
        Returns: {
          campaigns_count: number
          deliverables_count: number
          learnings_count: number
          project_id: string
          tasks_done: number
          tasks_total: number
        }[]
      }
      get_public_tracking_config: { Args: never; Returns: Json }
      get_user_client_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_ponto_focal: {
        Args: { _client_id: string; _user_id: string }
        Returns: boolean
      }
      log_phase_change: {
        Args: {
          _actor_user_id: string
          _client_id: string
          _from_phase: string
          _to_phase: string
        }
        Returns: string
      }
      match_document_chunks: {
        Args: {
          match_count?: number
          query_embedding: string
          similarity_threshold?: number
          target_client_id: string
        }
        Returns: {
          chunk_id: string
          content: string
          file_id: string
          file_name: string
          page_number: number
          similarity: number
        }[]
      }
      set_ponto_focal: {
        Args: { _client_id: string; _user_id: string }
        Returns: boolean
      }
      user_has_client_access: {
        Args: { _client_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "account_manager" | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "account_manager", "client"],
    },
  },
} as const
