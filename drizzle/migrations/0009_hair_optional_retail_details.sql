CREATE OR REPLACE FUNCTION public.validate_hair_inventory() RETURNS trigger LANGUAGE plpgsql AS $func$
DECLARE r public.hair_product_references;
BEGIN
  IF NEW.reference_id IS NULL THEN
    IF NEW.enabled THEN
      RAISE EXCEPTION 'Select a verified individual product reference';
    END IF;
    RETURN NEW;
  END IF;
  SELECT * INTO r FROM public.hair_product_references WHERE id = NEW.reference_id;
  IF r.kind <> 'product' OR NOT r.verified THEN
    RAISE EXCEPTION 'Only verified individual products can enter salon inventory';
  END IF;
  IF NEW.purchase_url !~ '^https://' THEN
    RAISE EXCEPTION 'Provide a secure purchase link';
  END IF;
  NEW.name := r.name;
  NEW.brand := r.brand;
  NEW.function := r.category;
  NEW.description := r.description;
  NEW.verified := true;
  RETURN NEW;
END
$func$;

DROP POLICY IF EXISTS catalog_public ON public.hair_salon_products;
CREATE POLICY catalog_public ON public.hair_salon_products
FOR SELECT
USING (
  verified AND active AND enabled AND available
  AND purchase_url ~ '^https://'
  AND EXISTS (
    SELECT 1 FROM public.hair_product_references r
    WHERE r.id = hair_salon_products.reference_id AND r.verified AND r.kind = 'product'
  )
  AND EXISTS (
    SELECT 1 FROM public.hair_salons s
    WHERE s.id = hair_salon_products.salon_id AND s.active
  )
);