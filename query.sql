--buat totalsum purchases
CREATE OR REPLACE FUNCTION update_purchase_total_sum()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    UPDATE purchases
    SET totalsum = totalsum - OLD.totalprice
    WHERE invoice = OLD.invoice;
    RETURN OLD;
  ELSE
    UPDATE purchases
    SET totalsum = totalsum + NEW.totalprice
    WHERE invoice = NEW.invoice;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_purchase_total_sum_trigger
AFTER INSERT OR DELETE ON purchaseitems
FOR EACH ROW
EXECUTE FUNCTION update_purchase_total_sum();

--

--buat default invoice dan reset invoice seq ketika berganti hari
CREATE OR REPLACE FUNCTION restart_invoice_sequence()
RETURNS TRIGGER AS $$
DECLARE
  invoice_suffix text;
  prev_invoice text;
BEGIN
  SELECT invoice INTO prev_invoice FROM purchases ORDER BY invoice DESC LIMIT 1 OFFSET 0;
  IF (prev_invoice IS NULL OR to_char(now(), 'YYYYMMDD') != substring(prev_invoice, 5, 8)) THEN
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
AFTER INSERT OR DELETE ON purchaseitems
FOR EACH ROW
EXECUTE FUNCTION update_goods_stock();

--

-- format number jadi +62
CREATE OR REPLACE FUNCTION format_phone_number_customers()
RETURNS TRIGGER AS $$
DECLARE
formatted_phone_number_customers text;
BEGIN
IF (NEW.phone IS NULL OR NEW.phone = '') THEN
NEW.phone := '+62';
ELSIF (substring(NEW.phone, 1, 1) != '+') THEN
formatted_phone_number_customers := '+62' || substring(NEW.phone, 2);
NEW.phone := formatted_phone_number_customers;
ELSE
NEW.phone := NEW.phone;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER format_phone_number_customers_trigger
BEFORE INSERT OR UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION format_phone_number_customers();

--

CREATE OR REPLACE FUNCTION format_phone_number_suppliers()
RETURNS TRIGGER AS $$
DECLARE
formatted_phone_number_suppliers text;
BEGIN
IF (NEW.phone IS NULL OR NEW.phone = '') THEN
NEW.phone := '+62';
ELSIF (substring(NEW.phone, 1, 1) != '+') THEN
formatted_phone_number_suppliers := '+62' || substring(NEW.phone, 2);
NEW.phone := formatted_phone_number_suppliers;
ELSE
NEW.phone := NEW.phone;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER format_phone_number_suppliers_trigger
BEFORE INSERT OR UPDATE ON suppliers
FOR EACH ROW
EXECUTE FUNCTION format_phone_number_suppliers();

--buat default invoice penjualan dan restart ketika berganti hari
CREATE OR REPLACE FUNCTION restart_invoice_penj_sequence()
RETURNS TRIGGER AS $$
DECLARE
invoice_suffix text;
prev_invoice text;
BEGIN
SELECT invoice INTO prev_invoice FROM sales ORDER BY invoice DESC LIMIT 1 OFFSET 0;
IF (prev_invoice IS NULL OR to_char(now(), 'YYYYMMDD') != substring(prev_invoice, 9, 8)) THEN
ALTER SEQUENCE no_urut_penj RESTART WITH 1;
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
AFTER INSERT OR DELETE ON saleitems
FOR EACH ROW
EXECUTE FUNCTION update_goods_stock_penj();

--

--buat totalsum sales
CREATE OR REPLACE FUNCTION update_sales_total_sum()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    UPDATE sales
    SET totalsum = totalsum - OLD.totalprice
    WHERE invoice = OLD.invoice;
    RETURN OLD;
  ELSE
    UPDATE sales
    SET totalsum = totalsum + NEW.totalprice
    WHERE invoice = NEW.invoice;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sales_total_sum_trigger
AFTER INSERT OR DELETE ON saleitems
FOR EACH ROW
EXECUTE FUNCTION update_sales_total_sum();


--buat update change setiap ada perubahan data di saleitems
CREATE OR REPLACE FUNCTION update_sales_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE sales
    SET change = pay - (SELECT SUM(totalprice) FROM saleitems WHERE invoice = NEW.invoice)
    WHERE invoice = NEW.invoice;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE sales
    SET change = pay - (SELECT SUM(totalprice) FROM saleitems WHERE invoice = OLD.invoice)
    WHERE invoice = OLD.invoice;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sales_change_trigger
AFTER INSERT OR DELETE ON saleitems
FOR EACH ROW
EXECUTE FUNCTION update_sales_change();

--update stock table goods kalau salah satu sales dihapus
CREATE OR REPLACE FUNCTION return_goods_data_for_sales() 
RETURNS TRIGGER 
AS $$
DECLARE
    invoice_exists BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 
                   FROM saleitems 
                   WHERE invoice = OLD.invoice) 
    INTO invoice_exists;
    
    IF invoice_exists THEN
        UPDATE goods
        SET stock = stock + saleitems.quantity
        FROM saleitems
        WHERE goods.barcode = saleitems.itemcode 
        AND saleitems.invoice = OLD.invoice;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER return_goods_data_for_sales_trigger 
AFTER DELETE ON sales
FOR EACH ROW 
WHEN (TRUE)
EXECUTE FUNCTION return_goods_data_for_sales();