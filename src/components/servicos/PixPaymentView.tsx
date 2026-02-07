import { useState, useEffect, useRef } from "react";
import { Copy, CheckCircle2, Loader2, XCircle, QrCode, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface PixPaymentData {
  payment_intent_id: string;
  pix_qr_code_url: string;
  pix_code: string;
  expires_at: number;
}

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

type Stage = "waiting" | "confirmed" | "uploading" | "done" | "expired" | "error";

interface PixPaymentViewProps {
  paymentData: PixPaymentData;
  totalAmount: number;
  onBack: () => void;
  onComplete: () => void;
}

export function PixPaymentView({ paymentData, totalAmount, onBack, onComplete }: PixPaymentViewProps) {
  const [stage, setStage] = useState<Stage>("waiting");
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const verifiedRef = useRef(false);

  // Countdown
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const diff = paymentData.expires_at - Math.floor(Date.now() / 1000);
    return Math.max(0, diff);
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (secondsLeft === 0 && stage === "waiting") {
      setStage("expired");
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [secondsLeft, stage]);

  // Polling
  useEffect(() => {
    if (stage !== "waiting") return;

    const poll = async () => {
      if (verifiedRef.current) return;
      try {
        const { data, error } = await supabase.functions.invoke("verify-limpa-nome-payment", {
          body: { payment_intent_id: paymentData.payment_intent_id },
        });

        if (error) return; // Keep polling on transient errors

        if (data?.success) {
          verifiedRef.current = true;
          if (intervalRef.current) clearInterval(intervalRef.current);
          setStage("confirmed");
          await handlePostPayment(data.request_ids);
        }
      } catch {
        // Ignore, keep polling
      }
    };

    intervalRef.current = setInterval(poll, 4000);
    // Also poll immediately
    poll();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [stage]);

  const handlePostPayment = async (requestIds: string[]) => {
    try {
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
              continue;
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
      setErrorMsg(err.message || "Erro ao enviar documentos");
      setStage("error");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(paymentData.pix_code);
      setCopied(true);
      toast.success("Código Pix copiado!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  // Success / Done
  if (stage === "done") {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Pagamento confirmado!</h2>
        <p className="text-muted-foreground mb-6">Seus nomes foram registrados com sucesso.</p>
        <Button onClick={onComplete}>Voltar para Serviços</Button>
      </div>
    );
  }

  // Uploading
  if (stage === "uploading" || stage === "confirmed") {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-semibold text-foreground">
          {stage === "confirmed" ? "Pagamento confirmado!" : "Enviando documentos..."}
        </h2>
        <p className="text-muted-foreground mt-2">Aguarde enquanto processamos.</p>
      </div>
    );
  }

  // Expired
  if (stage === "expired") {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <XCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Pix expirado</h2>
        <p className="text-muted-foreground mb-6">O tempo para pagamento expirou. Tente novamente.</p>
        <Button onClick={onBack}>Voltar</Button>
      </div>
    );
  }

  // Error
  if (stage === "error") {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <XCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Erro</h2>
        <p className="text-muted-foreground mb-6">{errorMsg}</p>
        <Button onClick={onBack}>Voltar</Button>
      </div>
    );
  }

  // Waiting for payment
  return (
    <div className="w-full max-w-md mx-auto px-4 py-6">
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground mb-6">
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium">Cancelar</span>
      </button>

      <div className="text-center mb-6">
        <QrCode className="h-8 w-8 text-primary mx-auto mb-2" />
        <h2 className="text-lg font-semibold text-foreground">Pagamento via Pix</h2>
        <p className="text-2xl font-bold text-foreground mt-1">
          R$ {totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
        </p>
      </div>

      {/* QR Code */}
      <Card className="p-6 flex flex-col items-center mb-4">
        <img
          src={paymentData.pix_qr_code_url}
          alt="QR Code Pix"
          className="w-56 h-56 object-contain mb-4 rounded-lg"
        />

        {/* Timer */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>
            Expira em {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>
      </Card>

      {/* Copy-paste code */}
      <Card className="p-4 mb-4">
        <label className="text-xs text-muted-foreground mb-2 block">Código Pix (copia e cola)</label>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-muted rounded-lg px-3 py-2.5 text-xs text-foreground font-mono break-all select-all max-h-20 overflow-y-auto">
            {paymentData.pix_code}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
            aria-label="Copiar código Pix"
          >
            {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </Card>

      <p className="text-xs text-center text-muted-foreground">
        Aguardando confirmação do pagamento...
      </p>
    </div>
  );
}
