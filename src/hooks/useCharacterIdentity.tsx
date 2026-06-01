import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CharacterIdentity = {
  guildName: string | null;
  guildLevel: number | null;
  roleTag: "ADM" | "GM" | "TUTOR" | null;
};

const ROLE_PRIORITY: Array<{ role: "admin" | "gm" | "tutor"; tag: "ADM" | "GM" | "TUTOR" }> = [
  { role: "admin", tag: "ADM" },
  { role: "gm", tag: "GM" },
  { role: "tutor", tag: "TUTOR" },
];

export function useCharacterIdentity(characterId: string | null | undefined, userId: string | null | undefined): CharacterIdentity {
  const [identity, setIdentity] = useState<CharacterIdentity>({ guildName: null, guildLevel: null, roleTag: null });

  useEffect(() => {
    let cancelled = false;
    if (!characterId) {
      setIdentity({ guildName: null, guildLevel: null, roleTag: null });
      return;
    }
    (async () => {
      try {
        const [guildRes, rolesRes] = await Promise.all([
          supabase.from("guild_members").select("guilds(name, level)").eq("character_id", characterId).maybeSingle(),
          userId
            ? supabase.from("user_roles" as any).select("role").eq("user_id", userId)
            : Promise.resolve({ data: [] as any[] } as any),
        ]);
        if (cancelled) return;
        const g: any = (guildRes as any).data?.guilds ?? null;
        const roles: Array<{ role: string }> = ((rolesRes as any).data as any[]) || [];
        const found = ROLE_PRIORITY.find((r) => roles.some((x) => x.role === r.role));
        setIdentity({
          guildName: g?.name ?? null,
          guildLevel: g?.level ?? null,
          roleTag: found?.tag ?? null,
        });
      } catch {
        if (!cancelled) setIdentity({ guildName: null, guildLevel: null, roleTag: null });
      }
    })();
    return () => { cancelled = true; };
  }, [characterId, userId]);

  return identity;
}
