
-- =============================================
-- MIGRAÇÃO PARTE 2: TABELAS, FUNÇÕES E RLS
-- =============================================

-- 1. Criar enums para tipos de transação e status
CREATE TYPE public.wallet_transaction_type AS ENUM ('credit', 'debit');
CREATE TYPE public.withdrawal_status AS ENUM ('pending', 'approved', 'rejected');

-- =============================================
-- 2. TABELAS
-- =============================================

-- 2.1 Tabela wallet_transactions (Ledger de Movimentações)
CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type wallet_transaction_type NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  source_type text NOT NULL,
  source_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);
CREATE INDEX idx_wallet_transactions_source ON public.wallet_transactions(source_type, source_id);

-- 2.2 Tabela withdrawal_requests (Solicitações de Saque)
CREATE TABLE public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  gross_amount numeric(12,2) NOT NULL CHECK (gross_amount >= 100),
  fee_amount numeric(12,2) NOT NULL CHECK (fee_amount >= 0),
  net_amount numeric(12,2) NOT NULL CHECK (net_amount > 0),
  pix_key text NOT NULL,
  status withdrawal_status NOT NULL DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  rejection_reason text,
  transaction_id uuid
);

CREATE INDEX idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON public.withdrawal_requests(status);
CREATE INDEX idx_withdrawal_requests_requested_at ON public.withdrawal_requests(requested_at DESC);

-- 2.3 Tabela withdrawal_audits (Log Imutável de Auditoria)
CREATE TABLE public.withdrawal_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_id uuid NOT NULL REFERENCES public.withdrawal_requests(id) ON DELETE CASCADE,
  action text NOT NULL,
  performed_by uuid NOT NULL,
  performed_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_withdrawal_audits_withdrawal_id ON public.withdrawal_audits(withdrawal_id);
CREATE INDEX idx_withdrawal_audits_performed_by ON public.withdrawal_audits(performed_by);
CREATE INDEX idx_withdrawal_audits_performed_at ON public.withdrawal_audits(performed_at DESC);

-- 2.4 Tabela commission_sources (Origem das Comissões)
CREATE TABLE public.commission_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES public.wallet_transactions(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  product_sku text,
  sale_amount numeric(12,2) NOT NULL,
  commission_rate numeric(5,4) NOT NULL,
  referral_user_id uuid,
  level smallint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_commission_sources_transaction_id ON public.commission_sources(transaction_id);
CREATE INDEX idx_commission_sources_referral ON public.commission_sources(referral_user_id);

-- =============================================
-- 3. FUNÇÕES DE SEGURANÇA
-- =============================================

-- 3.1 Função para verificar se usuário é financeiro
CREATE OR REPLACE FUNCTION public.is_financeiro()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'financeiro'::app_role)
$$;

-- 3.2 Função para calcular saldo do usuário
CREATE OR REPLACE FUNCTION public.get_user_balance(p_user_id uuid)
RETURNS numeric(12,2)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    SUM(
      CASE 
        WHEN type = 'credit' THEN amount 
        WHEN type = 'debit' THEN -amount 
      END
    ), 
    0
  )::numeric(12,2)
  FROM public.wallet_transactions
  WHERE user_id = p_user_id
$$;

-- 3.3 Função para obter resumo financeiro do usuário
CREATE OR REPLACE FUNCTION public.get_user_financial_summary(p_user_id uuid)
RETURNS TABLE(
  total_credits numeric(12,2),
  total_debits numeric(12,2),
  current_balance numeric(12,2),
  pending_withdrawals numeric(12,2)
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(SUM(CASE WHEN type = 'credit' THEN amount END), 0)::numeric(12,2) as total_credits,
    COALESCE(SUM(CASE WHEN type = 'debit' THEN amount END), 0)::numeric(12,2) as total_debits,
    COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END), 0)::numeric(12,2) as current_balance,
    COALESCE((
      SELECT SUM(gross_amount) 
      FROM public.withdrawal_requests 
      WHERE user_id = p_user_id AND status = 'pending'
    ), 0)::numeric(12,2) as pending_withdrawals
  FROM public.wallet_transactions
  WHERE user_id = p_user_id
$$;

-- =============================================
-- 4. POLÍTICAS RLS
-- =============================================

