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
      ad_metrics_cache: {
        Row: {
          connection_id: string
          data: Json
          date_range_end: string
          date_range_start: string
          fetched_at: string | null
          id: string
          metric_type: string
        }
        Insert: {
          connection_id: string
          data: Json
          date_range_end: string
          date_range_start: string
          fetched_at?: string | null
          id?: string
          metric_type: string
        }
        Update: {
          connection_id?: string
          data?: Json
          date_range_end?: string
          date_range_start?: string
          fetched_at?: string | null
          id?: string
          metric_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_metrics_cache_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "ad_platform_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_platform_connections: {
        Row: {
          access_token_encrypted: string | null
          account_id: string | null
          account_name: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          platform: string
          property_id: string | null
          refresh_token_encrypted: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          account_id?: string | null
          account_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          platform: string
          property_id?: string | null
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          account_id?: string | null
          account_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          platform?: string
          property_id?: string | null
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ad_reports: {
        Row: {
          created_at: string | null
          date_range_end: string
          date_range_start: string
          id: string
          pdf_storage_path: string | null
          platforms: string[]
          report_data: Json
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date_range_end: string
          date_range_start: string
          id?: string
          pdf_storage_path?: string | null
          platforms: string[]
          report_data: Json
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          date_range_end?: string
          date_range_start?: string
          id?: string
          pdf_storage_path?: string | null
          platforms?: string[]
          report_data?: Json
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      community_channels: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      community_post_attachments: {
        Row: {
          content_type: string | null
          created_at: string
          file_name: string | null
          id: string
          post_id: string
          size_bytes: number | null
          storage_bucket: string
          storage_path: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          file_name?: string | null
          id?: string
          post_id: string
          size_bytes?: number | null
          storage_bucket?: string
          storage_path: string
        }
        Update: {
          content_type?: string | null
          created_at?: string
          file_name?: string | null
          id?: string
          post_id?: string
          size_bytes?: number | null
          storage_bucket?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_attachments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_id: string
          body: string | null
          created_at: string
          id: string
          thread_id: string
        }
        Insert: {
          author_id: string
          body?: string | null
          created_at?: string
          id?: string
          thread_id: string
        }
        Update: {
          author_id?: string
          body?: string | null
          created_at?: string
          id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "community_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      community_threads: {
        Row: {
          body: string | null
          channel_id: string
          created_at: string
          created_by: string
          id: string
          is_locked: boolean
          last_post_at: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          channel_id: string
          created_at?: string
          created_by: string
          id?: string
          is_locked?: boolean
          last_post_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          channel_id?: string
          created_at?: string
          created_by?: string
          id?: string
          is_locked?: boolean
          last_post_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_threads_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "community_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_members: {
        Row: {
          accepted_at: string | null
          conversation_id: string
          folder: Database["public"]["Enums"]["conversation_folder"]
          joined_at: string
          last_read_at: string | null
          member_role: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          conversation_id: string
          folder?: Database["public"]["Enums"]["conversation_folder"]
          joined_at?: string
          last_read_at?: string | null
          member_role?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          conversation_id?: string
          folder?: Database["public"]["Enums"]["conversation_folder"]
          joined_at?: string
          last_read_at?: string | null
          member_role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
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
          created_by: string
          group_name: string | null
          id: string
          last_message_at: string | null
          type: Database["public"]["Enums"]["conversation_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          group_name?: string | null
          id?: string
          last_message_at?: string | null
          type: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          group_name?: string | null
          id?: string
          last_message_at?: string | null
          type?: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string
        }
        Relationships: []
      }
      feed_comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "feed_post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_post_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_post_media: {
        Row: {
          content_type: string | null
          created_at: string
          height: number | null
          id: string
          post_id: string
          size_bytes: number | null
          sort_order: number
          storage_bucket: string
          storage_path: string
          trim_end_seconds: number | null
          trim_start_seconds: number | null
          width: number | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          height?: number | null
          id?: string
          post_id: string
          size_bytes?: number | null
          sort_order?: number
          storage_bucket?: string
          storage_path: string
          trim_end_seconds?: number | null
          trim_start_seconds?: number | null
          width?: number | null
        }
        Update: {
          content_type?: string | null
          created_at?: string
          height?: number | null
          id?: string
          post_id?: string
          size_bytes?: number | null
          sort_order?: number
          storage_bucket?: string
          storage_path?: string
          trim_end_seconds?: number | null
          trim_start_seconds?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_posts: {
        Row: {
          author_id: string
          caption: string | null
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          caption?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: []
      }
      geo_city_cache: {
        Row: {
          city: string
          created_at: string
          id: string
          key: string
          lat: number
          lng: number
          source: string
          state: string
          updated_at: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          key: string
          lat: number
          lng: number
          source?: string
          state: string
          updated_at?: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          key?: string
          lat?: number
          lng?: number
          source?: string
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      invite_codes: {
        Row: {
          active: boolean
          archived_at: string | null
          archived_by: string | null
          code: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          max_uses: number
          note: string | null
          uses_count: number
        }
        Insert: {
          active?: boolean
          archived_at?: string | null
          archived_by?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number
          note?: string | null
          uses_count?: number
        }
        Update: {
          active?: boolean
          archived_at?: string | null
          archived_by?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number
          note?: string | null
          uses_count?: number
        }
        Relationships: []
      }
      invite_redemptions: {
        Row: {
          id: string
          invite_id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          id?: string
          invite_id: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          id?: string
          invite_id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invite_redemptions_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "invite_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      member_live_locations: {
        Row: {
          approx_decimals: number
          expires_at: string
          lat: number
          lng: number
          updated_at: string
          user_id: string
        }
        Insert: {
          approx_decimals?: number
          expires_at: string
          lat: number
          lng: number
          updated_at?: string
          user_id: string
        }
        Update: {
          approx_decimals?: number
          expires_at?: string
          lat?: number
          lng?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      member_status: {
        Row: {
          created_at: string
          expires_at: string
          status_text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          status_text: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          status_text?: string
          user_id?: string
        }
        Relationships: []
      }
      message_attachments: {
        Row: {
          content_type: string | null
          created_at: string
          file_name: string | null
          id: string
          message_id: string
          size_bytes: number | null
          storage_bucket: string
          storage_path: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          file_name?: string | null
          id?: string
          message_id: string
          size_bytes?: number | null
          storage_bucket?: string
          storage_path: string
        }
        Update: {
          content_type?: string | null
          created_at?: string
          file_name?: string | null
          id?: string
          message_id?: string
          size_bytes?: number | null
          storage_bucket?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string | null
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          body?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string | null
          conversation_id?: string
          created_at?: string
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
      notifications: {
        Row: {
          actor_id: string | null
          conversation_id: string | null
          created_at: string
          data: Json
          entity_id: string | null
          id: string
          read_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          conversation_id?: string | null
          created_at?: string
          data?: Json
          entity_id?: string | null
          id?: string
          read_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          conversation_id?: string | null
          created_at?: string
          data?: Json
          entity_id?: string | null
          id?: string
          read_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          access_status: Database["public"]["Enums"]["access_status"]
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          display_name: string | null
          expertises: string[]
          first_name: string | null
          id: string
          last_name: string | null
          location_lat: number | null
          location_lng: number | null
          location_updated_at: string | null
          postal_code: string | null
          profile_visibility: Database["public"]["Enums"]["profile_visibility"]
          region: string | null
          state: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          access_status?: Database["public"]["Enums"]["access_status"]
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          expertises?: string[]
          first_name?: string | null
          id?: string
          last_name?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_updated_at?: string | null
          postal_code?: string | null
          profile_visibility?: Database["public"]["Enums"]["profile_visibility"]
          region?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          access_status?: Database["public"]["Enums"]["access_status"]
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          expertises?: string[]
          first_name?: string | null
          id?: string
          last_name?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_updated_at?: string | null
          postal_code?: string | null
          profile_visibility?: Database["public"]["Enums"]["profile_visibility"]
          region?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      training_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      trainings: {
        Row: {
          category_id: string | null
          cover_path: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          published: boolean
          sort_order: number
          title: string
          updated_at: string
          youtube_url: string
        }
        Insert: {
          category_id?: string | null
          cover_path?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          published?: boolean
          sort_order?: number
          title: string
          updated_at?: string
          youtube_url: string
        }
        Update: {
          category_id?: string | null
          cover_path?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          published?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
          youtube_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "training_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist_leads: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          ip_hash: string | null
          phone: string | null
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          ip_hash?: string | null
          phone?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          ip_hash?: string | null
          phone?: string | null
          source?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _notify: {
        Args: {
          p_actor_id: string
          p_conversation_id?: string
          p_data?: Json
          p_entity_id?: string
          p_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      add_community_post_attachment: {
        Args: {
          p_content_type?: string
          p_file_name?: string
          p_post_id: string
          p_size_bytes?: number
          p_storage_path: string
        }
        Returns: string
      }
      add_feed_post_comment: {
        Args: { p_body: string; p_post_id: string }
        Returns: string
      }
      admin_get_pending_profile_for_review: {
        Args: { p_profile_id: string }
        Returns: {
          access_status: Database["public"]["Enums"]["access_status"]
          avatar_url: string
          bio: string
          city: string
          created_at: string
          display_name: string
          expertises: string[]
          first_name: string
          last_name: string
          profile_id: string
          region: string
          state: string
          user_id: string
          username: string
        }[]
      }
      admin_list_pending_profiles: {
        Args: { p_limit?: number }
        Returns: {
          access_status: Database["public"]["Enums"]["access_status"]
          created_at: string
          display_name: string
          id: string
          user_id: string
        }[]
      }
      admin_list_pending_profiles_logged: {
        Args: { p_limit?: number }
        Returns: {
          access_status: Database["public"]["Enums"]["access_status"]
          created_at: string
          display_name: string
          id: string
          user_id: string
        }[]
      }
      admin_log: {
        Args: { p_action: string; p_target_user_id?: string }
        Returns: undefined
      }
      admin_search_members: {
        Args: { p_limit?: number; p_search?: string }
        Returns: {
          approved_at: string
          city: string
          created_at: string
          display_name: string
          profile_id: string
          state: string
          user_id: string
          username: string
        }[]
      }
      admin_set_profile_status: {
        Args: {
          p_next: Database["public"]["Enums"]["access_status"]
          p_profile_id: string
        }
        Returns: {
          access_status: Database["public"]["Enums"]["access_status"]
          approved_at: string
          approved_by: string
          profile_id: string
          user_id: string
        }[]
      }
      can_view_author: { Args: { p_author_id: string }; Returns: boolean }
      can_view_feed_media: { Args: { p_object_name: string }; Returns: boolean }
      can_view_post: { Args: { p_post_id: string }; Returns: boolean }
      count_unread_notifications: { Args: never; Returns: number }
      create_community_post: {
        Args: { p_body: string; p_thread_id: string }
        Returns: string
      }
      create_community_thread: {
        Args: { p_body?: string; p_channel_id: string; p_title: string }
        Returns: string
      }
      create_conversation: {
        Args: {
          p_group_name?: string
          p_member_ids: string[]
          p_type: Database["public"]["Enums"]["conversation_type"]
        }
        Returns: string
      }
      create_feed_post:
        | { Args: { p_caption: string; p_media: Json }; Returns: string }
        | {
            Args: { p_caption: string; p_media: Json; p_post_id: string }
            Returns: string
          }
      delete_community_post: { Args: { p_post_id: string }; Returns: string }
      delete_feed_post_comment: {
        Args: { p_comment_id: string }
        Returns: boolean
      }
      delete_my_notifications: {
        Args: { p_all?: boolean; p_ids?: string[] }
        Returns: number
      }
      edit_community_post: {
        Args: { p_body: string; p_post_id: string }
        Returns: string
      }
      edit_feed_post_comment: {
        Args: { p_body: string; p_comment_id: string }
        Returns: string
      }
      find_approved_member_by_username: {
        Args: { p_username: string }
        Returns: {
          avatar_url: string
          bio: string
          city: string
          display_name: string
          region: string
          state: string
          user_id: string
          username: string
        }[]
      }
      get_approved_member_pins: {
        Args: { p_limit?: number }
        Returns: {
          avatar_url: string
          city: string
          display_name: string
          lat: number
          lng: number
          state: string
          user_id: string
        }[]
      }
      get_community_thread: {
        Args: { p_thread_id: string }
        Returns: {
          body: string
          channel_id: string
          channel_name: string
          channel_slug: string
          created_at: string
          is_locked: boolean
          last_post_at: string
          thread_id: string
          title: string
        }[]
      }
      get_follow_stats: {
        Args: { p_user_id: string }
        Returns: {
          followers_count: number
          following_count: number
          is_following: boolean
        }[]
      }
      get_my_threads: {
        Args: { p_folder: Database["public"]["Enums"]["conversation_folder"] }
        Returns: {
          accepted: boolean
          avatar_urls: string[]
          conversation_id: string
          last_message_at: string
          title: string
          type: Database["public"]["Enums"]["conversation_type"]
        }[]
      }
      get_nearby_member_pins: {
        Args: {
          p_lat: number
          p_limit?: number
          p_lng: number
          p_radius_km: number
        }
        Returns: {
          avatar_url: string
          city: string
          display_name: string
          distance_km: number
          lat: number
          lng: number
          state: string
          user_id: string
        }[]
      }
      get_public_profile: {
        Args: { p_user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          city: string
          display_name: string
          expertises: string[]
          first_name: string
          last_name: string
          state: string
          user_id: string
          username: string
        }[]
      }
      get_public_profile_by_username: {
        Args: { p_username: string }
        Returns: {
          avatar_url: string
          bio: string
          can_view: boolean
          city: string
          display_name: string
          expertises: string[]
          profile_visibility: Database["public"]["Enums"]["profile_visibility"]
          region: string
          state: string
          user_id: string
          username: string
        }[]
      }
      get_safe_author_card: {
        Args: { p_author_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          user_id: string
          username: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      haversine_km: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      is_approved: { Args: never; Returns: boolean }
      is_mutual_follow: { Args: { a: string; b: string }; Returns: boolean }
      list_community_channels: {
        Args: never
        Returns: {
          description: string
          id: string
          name: string
          slug: string
          sort_order: number
        }[]
      }
      list_community_posts: {
        Args: { p_before?: string; p_limit?: number; p_thread_id: string }
        Returns: {
          attachment_count: number
          author_avatar_url: string
          author_display_name: string
          author_id: string
          author_username: string
          body: string
          created_at: string
          post_id: string
          thread_id: string
        }[]
      }
      list_community_threads: {
        Args: {
          p_channel_id: string
          p_limit?: number
          p_offset?: number
          p_search?: string
        }
        Returns: {
          author_avatar_url: string
          author_display_name: string
          author_username: string
          channel_id: string
          created_at: string
          created_by: string
          last_post_at: string
          post_count: number
          thread_id: string
          title: string
        }[]
      }
      list_feed_post_comments: {
        Args: { p_limit?: number; p_post_id: string }
        Returns: {
          author_avatar_url: string
          author_display_name: string
          author_user_id: string
          author_username: string
          body: string
          comment_id: string
          created_at: string
          like_count: number
          liked_by_me: boolean
        }[]
      }
      list_feed_posts: {
        Args: { p_before?: string; p_limit?: number; p_mode: string }
        Returns: {
          author_avatar_url: string
          author_display_name: string
          author_user_id: string
          author_username: string
          caption: string
          comment_count: number
          created_at: string
          like_count: number
          liked_by_me: boolean
          media: Json
          post_id: string
        }[]
      }
      list_my_notifications: {
        Args: { p_before?: string; p_limit?: number }
        Returns: {
          actor_avatar_url: string
          actor_display_name: string
          actor_user_id: string
          actor_username: string
          conversation_id: string
          created_at: string
          data: Json
          entity_id: string
          id: string
          read_at: string
          type: string
        }[]
      }
      list_profile_feed_posts: {
        Args: { p_before?: string; p_limit?: number; p_user_id: string }
        Returns: {
          caption: string
          comment_count: number
          created_at: string
          like_count: number
          liked_by_me: boolean
          media: Json
          post_id: string
        }[]
      }
      list_safe_author_cards: {
        Args: { p_user_ids: string[] }
        Returns: {
          avatar_url: string
          display_name: string
          user_id: string
          username: string
        }[]
      }
      mark_notifications_read: { Args: { p_before: string }; Returns: number }
      search_approved_members: {
        Args: { p_limit?: number; p_search?: string }
        Returns: {
          avatar_url: string
          display_name: string
          user_id: string
          username: string
        }[]
      }
      send_message: {
        Args: { p_body: string; p_conversation_id: string }
        Returns: string
      }
      toggle_feed_comment_like: {
        Args: { p_comment_id: string }
        Returns: boolean
      }
      toggle_feed_post_like: { Args: { p_post_id: string }; Returns: boolean }
      toggle_follow: { Args: { p_target_user_id: string }; Returns: boolean }
      upsert_my_live_location: {
        Args: {
          p_approx_decimals?: number
          p_expires_in_seconds?: number
          p_lat: number
          p_lng: number
        }
        Returns: boolean
      }
    }
    Enums: {
      access_status: "pending" | "approved" | "rejected"
      app_role: "admin" | "moderator" | "user"
      conversation_folder: "inbox" | "requests"
      conversation_type: "direct" | "group"
      profile_visibility: "members" | "mutuals" | "private"
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
      access_status: ["pending", "approved", "rejected"],
      app_role: ["admin", "moderator", "user"],
      conversation_folder: ["inbox", "requests"],
      conversation_type: ["direct", "group"],
      profile_visibility: ["members", "mutuals", "private"],
    },
  },
} as const
