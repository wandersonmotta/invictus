-- Add pix_key column for storing user's PIX key (CPF) for withdrawals
ALTER TABLE profiles ADD COLUMN pix_key text;

COMMENT ON COLUMN profiles.pix_key IS 'Chave PIX (CPF) do usuário para receber saques';