-- 4.1 RLS para wallet_transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wallet_transactions_select" ON public.wallet_transactions
FOR SELECT USING (
  auth.uid() = user_id 
  OR public.is_financeiro()
);

CREATE POLICY "wallet_transactions_insert" ON public.wallet_transactions
FOR INSERT WITH CHECK (false);

CREATE POLICY "wallet_transactions_update" ON public.wallet_transactions
FOR UPDATE USING (false) WITH CHECK (false);

CREATE POLICY "wallet_transactions_delete" ON public.wallet_transactions
FOR DELETE USING (false);

-- 4.2 RLS para withdrawal_requests
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "withdrawal_requests_select" ON public.withdrawal_requests
FOR SELECT USING (
  auth.uid() = user_id 
  OR public.is_financeiro()
);

CREATE POLICY "withdrawal_requests_insert" ON public.withdrawal_requests
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
  AND reviewed_at IS NULL
  AND reviewed_by IS NULL
);

CREATE POLICY "withdrawal_requests_update" ON public.withdrawal_requests
FOR UPDATE USING (public.is_financeiro());

CREATE POLICY "withdrawal_requests_delete" ON public.withdrawal_requests
FOR DELETE USING (false);

-- 4.3 RLS para withdrawal_audits
ALTER TABLE public.withdrawal_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "withdrawal_audits_select" ON public.withdrawal_audits
FOR SELECT USING (public.is_financeiro());

CREATE POLICY "withdrawal_audits_insert" ON public.withdrawal_audits
FOR INSERT WITH CHECK (false);

CREATE POLICY "withdrawal_audits_update" ON public.withdrawal_audits
FOR UPDATE USING (false) WITH CHECK (false);

CREATE POLICY "withdrawal_audits_delete" ON public.withdrawal_audits
FOR DELETE USING (false);

-- 4.4 RLS para commission_sources
ALTER TABLE public.commission_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commission_sources_select" ON public.commission_sources
FOR SELECT USING (
  public.is_financeiro()
  OR EXISTS (
    SELECT 1 FROM public.wallet_transactions wt 
    WHERE wt.id = commission_sources.transaction_id 
    AND wt.user_id = auth.uid()
  )
);

CREATE POLICY "commission_sources_insert" ON public.commission_sources
FOR INSERT WITH CHECK (false);

CREATE POLICY "commission_sources_update" ON public.commission_sources
FOR UPDATE USING (false) WITH CHECK (false);

CREATE POLICY "commission_sources_delete" ON public.commission_sources
FOR DELETE USING (false);

-- =============================================
-- 5. RPCs DE OPERAÇÕES
-- =============================================

-- 5.1 RPC para criar solicitação de saque
CREATE OR REPLACE FUNCTION public.create_withdrawal_request(
  p_gross_amount numeric,
  p_pix_key text
)
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fee_rate constant numeric := 0.0499;
  v_fee_amount numeric(12,2);
  v_net_amount numeric(12,2);
  v_current_balance numeric(12,2);
  v_pending_amount numeric(12,2);
  v_available_balance numeric(12,2);
  v_withdrawal_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  IF p_gross_amount < 100 THEN
    RAISE EXCEPTION 'Valor mínimo de saque é R$ 100,00';
  END IF;

  v_fee_amount := ROUND(p_gross_amount * v_fee_rate, 2);
  v_net_amount := p_gross_amount - v_fee_amount;

  v_current_balance := public.get_user_balance(auth.uid());

  SELECT COALESCE(SUM(gross_amount), 0) INTO v_pending_amount
  FROM public.withdrawal_requests
  WHERE user_id = auth.uid() AND status = 'pending';

  v_available_balance := v_current_balance - v_pending_amount;

  IF v_available_balance < p_gross_amount THEN
    RAISE EXCEPTION 'Saldo insuficiente. Disponível: R$ %', v_available_balance;
  END IF;

  INSERT INTO public.withdrawal_requests (
    user_id, gross_amount, fee_amount, net_amount, pix_key, status
  ) VALUES (
    auth.uid(), p_gross_amount, v_fee_amount, v_net_amount, p_pix_key, 'pending'
  ) RETURNING id INTO v_withdrawal_id;

  RETURN v_withdrawal_id;
