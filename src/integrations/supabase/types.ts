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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_alert_rules: {
        Row: {
          channels: string[]
          comparison: string
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          label: string
          rule_key: string
          scope: string
          threshold_value: number | null
          updated_at: string
        }
        Insert: {
          channels?: string[]
          comparison?: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          label: string
          rule_key: string
          scope?: string
          threshold_value?: number | null
          updated_at?: string
        }
        Update: {
          channels?: string[]
          comparison?: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          label?: string
          rule_key?: string
          scope?: string
          threshold_value?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      admin_command_history: {
        Row: {
          actor_id: string | null
          command: string
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
          actor_id?: string | null
          command: string
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
        Update: {
          actor_id?: string | null
          command?: string
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
      admin_feature_flags: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          flag_key: string
          id: string
          label: string
          rollout_percent: number
          section: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          flag_key: string
          id?: string
          label: string
          rollout_percent?: number
          section?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          flag_key?: string
          id?: string
          label?: string
          rollout_percent?: number
          section?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_global_config: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          description: string | null
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config_key: string
          config_value?: Json
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      admin_impersonation_sessions: {
        Row: {
          admin_id: string
          ended_at: string | null
          id: string
          metadata: Json
          notes: string | null
          started_at: string
          status: string
          target_user_id: string
        }
        Insert: {
          admin_id: string
          ended_at?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          started_at?: string
          status?: string
          target_user_id: string
        }
        Update: {
          admin_id?: string
          ended_at?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          started_at?: string
          status?: string
          target_user_id?: string
        }
        Relationships: []
      }
      admin_integrations: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          integration_key: string
          label: string
          last_synced_at: string | null
          provider: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          integration_key: string
          label: string
          last_synced_at?: string | null
          provider: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          integration_key?: string
          label?: string
          last_synced_at?: string | null
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_monitoring_events: {
        Row: {
          created_at: string
          details: Json
          event_type: string
          id: string
          severity: string
          title: string
        }
        Insert: {
          created_at?: string
          details?: Json
          event_type: string
          id?: string
          severity?: string
          title: string
        }
        Update: {
          created_at?: string
          details?: Json
          event_type?: string
          id?: string
          severity?: string
          title?: string
        }
        Relationships: []
      }
      admin_workflow_states: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          label: string
          metadata: Json
          state: string
          updated_at: string
          updated_by: string | null
          workflow_key: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          label: string
          metadata?: Json
          state?: string
          updated_at?: string
          updated_by?: string | null
          workflow_key: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          label?: string
          metadata?: Json
          state?: string
          updated_at?: string
          updated_by?: string | null
          workflow_key?: string
        }
        Relationships: []
      }
      ads: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link_url: string | null
          media_type: string | null
          media_url: string | null
          target_audience: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          media_type?: string | null
          media_url?: string | null
          target_audience?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          media_type?: string | null
          media_url?: string | null
          target_audience?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      alert_thresholds: {
        Row: {
          alert_type: string
          comparison_operator: string | null
          created_at: string | null
          description: string | null
          id: string
          is_enabled: boolean | null
          notify_on_breach: boolean | null
          threshold_value: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          alert_type: string
          comparison_operator?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          notify_on_breach?: boolean | null
          threshold_value?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          alert_type?: string
          comparison_operator?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          notify_on_breach?: boolean | null
          threshold_value?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          media_type: string | null
          media_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          media_type?: string | null
          media_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          media_type?: string | null
          media_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      api_usage_stats: {
        Row: {
          average_response_time_ms: number | null
          endpoint: string
          failed_requests: number | null
          id: string
          method: string
          recorded_at: string | null
          successful_requests: number | null
          total_requests: number | null
        }
        Insert: {
          average_response_time_ms?: number | null
          endpoint: string
          failed_requests?: number | null
          id?: string
          method: string
          recorded_at?: string | null
          successful_requests?: number | null
          total_requests?: number | null
        }
        Update: {
          average_response_time_ms?: number | null
          endpoint?: string
          failed_requests?: number | null
          id?: string
          method?: string
          recorded_at?: string | null
          successful_requests?: number | null
          total_requests?: number | null
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
      call_participants: {
        Row: {
          created_at: string
          id: string
          is_muted: boolean
          is_screen_sharing: boolean
          is_video_on: boolean
          joined_at: string | null
          left_at: string | null
          session_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_muted?: boolean
          is_screen_sharing?: boolean
          is_video_on?: boolean
          joined_at?: string | null
          left_at?: string | null
          session_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_muted?: boolean
          is_screen_sharing?: boolean
          is_video_on?: boolean
          joined_at?: string | null
          left_at?: string | null
          session_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
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
          is_group: boolean
          mode: string
          offer_sdp: string | null
          recipient_id: string | null
          started_at: string | null
          status: string
          title: string | null
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
          is_group?: boolean
          mode?: string
          offer_sdp?: string | null
          recipient_id?: string | null
          started_at?: string | null
          status?: string
          title?: string | null
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
          is_group?: boolean
          mode?: string
          offer_sdp?: string | null
          recipient_id?: string | null
          started_at?: string | null
          status?: string
          title?: string | null
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
      call_signals: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          kind: string
          payload: Json
          session_id: string
          to_user_id: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          kind: string
          payload?: Json
          session_id: string
          to_user_id: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          kind?: string
          payload?: Json
          session_id?: string
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_signals_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_requests: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          recipient_id: string
          requester_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          recipient_id: string
          requester_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          recipient_id?: string
          requester_id?: string
          status?: string | null
        }
        Relationships: []
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
          category: string | null
          created_at: string
          group_admin_id: string | null
          group_description: string | null
          group_image_url: string | null
          group_name: string | null
          group_permissions: Json | null
          id: string
          is_group: boolean | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          group_admin_id?: string | null
          group_description?: string | null
          group_image_url?: string | null
          group_name?: string | null
          group_permissions?: Json | null
          id?: string
          is_group?: boolean | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          group_admin_id?: string | null
          group_description?: string | null
          group_image_url?: string | null
          group_name?: string | null
          group_permissions?: Json | null
          id?: string
          is_group?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      creator_analytics: {
        Row: {
          comments_received: number | null
          created_at: string | null
          id: string
          likes_received: number | null
          profile_views: number | null
          revenue_generated: number | null
          total_followers: number | null
          trending_rank: number | null
          user_id: string
        }
        Insert: {
          comments_received?: number | null
          created_at?: string | null
          id?: string
          likes_received?: number | null
          profile_views?: number | null
          revenue_generated?: number | null
          total_followers?: number | null
          trending_rank?: number | null
          user_id: string
        }
        Update: {
          comments_received?: number | null
          created_at?: string | null
          id?: string
          likes_received?: number | null
          profile_views?: number | null
          revenue_generated?: number | null
          total_followers?: number | null
          trending_rank?: number | null
          user_id?: string
        }
        Relationships: []
      }
      creator_badges: {
        Row: {
          awarded_at: string | null
          awarded_by: string | null
          badge_type: string
          category: string | null
          color: string | null
          created_at: string
          description: string | null
          earned_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          label: string | null
          level: number
          reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          awarded_at?: string | null
          awarded_by?: string | null
          badge_type: string
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          earned_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          level?: number
          reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          awarded_at?: string | null
          awarded_by?: string | null
          badge_type?: string
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          earned_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          level?: number
          reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      creator_network: {
        Row: {
          compatibility_score: number | null
          connected_id: string
          connection_type: string | null
          created_at: string | null
          creator_id: string
          id: string
          shared_interests: string[] | null
        }
        Insert: {
          compatibility_score?: number | null
          connected_id: string
          connection_type?: string | null
          created_at?: string | null
          creator_id: string
          id?: string
          shared_interests?: string[] | null
        }
        Update: {
          compatibility_score?: number | null
          connected_id?: string
          connection_type?: string | null
          created_at?: string | null
          creator_id?: string
          id?: string
          shared_interests?: string[] | null
        }
        Relationships: []
      }
      creator_recommendations: {
        Row: {
          created_at: string | null
          id: string
          recommended_creator_id: string
          score: number | null
          seen: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          recommended_creator_id: string
          score?: number | null
          seen?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          recommended_creator_id?: string
          score?: number | null
          seen?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      database_backups: {
        Row: {
          backup_name: string
          backup_path: string | null
          backup_size: number | null
          backup_type: string
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          error_message: string | null
          id: string
          retention_until: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          backup_name: string
          backup_path?: string | null
          backup_size?: number | null
          backup_type: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          retention_until?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          backup_name?: string
          backup_path?: string | null
          backup_size?: number | null
          backup_type?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          retention_until?: string | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      database_maintenance_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          duration_seconds: number | null
          error_message: string | null
          id: string
          maintenance_type: string
          rows_affected: number | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          id?: string
          maintenance_type: string
          rows_affected?: number | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          id?: string
          maintenance_type?: string
          rows_affected?: number | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      digital_product_bookmarks: {
        Row: {
          bookmarked_at: string
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          bookmarked_at?: string
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          bookmarked_at?: string
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_product_bookmarks_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "selling_items"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_product_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          is_seller: boolean | null
          item_id: string
          parent_comment_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_seller?: boolean | null
          item_id: string
          parent_comment_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_seller?: boolean | null
          item_id?: string
          parent_comment_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_product_comments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "selling_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_product_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "digital_product_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_digital_product_comments_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      digital_product_interactions: {
        Row: {
          comment_text: string | null
          comment_type: string | null
          created_at: string
          id: string
          item_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment_text?: string | null
          comment_type?: string | null
          created_at?: string
          id?: string
          item_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment_text?: string | null
          comment_type?: string | null
          created_at?: string
          id?: string
          item_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_product_interactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "selling_items"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_product_likes: {
        Row: {
          id: string
          item_id: string
          liked_at: string
          user_id: string
        }
        Insert: {
          id?: string
          item_id: string
          liked_at?: string
          user_id: string
        }
        Update: {
          id?: string
          item_id?: string
          liked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_product_likes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "selling_items"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_product_shares: {
        Row: {
          id: string
          item_id: string
          shared_at: string
          user_id: string
        }
        Insert: {
          id?: string
          item_id: string
          shared_at?: string
          user_id: string
        }
        Update: {
          id?: string
          item_id?: string
          shared_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_product_shares_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "selling_items"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_product_views: {
        Row: {
          id: string
          item_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          item_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          item_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_product_views_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "selling_items"
            referencedColumns: ["id"]
          },
        ]
      }
      event_bookmarks: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_bookmarks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_comments: {
        Row: {
          content: string
          created_at: string
          event_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          event_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          event_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_comments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_media: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          event_id: string
          id: string
          media_type: string
          media_url: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          event_id: string
          id?: string
          media_type: string
          media_url: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          event_id?: string
          id?: string
          media_type?: string
          media_url?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_media_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_ratings: {
        Row: {
          created_at: string
          event_id: string
          id: string
          rating: number
          review: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          rating?: number
          review?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          rating?: number
          review?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_ratings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
      event_series: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          end_date: string | null
          id: string
          recurrence_pattern: string
          title: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          end_date?: string | null
          id?: string
          recurrence_pattern: string
          title: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          end_date?: string | null
          id?: string
          recurrence_pattern?: string
          title?: string
        }
        Relationships: []
      }
      event_waitlist: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_waitlist_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cover_url: string | null
          created_at: string
          currency: string | null
          description: string | null
          event_date: string
          id: string
          is_cancelled: boolean | null
          is_free: boolean | null
          is_public: boolean | null
          is_virtual: boolean | null
          location: string | null
          max_attendees: number | null
          price: number | null
          requirements_info: string | null
          series_id: string | null
          show_attendees: boolean | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cover_url?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          event_date: string
          id?: string
          is_cancelled?: boolean | null
          is_free?: boolean | null
          is_public?: boolean | null
          is_virtual?: boolean | null
          location?: string | null
          max_attendees?: number | null
          price?: number | null
          requirements_info?: string | null
          series_id?: string | null
          show_attendees?: boolean | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cover_url?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          event_date?: string
          id?: string
          is_cancelled?: boolean | null
          is_free?: boolean | null
          is_public?: boolean | null
          is_virtual?: boolean | null
          location?: string | null
          max_attendees?: number | null
          price?: number | null
          requirements_info?: string | null
          series_id?: string | null
          show_attendees?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "event_series"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          flag_key: string
          id: string
          name: string
          rollout_percentage: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          flag_key: string
          id?: string
          name: string
          rollout_percentage?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          flag_key?: string
          id?: string
          name?: string
          rollout_percentage?: number
          updated_at?: string
          updated_by?: string | null
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
      livestream_sessions: {
        Row: {
          created_at: string | null
          creator_id: string
          description: string | null
          ended_at: string | null
          id: string
          likes_count: number | null
          schedule_datetime: string | null
          scheduled_at: string | null
          started_at: string | null
          status: string | null
          stream_key: string | null
          tips_total: number | null
          title: string
          viewers_count: number | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          description?: string | null
          ended_at?: string | null
          id?: string
          likes_count?: number | null
          schedule_datetime?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
          stream_key?: string | null
          tips_total?: number | null
          title: string
          viewers_count?: number | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          likes_count?: number | null
          schedule_datetime?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
          stream_key?: string | null
          tips_total?: number | null
          title?: string
          viewers_count?: number | null
        }
        Relationships: []
      }
      marketplace_listings: {
        Row: {
          created_at: string | null
          creator_id: string
          description: string | null
          file_url: string | null
          id: string
          is_active: boolean | null
          license_type: string | null
          price: number | null
          revenue_total: number | null
          sales_count: number | null
          title: string
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          license_type?: string | null
          price?: number | null
          revenue_total?: number | null
          sales_count?: number | null
          title: string
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          license_type?: string | null
          price?: number | null
          revenue_total?: number | null
          sales_count?: number | null
          title?: string
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
      messages: {
        Row: {
          attachment_kind: string
          attachment_mime_type: string | null
          attachment_name: string | null
          attachment_url: string | null
          call_session_id: string | null
          content: string
          conversation_id: string
          created_at: string
          deleted_for_all: boolean
          id: string
          sender_id: string
        }
        Insert: {
          attachment_kind?: string
          attachment_mime_type?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          call_session_id?: string | null
          content: string
          conversation_id: string
          created_at?: string
          deleted_for_all?: boolean
          id?: string
          sender_id: string
        }
        Update: {
          attachment_kind?: string
          attachment_mime_type?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          call_session_id?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          deleted_for_all?: boolean
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_call_session_id_fkey"
            columns: ["call_session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_channels: {
        Row: {
          channel_name: string
          channel_type: string
          configuration: Json | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          is_verified: boolean | null
          last_tested_at: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          channel_name: string
          channel_type: string
          configuration?: Json | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          is_verified?: boolean | null
          last_tested_at?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          channel_name?: string
          channel_type?: string
          configuration?: Json | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          is_verified?: boolean | null
          last_tested_at?: string | null
          updated_at?: string | null
          updated_by?: string | null
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
      old_files: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          is_deleted: boolean | null
          last_accessed_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          file_name: string
          file_path: string
          file_size: number
          id?: string
          is_deleted?: boolean | null
          last_accessed_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          is_deleted?: boolean | null
          last_accessed_at?: string | null
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          parent_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          parent_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          parent_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_hashtags: {
        Row: {
          created_at: string
          id: string
          post_id: string
          tag: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          tag: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_hashtags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_media: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number
          duration_seconds: number | null
          filters: Json | null
          height: number | null
          id: string
          media_type: string
          media_url: string
          post_id: string
          thumbnail_url: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          duration_seconds?: number | null
          filters?: Json | null
          height?: number | null
          id?: string
          media_type: string
          media_url: string
          post_id: string
          thumbnail_url?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          duration_seconds?: number | null
          filters?: Json | null
          height?: number | null
          id?: string
          media_type?: string
          media_url?: string
          post_id?: string
          thumbnail_url?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_poll_votes: {
        Row: {
          created_at: string
          id: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_index?: number
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "post_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      post_polls: {
        Row: {
          closes_at: string | null
          created_at: string
          id: string
          multi_select: boolean
          options: Json
          post_id: string
          question: string
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          id?: string
          multi_select?: boolean
          options?: Json
          post_id: string
          question: string
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          id?: string
          multi_select?: boolean
          options?: Json
          post_id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_polls_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_saves: {
        Row: {
          collection: string | null
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          collection?: string | null
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          collection?: string | null
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_saves_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_views: {
        Row: {
          created_at: string
          id: string
          post_id: string
          viewer_id: string | null
          watched_seconds: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          viewer_id?: string | null
          watched_seconds?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          viewer_id?: string | null
          watched_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          allow_comments: boolean
          caption: string | null
          collab_user_ids: string[] | null
          created_at: string
          expires_at: string | null
          hide_like_count: boolean
          id: string
          is_collab: boolean
          is_draft: boolean
          is_pinned: boolean
          location: string | null
          mentioned_user_ids: string[] | null
          music_artist: string | null
          music_track: string | null
          post_type: string
          scheduled_for: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
          view_count: number
          visibility: string
        }
        Insert: {
          allow_comments?: boolean
          caption?: string | null
          collab_user_ids?: string[] | null
          created_at?: string
          expires_at?: string | null
          hide_like_count?: boolean
          id?: string
          is_collab?: boolean
          is_draft?: boolean
          is_pinned?: boolean
          location?: string | null
          mentioned_user_ids?: string[] | null
          music_artist?: string | null
          music_track?: string | null
          post_type?: string
          scheduled_for?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
          view_count?: number
          visibility?: string
        }
        Update: {
          allow_comments?: boolean
          caption?: string | null
          collab_user_ids?: string[] | null
          created_at?: string
          expires_at?: string | null
          hide_like_count?: boolean
          id?: string
          is_collab?: boolean
          is_draft?: boolean
          is_pinned?: boolean
          location?: string | null
          mentioned_user_ids?: string[] | null
          music_artist?: string | null
          music_track?: string | null
          post_type?: string
          scheduled_for?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          view_count?: number
          visibility?: string
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
          last_seen_at: string | null
          location: string | null
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
          last_seen_at?: string | null
          location?: string | null
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
          last_seen_at?: string | null
          location?: string | null
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
          is_protected: boolean | null
          is_public: boolean | null
          password_hash: string | null
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
          is_protected?: boolean | null
          is_public?: boolean | null
          password_hash?: string | null
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
          is_protected?: boolean | null
          is_public?: boolean | null
          password_hash?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          discount_percentage: number | null
          id: string
          is_active: boolean
          media_type: string | null
          media_url: string | null
          title: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean
          media_type?: string | null
          media_url?: string | null
          title: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean
          media_type?: string | null
          media_url?: string | null
          title?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      rate_limit_logs: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          requests_count: number | null
          user_id: string | null
          was_limited: boolean | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          requests_count?: number | null
          user_id?: string | null
          was_limited?: boolean | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          requests_count?: number | null
          user_id?: string | null
          was_limited?: boolean | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      scheduled_tasks: {
        Row: {
          configuration: Json | null
          created_at: string | null
          created_by: string | null
          id: string
          last_run_at: string | null
          next_run_at: string | null
          schedule_expression: string | null
          status: string | null
          task_name: string
          task_type: string
        }
        Insert: {
          configuration?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          schedule_expression?: string | null
          status?: string | null
          task_name: string
          task_type: string
        }
        Update: {
          configuration?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          schedule_expression?: string | null
          status?: string | null
          task_name?: string
          task_type?: string
        }
        Relationships: []
      }
      selling_items: {
        Row: {
          accepted_payment_methods: string[] | null
          allow_comments: boolean | null
          artist_name: string | null
          bookmarks_count: number | null
          bulk_pricing: boolean | null
          category: string | null
          collaborators: string | null
          comments_visible_to_all: boolean | null
          commercial_use: boolean | null
          contact_email: string | null
          created_at: string
          currency: string | null
          description: string | null
          discount_percentage: number | null
          download_password: string | null
          duration: string | null
          file_format: string | null
          file_url: string | null
          id: string
          image_url: string | null
          images_urls: string[] | null
          interactions_count: number | null
          is_available: boolean
          keywords: string | null
          language: string | null
          license_type: string | null
          likes_count: number | null
          price: number
          quality: string | null
          refund_policy: string | null
          resale_allowed: boolean | null
          resolution: string | null
          sample_available: boolean | null
          seller_id: string
          seller_notes: string | null
          shares_count: number | null
          skill_level: string | null
          software_used: string | null
          support_included: boolean | null
          tags: string | null
          title: string
          updated_at: string
          usage_rights: string | null
          version: string | null
          views_count: number | null
          visibility: string | null
          warranty: boolean | null
        }
        Insert: {
          accepted_payment_methods?: string[] | null
          allow_comments?: boolean | null
          artist_name?: string | null
          bookmarks_count?: number | null
          bulk_pricing?: boolean | null
          category?: string | null
          collaborators?: string | null
          comments_visible_to_all?: boolean | null
          commercial_use?: boolean | null
          contact_email?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          discount_percentage?: number | null
          download_password?: string | null
          duration?: string | null
          file_format?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          images_urls?: string[] | null
          interactions_count?: number | null
          is_available?: boolean
          keywords?: string | null
          language?: string | null
          license_type?: string | null
          likes_count?: number | null
          price: number
          quality?: string | null
          refund_policy?: string | null
          resale_allowed?: boolean | null
          resolution?: string | null
          sample_available?: boolean | null
          seller_id: string
          seller_notes?: string | null
          shares_count?: number | null
          skill_level?: string | null
          software_used?: string | null
          support_included?: boolean | null
          tags?: string | null
          title: string
          updated_at?: string
          usage_rights?: string | null
          version?: string | null
          views_count?: number | null
          visibility?: string | null
          warranty?: boolean | null
        }
        Update: {
          accepted_payment_methods?: string[] | null
          allow_comments?: boolean | null
          artist_name?: string | null
          bookmarks_count?: number | null
          bulk_pricing?: boolean | null
          category?: string | null
          collaborators?: string | null
          comments_visible_to_all?: boolean | null
          commercial_use?: boolean | null
          contact_email?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          discount_percentage?: number | null
          download_password?: string | null
          duration?: string | null
          file_format?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          images_urls?: string[] | null
          interactions_count?: number | null
          is_available?: boolean
          keywords?: string | null
          language?: string | null
          license_type?: string | null
          likes_count?: number | null
          price?: number
          quality?: string | null
          refund_policy?: string | null
          resale_allowed?: boolean | null
          resolution?: string | null
          sample_available?: boolean | null
          seller_id?: string
          seller_notes?: string | null
          shares_count?: number | null
          skill_level?: string | null
          software_used?: string | null
          support_included?: boolean | null
          tags?: string | null
          title?: string
          updated_at?: string
          usage_rights?: string | null
          version?: string | null
          views_count?: number | null
          visibility?: string | null
          warranty?: boolean | null
        }
        Relationships: []
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
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
      system_alerts: {
        Row: {
          created_at: string | null
          id: string
          level: string
          message: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          source: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          level: string
          message?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          source?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: string
          message?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          source?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_metrics: {
        Row: {
          active_users: number | null
          api_requests_24h: number | null
          cache_hit_rate: number | null
          cpu_usage: number | null
          created_at: string | null
          database_size_mb: number | null
          disk_usage: number | null
          error_rate: number | null
          id: string
          memory_usage: number | null
          timestamp: string | null
          uptime_hours: number | null
        }
        Insert: {
          active_users?: number | null
          api_requests_24h?: number | null
          cache_hit_rate?: number | null
          cpu_usage?: number | null
          created_at?: string | null
          database_size_mb?: number | null
          disk_usage?: number | null
          error_rate?: number | null
          id?: string
          memory_usage?: number | null
          timestamp?: string | null
          uptime_hours?: number | null
        }
        Update: {
          active_users?: number | null
          api_requests_24h?: number | null
          cache_hit_rate?: number | null
          cpu_usage?: number | null
          created_at?: string | null
          database_size_mb?: number | null
          disk_usage?: number | null
          error_rate?: number | null
          id?: string
          memory_usage?: number | null
          timestamp?: string | null
          uptime_hours?: number | null
        }
        Relationships: []
      }
      system_performance_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          metric_type: string
          metric_value: number | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          metric_type: string
          metric_value?: number | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          metric_type?: string
          metric_value?: number | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          is_protected: boolean | null
          password_hash: string | null
          priority: string | null
          project_id: string
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_protected?: boolean | null
          password_hash?: string | null
          priority?: string | null
          project_id: string
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_protected?: boolean | null
          password_hash?: string | null
          priority?: string | null
          project_id?: string
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          creator_id: string
          id: string
          member_ids: string[] | null
          name: string
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          id?: string
          member_ids?: string[] | null
          name: string
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          id?: string
          member_ids?: string[] | null
          name?: string
        }
        Relationships: []
      }
      trending_collections: {
        Row: {
          collection_items: string[] | null
          collection_name: string | null
          created_at: string | null
          id: string
          rank: number | null
          trending_score: number | null
        }
        Insert: {
          collection_items?: string[] | null
          collection_name?: string | null
          created_at?: string | null
          id?: string
          rank?: number | null
          trending_score?: number | null
        }
        Update: {
          collection_items?: string[] | null
          collection_name?: string | null
          created_at?: string | null
          id?: string
          rank?: number | null
          trending_score?: number | null
        }
        Relationships: []
      }
      update_comments: {
        Row: {
          commenter_id: string
          content: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          is_hidden: boolean
          updated_at: string
        }
        Insert: {
          commenter_id: string
          content: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          is_hidden?: boolean
          updated_at?: string
        }
        Update: {
          commenter_id?: string
          content?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          is_hidden?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      user_reports: {
        Row: {
          admin_action: string | null
          admin_notes: string | null
          created_at: string
          details: Json
          entity_id: string
          entity_type: string
          id: string
          reason: string
          reported_user_id: string | null
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_action?: string | null
          admin_notes?: string | null
          created_at?: string
          details?: Json
          entity_id: string
          entity_type: string
          id?: string
          reason: string
          reported_user_id?: string | null
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_action?: string | null
          admin_notes?: string | null
          created_at?: string
          details?: Json
          entity_id?: string
          entity_type?: string
          id?: string
          reason?: string
          reported_user_id?: string | null
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
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
      user_settings: {
        Row: {
          allow_follow_requests: boolean
          allow_group_invites: boolean
          allow_messages: boolean
          allow_tagging: boolean
          analytics_sharing: boolean
          auto_archive_days: number
          auto_save_drafts: boolean
          autoplay_gifs: boolean
          autoplay_media: boolean
          backup_exports: boolean
          beta_features: boolean
          calendar_sync: boolean
          captions_enabled: boolean
          compact_mode: boolean
          content_language: string
          content_warnings: boolean
          created_at: string
          creator_mode: boolean
          cross_device_sync: boolean
          data_sharing: boolean
          developer_mode: boolean
          discoverable_profile: boolean
          drive_sync: boolean
          email_digest: boolean
          email_notifications: boolean
          email_summary: string
          feed_density: string
          high_contrast: boolean
          high_contrast_mode: boolean
          high_quality_media: boolean
          id: string
          instagram_sync: boolean
          language: string
          large_text: boolean
          login_alerts: boolean
          marketing_emails: boolean
          message_sound: boolean
          profile_highlights: boolean
          profile_visibility: string
          push_notifications: boolean
          recommend_to_others: boolean
          reduced_motion: boolean
          require_password_for_actions: boolean
          search_visibility: string
          session_timeout_minutes: number
          show_activity_status: boolean
          show_in_search: boolean
          show_location: boolean
          show_online_status: boolean
          sidebar_mode: string
          slack_sync: boolean
          sms_notifications: boolean
          spotify_sync: boolean
          theme_accent: string
          theme_mode: string
          time_zone: string
          two_factor_enabled: boolean
          typing_indicator: boolean
          updated_at: string
          user_id: string
          wifi_only_media: boolean
        }
        Insert: {
          allow_follow_requests?: boolean
          allow_group_invites?: boolean
          allow_messages?: boolean
          allow_tagging?: boolean
          analytics_sharing?: boolean
          auto_archive_days?: number
          auto_save_drafts?: boolean
          autoplay_gifs?: boolean
          autoplay_media?: boolean
          backup_exports?: boolean
          beta_features?: boolean
          calendar_sync?: boolean
          captions_enabled?: boolean
          compact_mode?: boolean
          content_language?: string
          content_warnings?: boolean
          created_at?: string
          creator_mode?: boolean
          cross_device_sync?: boolean
          data_sharing?: boolean
          developer_mode?: boolean
          discoverable_profile?: boolean
          drive_sync?: boolean
          email_digest?: boolean
          email_notifications?: boolean
          email_summary?: string
          feed_density?: string
          high_contrast?: boolean
          high_contrast_mode?: boolean
          high_quality_media?: boolean
          id?: string
          instagram_sync?: boolean
          language?: string
          large_text?: boolean
          login_alerts?: boolean
          marketing_emails?: boolean
          message_sound?: boolean
          profile_highlights?: boolean
          profile_visibility?: string
          push_notifications?: boolean
          recommend_to_others?: boolean
          reduced_motion?: boolean
          require_password_for_actions?: boolean
          search_visibility?: string
          session_timeout_minutes?: number
          show_activity_status?: boolean
          show_in_search?: boolean
          show_location?: boolean
          show_online_status?: boolean
          sidebar_mode?: string
          slack_sync?: boolean
          sms_notifications?: boolean
          spotify_sync?: boolean
          theme_accent?: string
          theme_mode?: string
          time_zone?: string
          two_factor_enabled?: boolean
          typing_indicator?: boolean
          updated_at?: string
          user_id: string
          wifi_only_media?: boolean
        }
        Update: {
          allow_follow_requests?: boolean
          allow_group_invites?: boolean
          allow_messages?: boolean
          allow_tagging?: boolean
          analytics_sharing?: boolean
          auto_archive_days?: number
          auto_save_drafts?: boolean
          autoplay_gifs?: boolean
          autoplay_media?: boolean
          backup_exports?: boolean
          beta_features?: boolean
          calendar_sync?: boolean
          captions_enabled?: boolean
          compact_mode?: boolean
          content_language?: string
          content_warnings?: boolean
          created_at?: string
          creator_mode?: boolean
          cross_device_sync?: boolean
          data_sharing?: boolean
          developer_mode?: boolean
          discoverable_profile?: boolean
          drive_sync?: boolean
          email_digest?: boolean
          email_notifications?: boolean
          email_summary?: string
          feed_density?: string
          high_contrast?: boolean
          high_contrast_mode?: boolean
          high_quality_media?: boolean
          id?: string
          instagram_sync?: boolean
          language?: string
          large_text?: boolean
          login_alerts?: boolean
          marketing_emails?: boolean
          message_sound?: boolean
          profile_highlights?: boolean
          profile_visibility?: string
          push_notifications?: boolean
          recommend_to_others?: boolean
          reduced_motion?: boolean
          require_password_for_actions?: boolean
          search_visibility?: string
          session_timeout_minutes?: number
          show_activity_status?: boolean
          show_in_search?: boolean
          show_location?: boolean
          show_online_status?: boolean
          sidebar_mode?: string
          slack_sync?: boolean
          sms_notifications?: boolean
          spotify_sync?: boolean
          theme_accent?: string
          theme_mode?: string
          time_zone?: string
          two_factor_enabled?: boolean
          typing_indicator?: boolean
          updated_at?: string
          user_id?: string
          wifi_only_media?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_call: {
        Args: { _session_id: string; _user_id: string }
        Returns: boolean
      }
      delete_own_comment: { Args: { comment_id: string }; Returns: boolean }
      get_or_create_direct_conversation: {
        Args: { _other_user_id: string }
        Returns: string
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
      update_last_seen: { Args: never; Returns: undefined }
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
