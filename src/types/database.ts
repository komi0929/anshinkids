/* eslint-disable @typescript-eslint/no-explicit-any */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string
          avatar_url: string | null
          line_user_id: string | null
          trust_score: number
          total_contributions: number
          total_thanks_received: number
          total_helpful_votes: number
          allergen_tags: string[]
          children_profiles: Json
          interests: string[]
          child_age_months: number | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']>
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
        Relationships: any[]
      }
      talk_rooms: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          icon_emoji: string
          sort_order: number
          is_active: boolean
          extraction_threshold: number
          conversation_prompts: Json
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['talk_rooms']['Row']>
        Update: Partial<Database['public']['Tables']['talk_rooms']['Row']>
        Relationships: any[]
      }
      talk_topics: {
        Row: {
          id: string
          room_id: string
          creator_id: string | null
          title: string
          last_message_preview: string | null
          message_count: number
          is_active: boolean
          linked_wiki_entry_id: string | null
          linked_wiki_item_title: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['talk_topics']['Row']>
        Update: Partial<Database['public']['Tables']['talk_topics']['Row']>
        Relationships: any[]
      }
      messages: {
        Row: {
          id: string
          room_id: string
          topic_id: string | null
          user_id: string | null
          content: string
          image_url: string | null
          is_system_bot: boolean
          thanks_count: number
          ai_extracted: boolean
          expires_at: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['messages']['Row']>
        Update: Partial<Database['public']['Tables']['messages']['Row']>
        Relationships: any[]
      }
      message_thanks: {
        Row: {
          id: string
          message_id: string
          user_id: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['message_thanks']['Row']>
        Update: Partial<Database['public']['Tables']['message_thanks']['Row']>
        Relationships: any[]
      }
      wiki_entries: {
        Row: {
          id: string
          category: string
          title: string
          slug: string
          content_json: Json
          sections: Json
          summary: string | null
          allergen_tags: string[]
          image_gallery: string[]
          theme_slug: string | null
          is_mega_wiki: boolean
          source_count: number
          helpful_count: number
          avg_trust_score: number
          is_public: boolean
          last_updated_from_batch: string | null
          freshness_checked_at: string
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['wiki_entries']['Row']>
        Update: Partial<Database['public']['Tables']['wiki_entries']['Row']>
        Relationships: any[]
      }
      wiki_helpful_votes: {
        Row: {
          id: string
          wiki_entry_id: string
          user_id: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['wiki_helpful_votes']['Row']>
        Update: Partial<Database['public']['Tables']['wiki_helpful_votes']['Row']>
        Relationships: any[]
      }
      wiki_sources: {
        Row: {
          id: string
          wiki_entry_id: string
          original_message_snippet: string | null
          contributor_id: string | null
          contributor_trust_score: number
          source_type: string
          extracted_at: string
        }
        Insert: Partial<Database['public']['Tables']['wiki_sources']['Row']>
        Update: Partial<Database['public']['Tables']['wiki_sources']['Row']>
        Relationships: any[]
      }
      concierge_sessions: {
        Row: {
          id: string
          user_id: string
          messages_json: Json
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['concierge_sessions']['Row']>
        Update: Partial<Database['public']['Tables']['concierge_sessions']['Row']>
        Relationships: any[]
      }
      user_bookmarks: {
        Row: {
          id: string
          user_id: string
          wiki_entry_id: string | null
          topic_summary_id: string | null
          snippet_title: string
          snippet_content: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['user_bookmarks']['Row']>
        Update: Partial<Database['public']['Tables']['user_bookmarks']['Row']>
        Relationships: any[]
      }
      contribution_days: {
        Row: {
          id: string
          user_id: string
          active_date: string
          post_count: number
        }
        Insert: Partial<Database['public']['Tables']['contribution_days']['Row']>
        Update: Partial<Database['public']['Tables']['contribution_days']['Row']>
        Relationships: any[]
      }
      topic_summaries: {
        Row: {
          id: string
          topic_id: string
          summary_snippet: string | null
          full_summary: Json | null
          allergen_tags: string[]
          source_count: number
          last_generated_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['topic_summaries']['Row']>
        Update: Partial<Database['public']['Tables']['topic_summaries']['Row']>
        Relationships: any[]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
