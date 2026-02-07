import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, User, FileText, Upload, ShoppingCart, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { formatCPF } from "@/lib/cpf";

interface AddNomeViewProps {
  onBack: () => void;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function formatDocument(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 11) return formatCPF(value);
  return formatCNPJ(value);
}

interface NomeItem {
  id: string;
  person_name: string;
  document: string;
  whatsapp: string;
}

export function AddNomeView({ onBack }: AddNomeViewProps) {
  const [personName, setPersonName] = useState("");
  const [document, setDocument] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [fichaFile, setFichaFile] = useState<File | null>(null);
  const [identidadeFile, setIdentidadeFile] = useState<File | null>(null);
  const [addedNames, setAddedNames] = useState<NomeItem[]>([]);
  const fichaRef = useRef<HTMLInputElement>(null);
  const identidadeRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const trimmedName = personName.trim();
      if (!trimmedName) throw new Error("Nome obrigatório");

      const docDigits = document.replace(/\D/g, "");
      if (!docDigits) throw new Error("CPF/CNPJ obrigatório");

      const phoneDigits = whatsapp.replace(/\D/g, "");
      if (phoneDigits.length < 10) throw new Error("WhatsApp obrigatório");

      const { data, error } = await supabase
        .from("limpa_nome_requests" as any)
        .insert({
          user_id: user.id,
          person_name: trimmedName,
          document: document.trim() || null,
          whatsapp: `+55${phoneDigits}`,
        } as any)
        .select("id")
        .single();
      if (error) throw error;

      const requestId = (data as any).id;

      // Upload docs if present
      for (const { file, docType } of [
        { file: fichaFile, docType: "ficha_associativa" },
        { file: identidadeFile, docType: "identidade" },
      ]) {
        if (!file) continue;
        const path = `${user.id}/${requestId}/${docType}_${file.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("limpa-nome-docs")
          .upload(path, file);
        if (uploadErr) throw uploadErr;

        await supabase
          .from("limpa_nome_documents" as any)
          .insert({
            request_id: requestId,
            doc_type: docType,
            storage_path: path,
            file_name: file.name,
          } as any);
      }

      return { id: requestId, person_name: trimmedName, document: document.trim(), whatsapp: `+55${phoneDigits}` };
    },
    onSuccess: (item) => {
      toast.success("Nome adicionado à lista!");
      setAddedNames((prev) => [...prev, item]);
      queryClient.invalidateQueries({ queryKey: ["limpa-nome-requests"] });
      setPersonName("");
      setDocument("");
      setWhatsapp("");
      setFichaFile(null);
      setIdentidadeFile(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao adicionar nome.");
    },
  });

  const isValid = personName.trim().length >= 2 && document.replace(/\D/g, "").length >= 11 && whatsapp.replace(/\D/g, "").length >= 10;

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
        {/* Nome */}
        <div className="mb-4">
          <label className="text-sm text-muted-foreground mb-1.5 block">Nome | Nome Fantasia*</label>
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              className="bg-transparent w-full text-sm text-foreground placeholder:text-muted-foreground outline-none"
              placeholder="Informe o nome"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              maxLength={200}
            />
          </div>
        </div>

        {/* CPF / CNPJ */}
        <div className="mb-4">
          <label className="text-sm text-muted-foreground mb-1.5 block">CPF | CNPJ*</label>
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              className="bg-transparent w-full text-sm text-foreground placeholder:text-muted-foreground outline-none"
              placeholder="Informe o CPF ou CNPJ"
              value={document}
              onChange={(e) => setDocument(formatDocument(e.target.value))}
              maxLength={18}
            />
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
        disabled={!isValid || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? "Adicionando..." : "Adicionar à lista"}
      </Button>

      {/* Names list card */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <User className="h-4 w-4" />
          <span className="text-sm">Lista de nomes</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            <span>Nomes: <strong className="text-foreground">{addedNames.length}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Pencil className="h-4 w-4 text-muted-foreground" />
            <span>Valor: <strong className="text-foreground">R$ {addedNames.length * 0}</strong></span>
          </div>
        </div>
      </Card>

      {/* Payment button */}
      <Button
        className="w-full bg-[hsl(0,85%,65%)] hover:bg-[hsl(0,85%,55%)] text-white font-semibold py-5"
        disabled={addedNames.length === 0}
        onClick={() => toast.info("Funcionalidade de pagamento em breve!")}
      >
        Ir para pagamento
      </Button>
    </div>
  );
}
