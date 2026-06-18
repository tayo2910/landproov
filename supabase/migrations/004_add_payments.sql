ALTER TABLE user_services
ADD COLUMN amount INTEGER NOT NULL DEFAULT 0,
ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid',
ADD COLUMN payment_reference TEXT,
ADD COLUMN paid_at TIMESTAMPTZ,
ADD COLUMN access_code TEXT;

ALTER TABLE user_services
ADD CONSTRAINT check_payment_status CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed'));
