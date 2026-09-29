CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL, name text NOT NULL,
  category text NOT NULL CHECK (category IN ('cleanser','micellar','calming','redness_moisturizer','moisturizer','rescue','sunscreen','antioxidant','anti_aging')),
  purpose text NOT NULL DEFAULT '',
  concerns text[] NOT NULL DEFAULT '{}',
  price_tier smallint NOT NULL CHECK (price_tier BETWEEN 1 AND 3),
  approx_price numeric,
  key_ingredients text[] NOT NULL DEFAULT '{}',
  fragrance_free boolean,
  best_for text NOT NULL DEFAULT '',
  why text NOT NULL DEFAULT '',
  image_url text, normal_url text, affiliate_url text,
  sponsored boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  rank smallint NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active products are public" ON public.products FOR SELECT TO anon, authenticated USING (active);

ALTER TABLE public.experiment_events DROP CONSTRAINT IF EXISTS experiment_events_experience_type_check;
ALTER TABLE public.experiment_events ADD CONSTRAINT experiment_events_experience_type_check CHECK (experience_type IN ('redness','botox_information','skin_journey','onboarding','routine'));
ALTER TABLE public.email_leads DROP CONSTRAINT IF EXISTS email_leads_experience_type_check;
ALTER TABLE public.email_leads ADD CONSTRAINT email_leads_experience_type_check CHECK (experience_type IN ('redness','botox_information','routine'));

INSERT INTO public.products (brand,name,category,purpose,concerns,price_tier,approx_price,key_ingredients,fragrance_free,best_for,rank) VALUES
('Vanicream','Gentle Facial Cleanser','cleanser','Cleanses without stripping','{sensitive,redness,dryness}',1,10,'{}',true,'Very sensitive, reactive skin',10),
('Bioderma','Sensibio Gel Moussant','cleanser','Gentle, soothing cleanse','{sensitive,redness}',2,18,'{}',true,'Sensitive, redness-prone skin',20),
('SVR','Topialyse Gel Lavant','cleanser','Cleansing gel for dry skin','{dryness,sensitive}',2,17,'{}',true,'Sensitive, dry skin',30),
('Bioderma','Sensibio H2O','micellar','Optional — useful for makeup or sunscreen removal','{sensitive,redness}',2,16,'{}',true,'Removing makeup or SPF gently',10),
('Garnier','Micellar Water Sensitive','micellar','Optional — useful for makeup or sunscreen removal','{sensitive}',1,9,'{}',true,'Budget makeup removal',20),
('Prequel','Redness Reform','calming','Helps reduce the appearance of redness','{redness,sensitive}',2,20,'{}',true,'Redness-prone skin wanting a calming step',10),
('Aveeno','Calm + Restore Triple Oat Serum','calming','Supports calmer-looking skin','{redness,sensitive,dryness}',1,20,'{oat}',true,'Sensitive skin on a budget',20),
('SkinCeuticals','Phyto Corrective','calming','Supports calmer-looking skin','{redness,sensitive}',3,70,'{}',false,'Premium calming step',30),
('M.A.D. Skincare','Redness Rescue','calming','Helps reduce the appearance of redness','{redness}',3,50,'{}',true,'Redness-focused premium serum',40),
('Cetaphil','Redness Relieving Daily Moisturizer','redness_moisturizer','Moisturizes and helps reduce the look of redness','{redness,sensitive}',1,16,'{}',true,'Affordable redness moisturizer',10),
('Uriage','Roséliane Anti-Redness Cream','redness_moisturizer','Designed for redness-prone skin','{redness,sensitive}',2,28,'{}',true,'Redness-prone skin',20),
('Bioderma','Sensibio AR','redness_moisturizer','Designed for redness-prone skin','{redness,sensitive}',2,25,'{}',true,'Visible redness + sensitivity',30),
('Noreva','Sensidiane AR','redness_moisturizer','Designed for redness-prone skin','{redness}',2,24,'{}',true,'Redness-prone skin',40),
('SVR','Sensifine AR','redness_moisturizer','Designed for redness-prone skin','{redness}',2,26,'{}',true,'Redness-prone skin',50),
('SkinCeuticals','Redness Neutralizer','redness_moisturizer','Helps reduce the appearance of redness','{redness}',3,70,'{}',true,'Premium redness care',60),
('Vanicream','Daily Facial Moisturizer','moisturizer','Lightweight, simple hydration','{sensitive,light,barrier}',1,14,'{ceramides,squalane,hyaluronic acid}',true,'Slightly dry, sensitive skin',10),
('CeraVe','Moisturizing Cream','moisturizer','Supports the skin barrier','{dryness,barrier,rich}',1,17,'{ceramides,hyaluronic acid}',true,'Dry, tight skin on a budget',20),
('Prequel','AM/PM Moisturizer','moisturizer','Everyday hydration','{sensitive,light,barrier}',2,18,'{glycerin}',true,'Everyday light moisture',30),
('Prequel','Barrier Therapy','moisturizer','Supports the skin barrier','{dryness,sensitive,redness,barrier,rich}',2,18,'{ceramides,glycerin}',true,'Dry + sensitive + redness-prone skin',5),
('Avène','Tolérance Control Soothing Cream','moisturizer','Designed for highly sensitive skin','{sensitive,redness,barrier}',3,38,'{}',true,'Very reactive skin',40),
('SkinCeuticals','Triple Lipid Restore 2:4:2','moisturizer','Rich barrier support','{dryness,lines,barrier,rich}',3,140,'{ceramides,cholesterol}',true,'Dry, mature skin',50),
('Avène','Cicalfate+ Restorative Protective Cream','rescue','Protective cream for very dry areas','{dryness,barrier}',2,30,'{}',true,'Very dry, flaky patches',10),
('La Roche-Posay','Anthelios Mineral SPF 50','sunscreen','Broad-spectrum daily protection','{sensitive,redness}',2,36,'{zinc oxide,titanium dioxide}',true,'Sensitive, redness-prone skin',10),
('EltaMD','UV Clear SPF 46','sunscreen','Broad-spectrum daily protection','{redness,sensitive}',3,43,'{zinc oxide,niacinamide}',true,'Redness-prone skin',20),
('Vanicream','Facial Moisturizer SPF 30','sunscreen','Broad-spectrum daily protection','{sensitive}',1,15,'{zinc oxide}',true,'Budget sensitive SPF',30),
('SkinCeuticals','C E Ferulic','antioxidant','Antioxidant support','{lines}',3,180,'{vitamin C,vitamin E,ferulic acid}',false,'Tolerant skin, anti-aging',10),
('The Ordinary','Granactive Retinoid 2% Emulsion','anti_aging','Gentle retinoid; helps fine lines appear less noticeable','{lines}',1,12,'{retinoid}',true,'Tolerant skin, stable',10);
UPDATE public.products SET normal_url = 'https://www.google.com/search?tbm=shop&q=' || replace(brand || ' ' || name, ' ', '+');