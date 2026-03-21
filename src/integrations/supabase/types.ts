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
      achievements: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          objective_count: number
          objective_type: string
          reward_title: string | null
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          objective_count?: number
          objective_type?: string
          reward_title?: string | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          objective_count?: number
          objective_type?: string
          reward_title?: string | null
          title?: string
        }
        Relationships: []
      }
      arena_matches: {
        Row: {
          arena_points_awarded: number | null
          combat_log: string[] | null
          completed_at: string | null
          created_at: string
          id: string
          player1_health_remaining: number | null
          player1_id: string
          player2_health_remaining: number | null
          player2_id: string
          winner_id: string | null
        }
        Insert: {
          arena_points_awarded?: number | null
          combat_log?: string[] | null
          completed_at?: string | null
          created_at?: string
          id?: string
          player1_health_remaining?: number | null
          player1_id: string
          player2_health_remaining?: number | null
          player2_id: string
          winner_id?: string | null
        }
        Update: {
          arena_points_awarded?: number | null
          combat_log?: string[] | null
          completed_at?: string | null
          created_at?: string
          id?: string
          player1_health_remaining?: number | null
          player1_id?: string
          player2_health_remaining?: number | null
          player2_id?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "arena_matches_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arena_matches_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arena_matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_achievements: {
        Row: {
          achievement_id: string
          character_id: string
          completed: boolean
          completed_at: string | null
          id: string
          progress: number
        }
        Insert: {
          achievement_id: string
          character_id: string
          completed?: boolean
          completed_at?: string | null
          id?: string
          progress?: number
        }
        Update: {
          achievement_id?: string
          character_id?: string
          completed?: boolean
          completed_at?: string | null
          id?: string
          progress?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_achievements_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_items: {
        Row: {
          acquired_at: string
          character_id: string
          id: string
          is_equipped: boolean
          item_id: string
          quantity: number
        }
        Insert: {
          acquired_at?: string
          character_id: string
          id?: string
          is_equipped?: boolean
          item_id: string
          quantity?: number
        }
        Update: {
          acquired_at?: string
          character_id?: string
          id?: string
          is_equipped?: boolean
          item_id?: string
          quantity?: number
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
          captured_at: string
          character_id: string
          id: string
          is_active: boolean
          mount_id: string
        }
        Insert: {
          captured_at?: string
          character_id: string
          id?: string
          is_active?: boolean
          mount_id: string
        }
        Update: {
          captured_at?: string
          character_id?: string
          id?: string
          is_active?: boolean
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
      character_quests: {
        Row: {
          accepted_at: string
          character_id: string
          completed: boolean
          completed_at: string | null
          id: string
          progress: Json | null
          quest_id: string
          status: string
        }
        Insert: {
          accepted_at?: string
          character_id: string
          completed?: boolean
          completed_at?: string | null
          id?: string
          progress?: Json | null
          quest_id: string
          status?: string
        }
        Update: {
          accepted_at?: string
          character_id?: string
          completed?: boolean
          completed_at?: string | null
          id?: string
          progress?: Json | null
          quest_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_quests_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      character_titles: {
        Row: {
          character_id: string
          description: string | null
          earned_at: string
          id: string
          is_active: boolean
          title_name: string
        }
        Insert: {
          character_id: string
          description?: string | null
          earned_at?: string
          id?: string
          is_active?: boolean
          title_name: string
        }
        Update: {
          character_id?: string
          description?: string | null
          earned_at?: string
          id?: string
          is_active?: boolean
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
          agility: number
          class: string
          created_at: string
          current_biome: string
          experience: number
          gold: number
          health: number
          id: string
          intelligence: number
          level: number
          luck: number
          mana: number
          max_health: number
          max_mana: number
          name: string
          position_x: number
          position_y: number
          strength: number
          updated_at: string
          user_id: string
          vitality: number
        }
        Insert: {
          agility?: number
          class?: string
          created_at?: string
          current_biome?: string
          experience?: number
          gold?: number
          health?: number
          id?: string
          intelligence?: number
          level?: number
          luck?: number
          mana?: number
          max_health?: number
          max_mana?: number
          name: string
          position_x?: number
          position_y?: number
          strength?: number
          updated_at?: string
          user_id: string
          vitality?: number
        }
        Update: {
          agility?: number
          class?: string
          created_at?: string
          current_biome?: string
          experience?: number
          gold?: number
          health?: number
          id?: string
          intelligence?: number
          level?: number
          luck?: number
          mana?: number
          max_health?: number
          max_mana?: number
          name?: string
          position_x?: number
          position_y?: number
          strength?: number
          updated_at?: string
          user_id?: string
          vitality?: number
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          character_id: string
          character_name: string
          created_at: string
          id: string
          message: string
        }
        Insert: {
          character_id: string
          character_name: string
          created_at?: string
          id?: string
          message: string
        }
        Update: {
          character_id?: string
          character_name?: string
          created_at?: string
          id?: string
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      crafting_recipes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          required_level: number
          result_item_id: string
          result_quantity: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          required_level?: number
          result_item_id: string
          result_quantity?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          required_level?: number
          result_item_id?: string
          result_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "crafting_recipes_result_item_id_fkey"
            columns: ["result_item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      creature_drops: {
        Row: {
          creature_id: string
          drop_chance: number
          id: string
          item_id: string
          quantity_max: number
          quantity_min: number
        }
        Insert: {
          creature_id: string
          drop_chance?: number
          id?: string
          item_id: string
          quantity_max?: number
          quantity_min?: number
        }
        Update: {
          creature_id?: string
          drop_chance?: number
          id?: string
          item_id?: string
          quantity_max?: number
          quantity_min?: number
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
          agility: number
          biome: string
          created_at: string
          description: string | null
          experience_reward: number
          gold_reward: number
          health: number
          id: string
          intelligence: number
          level: number
          luck: number
          max_health: number
          name: string
          rarity: string
          special_ability: string | null
          strength: number
          vitality: number
        }
        Insert: {
          agility?: number
          biome?: string
          created_at?: string
          description?: string | null
          experience_reward?: number
          gold_reward?: number
          health?: number
          id?: string
          intelligence?: number
          level?: number
          luck?: number
          max_health?: number
          name: string
          rarity?: string
          special_ability?: string | null
          strength?: number
          vitality?: number
        }
        Update: {
          agility?: number
          biome?: string
          created_at?: string
          description?: string | null
          experience_reward?: number
          gold_reward?: number
          health?: number
          id?: string
          intelligence?: number
          level?: number
          luck?: number
          max_health?: number
          name?: string
          rarity?: string
          special_ability?: string | null
          strength?: number
          vitality?: number
        }
        Relationships: []
      }
      event_participants: {
        Row: {
          character_id: string
          damage_dealt: number
          event_id: string
          id: string
          participated_at: string
          reward_claimed: boolean
        }
        Insert: {
          character_id: string
          damage_dealt?: number
          event_id: string
          id?: string
          participated_at?: string
          reward_claimed?: boolean
        }
        Update: {
          character_id?: string
          damage_dealt?: number
          event_id?: string
          id?: string
          participated_at?: string
          reward_claimed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          biome: string
          boss_agility: number
          boss_health: number
          boss_intelligence: number
          boss_level: number
          boss_luck: number
          boss_max_health: number
          boss_name: string
          boss_special_ability: string | null
          boss_strength: number
          boss_vitality: number
          created_at: string
          description: string | null
          ends_at: string
          event_type: string
          id: string
          is_active: boolean
          reward_experience: number
          reward_gold: number
          reward_item_id: string | null
          starts_at: string
          title: string
        }
        Insert: {
          biome?: string
          boss_agility?: number
          boss_health?: number
          boss_intelligence?: number
          boss_level?: number
          boss_luck?: number
          boss_max_health?: number
          boss_name?: string
          boss_special_ability?: string | null
          boss_strength?: number
          boss_vitality?: number
          created_at?: string
          description?: string | null
          ends_at?: string
          event_type?: string
          id?: string
          is_active?: boolean
          reward_experience?: number
          reward_gold?: number
          reward_item_id?: string | null
          starts_at?: string
          title: string
        }
        Update: {
          biome?: string
          boss_agility?: number
          boss_health?: number
          boss_intelligence?: number
          boss_level?: number
          boss_luck?: number
          boss_max_health?: number
          boss_name?: string
          boss_special_ability?: string | null
          boss_strength?: number
          boss_vitality?: number
          created_at?: string
          description?: string | null
          ends_at?: string
          event_type?: string
          id?: string
          is_active?: boolean
          reward_experience?: number
          reward_gold?: number
          reward_item_id?: string | null
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_reward_item_id_fkey"
            columns: ["reward_item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_members: {
        Row: {
          character_id: string
          guild_id: string
          id: string
          joined_at: string
          role: string
        }
        Insert: {
          character_id: string
          guild_id: string
          id?: string
          joined_at?: string
          role?: string
        }
        Update: {
          character_id?: string
          guild_id?: string
          id?: string
          joined_at?: string
          role?: string
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
          created_at: string
          description: string | null
          id: string
          leader_id: string | null
          max_members: number
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          leader_id?: string | null
          max_members?: number
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          leader_id?: string | null
          max_members?: number
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
          agility_bonus: number
          biome: string | null
          created_at: string
          description: string | null
          id: string
          intelligence_bonus: number
          luck_bonus: number
          name: string
          rarity: string
          required_level: number
          strength_bonus: number
          type: string
          value: number
          vitality_bonus: number
        }
        Insert: {
          agility_bonus?: number
          biome?: string | null
          created_at?: string
          description?: string | null
          id?: string
          intelligence_bonus?: number
          luck_bonus?: number
          name: string
          rarity?: string
          required_level?: number
          strength_bonus?: number
          type?: string
          value?: number
          vitality_bonus?: number
        }
        Update: {
          agility_bonus?: number
          biome?: string | null
          created_at?: string
          description?: string | null
          id?: string
          intelligence_bonus?: number
          luck_bonus?: number
          name?: string
          rarity?: string
          required_level?: number
          strength_bonus?: number
          type?: string
          value?: number
          vitality_bonus?: number
        }
        Relationships: []
      }
      locations: {
        Row: {
          biome: string
          created_at: string
          description: string | null
          id: string
          is_discovered: boolean
          location_type: string
          name: string
          position_x: number
          position_y: number
        }
        Insert: {
          biome?: string
          created_at?: string
          description?: string | null
          id?: string
          is_discovered?: boolean
          location_type?: string
          name: string
          position_x?: number
          position_y?: number
        }
        Update: {
          biome?: string
          created_at?: string
          description?: string | null
          id?: string
          is_discovered?: boolean
          location_type?: string
          name?: string
          position_x?: number
          position_y?: number
        }
        Relationships: []
      }
      mounts: {
        Row: {
          biome: string
          capture_difficulty: number
          created_at: string
          description: string | null
          id: string
          name: string
          rarity: string
          special_ability: string | null
          speed_bonus: number
          stamina_bonus: number
        }
        Insert: {
          biome?: string
          capture_difficulty?: number
          created_at?: string
          description?: string | null
          id?: string
          name: string
          rarity?: string
          special_ability?: string | null
          speed_bonus?: number
          stamina_bonus?: number
        }
        Update: {
          biome?: string
          capture_difficulty?: number
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          rarity?: string
          special_ability?: string | null
          speed_bonus?: number
          stamina_bonus?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          character_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          notification_type: string
          related_id: string | null
          title: string
        }
        Insert: {
          character_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          notification_type?: string
          related_id?: string | null
          title: string
        }
        Update: {
          character_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          notification_type?: string
          related_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      npcs: {
        Row: {
          biome: string
          created_at: string
          dialogue: string | null
          id: string
          name: string
          npc_type: string
        }
        Insert: {
          biome?: string
          created_at?: string
          dialogue?: string | null
          id?: string
          name: string
          npc_type?: string
        }
        Update: {
          biome?: string
          created_at?: string
          dialogue?: string | null
          id?: string
          name?: string
          npc_type?: string
        }
        Relationships: []
      }
      parties: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          leader_id: string
          max_members: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          leader_id: string
          max_members?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          leader_id?: string
          max_members?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "parties_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      party_members: {
        Row: {
          character_id: string
          id: string
          joined_at: string
          party_id: string
        }
        Insert: {
          character_id: string
          id?: string
          joined_at?: string
          party_id: string
        }
        Update: {
          character_id?: string
          id?: string
          joined_at?: string
          party_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "party_members_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "party_members_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      quests: {
        Row: {
          biome: string
          created_at: string
          description: string | null
          id: string
          objective_count: number
          objective_target: string
          objective_type: string
          objectives: Json | null
          quest_type: string
          required_level: number
          reward_experience: number
          reward_gold: number
          title: string
        }
        Insert: {
          biome?: string
          created_at?: string
          description?: string | null
          id?: string
          objective_count?: number
          objective_target?: string
          objective_type?: string
          objectives?: Json | null
          quest_type?: string
          required_level?: number
          reward_experience?: number
          reward_gold?: number
          title: string
        }
        Update: {
          biome?: string
          created_at?: string
          description?: string | null
          id?: string
          objective_count?: number
          objective_target?: string
          objective_type?: string
          objectives?: Json | null
          quest_type?: string
          required_level?: number
          reward_experience?: number
          reward_gold?: number
          title?: string
        }
        Relationships: []
      }
      recipe_materials: {
        Row: {
          id: string
          item_id: string
          quantity: number
          recipe_id: string
        }
        Insert: {
          id?: string
          item_id: string
          quantity?: number
          recipe_id: string
        }
        Update: {
          id?: string
          item_id?: string
          quantity?: number
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_materials_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_materials_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "crafting_recipes"
            referencedColumns: ["id"]
          },
        ]
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
