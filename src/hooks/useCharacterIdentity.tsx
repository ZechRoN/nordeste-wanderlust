import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type GuildRole = "leader" | "vice_leader" | "officer" | "member";

export type CharacterIdentity = {
  guildName: string | null;
  guildRole: GuildRole | null;
  guildRoleLabel: string | null;
  roleTag: "ADM" | "GM" | "TUTOR" | null;
};

const ROLE_PRIORITY: Array<{ role: "admin" | "gm" | "tutor"; tag: "ADM" | "GM" | "TUTOR" }> = [
  { role: "admin", tag: "ADM" },
  { role: "gm", tag: "GM" },
  { role: "tutor", tag: "TUTOR" },
];

const GUILD_ROLE_LABELS: Record<GuildRole, string> = {
  leader: "Guild Leader",
  vice_leader: "Vice Leader",
  officer: "Officer",
  member: "Member",
};

const EMPTY: CharacterIdentity = { guildName: null, guildRole: null, guildRoleLabel: null, roleTag: null };

export function useCharacterIdentity(characterId: string | null | undefined, userId: string | null | undefined): CharacterIdentity {
  const [identity, setIdentity] = useState<CharacterIdentity>(EMPTY);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!characterId) {
        if (!cancelled) setIdentity(EMPTY);
        return;
      }
      try {
        // Fetch guild membership (avoid PostgREST embed in case FK is not declared)
        const memberRes = await supabase
          .from("guild_members")
          .select("role, guild_id, joined_at")
          .eq("character_id", characterId)
          .order("joined_at", { ascending: false })
          .limit(1);

        const member: any = memberRes.data?.[0] ?? null;
        let guildName: string | null = null;
        let guildRole: GuildRole | null = (member?.role ?? null) as GuildRole | null;

        if (member?.guild_id) {
          const guildRes = await supabase
            .from("guilds")
            .select("name")
            .eq("id", member.guild_id)
            .maybeSingle();
          guildName = (guildRes.data as any)?.name ?? null;
        }

        // Roles (only if user available)
        let roleTag: CharacterIdentity["roleTag"] = null;
        if (userId) {
          const rolesRes = await supabase.from("user_roles").select("role").eq("user_id", userId);
          const roles: Array<{ role: string }> = ((rolesRes.data as any[]) || []);
          const found = ROLE_PRIORITY.find((r) => roles.some((x) => x.role === r.role));
          roleTag = found?.tag ?? null;
        }

        if (cancelled) return;
        setIdentity({
          guildName,
          guildRole,
          guildRoleLabel: guildRole ? GUILD_ROLE_LABELS[guildRole] ?? "Member" : null,
          roleTag,
        });
      } catch {
        if (!cancelled) setIdentity(EMPTY);
      }
    }

    load();

    // Realtime: refresh when this character's guild membership changes
    const channel = characterId
      ? supabase
          .channel(`identity_${characterId}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "guild_members", filter: `character_id=eq.${characterId}` },
            () => load(),
          )
          .subscribe()
      : null;

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [characterId, userId]);

  return identity;
}
