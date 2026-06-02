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
    if (!characterId) {
      setIdentity(EMPTY);
      return;
    }
    (async () => {
      try {
        const [guildRes, rolesRes] = await Promise.all([
          supabase
            .from("guild_members")
            .select("role, guilds(name)")
            .eq("character_id", characterId)
            .maybeSingle(),
          userId
            ? supabase.from("user_roles").select("role").eq("user_id", userId)
            : Promise.resolve({ data: [] as any[] } as any),
        ]);
        if (cancelled) return;
        const g: any = (guildRes as any).data ?? null;
        const guildRole = (g?.role ?? null) as GuildRole | null;
        const roles: Array<{ role: string }> = ((rolesRes as any).data as any[]) || [];
        const found = ROLE_PRIORITY.find((r) => roles.some((x) => x.role === r.role));
        setIdentity({
          guildName: g?.guilds?.name ?? null,
          guildRole,
          guildRoleLabel: guildRole ? GUILD_ROLE_LABELS[guildRole] ?? "Member" : null,
          roleTag: found?.tag ?? null,
        });
      } catch {
        if (!cancelled) setIdentity(EMPTY);
      }
    })();
    return () => { cancelled = true; };
  }, [characterId, userId]);

  return identity;
}
