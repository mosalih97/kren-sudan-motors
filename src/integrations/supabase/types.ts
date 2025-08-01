export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      ad_boost_logs: {
        Row: {
          ad_id: string
          boost_type_id: string
          created_at: string
          end_time: string
          id: string
          start_time: string
          status: string
          user_id: string
        }
        Insert: {
          ad_id: string
          boost_type_id: string
          created_at?: string
          end_time: string
          id?: string
          start_time?: string
          status?: string
          user_id: string
        }
        Update: {
          ad_id?: string
          boost_type_id?: string
          created_at?: string
          end_time?: string
          id?: string
          start_time?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_boost_logs_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_boost_logs_boost_type_id_fkey"
            columns: ["boost_type_id"]
            isOneToOne: false
            referencedRelation: "boost_types"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_boosts: {
        Row: {
          ad_id: string
          boost_plan: string | null
          boost_type: string
          boosted_at: string
          cost: number
          created_at: string
          expires_at: string
          id: string
          original_expires_at: string | null
          payment_method: string
          status: string
          tier_priority: number | null
          user_id: string
          views_gained: number | null
        }
        Insert: {
          ad_id: string
          boost_plan?: string | null
          boost_type?: string
          boosted_at?: string
          cost?: number
          created_at?: string
          expires_at: string
          id?: string
          original_expires_at?: string | null
          payment_method?: string
          status?: string
          tier_priority?: number | null
          user_id: string
          views_gained?: number | null
        }
        Update: {
          ad_id?: string
          boost_plan?: string | null
          boost_type?: string
          boosted_at?: string
          cost?: number
          created_at?: string
          expires_at?: string
          id?: string
          original_expires_at?: string | null
          payment_method?: string
          status?: string
          tier_priority?: number | null
          user_id?: string
          views_gained?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_boosts_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_interactions: {
        Row: {
          ad_id: string
          created_at: string | null
          id: string
          interaction_type: string
          points_spent: number | null
          user_id: string
        }
        Insert: {
          ad_id: string
          created_at?: string | null
          id?: string
          interaction_type: string
          points_spent?: number | null
          user_id: string
        }
        Update: {
          ad_id?: string
          created_at?: string | null
          id?: string
          interaction_type?: string
          points_spent?: number | null
          user_id?: string
        }
        Relationships: []
      }
      admin_credentials: {
        Row: {
          created_at: string
          id: string
          password_hash: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          password_hash: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          password_hash?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      admin_sessions: {
        Row: {
          admin_user_id: string | null
          created_at: string
          expires_at: string
          id: string
          ip_address: string | null
          is_active: boolean
          session_token: string
          user_agent: string | null
        }
        Insert: {
          admin_user_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          session_token: string
          user_agent?: string | null
        }
        Update: {
          admin_user_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          session_token?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_credentials"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
      ads: {
        Row: {
          brand: string
          city: string
          condition: string | null
          created_at: string
          description: string | null
          fuel_type: string | null
          id: string
          images: string[] | null
          is_featured: boolean | null
          is_new: boolean | null
          is_premium: boolean | null
          last_top_spot_viewed: string | null
          mileage: string | null
          model: string
          phone: string | null
          price: number
          priority_score: number | null
          status: string | null
          times_shown_top: number | null
          title: string
          top_spot: boolean | null
          top_spot_until: string | null
          transmission: string | null
          updated_at: string
          user_id: string
          view_count: number | null
          whatsapp: string | null
          year: number | null
        }
        Insert: {
          brand: string
          city: string
          condition?: string | null
          created_at?: string
          description?: string | null
          fuel_type?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          is_new?: boolean | null
          is_premium?: boolean | null
          last_top_spot_viewed?: string | null
          mileage?: string | null
          model: string
          phone?: string | null
          price: number
          priority_score?: number | null
          status?: string | null
          times_shown_top?: number | null
          title: string
          top_spot?: boolean | null
          top_spot_until?: string | null
          transmission?: string | null
          updated_at?: string
          user_id: string
          view_count?: number | null
          whatsapp?: string | null
          year?: number | null
        }
        Update: {
          brand?: string
          city?: string
          condition?: string | null
          created_at?: string
          description?: string | null
          fuel_type?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          is_new?: boolean | null
          is_premium?: boolean | null
          last_top_spot_viewed?: string | null
          mileage?: string | null
          model?: string
          phone?: string | null
          price?: number
          priority_score?: number | null
          status?: string | null
          times_shown_top?: number | null
          title?: string
          top_spot?: boolean | null
          top_spot_until?: string | null
          transmission?: string | null
          updated_at?: string
          user_id?: string
          view_count?: number | null
          whatsapp?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      boost_types: {
        Row: {
          created_at: string
          duration_hours: number
          features: Json
          id: string
          label: string
          points_cost: number
        }
        Insert: {
          created_at?: string
          duration_hours: number
          features: Json
          id?: string
          label: string
          points_cost: number
        }
        Update: {
          created_at?: string
          duration_hours?: number
          features?: Json
          id?: string
          label?: string
          points_cost?: number
        }
        Relationships: []
      }
      favorites: {
        Row: {
          ad_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          ad_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          ad_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      messages: {
        Row: {
          ad_id: string | null
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          ad_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          ad_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      password_reset_attempts: {
        Row: {
          attempted_at: string | null
          created_at: string | null
          email: string
          id: string
          ip_address: string | null
        }
        Insert: {
          attempted_at?: string | null
          created_at?: string | null
          email: string
          id?: string
          ip_address?: string | null
        }
        Update: {
          attempted_at?: string | null
          created_at?: string | null
          email?: string
          id?: string
          ip_address?: string | null
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          updated_at: string | null
          used: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          updated_at?: string | null
          used?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          updated_at?: string | null
          used?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      payment_receipts: {
        Row: {
          created_at: string
          date_of_payment: string
          green_image_url: string
          id: string
          transaction_id: string
          user_id: string
          verified: boolean
          white_image_url: string
        }
        Insert: {
          created_at?: string
          date_of_payment: string
          green_image_url: string
          id?: string
          transaction_id: string
          user_id: string
          verified?: boolean
          white_image_url: string
        }
        Update: {
          created_at?: string
          date_of_payment?: string
          green_image_url?: string
          id?: string
          transaction_id?: string
          user_id?: string
          verified?: boolean
          white_image_url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          credits: number | null
          display_name: string | null
          frozen_points: number | null
          id: string
          is_premium: boolean | null
          last_monthly_reset: string | null
          membership_type: string | null
          monthly_ads_count: number | null
          phone: string | null
          points: number | null
          premium_expires_at: string | null
          role: string | null
          updated_at: string
          upgraded_at: string | null
          upgraded_by: string | null
          user_id: string
          user_id_display: string | null
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          credits?: number | null
          display_name?: string | null
          frozen_points?: number | null
          id?: string
          is_premium?: boolean | null
          last_monthly_reset?: string | null
          membership_type?: string | null
          monthly_ads_count?: number | null
          phone?: string | null
          points?: number | null
          premium_expires_at?: string | null
          role?: string | null
          updated_at?: string
          upgraded_at?: string | null
          upgraded_by?: string | null
          user_id: string
          user_id_display?: string | null
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          credits?: number | null
          display_name?: string | null
          frozen_points?: number | null
          id?: string
          is_premium?: boolean | null
          last_monthly_reset?: string | null
          membership_type?: string | null
          monthly_ads_count?: number | null
          phone?: string | null
          points?: number | null
          premium_expires_at?: string | null
          role?: string | null
          updated_at?: string
          upgraded_at?: string | null
          upgraded_by?: string | null
          user_id?: string
          user_id_display?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      receipt_logs: {
        Row: {
          created_at: string
          extracted_data: Json | null
          id: string
          image_urls: string[]
          reason: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          extracted_data?: Json | null
          id?: string
          image_urls: string[]
          reason?: string | null
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          extracted_data?: Json | null
          id?: string
          image_urls?: string[]
          reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      receipt_submissions: {
        Row: {
          extracted_text: string | null
          id: string
          membership_id: string
          receipt_date: string | null
          receipt_url: string
          rejection_reason: string | null
          status: string | null
          submitted_at: string | null
          transaction_number: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          extracted_text?: string | null
          id?: string
          membership_id: string
          receipt_date?: string | null
          receipt_url: string
          rejection_reason?: string | null
          status?: string | null
          submitted_at?: string | null
          transaction_number?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          extracted_text?: string | null
          id?: string
          membership_id?: string
          receipt_date?: string | null
          receipt_url?: string
          rejection_reason?: string | null
          status?: string | null
          submitted_at?: string | null
          transaction_number?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      upgrade_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          expires_at: string | null
          from_membership: string
          id: string
          notes: string | null
          to_membership: string
          user_id: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          expires_at?: string | null
          from_membership: string
          id?: string
          notes?: string | null
          to_membership: string
          user_id: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          expires_at?: string | null
          from_membership?: string
          id?: string
          notes?: string | null
          to_membership?: string
          user_id?: string
        }
        Relationships: []
      }
      used_receipt_transactions: {
        Row: {
          created_at: string | null
          id: string
          receipt_date: string
          transaction_number: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          receipt_date: string
          transaction_number: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          receipt_date?: string
          transaction_number?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      used_transaction_ids: {
        Row: {
          created_at: string
          id: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          transaction_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_activity: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      verified_passports: {
        Row: {
          created_at: string
          extracted_text: string | null
          full_name: string | null
          id: string
          passport_image_url: string
          passport_number: string | null
          receipt_id: string | null
          updated_at: string
          user_id: string
          verification_status: string | null
          verified: boolean | null
        }
        Insert: {
          created_at?: string
          extracted_text?: string | null
          full_name?: string | null
          id?: string
          passport_image_url: string
          passport_number?: string | null
          receipt_id?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string
          extracted_text?: string | null
          full_name?: string | null
          id?: string
          passport_image_url?: string
          passport_number?: string | null
          receipt_id?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "verified_passports_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipt_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_dashboard_stats: {
        Row: {
          active_ads: number | null
          active_boosts: number | null
          basic_boosts: number | null
          deleted_ads: number | null
          new_users_this_month: number | null
          premium_ads: number | null
          premium_boosts: number | null
          premium_users: number | null
          total_credits: number | null
          total_points: number | null
          total_users: number | null
          ultimate_boosts: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      boost_ad: {
        Args: {
          ad_id_param: string
          user_id_param: string
          boost_type_id_param: string
        }
        Returns: Json
      }
      boost_ad_enhanced: {
        Args: {
          ad_id_param: string
          user_id_param: string
          boost_plan?: string
        }
        Returns: Json
      }
      boost_ad_to_top_spot: {
        Args: {
          ad_id_param: string
          user_id_param: string
          hours_duration?: number
        }
        Returns: Json
      }
      calculate_ad_priority_score: {
        Args: { ad_id_param: string }
        Returns: number
      }
      can_boost_ad: {
        Args: { ad_id_param: string; user_id_param: string }
        Returns: Json
      }
      can_boost_ad_enhanced: {
        Args: {
          ad_id_param: string
          user_id_param: string
          boost_plan?: string
        }
        Returns: Json
      }
      check_admin_access: {
        Args: { user_email: string }
        Returns: boolean
      }
      cleanup_expired_boosts: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_reset_tokens: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_top_spots: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_reset_attempts: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_admin_session: {
        Args: {
          username_input: string
          password_input: string
          ip_addr?: string
          user_agent_input?: string
        }
        Returns: Json
      }
      create_password_reset_token: {
        Args: { user_email: string }
        Returns: Json
      }
      deduct_points: {
        Args: { user_id_param: string; points_to_deduct: number }
        Returns: boolean
      }
      delete_ad_permanently: {
        Args: { ad_id_param: string; admin_user_id: string }
        Returns: Json
      }
      downgrade_user_to_free: {
        Args: { target_user_id: string; admin_user_id: string }
        Returns: Json
      }
      generate_unique_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_admin_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_admin_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_admin_users_list: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          display_name: string
          phone: string
          city: string
          membership_type: string
          is_premium: boolean
          points: number
          credits: number
          created_at: string
          upgraded_at: string
          premium_expires_at: string
          days_remaining: number
          ads_count: number
        }[]
      }
      get_boost_stats: {
        Args: { user_id_param: string }
        Returns: Json
      }
      get_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_total_points: {
        Args: { user_id_param: string }
        Returns: Json
      }
      is_admin: {
        Args: { user_email: string }
        Returns: boolean
      }
      is_admin_user: {
        Args: { user_email: string }
        Returns: boolean
      }
      log_security_event: {
        Args: { event_type: string; event_data?: Json }
        Returns: undefined
      }
      logout_all_admin_sessions: {
        Args: { admin_id: string }
        Returns: Json
      }
      record_ad_view: {
        Args: { ad_id_param: string; viewer_user_id?: string }
        Returns: undefined
      }
      reset_password_with_token: {
        Args: { reset_token: string; new_password: string }
        Returns: Json
      }
      update_admin_credentials: {
        Args: {
          admin_user_id: string
          new_username: string
          new_password_hash: string
        }
        Returns: Json
      }
      upgrade_user_to_premium: {
        Args: { target_user_id: string; admin_user_id: string }
        Returns: Json
      }
      verify_admin_session: {
        Args: { token: string }
        Returns: Json
      }
      verify_password_reset_token: {
        Args: { reset_token: string }
        Returns: Json
      }
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
    Enums: {},
  },
} as const
