CREATE SEQUENCE IF NOT EXISTS product_code_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE CHECK (char_length(trim(username)) BETWEEN 3 AND 120),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE DEFAULT (
    'PROD-' || LPAD(nextval('product_code_seq')::TEXT, 3, '0')
  ),
  name TEXT NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 160),
  description TEXT NOT NULL DEFAULT '',
  brand TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  gender TEXT NOT NULL DEFAULT '',
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  sizes_available TEXT NOT NULL DEFAULT 'Consultar',
  status TEXT NOT NULL DEFAULT 'disponible'
    CHECK (status IN ('disponible', 'agotado', 'bajo_confirmacion')),
  image_urls TEXT[] NOT NULL CHECK (cardinality(image_urls) >= 1),
  whatsapp_number TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  click_type TEXT NOT NULL CHECK (click_type IN ('whatsapp', 'view'))
);

CREATE OR REPLACE FUNCTION set_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_updated_at_trigger ON products;
CREATE TRIGGER products_updated_at_trigger
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_products_updated_at();

CREATE INDEX IF NOT EXISTS products_category_idx ON products (category);
CREATE INDEX IF NOT EXISTS products_type_idx ON products (type);
CREATE INDEX IF NOT EXISTS products_color_idx ON products (color);
CREATE INDEX IF NOT EXISTS products_status_idx ON products (status);
CREATE INDEX IF NOT EXISTS products_created_at_idx ON products (created_at DESC);
CREATE INDEX IF NOT EXISTS product_clicks_product_type_date_idx
  ON product_clicks (product_id, click_type, clicked_at DESC);
CREATE INDEX IF NOT EXISTS product_clicks_date_idx ON product_clicks (clicked_at DESC);

DO $$
BEGIN
  IF to_regclass('public.productos') IS NOT NULL THEN
    INSERT INTO products (
      name,
      description,
      brand,
      category,
      type,
      color,
      gender,
      price,
      sizes_available,
      status,
      image_urls,
      whatsapp_number,
      created_at,
      updated_at
    )
    SELECT
      p.nombre,
      '',
      'Store MAY',
      p.categoria,
      'Producto',
      'Consultar',
      CASE
        WHEN p.categoria = 'Mujer' THEN 'Mujer'
        WHEN p.categoria = 'Hombre' THEN 'Hombre'
        WHEN p.categoria = 'Niños' THEN 'Niños'
        ELSE 'Unisex'
      END,
      p.precio_venta,
      CASE WHEN cardinality(p.tallas) > 0 THEN array_to_string(p.tallas, ', ') ELSE 'Consultar' END,
      CASE WHEN p.stock = 0 THEN 'agotado' ELSE 'disponible' END,
      ARRAY[p.imagen_url],
      '',
      p.fecha_creacion,
      p.fecha_creacion
    FROM productos p
    WHERE NOT EXISTS (
      SELECT 1 FROM products np
      WHERE lower(trim(np.name)) = lower(trim(p.nombre))
    );
  END IF;
END $$;
