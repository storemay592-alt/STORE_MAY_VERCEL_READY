CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL CHECK (char_length(trim(nombre)) BETWEEN 2 AND 140),
  categoria TEXT NOT NULL CHECK (categoria IN ('Hombre', 'Mujer', 'Niños', 'Accesorios')),
  imagen_url TEXT NOT NULL,
  precio_original NUMERIC(12, 2) NULL CHECK (precio_original IS NULL OR precio_original > 0),
  precio_venta NUMERIC(12, 2) NOT NULL CHECK (precio_venta > 0),
  tallas TEXT[] NOT NULL DEFAULT '{}',
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS productos_categoria_idx ON productos (categoria);
CREATE INDEX IF NOT EXISTS productos_fecha_creacion_idx ON productos (fecha_creacion DESC);
