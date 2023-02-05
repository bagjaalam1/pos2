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