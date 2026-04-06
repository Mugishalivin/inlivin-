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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_command_history: {
        Row: {
          actor_id: string
          command_key: string
          command_label: string
          completed_at: string | null
          created_at: string
          id: string
          payload: Json
          result: Json
          scope: string
          status: string
        }
        Insert: {
          actor_id: string
          command_key: string
          command_label: string
          completed_at?: string | null
          created_at?: string
          id?: string
          payload?: Json
          result?: Json
          scope?: string
          status?: string
        }
        Update: {
          actor_id?: string
          command_key?: string
          command_label?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          payload?: Json
          result?: Json
          scope?: string
          status?: string
        }
        Relationships: []
      }
      admin_monitoring_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          message: string
          metadata: Json
          severity: string
          source: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          message: string
          metadata?: Json
          severity?: string
          source?: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          message?: string
          metadata?: Json
          severity?: string
          source?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          id: string
          user_id: string
          default_view: string
          refresh_interval: number
          compact_mode: boolean
          show_empty_hints: boolean
          confirm_delete: boolean
          verbose_logging: boolean
          always_show_icons: boolean
          compact_sidebar: boolean
          desktop_notifications: boolean
          critical_alerts_only: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          default_view?: string
          refresh_interval?: number
          compact_mode?: boolean
          show_empty_hints?: boolean
          confirm_delete?: boolean
          verbose_logging?: boolean
          always_show_icons?: boolean
          compact_sidebar?: boolean
          desktop_notifications?: boolean
          critical_alerts_only?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          default_view?: string
          refresh_interval?: number
          compact_mode?: boolean
          show_empty_hints?: boolean
          confirm_delete?: boolean
          verbose_logging?: boolean
          always_show_icons?: boolean
          compact_sidebar?: boolean
          desktop_notifications?: boolean
          critical_alerts_only?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          event_date: string
          id: string
          is_public: boolean | null
          location: string | null
          max_attendees: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          event_date: string
          id?: string
          is_public?: boolean | null
          location?: string | null
          max_attendees?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          is_public?: boolean | null
          location?: string | null
          max_attendees?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_kind: string
          attachment_mime_type: string | null
          attachment_name: string | null
          attachment_url: string | null
          content: string
          conversation_id: string
          created_at: string
          deleted_for_all: boolean
          call_session_id: string | null
          id: string
          sender_id: string
        }
        Insert: {
          attachment_kind?: string
          attachment_mime_type?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          content: string
          conversation_id: string
          created_at?: string
          deleted_for_all?: boolean
          call_session_id?: string | null
          id?: string
          sender_id: string
        }
        Update: {
          attachment_kind?: string
          attachment_mime_type?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          deleted_for_all?: boolean
          call_session_id?: string | null
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      call_sessions: {
        Row: {
          accepted_at: string | null
          answer_sdp: string | null
          burst_emojis: string[]
          callee_candidates: Json
          caller_candidates: Json
          conversation_id: string
          created_at: string
          ended_at: string | null
          id: string
          initiator_id: string
          mode: string
          offer_sdp: string | null
          recipient_id: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          answer_sdp?: string | null
          burst_emojis?: string[]
          callee_candidates?: Json
          caller_candidates?: Json
          conversation_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          initiator_id: string
          mode?: string
          offer_sdp?: string | null
          recipient_id: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          answer_sdp?: string | null
          burst_emojis?: string[]
          callee_candidates?: Json
          caller_candidates?: Json
          conversation_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          initiator_id?: string
          mode?: string
          offer_sdp?: string | null
          recipient_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_sessions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          created_by: string
          media_url: string | null
          media_type: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          created_by: string
          media_url?: string | null
          media_type?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          created_by?: string
          media_url?: string | null
          media_type?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          id: string
          title: string
          content: string
          discount_percentage: number | null
          valid_until: string | null
          created_by: string
          media_url: string | null
          media_type: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          discount_percentage?: number | null
          valid_until?: string | null
          created_by: string
          media_url?: string | null
          media_type?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          discount_percentage?: number | null
          valid_until?: string | null
          created_by?: string
          media_url?: string | null
          media_type?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ads: {
        Row: {
          id: string
          title: string
          content: string
          image_url: string | null
          link_url: string | null
          target_audience: string | null
          created_by: string
          media_url: string | null
          media_type: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          image_url?: string | null
          link_url?: string | null
          target_audience?: string | null
          created_by: string
          media_url?: string | null
          media_type?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          image_url?: string | null
          link_url?: string | null
          target_audience?: string | null
          created_by?: string
          media_url?: string | null
          media_type?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string | null
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      message_hidden: {
        Row: {
          hidden_at: string
          message_id: string
          user_id: string
        }
        Insert: {
          hidden_at?: string
          message_id: string
          user_id: string
        }
        Update: {
          hidden_at?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_hidden_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          allow_messages: boolean
          allow_follow_requests: boolean
          allow_group_invites: boolean
          allow_tagging: boolean
          autoplay_media: boolean
          autoplay_gifs: boolean
          analytics_sharing: boolean
          compact_mode: boolean
          created_at: string
          backup_exports: boolean
          beta_features: boolean
          captions_enabled: boolean
          calendar_sync: boolean
          content_language: string
          data_sharing: boolean
          developer_mode: boolean
          discoverable_profile: boolean
          email_notifications: boolean
          email_summary: string
          id: string
          drive_sync: boolean
          feed_density: string
          high_contrast_mode: boolean
          high_quality_media: boolean
          instagram_sync: boolean
          large_text: boolean
          marketing_emails: boolean
          login_alerts: boolean
          message_sound: boolean
          reduced_motion: boolean
          profile_visibility: string
          profile_highlights: boolean
          push_notifications: boolean
          recommend_to_others: boolean
          require_password_for_actions: boolean
          session_timeout_minutes: number
          show_location: boolean
          show_activity_status: boolean
          show_in_search: boolean
          sidebar_mode: string
          slack_sync: boolean
          sms_notifications: boolean
          spotify_sync: boolean
          theme_mode: string
          theme_accent: string
          two_factor_enabled: boolean
          typing_indicator: boolean
          auto_archive_days: number
          auto_save_drafts: boolean
          updated_at: string
          user_id: string
          wifi_only_media: boolean
        }
        Insert: {
          allow_messages?: boolean
          allow_follow_requests?: boolean
          allow_group_invites?: boolean
          allow_tagging?: boolean
          autoplay_media?: boolean
          autoplay_gifs?: boolean
          analytics_sharing?: boolean
          compact_mode?: boolean
          created_at?: string
          backup_exports?: boolean
          beta_features?: boolean
          captions_enabled?: boolean
          calendar_sync?: boolean
          content_language?: string
          data_sharing?: boolean
          developer_mode?: boolean
          discoverable_profile?: boolean
          email_notifications?: boolean
          email_summary?: string
          id?: string
          drive_sync?: boolean
          feed_density?: string
          high_contrast_mode?: boolean
          high_quality_media?: boolean
          instagram_sync?: boolean
          large_text?: boolean
          marketing_emails?: boolean
          login_alerts?: boolean
          message_sound?: boolean
          reduced_motion?: boolean
          profile_visibility?: string
          profile_highlights?: boolean
          push_notifications?: boolean
          recommend_to_others?: boolean
          require_password_for_actions?: boolean
          session_timeout_minutes?: number
          show_location?: boolean
          show_activity_status?: boolean
          show_in_search?: boolean
          sidebar_mode?: string
          slack_sync?: boolean
          sms_notifications?: boolean
          spotify_sync?: boolean
          theme_mode?: string
          theme_accent?: string
          two_factor_enabled?: boolean
          typing_indicator?: boolean
          auto_archive_days?: number
          auto_save_drafts?: boolean
          updated_at?: string
          user_id: string
          wifi_only_media?: boolean
        }
        Update: {
          allow_messages?: boolean
          allow_follow_requests?: boolean
          allow_group_invites?: boolean
          allow_tagging?: boolean
          autoplay_media?: boolean
          autoplay_gifs?: boolean
          analytics_sharing?: boolean
          compact_mode?: boolean
          created_at?: string
          backup_exports?: boolean
          beta_features?: boolean
          captions_enabled?: boolean
          calendar_sync?: boolean
          content_language?: string
          data_sharing?: boolean
          developer_mode?: boolean
          discoverable_profile?: boolean
          email_notifications?: boolean
          email_summary?: string
          id?: string
          drive_sync?: boolean
          feed_density?: string
          high_contrast_mode?: boolean
          high_quality_media?: boolean
          instagram_sync?: boolean
          large_text?: boolean
          marketing_emails?: boolean
          login_alerts?: boolean
          message_sound?: boolean
          reduced_motion?: boolean
          profile_visibility?: string
          profile_highlights?: boolean
          push_notifications?: boolean
          recommend_to_others?: boolean
          require_password_for_actions?: boolean
          session_timeout_minutes?: number
          show_location?: boolean
          show_activity_status?: boolean
          show_in_search?: boolean
          sidebar_mode?: string
          slack_sync?: boolean
          sms_notifications?: boolean
          spotify_sync?: boolean
          theme_mode?: string
          theme_accent?: string
          two_factor_enabled?: boolean
          typing_indicator?: boolean
          auto_archive_days?: number
          auto_save_drafts?: boolean
          updated_at?: string
          user_id?: string
          wifi_only_media?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          genres: string[] | null
          id: string
          location: string | null
          last_seen_at: string | null
          skills: string[] | null
          status: string
          updated_at: string
          user_id: string
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          genres?: string[] | null
          id?: string
          location?: string | null
          last_seen_at?: string | null
          skills?: string[] | null
          status?: string
          updated_at?: string
          user_id: string
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          genres?: string[] | null
          id?: string
          location?: string | null
          last_seen_at?: string | null
          skills?: string[] | null
          status?: string
          updated_at?: string
          user_id?: string
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      project_collaborators: {
        Row: {
          created_at: string
          id: string
          invited_by: string
          project_id: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by: string
          project_id: string
          role?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string
          project_id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_collaborators_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_media: {
        Row: {
          created_at: string
          file_name: string | null
          file_type: string | null
          file_url: string
          id: string
          project_id: string
          sort_order: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          project_id: string
          sort_order?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          project_id?: string
          sort_order?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_media_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          category: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      studio_assets: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_url: string
          id: string
          is_favorite: boolean
          mime_type: string | null
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_url: string
          id?: string
          is_favorite?: boolean
          mime_type?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_url?: string
          id?: string
          is_favorite?: boolean
          mime_type?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      studio_schedule_items: {
        Row: {
          color: string
          created_at: string
          id: string
          item_type: string
          notes: string | null
          scheduled_at: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          item_type?: string
          notes?: string | null
          scheduled_at: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          item_type?: string
          notes?: string | null
          scheduled_at?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      studio_tasks: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          reminder_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          reminder_at?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          reminder_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_get_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          last_seen_at: string | null
          location: string | null
          role: string
          status: string
          user_id: string
          username: string | null
          website: string | null
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_conversation_member: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
