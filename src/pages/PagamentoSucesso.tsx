import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Stage = "verifying" | "uploading" | "done" | "error";

interface StoredFile {
  name: string;
  type: string;
  base64: string;
}

interface StoredNomeItem {
  person_name: string;
  document: string;
  whatsapp: string;
  fichaFile: StoredFile | null;
  identidadeFile: StoredFile | null;
}

function base64ToFile(stored: StoredFile): File {
  const byteString = atob(stored.base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new File([ab], stored.name, { type: stored.type });
}

export default function PagamentoSucesso() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = params.get("session_id");
  const [stage, setStage] = useState<Stage>("verifying");
  const [errorMsg, setErrorMsg] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || !sessionId) return;
    ran.current = true;

    (async () => {
      try {
        // 1. Verify payment and insert names
        const { data, error } = await supabase.functions.invoke("verify-limpa-nome-payment", {
          body: { session_id: sessionId },
        });

        if (error || !data?.success) {
          throw new Error(data?.error || error?.message || "Erro ao verificar pagamento");
        }

        const requestIds: string[] = data.request_ids;

        // 2. Upload documents from sessionStorage
        setStage("uploading");

        const raw = sessionStorage.getItem("limpa_nome_items");
        if (raw) {
          const items: StoredNomeItem[] = JSON.parse(raw);
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Não autenticado");

          for (let i = 0; i < items.length && i < requestIds.length; i++) {
            const item = items[i];
            const requestId = requestIds[i];

            for (const { stored, docType } of [
              { stored: item.fichaFile, docType: "ficha_associativa" },
              { stored: item.identidadeFile, docType: "identidade" },
            ]) {
              if (!stored) continue;
              const file = base64ToFile(stored);
              const path = `${user.id}/${requestId}/${docType}_${file.name}`;

              const { error: uploadErr } = await supabase.storage
                .from("limpa-nome-docs")
                .upload(path, file);
              if (uploadErr) {
                console.error("Upload error:", uploadErr);
                continue; // non-blocking
              }

              await supabase.from("limpa_nome_documents" as any).insert({
                request_id: requestId,
                doc_type: docType,
                storage_path: path,
                file_name: file.name,
              } as any);
            }
          }

          sessionStorage.removeItem("limpa_nome_items");
        }

        setStage("done");
        toast.success("Pagamento confirmado e nomes registrados!");
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || "Erro inesperado");
        setStage("error");
      }
    })();
  }, [sessionId]);

  if (!sessionId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <XCircle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-xl font-semibold mb-2">Sessão inválida</h1>
        <p className="text-muted-foreground mb-6">Nenhum ID de sessão encontrado.</p>
        <Button onClick={() => navigate("/servicos")}>Voltar para Serviços</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      {stage === "verifying" && (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h1 className="text-xl font-semibold">Verificando pagamento...</h1>
          <p className="text-muted-foreground mt-2">Aguarde enquanto confirmamos seu pagamento.</p>
        </>
      )}

      {stage === "uploading" && (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h1 className="text-xl font-semibold">Enviando documentos...</h1>
          <p className="text-muted-foreground mt-2">Estamos fazendo upload dos seus arquivos.</p>
        </>
      )}

      {stage === "done" && (
        <>
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
          <h1 className="text-xl font-semibold">Pagamento confirmado!</h1>
          <p className="text-muted-foreground mt-2 mb-6">
            Seus nomes foram registrados com sucesso.
          </p>
          <Button onClick={() => navigate("/servicos")}>Voltar para Serviços</Button>
        </>
      )}

      {stage === "error" && (
        <>
          <XCircle className="h-12 w-12 text-destructive mb-4" />
          <h1 className="text-xl font-semibold">Erro no pagamento</h1>
          <p className="text-muted-foreground mt-2 mb-6">{errorMsg}</p>
          <Button onClick={() => navigate("/servicos")}>Voltar para Serviços</Button>
        </>
      )}
    </div>
  );
}
