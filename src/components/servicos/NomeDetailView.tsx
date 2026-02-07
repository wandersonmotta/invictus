import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

interface LimpaNomeRequest {
  id: string;
  person_name: string;
  document: string | null;
  status: string;
  whatsapp: string | null;
  created_at: string;
}

interface LimpaNomeDocument {
  id: string;
  doc_type: string;
  file_name: string | null;
  storage_path: string;
}

interface NomeDetailViewProps {
  request: LimpaNomeRequest;
  onBack: () => void;
}

const docTypeLabel: Record<string, string> = {
  ficha_associativa: "Ficha Associativa",
  identidade: "Identidade / Cartão CNPJ",
};

export function NomeDetailView({ request, onBack }: NomeDetailViewProps) {
  const { data: documents = [] } = useQuery({
    queryKey: ["limpa-nome-docs", request.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("limpa_nome_documents" as any)
        .select("id, doc_type, file_name, storage_path")
        .eq("request_id", request.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as LimpaNomeDocument[];
    },
  });

  const handleViewDoc = async (doc: LimpaNomeDocument) => {
    const { data } = await supabase.storage
      .from("limpa-nome-docs")
      .createSignedUrl(doc.storage_path, 300);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground mb-6">
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium">Voltar</span>
      </button>

      <h2 className="text-lg font-semibold text-foreground mb-4">Detalhes</h2>

      <Card className="p-5 mb-4">
        {/* Name */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-1">Nome | Razão Social</p>
          <p className="text-sm font-semibold text-foreground uppercase">{request.person_name}</p>
        </div>

        {/* Document */}
        {request.document && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-1">CPF | CNPJ</p>
            <p className="text-sm text-foreground">{request.document}</p>
          </div>
        )}

        {/* WhatsApp */}
        {request.whatsapp && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-1">WhatsApp</p>
            <p className="text-sm text-foreground">{request.whatsapp}</p>
          </div>
        )}

        {/* Date */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Data de envio</p>
          <p className="text-sm text-foreground">
            {new Date(request.created_at).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </Card>

      {/* Documents */}
      <Card className="p-5">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <FileText className="h-4 w-4" />
          <span className="text-sm font-medium">Documentos enviados</span>
        </div>

        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum documento enviado.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleViewDoc(doc)}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-3 text-left hover:border-primary/40 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {docTypeLabel[doc.doc_type] || doc.doc_type}
                  </p>
                  {doc.file_name && (
                    <p className="text-xs text-muted-foreground">{doc.file_name}</p>
                  )}
                </div>
                <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
