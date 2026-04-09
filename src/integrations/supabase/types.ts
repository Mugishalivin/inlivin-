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
          is_protected: boolean
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          password_hash: string | null
        }
        Insert: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          is_protected?: boolean
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          password_hash?: string | null
        }
        Update: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          is_protected?: boolean
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          password_hash?: string | null
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
      admin_global_config: {
        Row: {
          id: string
          config_key: string
          config_value: Json
          description: string | null
          updated_by: string | null
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          config_key: string
          config_value?: Json
          description?: string | null
          updated_by?: string | null
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          config_key?: string
          config_value?: Json
          description?: string | null
          updated_by?: string | null
          updated_at?: string
          created_at?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          id: string
          flag_key: string
          name: string
          description: string | null
          enabled: boolean
          rollout_percentage: number
          conditions: Json
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          flag_key: string
          name: string
          description?: string | null
          enabled?: boolean
          rollout_percentage?: number
          conditions?: Json
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          flag_key?: string
          name?: string
          description?: string | null
          enabled?: boolean
          rollout_percentage?: number
          conditions?: Json
          updated_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      system_metrics: {
        Row: {
          id: string
          timestamp: string
          uptime_hours: number | null
          active_users: number | null
          database_size_mb: number | null
          api_requests_24h: number | null
          cache_hit_rate: number | null
          error_rate: number | null
          cpu_usage: number | null
          memory_usage: number | null
          disk_usage: number | null
          created_at: string
        }
        Insert: {
          id?: string
          timestamp?: string
          uptime_hours?: number | null
          active_users?: number | null
          database_size_mb?: number | null
          api_requests_24h?: number | null
          cache_hit_rate?: number | null
          error_rate?: number | null
          cpu_usage?: number | null
          memory_usage?: number | null
          disk_usage?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          timestamp?: string
          uptime_hours?: number | null
          active_users?: number | null
          database_size_mb?: number | null
          api_requests_24h?: number | null
          cache_hit_rate?: number | null
          error_rate?: number | null
          cpu_usage?: number | null
          memory_usage?: number | null
          disk_usage?: number | null
          created_at?: string
        }
        Relationships: []
      }
      system_alerts: {
        Row: {
          id: string
          level: string
          title: string
          message: string | null
          source: string | null
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          level: string
          title: string
          message?: string | null
          source?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          level?: string
          title?: string
          message?: string | null
          source?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_config: {
        Row: {
          id: string
          config_key: string
          config_value: Json
          description: string | null
          category: string | null
          updated_by: string | null
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          config_key: string
          config_value?: Json
          description?: string | null
          category?: string | null
          updated_by?: string | null
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          config_key?: string
          config_value?: Json
          description?: string | null
          category?: string | null
          updated_by?: string | null
          updated_at?: string
          created_at?: string
        }
        Relationships: []
      }
      database_backups: {
        Row: {
          id: string
          backup_name: string
          backup_size: number | null
          backup_path: string | null
          backup_type: string
          status: string
          started_at: string | null
          completed_at: string | null
          error_message: string | null
          retention_until: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          backup_name: string
          backup_size?: number | null
          backup_path?: string | null
          backup_type: string
          status?: string
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          retention_until?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          backup_name?: string
          backup_size?: number | null
          backup_path?: string | null
          backup_type?: string
          status?: string
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          retention_until?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      alert_thresholds: {
        Row: {
          id: string
          alert_type: string
          threshold_value: number | null
          comparison_operator: string | null
          is_enabled: boolean
          notify_on_breach: boolean
          description: string | null
          updated_by: string | null
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          alert_type: string
          threshold_value?: number | null
          comparison_operator?: string | null
          is_enabled?: boolean
          notify_on_breach?: boolean
          description?: string | null
          updated_by?: string | null
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          alert_type?: string
          threshold_value?: number | null
          comparison_operator?: string | null
          is_enabled?: boolean
          notify_on_breach?: boolean
          description?: string | null
          updated_by?: string | null
          updated_at?: string
          created_at?: string
        }
        Relationships: []
      }
      notification_channels: {
        Row: {
          id: string
          channel_type: string
          channel_name: string
          configuration: Json
          is_enabled: boolean
          is_verified: boolean
          last_tested_at: string | null
          updated_by: string | null
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          channel_type: string
          channel_name: string
          configuration?: Json
          is_enabled?: boolean
          is_verified?: boolean
          last_tested_at?: string | null
          updated_by?: string | null
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          channel_type?: string
          channel_name?: string
          configuration?: Json
          is_enabled?: boolean
          is_verified?: boolean
          last_tested_at?: string | null
          updated_by?: string | null
          updated_at?: string
          created_at?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          id: string
          user_id: string
          setting_key: string
          setting_value: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          setting_key: string
          setting_value?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          setting_key?: string
          setting_value?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      old_files: {
        Row: {
          id: string
          file_name: string
          file_path: string
          file_size: number
          created_at: string
          last_accessed_at: string | null
          is_deleted: boolean
          deleted_at: string | null
        }
        Insert: {
          id?: string
          file_name: string
          file_path: string
          file_size: number
          created_at?: string
          last_accessed_at?: string | null
          is_deleted?: boolean
          deleted_at?: string | null
        }
        Update: {
          id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          created_at?: string
          last_accessed_at?: string | null
          is_deleted?: boolean
          deleted_at?: string | null
        }
        Relationships: []
      }
      system_performance_logs: {
        Row: {
          id: string
          metric_type: string
          metric_value: number | null
          details: Json
          created_at: string
        }
        Insert: {
          id?: string
          metric_type: string
          metric_value?: number | null
          details?: Json
          created_at?: string
        }
        Update: {
          id?: string
          metric_type?: string
          metric_value?: number | null
          details?: Json
          created_at?: string
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          id: string
          admin_id: string | null
          action: string
          resource_type: string | null
          resource_id: string | null
          changes: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id?: string | null
          action: string
          resource_type?: string | null
          resource_id?: string | null
          changes?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string | null
          action?: string
          resource_type?: string | null
          resource_id?: string | null
          changes?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Relationships: []
      }
      database_maintenance_logs: {
        Row: {
          id: string
          maintenance_type: string
          status: string
          started_at: string | null
          completed_at: string | null
          duration_seconds: number | null
          rows_affected: number | null
          error_message: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          maintenance_type: string
          status?: string
          started_at?: string | null
          completed_at?: string | null
          duration_seconds?: number | null
          rows_affected?: number | null
          error_message?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          maintenance_type?: string
          status?: string
          started_at?: string | null
          completed_at?: string | null
          duration_seconds?: number | null
          rows_affected?: number | null
          error_message?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      scheduled_tasks: {
        Row: {
          id: string
          task_name: string
          task_type: string
          schedule_expression: string | null
          next_run_at: string | null
          last_run_at: string | null
          status: string
          configuration: Json
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          task_name: string
          task_type: string
          schedule_expression?: string | null
          next_run_at?: string | null
          last_run_at?: string | null
          status?: string
          configuration?: Json
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          task_name?: string
          task_type?: string
          schedule_expression?: string | null
          next_run_at?: string | null
          last_run_at?: string | null
          status?: string
          configuration?: Json
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      rate_limit_logs: {
        Row: {
          id: string
          user_id: string | null
          endpoint: string
          requests_count: number | null
          window_start: string | null
          window_end: string | null
          was_limited: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          endpoint: string
          requests_count?: number | null
          window_start?: string | null
          window_end?: string | null
          was_limited?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          endpoint?: string
          requests_count?: number | null
          window_start?: string | null
          window_end?: string | null
          was_limited?: boolean
          created_at?: string
        }
        Relationships: []
      }
      api_usage_stats: {
        Row: {
          id: string
          endpoint: string
          method: string
          total_requests: number | null
          successful_requests: number | null
          failed_requests: number | null
          average_response_time_ms: number | null
          recorded_at: string
        }
        Insert: {
          id?: string
          endpoint: string
          method: string
          total_requests?: number | null
          successful_requests?: number | null
          failed_requests?: number | null
          average_response_time_ms?: number | null
          recorded_at?: string
        }
        Update: {
          id?: string
          endpoint?: string
          method?: string
          total_requests?: number | null
          successful_requests?: number | null
          failed_requests?: number | null
          average_response_time_ms?: number | null
          recorded_at?: string
        }
        Relationships: []
      }
      creator_badges: {
        Row: {
          id: string
          creator_id: string
          badge_type: string
          reason: string | null
          awarded_at: string
          created_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          badge_type: string
          reason?: string | null
          awarded_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          badge_type?: string
          reason?: string | null
          awarded_at?: string
          created_at?: string
        }
        Relationships: []
      }
      creator_network: {
        Row: {
          id: string
          creator_id: string
          connected_id: string
          connection_type: string
          compatibility_score: number
          shared_interests: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          connected_id: string
          connection_type: string
          compatibility_score?: number
          shared_interests?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          connected_id?: string
          connection_type?: string
          compatibility_score?: number
          shared_interests?: string[] | null
          created_at?: string
        }
        Relationships: []
      }
      creator_analytics: {
        Row: {
          id: string
          user_id: string
          profile_views: number
          likes_received: number
          comments_received: number
          total_followers: number
          revenue_generated: number
          trending_rank: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          profile_views?: number
          likes_received?: number
          comments_received?: number
          total_followers?: number
          revenue_generated?: number
          trending_rank?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          profile_views?: number
          likes_received?: number
          comments_received?: number
          total_followers?: number
          revenue_generated?: number
          trending_rank?: number | null
          created_at?: string
        }
        Relationships: []
      }
      creator_recommendations: {
        Row: {
          id: string
          user_id: string
          recommended_creator_id: string
          score: number
          seen: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recommended_creator_id: string
          score?: number
          seen?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recommended_creator_id?: string
          score?: number
          seen?: boolean
          created_at?: string
        }
        Relationships: []
      }
      trending_collections: {
        Row: {
          id: string
          collection_name: string
          collection_items: string[] | null
          trending_score: number
          rank: number
          created_at: string
        }
        Insert: {
          id?: string
          collection_name: string
          collection_items?: string[] | null
          trending_score?: number
          rank?: number
          created_at?: string
        }
        Update: {
          id?: string
          collection_name?: string
          collection_items?: string[] | null
          trending_score?: number
          rank?: number
          created_at?: string
        }
        Relationships: []
      }
      livestream_sessions: {
        Row: {
          id: string
          creator_id: string
          title: string
          description: string | null
          status: string
          stream_key: string
          schedule_datetime: string | null
          viewers_count: number
          likes_count: number
          tips_total: number
          created_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          description?: string | null
          status?: string
          stream_key?: string
          schedule_datetime?: string | null
          viewers_count?: number
          likes_count?: number
          tips_total?: number
          created_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          title?: string
          description?: string | null
          status?: string
          stream_key?: string
          schedule_datetime?: string | null
          viewers_count?: number
          likes_count?: number
          tips_total?: number
          created_at?: string
        }
        Relationships: []
      }
      marketplace_listings: {
        Row: {
          id: string
          creator_id: string
          title: string
          description: string | null
          price: number
          license_type: string
          file_url: string | null
          file_size: number | null
          sales_count: number
          revenue_total: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          description?: string | null
          price: number
          license_type: string
          file_url?: string | null
          file_size?: number | null
          sales_count?: number
          revenue_total?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          title?: string
          description?: string | null
          price?: number
          license_type?: string
          file_url?: string | null
          file_size?: number | null
          sales_count?: number
          revenue_total?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          user_id: string
          title: string
          description: string | null
          status: string
          priority: string
          due_date: string | null
          is_protected: boolean
          password_hash: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          title: string
          description?: string | null
          status?: string
          priority?: string
          due_date?: string | null
          is_protected?: boolean
          password_hash?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          title?: string
          description?: string | null
          status?: string
          priority?: string
          due_date?: string | null
          is_protected?: boolean
          password_hash?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          id: string
          name: string
          creator_id: string
          member_ids: string[]
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          creator_id: string
          member_ids?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          creator_id?: string
          member_ids?: string[]
          created_at?: string
        }
        Relationships: []
      }
      collaboration_requests: {
        Row: {
          id: string
          requester_id: string
          recipient_id: string
          message: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          recipient_id: string
          message?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          recipient_id?: string
          message?: string | null
          status?: string
          created_at?: string
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
