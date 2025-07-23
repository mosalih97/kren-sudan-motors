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
          updated_at: string
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
          updated_at?: string
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
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      cleanup_expired_top_spots: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      deduct_points: {
        Args: { user_id_param: string; points_to_deduct: number }
        Returns: boolean
      }
      generate_unique_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_boost_stats: {
        Args: { user_id_param: string }
        Returns: Json
      }
      get_user_total_points: {
        Args: { user_id_param: string }
        Returns: Json
      }
      record_ad_view: {
        Args: { ad_id_param: string; viewer_user_id?: string }
        Returns: undefined
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
