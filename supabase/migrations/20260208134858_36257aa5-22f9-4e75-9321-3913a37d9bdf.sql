
-- Adicionar read_at para rastreamento de visualizacao
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- Remover policy antiga que bloqueia updates (se existir)
DROP POLICY IF EXISTS "No update messages" ON public.support_messages;

-- Permitir suporte atualizar read_at em mensagens do usuario
CREATE POLICY "Suporte can mark messages read"
  ON public.support_messages FOR UPDATE
  USING (
    has_role(auth.uid(), 'suporte'::app_role) AND
    sender_type = 'user'
  );
