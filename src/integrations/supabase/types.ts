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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      character_items: {
        Row: {
          character_id: string
          id: string
          is_equipped: boolean | null
          item_id: string
          obtained_at: string | null
          quantity: number | null
        }
        Insert: {
          character_id: string
          id?: string
          is_equipped?: boolean | null
          item_id: string
          obtained_at?: string | null
          quantity?: number | null
        }
        Update: {
          character_id?: string
          id?: string
          is_equipped?: boolean | null
          item_id?: string
          obtained_at?: string | null
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "character_items_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      character_mounts: {
        Row: {
          captured_at: string | null
          character_id: string
          id: string
          is_active: boolean | null
          mount_id: string
        }
        Insert: {
          captured_at?: string | null
          character_id: string
          id?: string
          is_active?: boolean | null
          mount_id: string
        }
        Update: {
          captured_at?: string | null
          character_id?: string
          id?: string
          is_active?: boolean | null
          mount_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_mounts_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_mounts_mount_id_fkey"
            columns: ["mount_id"]
            isOneToOne: false
            referencedRelation: "mounts"
            referencedColumns: ["id"]
          },
        ]
      }
      character_titles: {
        Row: {
          character_id: string
          description: string | null
          earned_at: string | null
          id: string
          title_name: string
        }
        Insert: {
          character_id: string
          description?: string | null
          earned_at?: string | null
          id?: string
          title_name: string
        }
        Update: {
          character_id?: string
          description?: string | null
          earned_at?: string | null
          id?: string
          title_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_titles_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          agility: number | null
          class: Database["public"]["Enums"]["character_class"]
          created_at: string | null
          current_biome: Database["public"]["Enums"]["biome_type"] | null
          experience: number | null
          gold: number | null
          health: number | null
          id: string
          intelligence: number | null
          level: number | null
          luck: number | null
          mana: number | null
          max_health: number | null
          max_mana: number | null
          name: string
          position_x: number | null
          position_y: number | null
          strength: number | null
          updated_at: string | null
          user_id: string
          vitality: number | null
        }
        Insert: {
          agility?: number | null
          class: Database["public"]["Enums"]["character_class"]
          created_at?: string | null
          current_biome?: Database["public"]["Enums"]["biome_type"] | null
          experience?: number | null
          gold?: number | null
          health?: number | null
          id?: string
          intelligence?: number | null
          level?: number | null
          luck?: number | null
          mana?: number | null
          max_health?: number | null
          max_mana?: number | null
          name: string
          position_x?: number | null
          position_y?: number | null
          strength?: number | null
          updated_at?: string | null
          user_id: string
          vitality?: number | null
        }
        Update: {
          agility?: number | null
          class?: Database["public"]["Enums"]["character_class"]
          created_at?: string | null
          current_biome?: Database["public"]["Enums"]["biome_type"] | null
          experience?: number | null
          gold?: number | null
          health?: number | null
          id?: string
          intelligence?: number | null
          level?: number | null
          luck?: number | null
          mana?: number | null
          max_health?: number | null
          max_mana?: number | null
          name?: string
          position_x?: number | null
          position_y?: number | null
          strength?: number | null
          updated_at?: string | null
          user_id?: string
          vitality?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "characters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creature_drops: {
        Row: {
          created_at: string | null
          creature_id: string | null
          drop_chance: number | null
          id: string
          item_id: string | null
          quantity_max: number | null
          quantity_min: number | null
        }
        Insert: {
          created_at?: string | null
          creature_id?: string | null
          drop_chance?: number | null
          id?: string
          item_id?: string | null
          quantity_max?: number | null
          quantity_min?: number | null
        }
        Update: {
          created_at?: string | null
          creature_id?: string | null
          drop_chance?: number | null
          id?: string
          item_id?: string | null
          quantity_max?: number | null
          quantity_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "creature_drops_creature_id_fkey"
            columns: ["creature_id"]
            isOneToOne: false
            referencedRelation: "creatures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creature_drops_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      creatures: {
        Row: {
          agility: number | null
          biome: Database["public"]["Enums"]["biome_type"]
          created_at: string | null
          description: string | null
          experience_reward: number | null
          gold_reward: number | null
          health: number | null
          id: string
          intelligence: number | null
          level: number | null
          luck: number | null
          max_health: number | null
          name: string
          rarity: Database["public"]["Enums"]["rarity_type"] | null
          special_ability: string | null
          strength: number | null
          vitality: number | null
        }
        Insert: {
          agility?: number | null
          biome: Database["public"]["Enums"]["biome_type"]
          created_at?: string | null
          description?: string | null
          experience_reward?: number | null
          gold_reward?: number | null
          health?: number | null
          id?: string
          intelligence?: number | null
          level?: number | null
          luck?: number | null
          max_health?: number | null
          name: string
          rarity?: Database["public"]["Enums"]["rarity_type"] | null
          special_ability?: string | null
          strength?: number | null
          vitality?: number | null
        }
        Update: {
          agility?: number | null
          biome?: Database["public"]["Enums"]["biome_type"]
          created_at?: string | null
          description?: string | null
          experience_reward?: number | null
          gold_reward?: number | null
          health?: number | null
          id?: string
          intelligence?: number | null
          level?: number | null
          luck?: number | null
          max_health?: number | null
          name?: string
          rarity?: Database["public"]["Enums"]["rarity_type"] | null
          special_ability?: string | null
          strength?: number | null
          vitality?: number | null
        }
        Relationships: []
      }
      guild_members: {
        Row: {
          character_id: string
          guild_id: string
          id: string
          joined_at: string | null
          role: string | null
        }
        Insert: {
          character_id: string
          guild_id: string
          id?: string
          joined_at?: string | null
          role?: string | null
        }
        Update: {
          character_id?: string
          guild_id?: string
          id?: string
          joined_at?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guild_members_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guild_members_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      guilds: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          leader_id: string
          max_members: number | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          leader_id: string
          max_members?: number | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          leader_id?: string
          max_members?: number | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "guilds_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          agility_bonus: number | null
          created_at: string | null
          description: string | null
          id: string
          intelligence_bonus: number | null
          luck_bonus: number | null
          name: string
          rarity: Database["public"]["Enums"]["rarity_type"] | null
          required_class: Database["public"]["Enums"]["character_class"] | null
          required_level: number | null
          strength_bonus: number | null
          type: Database["public"]["Enums"]["item_type"]
          value: number | null
          vitality_bonus: number | null
        }
        Insert: {
          agility_bonus?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          intelligence_bonus?: number | null
          luck_bonus?: number | null
          name: string
          rarity?: Database["public"]["Enums"]["rarity_type"] | null
          required_class?: Database["public"]["Enums"]["character_class"] | null
          required_level?: number | null
          strength_bonus?: number | null
          type: Database["public"]["Enums"]["item_type"]
          value?: number | null
          vitality_bonus?: number | null
        }
        Update: {
          agility_bonus?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          intelligence_bonus?: number | null
          luck_bonus?: number | null
          name?: string
          rarity?: Database["public"]["Enums"]["rarity_type"] | null
          required_class?: Database["public"]["Enums"]["character_class"] | null
          required_level?: number | null
          strength_bonus?: number | null
          type?: Database["public"]["Enums"]["item_type"]
          value?: number | null
          vitality_bonus?: number | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          biome: Database["public"]["Enums"]["biome_type"]
          created_at: string | null
          description: string | null
          id: string
          is_discovered: boolean | null
          location_type: string
          name: string
          position_x: number
          position_y: number
        }
        Insert: {
          biome: Database["public"]["Enums"]["biome_type"]
          created_at?: string | null
          description?: string | null
          id?: string
          is_discovered?: boolean | null
          location_type: string
          name: string
          position_x: number
          position_y: number
        }
        Update: {
          biome?: Database["public"]["Enums"]["biome_type"]
          created_at?: string | null
          description?: string | null
          id?: string
          is_discovered?: boolean | null
          location_type?: string
          name?: string
          position_x?: number
          position_y?: number
        }
        Relationships: []
      }
      mounts: {
        Row: {
          biome: Database["public"]["Enums"]["biome_type"]
          capture_difficulty: number | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          rarity: Database["public"]["Enums"]["rarity_type"] | null
          special_ability: string | null
          speed_bonus: number | null
          stamina_bonus: number | null
        }
        Insert: {
          biome: Database["public"]["Enums"]["biome_type"]
          capture_difficulty?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          rarity?: Database["public"]["Enums"]["rarity_type"] | null
          special_ability?: string | null
          speed_bonus?: number | null
          stamina_bonus?: number | null
        }
        Update: {
          biome?: Database["public"]["Enums"]["biome_type"]
          capture_difficulty?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          rarity?: Database["public"]["Enums"]["rarity_type"] | null
          special_ability?: string | null
          speed_bonus?: number | null
          stamina_bonus?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string
          is_online: boolean | null
          last_login: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id: string
          is_online?: boolean | null
          last_login?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_online?: boolean | null
          last_login?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      biome_type: "caatinga" | "agreste" | "litoral" | "santa_cruz"
      character_class: "warrior" | "mage" | "archer" | "healer" | "assassin"
      item_type: "weapon" | "armor" | "consumable" | "material" | "mount"
      rarity_type: "common" | "uncommon" | "rare" | "epic" | "legendary"
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
      biome_type: ["caatinga", "agreste", "litoral", "santa_cruz"],
      character_class: ["warrior", "mage", "archer", "healer", "assassin"],
      item_type: ["weapon", "armor", "consumable", "material", "mount"],
      rarity_type: ["common", "uncommon", "rare", "epic", "legendary"],
    },
  },
} as const
