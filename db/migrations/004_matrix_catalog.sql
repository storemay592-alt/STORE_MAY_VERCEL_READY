ALTER TABLE products
  ADD COLUMN IF NOT EXISTS article TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS model TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS brand_price NUMERIC(12, 2);

UPDATE products
SET article = type
WHERE article = '';

UPDATE products
SET model = name
WHERE model = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_brand_price_nonnegative'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_brand_price_nonnegative
      CHECK (brand_price IS NULL OR brand_price >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS products_article_model_brand_idx
  ON products (LOWER(article), LOWER(model), LOWER(brand));
