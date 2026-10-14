// Resolve which body slot an item occupies, with fallbacks for legacy items without equipment_slot.
export type EquipSlotKey = 'helmet' | 'chest' | 'legs' | 'gloves' | 'boots' | 'main_hand' | 'off_hand';

export const EQUIPMENT_UPDATED_EVENT = 'game:equipment-updated';

export function resolveEquipmentSlot(item: { type?: string | null; equipment_slot?: string | null; subtype?: string | null; name?: string | null }): EquipSlotKey | null {
  if (item.equipment_slot) return item.equipment_slot as EquipSlotKey;
  if (item.type !== 'weapon' && item.type !== 'armor') return null;
  const n = `${item.name ?? ''} ${item.subtype ?? ''}`.toLowerCase();
  if (/escudo|orbe|runa|aljava|bolsa de flecha|concha|shield|orb|quiver/.test(n)) return 'off_hand';
  if (item.type === 'weapon') return 'main_hand';
  if (/elmo|chap[eé]u|capacete|helm/.test(n)) return 'helmet';
  if (/perneira|cal[cç]a|greva|legs/.test(n)) return 'legs';
  if (/luva|manopla|glove/.test(n)) return 'gloves';
  if (/bota|sand[aá]lia|boot/.test(n)) return 'boots';
  return 'chest';
}

export function notifyEquipmentUpdated(characterId: string) {
  window.dispatchEvent(new CustomEvent(EQUIPMENT_UPDATED_EVENT, { detail: { characterId } }));
}
