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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      clinician_audit_events: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: string
          patient_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string
          created_at?: string
          id?: string
          patient_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: string
          patient_id?: string | null
        }
        Relationships: []
      }
      clinician_case_updates: {
        Row: {
          case_id: string
          content: string
          created_at: string
          event_date: string
          event_type: string
          id: string
          patient_id: string
          recorded_by: string
        }
        Insert: {
          case_id: string
          content: string
          created_at?: string
          event_date: string
          event_type: string
          id?: string
          patient_id: string
          recorded_by?: string
        }
        Update: {
          case_id?: string
          content?: string
          created_at?: string
          event_date?: string
          event_type?: string
          id?: string
          patient_id?: string
          recorded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinician_case_updates_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "clinician_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinician_case_updates_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "clinician_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinician_cases: {
        Row: {
          archived: boolean
          category: string
          created_at: string
          created_by: string
          follow_up_date: string | null
          id: string
          opened_date: string
          outcomes: string
          patient_id: string
          summary: string
          title: string
        }
        Insert: {
          archived?: boolean
          category: string
          created_at?: string
          created_by?: string
          follow_up_date?: string | null
          id?: string
          opened_date: string
          outcomes?: string
          patient_id: string
          summary?: string
          title: string
        }
        Update: {
          archived?: boolean
          category?: string
          created_at?: string
          created_by?: string
          follow_up_date?: string | null
          id?: string
          opened_date?: string
          outcomes?: string
          patient_id?: string
          summary?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinician_cases_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "clinician_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinician_checkins: {
        Row: {
          case_id: string | null
          created_at: string
          id: string
          observation_date: string
          observations: string
          patient_id: string
          ratings: Json
          recorded_by: string
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          id?: string
          observation_date: string
          observations?: string
          patient_id: string
          ratings?: Json
          recorded_by?: string
        }
        Update: {
          case_id?: string | null
          created_at?: string
          id?: string
          observation_date?: string
          observations?: string
          patient_id?: string
          ratings?: Json
          recorded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinician_checkins_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "clinician_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinician_checkins_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "clinician_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinician_consents: {
        Row: {
          acknowledged_at: string
          clinician_id: string
          id: string
          patient_id: string
          revoked_at: string | null
          scope: string
        }
        Insert: {
          acknowledged_at?: string
          clinician_id: string
          id?: string
          patient_id: string
          revoked_at?: string | null
          scope?: string
        }
        Update: {
          acknowledged_at?: string
          clinician_id?: string
          id?: string
          patient_id?: string
          revoked_at?: string | null
          scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinician_consents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "clinician_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinician_deletion_requests: {
        Row: {
          created_at: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      clinician_documents: {
        Row: {
          archived: boolean
          case_id: string
          created_at: string
          document_date: string
          file_name: string
          id: string
          is_test: boolean
          note: string
          patient_id: string
          storage_path: string
          tags: string[]
          treatment_id: string | null
          uploaded_by: string
        }
        Insert: {
          archived?: boolean
          case_id: string
          created_at?: string
          document_date: string
          file_name: string
          id?: string
          is_test?: boolean
          note?: string
          patient_id: string
          storage_path: string
          tags?: string[]
          treatment_id?: string | null
          uploaded_by?: string
        }
        Update: {
          archived?: boolean
          case_id?: string
          created_at?: string
          document_date?: string
          file_name?: string
          id?: string
          is_test?: boolean
          note?: string
          patient_id?: string
          storage_path?: string
          tags?: string[]
          treatment_id?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinician_documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "clinician_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinician_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "clinician_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinician_documents_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "clinician_treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      clinician_notes: {
        Row: {
          case_id: string | null
          content: string
          created_at: string
          id: string
          patient_id: string
          photo_a: string | null
          photo_b: string | null
          recorded_by: string
        }
        Insert: {
          case_id?: string | null
          content: string
          created_at?: string
          id?: string
          patient_id: string
          photo_a?: string | null
          photo_b?: string | null
          recorded_by?: string
        }
        Update: {
          case_id?: string | null
          content?: string
          created_at?: string
          id?: string
          patient_id?: string
          photo_a?: string | null
          photo_b?: string | null
          recorded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinician_notes_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "clinician_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinician_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "clinician_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinician_notes_photo_a_fkey"
            columns: ["photo_a"]
            isOneToOne: false
            referencedRelation: "clinician_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinician_notes_photo_b_fkey"
            columns: ["photo_b"]
            isOneToOne: false
            referencedRelation: "clinician_photos"
            referencedColumns: ["id"]
          },
        ]
      }
      clinician_patient_access: {
        Row: {
          clinician_id: string
          patient_id: string
        }
        Insert: {
          clinician_id: string
          patient_id: string
        }
        Update: {
          clinician_id?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinician_patient_access_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "clinician_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinician_patients: {
        Row: {
          archived: boolean
          concern: string
          consultation_date: string
          created_at: string
          display_name: string
          follow_up_date: string | null
          id: string
          is_test: boolean
          owner_id: string
          routine: string
          symptoms: string
        }
        Insert: {
          archived?: boolean
          concern: string
          consultation_date: string
          created_at?: string
          display_name: string
          follow_up_date?: string | null
          id?: string
          is_test?: boolean
          owner_id: string
          routine?: string
          symptoms?: string
        }
        Update: {
          archived?: boolean
          concern?: string
          consultation_date?: string
          created_at?: string
          display_name?: string
          follow_up_date?: string | null
          id?: string
          is_test?: boolean
          owner_id?: string
          routine?: string
          symptoms?: string
        }
        Relationships: []
      }
      clinician_photos: {
        Row: {
          archived: boolean
          capture_date: string
          case_id: string | null
          created_at: string
          facial_view: string
          id: string
          label: string
          note: string
          patient_id: string
          session_name: string
          storage_path: string
          tags: string[]
          treatment_id: string | null
          uploaded_by: string
        }
        Insert: {
          archived?: boolean
          capture_date: string
          case_id?: string | null
          created_at?: string
          facial_view: string
          id?: string
          label?: string
          note?: string
          patient_id: string
          session_name?: string
          storage_path: string
          tags?: string[]
          treatment_id?: string | null
          uploaded_by?: string
        }
        Update: {
          archived?: boolean
          capture_date?: string
          case_id?: string | null
          created_at?: string
          facial_view?: string
          id?: string
          label?: string
          note?: string
          patient_id?: string
          session_name?: string
          storage_path?: string
          tags?: string[]
          treatment_id?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinician_photos_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "clinician_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinician_photos_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "clinician_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinician_photos_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "clinician_treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      clinician_profiles: {
        Row: {
          clinic_name: string
          country: string
          full_name: string
          privacy_acknowledged_at: string
          professional_email: string
          professional_role: string
          test_only_acknowledged_at: string
          user_id: string
          verification_status: string
        }
        Insert: {
          clinic_name?: string
          country: string
          full_name: string
          privacy_acknowledged_at?: string
          professional_email: string
          professional_role: string
          test_only_acknowledged_at?: string
          user_id: string
          verification_status?: string
        }
        Update: {
          clinic_name?: string
          country?: string
          full_name?: string
          privacy_acknowledged_at?: string
          professional_email?: string
          professional_role?: string
          test_only_acknowledged_at?: string
          user_id?: string
          verification_status?: string
        }
        Relationships: []
      }
      clinician_treatments: {
        Row: {
          case_id: string | null
          created_at: string
          end_date: string | null
          follow_up_date: string | null
          id: string
          name: string
          notes: string
          patient_id: string
          procedure_type: string
          recorded_by: string
          start_date: string
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          end_date?: string | null
          follow_up_date?: string | null
          id?: string
          name: string
          notes?: string
          patient_id: string
          procedure_type?: string
          recorded_by?: string
          start_date: string
        }
        Update: {
          case_id?: string | null
          created_at?: string
          end_date?: string | null
          follow_up_date?: string | null
          id?: string
          name?: string
          notes?: string
          patient_id?: string
          procedure_type?: string
          recorded_by?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinician_treatments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "clinician_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinician_treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "clinician_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      email_leads: {
        Row: {
          created_at: string
          email: string
          experience_type: string
          id: string
          referred_by: string | null
        }
        Insert: {
          created_at?: string
          email: string
          experience_type: string
          id?: string
          referred_by?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          experience_type?: string
          id?: string
          referred_by?: string | null
        }
        Relationships: []
      }
      experiment_events: {
        Row: {
          created_at: string
          event_name: string
          experience_type: string
          id: string
          referral_code: string | null
          session_id: string
        }
        Insert: {
          created_at?: string
          event_name: string
          experience_type: string
          id?: string
          referral_code?: string | null
          session_id: string
        }
        Update: {
          created_at?: string
          event_name?: string
          experience_type?: string
          id?: string
          referral_code?: string | null
          session_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          affiliate_url: string | null
          approx_price: number | null
          best_for: string
          brand: string
          category: string
          concerns: string[]
          created_at: string
          fragrance_free: boolean | null
          id: string
          image_url: string | null
          key_ingredients: string[]
          name: string
          normal_url: string | null
          price_tier: number
          purpose: string
          rank: number
          sponsored: boolean
          why: string
        }
        Insert: {
          active?: boolean
          affiliate_url?: string | null
          approx_price?: number | null
          best_for?: string
          brand: string
          category: string
          concerns?: string[]
          created_at?: string
          fragrance_free?: boolean | null
          id?: string
          image_url?: string | null
          key_ingredients?: string[]
          name: string
          normal_url?: string | null
          price_tier: number
          purpose?: string
          rank?: number
          sponsored?: boolean
          why?: string
        }
        Update: {
          active?: boolean
          affiliate_url?: string | null
          approx_price?: number | null
          best_for?: string
          brand?: string
          category?: string
          concerns?: string[]
          created_at?: string
          fragrance_free?: boolean | null
          id?: string
          image_url?: string | null
          key_ingredients?: string[]
          name?: string
          normal_url?: string | null
          price_tier?: number
          purpose?: string
          rank?: number
          sponsored?: boolean
          why?: string
        }
        Relationships: []
      }
      rosie_conversations: {
        Row: {
          created_at: string
          messages: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          messages?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          messages?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_plans: {
        Row: {
          created_at: string
          environment: string
          plan: string
          plus_expires_at: string | null
          plus_started_at: string | null
          stripe_customer_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          environment?: string
          plan?: string
          plus_expires_at?: string | null
          plus_started_at?: string | null
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          environment?: string
          plan?: string
          plus_expires_at?: string | null
          plus_started_at?: string | null
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          role: string
          user_id: string
        }
        Insert: {
          role: string
          user_id: string
        }
        Update: {
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_clinician_patient: { Args: { p_id: string }; Returns: boolean }
      create_clinician_patient: {
        Args: {
          p_concern: string
          p_consent: boolean
          p_date: string
          p_follow: string
          p_name: string
          p_test: boolean
        }
        Returns: string
      }
      enroll_clinician: {
        Args: {
          p_clinic: string
          p_country: string
          p_name: string
          p_privacy: boolean
          p_role: string
          p_test: boolean
        }
        Returns: undefined
      }
      is_clinician: { Args: never; Returns: boolean }
      record_consumer_choice: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
