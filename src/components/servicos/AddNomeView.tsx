import { useState, useRef, useEffect } from "react";
import { ArrowLeft, User, FileText, Upload, ShoppingCart, CreditCard, X, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { formatCPF, isValidCPF } from "@/lib/cpf";
import { formatCNPJ, isValidCNPJ } from "@/lib/cnpj";
import { validateCpfFromBrowser, validateCnpjFromBrowser } from "@/lib/validateCpfClient";
import { PixPaymentView } from "./PixPaymentView";

interface AddNomeViewProps {
  onBack: () => void;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatDocument(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 11) return formatCPF(value);
  return formatCNPJ(value);
}

type DocStatus = "idle" | "validating" | "valid" | "invalid";

interface LocalNomeItem {
  tempId: string;
  person_name: string;
  document: string;
  whatsapp: string;
  fichaFile: File | null;
  identidadeFile: File | null;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get raw base64
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function serializeFileForStorage(file: File | null) {
  if (!file) return null;
  return {
    name: file.name,
    type: file.type,
    base64: await fileToBase64(file),
  };
}

export function AddNomeView({ onBack }: AddNomeViewProps) {
  const [paymentData, setPaymentData] = useState<{
    payment_intent_id: string;
    pix_qr_code_url: string;
    pix_code: string;
    expires_at: number;
  } | null>(null);
  const [personName, setPersonName] = useState("");
  const [document, setDocument] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [fichaFile, setFichaFile] = useState<File | null>(null);
  const [identidadeFile, setIdentidadeFile] = useState<File | null>(null);
  const [addedNames, setAddedNames] = useState<LocalNomeItem[]>([]);
  const [docStatus, setDocStatus] = useState<DocStatus>("idle");
  const [docError, setDocError] = useState("");
  const [nameAutoFilled, setNameAutoFilled] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const fichaRef = useRef<HTMLInputElement>(null);
  const identidadeRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced document validation
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const digits = document.replace(/\D/g, "");
    
    if ((digits.length < 11) || (digits.length > 11 && digits.length < 14)) {
      setDocStatus("idle");
      setDocError("");
      return;
    }

    if (digits.length !== 11 && digits.length !== 14) {
      setDocStatus("idle");
      setDocError("");
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const isCpf = digits.length === 11;

      const mathValid = isCpf ? isValidCPF(digits) : isValidCNPJ(digits);
      if (!mathValid) {
        setDocStatus("invalid");
        setDocError(isCpf ? "CPF inválido" : "CNPJ inválido");
        return;
      }

      setDocStatus("validating");
      setDocError("");

      try {
        const result = isCpf
          ? await validateCpfFromBrowser(digits)
          : await validateCnpjFromBrowser(digits);

        if (result.valid === false) {
          setDocStatus("invalid");
          setDocError(isCpf ? "CPF não encontrado na base" : "CNPJ não encontrado na base");
          return;
        }

        setDocStatus("valid");
        if (result.name) {
          setPersonName(result.name);
          setNameAutoFilled(true);
        }
      } catch {
        setDocStatus("valid");
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [document]);

  const resetForm = () => {
    setPersonName("");
    setDocument("");
    setWhatsapp("");
    setFichaFile(null);
    setIdentidadeFile(null);
    setDocStatus("idle");
    setDocError("");
    setNameAutoFilled(false);
  };

  const handleAddToList = () => {
    const trimmedName = personName.trim();
    if (!trimmedName) { toast.error("Nome obrigatório"); return; }

    const docDigits = document.replace(/\D/g, "");
    if (!docDigits) { toast.error("CPF/CNPJ obrigatório"); return; }

    const phoneDigits = whatsapp.replace(/\D/g, "");
    if (phoneDigits.length < 10) { toast.error("WhatsApp obrigatório"); return; }

    const item: LocalNomeItem = {
      tempId: crypto.randomUUID(),
      person_name: trimmedName,
      document: document.trim(),
      whatsapp: `+55${phoneDigits}`,
      fichaFile,
      identidadeFile,
    };

    setAddedNames((prev) => [...prev, item]);
    toast.success("Nome adicionado à lista!");
    resetForm();
  };

  const handleGoToPayment = async () => {
    if (addedNames.length === 0) return;
    setIsRedirecting(true);

    try {
      // Serialize files to sessionStorage
      const itemsForStorage = await Promise.all(
        addedNames.map(async (item) => ({
          person_name: item.person_name,
          document: item.document,
          whatsapp: item.whatsapp,
          fichaFile: await serializeFileForStorage(item.fichaFile),
          identidadeFile: await serializeFileForStorage(item.identidadeFile),
        })),
      );
      sessionStorage.setItem("limpa_nome_items", JSON.stringify(itemsForStorage));

      // Call edge function to create PaymentIntent with Pix
      const namesPayload = addedNames.map((item) => ({
        person_name: item.person_name,
        document: item.document,
        whatsapp: item.whatsapp,
      }));

      const { data, error } = await supabase.functions.invoke("create-limpa-nome-payment", {
        body: { names: namesPayload },
      });

      if (error || !data?.pix_code) {
        throw new Error(data?.error || error?.message || "Erro ao gerar Pix");
      }

      setPaymentData(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao iniciar pagamento");
    } finally {
      setIsRedirecting(false);
    }
  };

  const docDigits = document.replace(/\D/g, "");
  const isDocComplete = docDigits.length === 11 || docDigits.length === 14;
  const isValid =
    personName.trim().length >= 2 &&
    isDocComplete &&
    docStatus === "valid" &&
    whatsapp.replace(/\D/g, "").length >= 10;

  if (paymentData) {
    return (
      <PixPaymentView
        paymentData={paymentData}
        totalAmount={addedNames.length * 150}
        onBack={() => setPaymentData(null)}
        onComplete={onBack}
      />
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground mb-6">
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium">Voltar</span>
      </button>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Cadastre no campo abaixo</h2>
      </div>

      {/* Form Card */}
      <Card className="p-5 mb-4">
        {/* CPF / CNPJ */}
        <div className="mb-4">
          <label className="text-sm text-muted-foreground mb-1.5 block">CPF | CNPJ*</label>
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              className="bg-transparent w-full text-sm text-foreground placeholder:text-muted-foreground outline-none"
              placeholder="Informe o CPF ou CNPJ"
              value={document}
              onChange={(e) => {
                setDocument(formatDocument(e.target.value));
                setNameAutoFilled(false);
              }}
              maxLength={18}
            />
            {docStatus === "validating" && <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />}
            {docStatus === "valid" && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
            {docStatus === "invalid" && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
          </div>
          {docStatus === "validating" && (
            <p className="text-xs text-muted-foreground mt-1">Validando...</p>
          )}
          {docStatus === "invalid" && docError && (
            <p className="text-xs text-destructive mt-1">{docError}</p>
          )}
          {docStatus === "valid" && (
            <p className="text-xs text-green-500 mt-1">Documento válido</p>
          )}
        </div>

        {/* Nome */}
        <div className="mb-4">
          <label className="text-sm text-muted-foreground mb-1.5 block">Nome | Razão Social*</label>
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              className="bg-transparent w-full text-sm text-foreground placeholder:text-muted-foreground outline-none"
              placeholder={docStatus === "validating" ? "Buscando nome..." : "Informe o nome"}
              value={personName}
              onChange={(e) => {
                setPersonName(e.target.value);
                setNameAutoFilled(false);
              }}
              maxLength={200}
            />
            {nameAutoFilled && <span className="text-[10px] text-muted-foreground whitespace-nowrap">auto</span>}
          </div>
        </div>

        {/* WhatsApp */}
        <div className="mb-5">
          <label className="text-sm text-muted-foreground mb-1.5 block">WhatsApp*</label>
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <span className="text-base">🇧🇷</span>
            <span className="text-sm text-muted-foreground">+55</span>
            <input
              className="bg-transparent w-full text-sm text-foreground placeholder:text-muted-foreground outline-none"
              placeholder="Informe o WhatsApp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
              maxLength={16}
            />
          </div>
        </div>

        {/* Documents */}
        <p className="text-xs text-muted-foreground mb-3">
          Faça o envio dos documentos abaixo para ativar a garantia
        </p>
        <div className="grid grid-cols-2 gap-3">
          <input type="file" ref={fichaRef} className="hidden" accept="image/*,.pdf" onChange={(e) => setFichaFile(e.target.files?.[0] ?? null)} />
          <input type="file" ref={identidadeRef} className="hidden" accept="image/*,.pdf" onChange={(e) => setIdentidadeFile(e.target.files?.[0] ?? null)} />

          <button
            type="button"
            onClick={() => fichaRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-3 text-xs text-muted-foreground hover:border-primary/40 transition-colors"
          >
            <Upload className="h-4 w-4 shrink-0" />
            <span className="truncate">{fichaFile ? fichaFile.name : "Ficha associativa"}</span>
          </button>

          <button
            type="button"
            onClick={() => identidadeRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-3 text-xs text-muted-foreground hover:border-primary/40 transition-colors"
          >
            <Upload className="h-4 w-4 shrink-0" />
            <span className="truncate">{identidadeFile ? identidadeFile.name : "Identidade ou Cartão CNPJ"}</span>
          </button>
        </div>
      </Card>

      {/* Add button */}
      <Button
        className="w-full mb-4 bg-[hsl(245,80%,60%)] hover:bg-[hsl(245,80%,50%)] text-white font-semibold py-5"
        disabled={!isValid}
        onClick={handleAddToList}
      >
        Adicionar à lista
      </Button>

      {/* Names list card */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <User className="h-4 w-4" />
          <span className="text-sm">Lista de nomes</span>
        </div>

        {addedNames.length > 0 && (
          <div className="flex flex-col gap-2 mb-3">
            {addedNames.map((item, idx) => (
              <div
                key={item.tempId}
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs text-muted-foreground mt-0.5">{idx + 1}.</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground uppercase">{item.person_name}</p>
                    {item.document && (
                      <p className="text-xs text-muted-foreground">{item.document}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAddedNames((prev) => prev.filter((n) => n.tempId !== item.tempId))}
                  className="h-6 w-6 rounded-full flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Remover nome"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            <span>Nomes: <strong className="text-foreground">{addedNames.length}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span>Valor: <strong className="text-foreground">R$ {addedNames.length * 150}</strong></span>
          </div>
        </div>
      </Card>

      {/* Payment button */}
      <Button
        className="w-full bg-[hsl(0,85%,65%)] hover:bg-[hsl(0,85%,55%)] text-white font-semibold py-5"
        disabled={addedNames.length === 0 || isRedirecting}
        onClick={handleGoToPayment}
      >
        {isRedirecting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Redirecionando...
          </>
        ) : (
          "Ir para pagamento"
        )}
      </Button>
    </div>
  );
}