END;
$$;

-- 5.2 RPC para financeiro aprovar saque
CREATE OR REPLACE FUNCTION public.approve_withdrawal(
  p_withdrawal_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request record;
  v_transaction_id uuid;
  v_snapshot jsonb;
BEGIN
  IF NOT public.is_financeiro() THEN
    RAISE EXCEPTION 'Acesso negado: apenas financeiro pode aprovar saques';
  END IF;

  SELECT * INTO v_request
  FROM public.withdrawal_requests
  WHERE id = p_withdrawal_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação não encontrada ou já processada';
  END IF;

  SELECT jsonb_build_object(
    'user_id', v_request.user_id,
    'balance_at_approval', public.get_user_balance(v_request.user_id),
    'financial_summary', (SELECT row_to_json(s) FROM public.get_user_financial_summary(v_request.user_id) s),
    'approved_at', now()
  ) INTO v_snapshot;

  INSERT INTO public.wallet_transactions (
    user_id, type, amount, description, source_type, source_id, metadata
  ) VALUES (
    v_request.user_id, 
    'debit', 
    v_request.gross_amount,
    'Saque aprovado - PIX: ' || v_request.pix_key,
    'withdrawal',
    p_withdrawal_id,
    jsonb_build_object(
      'gross_amount', v_request.gross_amount,
      'fee_amount', v_request.fee_amount,
      'net_amount', v_request.net_amount,
      'pix_key', v_request.pix_key
    )
  ) RETURNING id INTO v_transaction_id;

  UPDATE public.withdrawal_requests
  SET 
    status = 'approved',
    reviewed_at = now(),
    reviewed_by = auth.uid(),
    transaction_id = v_transaction_id
  WHERE id = p_withdrawal_id;

  INSERT INTO public.withdrawal_audits (
    withdrawal_id, action, performed_by, notes, snapshot
  ) VALUES (
    p_withdrawal_id, 'approved', auth.uid(), p_notes, v_snapshot
  );

  RETURN true;
END;
$$;

-- 5.3 RPC para financeiro recusar saque
CREATE OR REPLACE FUNCTION public.reject_withdrawal(
  p_withdrawal_id uuid,
  p_reason text
)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request record;
  v_snapshot jsonb;
BEGIN
  IF NOT public.is_financeiro() THEN
    RAISE EXCEPTION 'Acesso negado: apenas financeiro pode recusar saques';
  END IF;

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'Motivo da recusa é obrigatório';
  END IF;

  SELECT * INTO v_request
  FROM public.withdrawal_requests
  WHERE id = p_withdrawal_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação não encontrada ou já processada';
  END IF;

  SELECT jsonb_build_object(
    'user_id', v_request.user_id,
    'balance_at_rejection', public.get_user_balance(v_request.user_id),
    'financial_summary', (SELECT row_to_json(s) FROM public.get_user_financial_summary(v_request.user_id) s),
    'rejected_at', now(),
    'reason', p_reason
  ) INTO v_snapshot;

  UPDATE public.withdrawal_requests
  SET 
    status = 'rejected',
    reviewed_at = now(),
    reviewed_by = auth.uid(),
    rejection_reason = p_reason
  WHERE id = p_withdrawal_id;

  INSERT INTO public.withdrawal_audits (
    withdrawal_id, action, performed_by, notes, snapshot
  ) VALUES (
    p_withdrawal_id, 'rejected', auth.uid(), p_reason, v_snapshot
  );

  RETURN true;
END;
$$;

-- 5.4 RPC para financeiro listar fila de auditoria
CREATE OR REPLACE FUNCTION public.list_pending_withdrawals(
  p_limit int DEFAULT 50
)
RETURNS TABLE(
  withdrawal_id uuid,
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  gross_amount numeric(12,2),
  fee_amount numeric(12,2),
  net_amount numeric(12,2),
  pix_key text,
  requested_at timestamptz,
  current_balance numeric(12,2)
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_financeiro() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN QUERY
  SELECT 
    wr.id as withdrawal_id,
    wr.user_id,
    p.display_name,
    p.username,
    p.avatar_url,
    wr.gross_amount,
    wr.fee_amount,
    wr.net_amount,
    wr.pix_key,
    wr.requested_at,
    public.get_user_balance(wr.user_id) as current_balance
  FROM public.withdrawal_requests wr
  JOIN public.profiles p ON p.user_id = wr.user_id
  WHERE wr.status = 'pending'
  ORDER BY wr.requested_at ASC
  LIMIT p_limit;
END;
$$;

-- 5.5 RPC para financeiro obter detalhes completos de auditoria
CREATE OR REPLACE FUNCTION public.get_withdrawal_audit_details(
  p_withdrawal_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_request record;
BEGIN
  IF NOT public.is_financeiro() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT * INTO v_request
  FROM public.withdrawal_requests
  WHERE id = p_withdrawal_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação não encontrada';
  END IF;

  INSERT INTO public.withdrawal_audits (
    withdrawal_id, action, performed_by, notes, snapshot
  ) VALUES (
    p_withdrawal_id, 
    'viewed', 
    auth.uid(), 
    NULL,
    jsonb_build_object('viewed_at', now())
  );

  SELECT jsonb_build_object(
    'withdrawal', jsonb_build_object(
      'id', v_request.id,
      'gross_amount', v_request.gross_amount,
      'fee_amount', v_request.fee_amount,
      'net_amount', v_request.net_amount,
      'pix_key', v_request.pix_key,
      'status', v_request.status,
      'requested_at', v_request.requested_at,
      'reviewed_at', v_request.reviewed_at,
      'rejection_reason', v_request.rejection_reason
    ),
    'member', (
      SELECT jsonb_build_object(
        'user_id', p.user_id,
        'display_name', p.display_name,
        'username', p.username,
        'avatar_url', p.avatar_url,
        'pix_key', p.pix_key,
        'created_at', p.created_at
      )
      FROM public.profiles p
      WHERE p.user_id = v_request.user_id
    ),
    'financial_summary', (
      SELECT row_to_json(s)
      FROM public.get_user_financial_summary(v_request.user_id) s
    ),
    'transactions', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', t.id,
          'type', t.type,
          'amount', t.amount,
          'description', t.description,
          'source_type', t.source_type,
          'created_at', t.created_at,
          'metadata', t.metadata
        ) ORDER BY t.created_at DESC
      )
      FROM public.wallet_transactions t
      WHERE t.user_id = v_request.user_id
    ),
    'commission_details', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', cs.id,
          'product_name', cs.product_name,
          'product_sku', cs.product_sku,
          'sale_amount', cs.sale_amount,
          'commission_rate', cs.commission_rate,
          'level', cs.level,
          'created_at', cs.created_at
        ) ORDER BY cs.created_at DESC
      )
      FROM public.commission_sources cs
      JOIN public.wallet_transactions wt ON wt.id = cs.transaction_id
      WHERE wt.user_id = v_request.user_id
    ),
    'audit_history', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', a.id,
          'action', a.action,
          'performed_at', a.performed_at,
          'notes', a.notes
        ) ORDER BY a.performed_at DESC
      )
      FROM public.withdrawal_audits a
      WHERE a.withdrawal_id = p_withdrawal_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 5.6 RPC para membro obter seu saldo e histórico
CREATE OR REPLACE FUNCTION public.get_my_wallet()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  RETURN jsonb_build_object(
    'balance', public.get_user_balance(v_user_id),
    'summary', (SELECT row_to_json(s) FROM public.get_user_financial_summary(v_user_id) s),
    'transactions', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', t.id,
          'type', t.type,
          'amount', t.amount,
          'description', t.description,
          'source_type', t.source_type,
          'created_at', t.created_at
        ) ORDER BY t.created_at DESC
      ), '[]'::jsonb)
      FROM public.wallet_transactions t
      WHERE t.user_id = v_user_id
      LIMIT 100
    ),
    'pending_withdrawals', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', wr.id,
          'gross_amount', wr.gross_amount,
          'fee_amount', wr.fee_amount,
          'net_amount', wr.net_amount,
          'status', wr.status,
          'requested_at', wr.requested_at,
          'rejection_reason', wr.rejection_reason
        ) ORDER BY wr.requested_at DESC
      ), '[]'::jsonb)
      FROM public.withdrawal_requests wr
      WHERE wr.user_id = v_user_id
      LIMIT 50
    )
  );
END;
$$;
