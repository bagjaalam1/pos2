--buat totalsum purchases
CREATE OR REPLACE FUNCTION update_purchase_total_sum()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE purchases
    SET totalsum = totalsum + NEW.totalprice
    WHERE invoice = NEW.invoice;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_purchase_total_sum_trigger
AFTER INSERT ON purchaseitems
FOR EACH ROW
EXECUTE FUNCTION update_purchase_total_sum();

--

--buat default invoice dan reset invoice seq ketika berganti hari
CREATE OR REPLACE FUNCTION restart_invoice_sequence()
RETURNS TRIGGER AS $$
DECLARE
invoice_suffix text;
BEGIN
IF (to_char(now(), 'YYYYMMDD') != substring(OLD.invoice, 5, 8)) THEN
ALTER SEQUENCE no_urut RESTART WITH 1;
END IF;
SELECT cast(nextval('no_urut') as text) INTO invoice_suffix;
NEW.invoice := 'INV-' || to_char(NOW(), 'YYYYMMDD') || '-' || invoice_suffix;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER restart_invoice_sequence_trigger
BEFORE INSERT ON purchases
FOR EACH ROW
EXECUTE FUNCTION restart_invoice_sequence();

--

--update stock table goods kalau beli
CREATE OR REPLACE FUNCTION update_goods_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE goods
    SET stock = stock + NEW.quantity
    WHERE barcode = NEW.itemcode;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE goods
    SET stock = stock - OLD.quantity
    WHERE barcode = OLD.itemcode;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_goods_stock_trigger
AFTER INSERT ON purchaseitems
FOR EACH ROW
EXECUTE FUNCTION update_goods_stock();

--

-- format number jadi +62
CREATE OR REPLACE FUNCTION format_phone_number()
RETURNS TRIGGER AS $$
DECLARE
formatted_phone_number text;
BEGIN
IF (NEW.phone IS NULL OR NEW.phone = '') THEN
NEW.phone := '+62';
ELSIF (substring(NEW.phone, 1, 1) != '+') THEN
formatted_phone_number := '+62' || substring(NEW.phone, 2);
NEW.phone := formatted_phone_number;
ELSE
NEW.phone := NEW.phone;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER format_phone_number_trigger
BEFORE INSERT ON customers
FOR EACH ROW
EXECUTE FUNCTION format_phone_number();

--

--buat default invoice penjualan dan restart ketika berganti hari
CREATE OR REPLACE FUNCTION restart_invoice_penj_sequence()
RETURNS TRIGGER AS $$
DECLARE
invoice_suffix text;
BEGINs
IF (to_char(now(), 'YYYYMMDD') != substring(OLD.invoice, 9, 8)) THEN
ALTER SEQUENCE no_urut RESTART WITH 1;
END IF;
SELECT cast(nextval('no_urut_penj') as text) INTO invoice_suffix;
NEW.invoice := 'INV-PENJ' || to_char(NOW(), 'YYYYMMDD') || '-' || invoice_suffix;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER restart_invoice_penj_sequence_trigger
BEFORE INSERT ON sales
FOR EACH ROW
EXECUTE FUNCTION restart_invoice_penj_sequence();

--update stock table goods kalau jual
CREATE OR REPLACE FUNCTION update_goods_stock_penj()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE goods
    SET stock = stock - NEW.quantity
    WHERE barcode = NEW.itemcode;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE goods
    SET stock = stock + OLD.quantity
    WHERE barcode = OLD.itemcode;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_goods_stock_penj_trigger
AFTER INSERT ON saleitems
FOR EACH ROW
EXECUTE FUNCTION update_goods_stock_penj();

--

--buat totalsum sales
CREATE OR REPLACE FUNCTION update_sales_total_sum()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE sales
    SET totalsum = totalsum + NEW.totalprice
    WHERE invoice = NEW.invoice;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sales_total_sum_trigger
AFTER INSERT ON saleitems
FOR EACH ROW
EXECUTE FUNCTION update_sales_total_sum();