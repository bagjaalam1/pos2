--buat default invoice
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  invoice_suffix text;
BEGIN
  SELECT cast(nextval('no_urut') as text) INTO invoice_suffix;
  NEW.invoice := 'INV-' || to_char(NOW(), 'YYYYMMDD') || '-' || invoice_suffix;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE no_urut START 1;

CREATE TRIGGER set_invoice_number_trigger
BEFORE INSERT ON purchases
FOR EACH ROW
EXECUTE FUNCTION set_invoice_number();

--

--buat totalsum
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

--reset invoice seq ketika berganti hari
CREATE OR REPLACE FUNCTION reset_invoice_number()
RETURNS TRIGGER AS $$
BEGIN 
  IF (date_part('day', NOW()) != date_part('day', OLD.invoice_date)) THEN
    ALTER SEQUENCE no_urut RESTART WITH 1;
  END IF;
  NEW.invoice := 'INV-' || to_char(NOW(), 'YYYYMMDD') || '-' || nextval('no_urut');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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