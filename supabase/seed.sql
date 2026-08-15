-- Trade-Sphere — demo catalog seed (run after schema.sql).
-- Idempotent: safe to run more than once.

insert into public.sellers (uid, name, location) values
  ('seller-soundwave','SoundWave Audio','Bengaluru'),
  ('seller-peripia','Peripia Tech','Pune'),
  ('seller-wearably','Wearably','Mumbai'),
  ('seller-homeglow','HomeGlow','New Delhi'),
  ('seller-playzone','PlayZone','Hyderabad')
on conflict (uid) do nothing;

insert into public.products (id, seller_uid, title, price_cents, sale_price_cents, stock, category, image_url, status) values
  ('aud-1','seller-soundwave','Wireless Over-Ear Headphones',249900,null,8,'audio','https://picsum.photos/seed/aud-1/800/800','active'),
  ('aud-2','seller-soundwave','Noise-Cancelling Earbuds',799900,599900,24,'audio','https://picsum.photos/seed/aud-2/800/800','active'),
  ('aud-3','seller-soundwave','Bluetooth Party Speaker',349900,null,5,'audio','https://picsum.photos/seed/aud-3/800/800','active'),
  ('aud-4','seller-soundwave','Studio Monitor Headphones',1299900,null,3,'audio','https://picsum.photos/seed/aud-4/800/800','active'),
  ('per-1','seller-peripia','Mechanical Keyboard',499900,null,0,'peripherals','https://picsum.photos/seed/per-1/800/800','active'),
  ('per-2','seller-peripia','4K Webcam',349900,null,3,'peripherals','https://picsum.photos/seed/per-2/800/800','active'),
  ('per-3','seller-peripia','Ergonomic Wireless Mouse',149900,119900,40,'peripherals','https://picsum.photos/seed/per-3/800/800','active'),
  ('per-4','seller-peripia','USB-C 7-in-1 Hub',249900,null,15,'peripherals','https://picsum.photos/seed/per-4/800/800','active'),
  ('wea-1','seller-wearably','Fitness Smartwatch',349900,279900,30,'wearables','https://picsum.photos/seed/wea-1/800/800','active'),
  ('wea-2','seller-wearably','Smart Fitness Band',199900,null,50,'wearables','https://picsum.photos/seed/wea-2/800/800','active'),
  ('wea-3','seller-wearably','GPS Running Watch',899900,null,7,'wearables','https://picsum.photos/seed/wea-3/800/800','active'),
  ('hom-1','seller-homeglow','LED Desk Lamp',129900,null,20,'home','https://picsum.photos/seed/hom-1/800/800','active'),
  ('hom-2','seller-homeglow','Smart Wi-Fi Plug',79900,null,60,'home','https://picsum.photos/seed/hom-2/800/800','active'),
  ('hom-3','seller-homeglow','Aroma Diffuser',99900,null,12,'home','https://picsum.photos/seed/hom-3/800/800','active'),
  ('hom-4','seller-homeglow','Robot Vacuum Cleaner',1899900,null,4,'home','https://picsum.photos/seed/hom-4/800/800','draft'),
  ('gam-1','seller-playzone','Wireless Controller',449900,null,12,'gaming','https://picsum.photos/seed/gam-1/800/800','active'),
  ('gam-2','seller-playzone','RGB Gaming Mousepad',129900,null,25,'gaming','https://picsum.photos/seed/gam-2/800/800','active'),
  ('gam-3','seller-playzone','Gaming Headset',299900,249900,9,'gaming','https://picsum.photos/seed/gam-3/800/800','active'),
  ('gam-4','seller-playzone','Streaming Capture Card',799900,null,6,'gaming','https://picsum.photos/seed/gam-4/800/800','active')
on conflict (id) do nothing;
