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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_key: string
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          rarity: string
          reward_cubes: Json | null
          reward_shards: number
          target_value: number | null
          title: string
        }
        Insert: {
          achievement_key: string
          category: string
          created_at?: string
          description: string
          icon: string
          id?: string
          rarity?: string
          reward_cubes?: Json | null
          reward_shards?: number
          target_value?: number | null
          title: string
        }
        Update: {
          achievement_key?: string
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          rarity?: string
          reward_cubes?: Json | null
          reward_shards?: number
          target_value?: number | null
          title?: string
        }
        Relationships: []
      }
      bonus_events: {
        Row: {
          active: boolean
          created_at: string
          description: string
          end_time: string
          event_type: string
          id: string
          multiplier: number
          start_time: string
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description: string
          end_time: string
          event_type: string
          id?: string
          multiplier?: number
          start_time: string
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          end_time?: string
          event_type?: string
          id?: string
          multiplier?: number
          start_time?: string
          title?: string
        }
        Relationships: []
      }
      crate_purchases: {
        Row: {
          amount: number
          bonus_shards: number | null
          crate_type: string
          created_at: string
          cubes_awarded: Json | null
          currency: string
          id: string
          processed_at: string | null
          status: string
          stripe_session_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          bonus_shards?: number | null
          crate_type: string
          created_at?: string
          cubes_awarded?: Json | null
          currency?: string
          id?: string
          processed_at?: string | null
          status?: string
          stripe_session_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          bonus_shards?: number | null
          crate_type?: string
          created_at?: string
          cubes_awarded?: Json | null
          currency?: string
          id?: string
          processed_at?: string | null
          status?: string
          stripe_session_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_challenges: {
        Row: {
          active_date: string
          challenge_type: string
          created_at: string
          description: string
          difficulty: string
          id: string
          reward_cubes: Json | null
          reward_shards: number
          target_value: number
          title: string
        }
        Insert: {
          active_date?: string
          challenge_type: string
          created_at?: string
          description: string
          difficulty?: string
          id?: string
          reward_cubes?: Json | null
          reward_shards: number
          target_value: number
          title: string
        }
        Update: {
          active_date?: string
          challenge_type?: string
          created_at?: string
          description?: string
          difficulty?: string
          id?: string
          reward_cubes?: Json | null
          reward_shards?: number
          target_value?: number
          title?: string
        }
        Relationships: []
      }
      daily_usage: {
        Row: {
          created_at: string
          date: string
          id: string
          minutes_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          minutes_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          minutes_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          category: string | null
          created_at: string
          developer_notes: string | null
          feedback_text: string
          id: string
          processed: boolean | null
          rating: number | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          developer_notes?: string | null
          feedback_text: string
          id?: string
          processed?: boolean | null
          rating?: number | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          developer_notes?: string | null
          feedback_text?: string
          id?: string
          processed?: boolean | null
          rating?: number | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      gifts: {
        Row: {
          claimed: boolean
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          cube_cost: number
          cube_id: string
          cube_name: string
          id: string
          message: string | null
          recipient: string
          recipient_type: string
          sender_email: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          claimed?: boolean
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          cube_cost: number
          cube_id: string
          cube_name: string
          id?: string
          message?: string | null
          recipient: string
          recipient_type: string
          sender_email: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          claimed?: boolean
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          cube_cost?: number
          cube_id?: string
          cube_name?: string
          id?: string
          message?: string | null
          recipient?: string
          recipient_type?: string
          sender_email?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      leaderboard: {
        Row: {
          best_score: number
          created_at: string
          email: string
          id: string
          last_played: string
          rooms_completed: number
          total_shards: number
          updated_at: string
          user_id: string
        }
        Insert: {
          best_score?: number
          created_at?: string
          email: string
          id?: string
          last_played?: string
          rooms_completed?: number
          total_shards?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          best_score?: number
          created_at?: string
          email?: string
          id?: string
          last_played?: string
          rooms_completed?: number
          total_shards?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      power_ups: {
        Row: {
          cost_shards: number
          created_at: string
          description: string
          duration_seconds: number
          effect_type: string
          effect_value: number
          icon: string
          id: string
          name: string
          power_up_key: string
          rarity: string
        }
        Insert: {
          cost_shards?: number
          created_at?: string
          description: string
          duration_seconds: number
          effect_type: string
          effect_value: number
          icon: string
          id?: string
          name: string
          power_up_key: string
          rarity?: string
        }
        Update: {
          cost_shards?: number
          created_at?: string
          description?: string
          duration_seconds?: number
          effect_type?: string
          effect_value?: number
          icon?: string
          id?: string
          name?: string
          power_up_key?: string
          rarity?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          progress: number
          score: number
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          progress?: number
          score?: number
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          progress?: number
          score?: number
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string | null
          created_at: string
          id: string
          progress: number
          unlocked: boolean
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id?: string | null
          created_at?: string
          id?: string
          progress?: number
          unlocked?: boolean
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string | null
          created_at?: string
          id?: string
          progress?: number
          unlocked?: boolean
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenge_progress: {
        Row: {
          challenge_id: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          current_progress: number
          id: string
          user_id: string
        }
        Insert: {
          challenge_id?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          id?: string
          user_id: string
        }
        Update: {
          challenge_id?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_data: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_game_data: {
        Row: {
          active_protection: number
          active_shard_multiplier: number
          active_speed_boost: number
          created_at: string
          equipped_cube_id: string | null
          id: string
          protection_rooms_left: number
          shard_multiplier_rooms_left: number
          speed_boost_rooms_left: number
          total_shards: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active_protection?: number
          active_shard_multiplier?: number
          active_speed_boost?: number
          created_at?: string
          equipped_cube_id?: string | null
          id?: string
          protection_rooms_left?: number
          shard_multiplier_rooms_left?: number
          speed_boost_rooms_left?: number
          total_shards?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active_protection?: number
          active_shard_multiplier?: number
          active_speed_boost?: number
          created_at?: string
          equipped_cube_id?: string | null
          id?: string
          protection_rooms_left?: number
          shard_multiplier_rooms_left?: number
          speed_boost_rooms_left?: number
          total_shards?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_inventory: {
        Row: {
          created_at: string
          cube_id: string
          id: string
          purchased_at: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cube_id: string
          id?: string
          purchased_at?: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cube_id?: string
          id?: string
          purchased_at?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_power_ups: {
        Row: {
          created_at: string
          id: string
          power_up_id: string | null
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          power_up_id?: string | null
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          power_up_id?: string | null
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_power_ups_power_up_id_fkey"
            columns: ["power_up_id"]
            isOneToOne: false
            referencedRelation: "power_ups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          created_at: string
          id: string
          last_login: string | null
          last_play: string | null
          login_streak: number
          max_login_streak: number
          max_play_streak: number
          play_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_login?: string | null
          last_play?: string | null
          login_streak?: number
          max_login_streak?: number
          max_play_streak?: number
          play_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_login?: string | null
          last_play?: string | null
          login_streak?: number
          max_login_streak?: number
          max_play_streak?: number
          play_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      verification_attempts: {
        Row: {
          attempt_count: number | null
          blocked_until: string | null
          created_at: string | null
          email: string
          id: string
          last_attempt: string | null
        }
        Insert: {
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          email: string
          id?: string
          last_attempt?: string | null
        }
        Update: {
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          email?: string
          id?: string
          last_attempt?: string | null
        }
        Relationships: []
      }
      verification_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          verified: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          verified?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          verified?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_codes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_unique_username: {
        Args: { base_email: string }
        Returns: string
      }
      get_leaderboard_with_context: {
        Args: { p_user_id?: string }
        Returns: {
          best_score: number
          is_current_user: boolean
          rank: number
          rooms_completed: number
          total_shards: number
          user_id: string
          username: string
        }[]
      }
      increment_user_shards: {
        Args: { shard_amount: number; user_id_param: string }
        Returns: undefined
      }
      update_leaderboard: {
        Args: {
          p_current_score: number
          p_email: string
          p_shards_earned: number
          p_user_id: string
        }
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
