export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
  public: {
    Tables: {
      activity: {
        Row: {
          action: string
          actor_id: string | null
          client_id: string | null
          client_visible: boolean
          created_at: string
          deliverable_id: string | null
          id: number
          metadata: Json
          workspace_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          client_id?: string | null
          client_visible?: boolean
          created_at?: string
          deliverable_id?: string | null
          id?: never
          metadata?: Json
          workspace_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          client_id?: string | null
          client_visible?: boolean
          created_at?: string
          deliverable_id?: string | null
          id?: never
          metadata?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          accent: string
          archived_at: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          accent?: string
          archived_at?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          accent?: string
          archived_at?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          body: string
          client_id: string
          created_at: string
          deleted_at: string | null
          deliverable_id: string
          edited_at: string | null
          id: string
          version_id: string | null
          workspace_id: string
        }
        Insert: {
          author_id?: string
          body: string
          client_id: string
          created_at?: string
          deleted_at?: string | null
          deliverable_id: string
          edited_at?: string | null
          id?: string
          version_id?: string | null
          workspace_id: string
        }
        Update: {
          author_id?: string
          body?: string
          client_id?: string
          created_at?: string
          deleted_at?: string | null
          deliverable_id?: string
          edited_at?: string | null
          id?: string
          version_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_deliverable_id_workspace_id_client_id_fkey"
            columns: ["deliverable_id", "workspace_id", "client_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id", "workspace_id", "client_id"]
          },
          {
            foreignKeyName: "comments_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "deliverable_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverable_versions: {
        Row: {
          client_id: string
          created_at: string
          deliverable_id: string
          file_name: string
          id: string
          mime_type: string
          note: string
          size_bytes: number
          storage_path: string
          uploaded_by: string
          version: number
          workspace_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          deliverable_id: string
          file_name: string
          id?: string
          mime_type: string
          note?: string
          size_bytes: number
          storage_path: string
          uploaded_by?: string
          version?: number
          workspace_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          deliverable_id?: string
          file_name?: string
          id?: string
          mime_type?: string
          note?: string
          size_bytes?: number
          storage_path?: string
          uploaded_by?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverable_versions_deliverable_id_workspace_id_client_id_fkey"
            columns: ["deliverable_id", "workspace_id", "client_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id", "workspace_id", "client_id"]
          },
        ]
      }
      deliverables: {
        Row: {
          approval_requested_at: string | null
          client_id: string
          created_at: string
          created_by: string
          decided_at: string | null
          description: string
          due_on: string | null
          id: string
          status: Database["public"]["Enums"]["deliverable_status"]
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          approval_requested_at?: string | null
          client_id: string
          created_at?: string
          created_by?: string
          decided_at?: string | null
          description?: string
          due_on?: string | null
          id?: string
          status?: Database["public"]["Enums"]["deliverable_status"]
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          approval_requested_at?: string | null
          client_id?: string
          created_at?: string
          created_by?: string
          decided_at?: string | null
          description?: string
          due_on?: string | null
          id?: string
          status?: Database["public"]["Enums"]["deliverable_status"]
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_client_id_workspace_id_fkey"
            columns: ["client_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "deliverables_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          client_id: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          revoked_at: string | null
          role: Database["public"]["Enums"]["member_role"]
          token_hash: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          client_id?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string
          revoked_at?: string | null
          role: Database["public"]["Enums"]["member_role"]
          token_hash: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          client_id?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          token_hash?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_client_id_workspace_id_fkey"
            columns: ["client_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_client_id_workspace_id_fkey"
            columns: ["client_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "memberships_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          client_id: string
          created_at: string
          decision: Database["public"]["Enums"]["review_decision"]
          deliverable_id: string
          id: string
          note: string
          reviewer_id: string
          version_id: string
          workspace_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          decision: Database["public"]["Enums"]["review_decision"]
          deliverable_id: string
          id?: string
          note?: string
          reviewer_id: string
          version_id: string
          workspace_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          decision?: Database["public"]["Enums"]["review_decision"]
          deliverable_id?: string
          id?: string
          note?: string
          reviewer_id?: string
          version_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "deliverable_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          deliveries: number
          id: string
          outcome: string
          received_at: string
          stripe_created_at: string
          summary: string
          type: string
          workspace_id: string | null
        }
        Insert: {
          deliveries?: number
          id: string
          outcome: string
          received_at?: string
          stripe_created_at: string
          summary?: string
          type: string
          workspace_id?: string | null
        }
        Update: {
          deliveries?: number
          id?: string
          outcome?: string
          received_at?: string
          stripe_created_at?: string
          summary?: string
          type?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          current_period_end: string | null
          plan: Database["public"]["Enums"]["plan_tier"]
          price_lookup_key: string | null
          risk_note: string | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          current_period_end?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          price_lookup_key?: string | null
          risk_note?: string | null
          status?: string
          stripe_customer_id: string
          stripe_subscription_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          current_period_end?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          price_lookup_key?: string | null
          risk_note?: string | null
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_demo: boolean
          name: string
          plan: Database["public"]["Enums"]["plan_tier"]
          slug: string
          suspended_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          is_demo?: boolean
          name: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          slug: string
          suspended_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_demo?: boolean
          name?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          slug?: string
          suspended_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: { Args: { p_token: string }; Returns: string }
      apply_stripe_subscription: {
        Args: {
          p_cancel_at_period_end: boolean
          p_customer: string
          p_event_created: string
          p_event_id: string
          p_event_type: string
          p_lookup_key?: string
          p_period_end?: string
          p_plan: Database["public"]["Enums"]["plan_tier"]
          p_status: string
          p_subscription: string
        }
        Returns: string
      }
      flag_stripe_risk: {
        Args: {
          p_customer: string
          p_event_created: string
          p_event_id: string
          p_event_type: string
          p_note: string
        }
        Returns: string
      }
      get_invitation: {
        Args: { p_token: string }
        Returns: {
          client_name: string
          email: string
          expired: boolean
          inviter_name: string
          role: Database["public"]["Enums"]["member_role"]
          workspace_name: string
        }[]
      }
      record_stripe_event: {
        Args: {
          p_created: string
          p_event_id: string
          p_outcome: string
          p_summary?: string
          p_type: string
          p_workspace?: string
        }
        Returns: boolean
      }
      request_approval: {
        Args: { p_deliverable: string; p_due_on?: string }
        Returns: undefined
      }
      submit_review: {
        Args: {
          p_decision: Database["public"]["Enums"]["review_decision"]
          p_deliverable: string
          p_note?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      deliverable_status:
        | "draft"
        | "in_review"
        | "changes_requested"
        | "approved"
      member_role: "owner" | "member" | "client"
      plan_tier: "free" | "pro" | "studio"
      review_decision: "approved" | "changes_requested"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      deliverable_status: [
        "draft",
        "in_review",
        "changes_requested",
        "approved",
      ],
      member_role: ["owner", "member", "client"],
      plan_tier: ["free", "pro", "studio"],
      review_decision: ["approved", "changes_requested"],
    },
  },
} as const

