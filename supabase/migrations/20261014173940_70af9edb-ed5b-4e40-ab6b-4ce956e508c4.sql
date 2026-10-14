INSERT INTO public.items (name, description, type, equipment_slot, class_restriction, subtype, rarity, value, strength_bonus, agility_bonus, intelligence_bonus, vitality_bonus, luck_bonus, required_level, biome, durability, max_durability)
SELECT
  s.base || ' ' || t.suffix,
  s.base || ' da linha ' || t.suffix || ' — equipamento de nível ' || t.lvl,
  s.typ, s.slot, s.cls, s.sub, t.rarity,
  (t.lvl * 40 + 20) * s.vmul,
  ROUND(s.str * t.mul)::int, ROUND(s.agi * t.mul)::int, ROUND(s.int_ * t.mul)::int, ROUND(s.vit * t.mul)::int, ROUND(t.luck)::int,
  t.lvl, t.biome, 80 + t.lvl * 2, 80 + t.lvl * 2
FROM (VALUES
  ('Sertanejo',1,'common',1.0,0,'caatinga'),
  ('do Vaqueiro',8,'common',1.8,1,'caatinga'),
  ('do Cangaço',15,'uncommon',2.7,2,'agreste'),
  ('do Agreste',22,'uncommon',3.6,3,'agreste'),
  ('de Mandacaru',30,'rare',4.8,4,'caatinga'),
  ('das Marés',40,'rare',6.2,5,'litoral'),
  ('Colonial',50,'epic',7.8,7,'santa_cruz'),
  ('Encantado',62,'epic',9.6,9,'litoral'),
  ('das Lendas',75,'legendary',12.0,12,'santa_cruz'),
  ('Oxente Mítico',90,'legendary',15.0,16,'agreste')
) AS t(suffix,lvl,rarity,mul,luck,biome)
CROSS JOIN (VALUES
  ('Elmo','armor','helmet',NULL,'elmo',0,0,1,3,1),
  ('Peitoral','armor','chest',NULL,'armadura_peito',1,0,0,5,2),
  ('Calças','armor','legs',NULL,'calcas',0,1,0,3,1),
  ('Luvas','armor','gloves',NULL,'luvas',1,1,0,1,1),
  ('Botas','armor','boots',NULL,'botas',0,2,0,1,1),
  ('Escudo','armor','off_hand',NULL,'escudo_aco',0,0,0,5,2),
  ('Espada','weapon','main_hand','warrior','espada_longa',5,0,0,1,3),
  ('Cajado','weapon','main_hand','mage','cajado_arcano',0,0,5,1,3),
  ('Arco','weapon','main_hand','archer','arco_longo',1,5,0,0,3),
  ('Tomo','weapon','main_hand','healer','tomo_da_luz',0,0,4,2,3),
  ('Adaga','weapon','main_hand','assassin','katar',2,4,0,0,3)
) AS s(base,typ,slot,cls,sub,str,agi,int_,vit,vmul);