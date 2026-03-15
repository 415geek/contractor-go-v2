export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          phone: string;
          full_name: string | null;
          role: "contractor" | "admin";
          onboarding_completed: boolean;
          last_sign_in_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          phone: string;
          full_name?: string | null;
          role?: "contractor" | "admin";
          onboarding_completed?: boolean;
          last_sign_in_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          full_name?: string | null;
          role?: "contractor" | "admin";
          onboarding_completed?: boolean;
          last_sign_in_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      virtual_numbers: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          label: string | null;
          phone_number: string;
          status: "provisioning" | "active" | "inactive";
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: string;
          label?: string | null;
          phone_number: string;
          status?: "provisioning" | "active" | "inactive";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: string;
          label?: string | null;
          phone_number?: string;
          status?: "provisioning" | "active" | "inactive";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          virtual_number_id: string | null;
          title: string | null;
          channel: "sms" | "whatsapp" | "system";
          status: "active" | "archived";
          metadata: Json;
          last_message_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          virtual_number_id?: string | null;
          title?: string | null;
          channel?: "sms" | "whatsapp" | "system";
          status?: "active" | "archived";
          metadata?: Json;
          last_message_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          virtual_number_id?: string | null;
          title?: string | null;
          channel?: "sms" | "whatsapp" | "system";
          status?: "active" | "archived";
          metadata?: Json;
          last_message_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          direction: "inbound" | "outbound";
          status: "queued" | "sent" | "delivered" | "failed";
          body: string;
          external_message_id: string | null;
          sent_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          direction: "inbound" | "outbound";
          status?: "queued" | "sent" | "delivered" | "failed";
          body: string;
          external_message_id?: string | null;
          sent_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          direction?: "inbound" | "outbound";
          status?: "queued" | "sent" | "delivered" | "failed";
          body?: string;
          external_message_id?: string | null;
          sent_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          address: string | null;
          client_name: string | null;
          client_phone: string | null;
          client_email: string | null;
          total_cost: number;
          labor_cost: number;
          material_cost: number;
          contract_type: string | null;
          start_date: string | null;
          end_date: string | null;
          duration_days: number | null;
          status: "planning" | "active" | "on_hold" | "completed" | "cancelled";
          ai_summary: Json;
          construction_plan: Json;
          material_list: Json;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          address?: string | null;
          client_name?: string | null;
          client_phone?: string | null;
          client_email?: string | null;
          total_cost?: number;
          labor_cost?: number;
          material_cost?: number;
          contract_type?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          duration_days?: number | null;
          status?: "planning" | "active" | "on_hold" | "completed" | "cancelled";
          ai_summary?: Json;
          construction_plan?: Json;
          material_list?: Json;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          address?: string | null;
          client_name?: string | null;
          client_phone?: string | null;
          client_email?: string | null;
          total_cost?: number;
          labor_cost?: number;
          material_cost?: number;
          contract_type?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          duration_days?: number | null;
          status?: "planning" | "active" | "on_hold" | "completed" | "cancelled";
          ai_summary?: Json;
          construction_plan?: Json;
          material_list?: Json;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      material_searches: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          image_urls: string[];
          description: string | null;
          ai_recognized_material: Json;
          search_results: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          image_urls?: string[];
          description?: string | null;
          ai_recognized_material?: Json;
          search_results?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          image_urls?: string[];
          description?: string | null;
          ai_recognized_material?: Json;
          search_results?: Json;
          created_at?: string;
        };
      };
      user_analytics: {
        Row: {
          id: string;
          user_id: string | null;
          event_name: string;
          subject_type: string;
          subject_value: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          event_name: string;
          subject_type: string;
          subject_value: string;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          event_name?: string;
          subject_type?: string;
          subject_value?: string;
          payload?: Json;
          created_at?: string;
        };
      };
    };
  };
};
