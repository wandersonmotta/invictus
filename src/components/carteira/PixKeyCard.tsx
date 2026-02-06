import { useState, useEffect, useRef } from "react";
import { Save, Info, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { formatCPF, isValidCPF } from "@/lib/cpf";
import { validateCpfFromBrowser } from "@/lib/validateCpfClient";

interface PixKeyCardProps {
  userId: string;
  currentPixKey: string | null;
  onUpdate: () => void;
}

type ValidationState =
  | { status: "idle" }
  | { status: "validating" }
  | { status: "valid"; name: string | null; fallback: boolean }
  | { status: "invalid"; reason: string };

export function PixKeyCard({ userId, currentPixKey, onUpdate }: PixKeyCardProps) {
  const [pixKey, setPixKey] = useState(currentPixKey ? formatCPF(currentPixKey) : "");
  const [validation, setValidation] = useState<ValidationState>({ status: "idle" });
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastValidatedRef = useRef<string>("");

  const digits = pixKey.replace(/\D/g, "");
  const isComplete = digits.length === 11;
  const mathValid = isComplete && isValidCPF(pixKey);
  const canSave =
    validation.status === "valid" &&
    !saving &&
    digits !== (currentPixKey ?? "").replace(/\D/g, "");

  // Real-time validation when CPF is complete
  useEffect(() => {
    // Clear previous debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Reset if incomplete
    if (!isComplete) {
      setValidation({ status: "idle" });
      lastValidatedRef.current = "";
      return;
    }

    // Math check first
    if (!mathValid) {
      setValidation({ status: "invalid", reason: "CPF inválido (dígitos verificadores)" });
      lastValidatedRef.current = "";
      return;
    }

    // Skip if already validated this exact value
    if (lastValidatedRef.current === digits) return;

    // Debounce the API call
    debounceRef.current = setTimeout(async () => {
      setValidation({ status: "validating" });

      try {
        const result = await validateCpfFromBrowser(digits);
        setValidation({
          status: "valid",
          name: result.name,
          fallback: result.fallback,
        });
      } catch {
        setValidation({ status: "valid", name: null, fallback: true });
      }
      lastValidatedRef.current = digits;
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [digits, isComplete, mathValid]);

  const handleChange = (value: string) => {
    const formatted = formatCPF(value);
    setPixKey(formatted);
  };

  const handleSave = async () => {
    if (!canSave) return;

    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ pix_key: digits })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      toast.success("Chave PIX salva com sucesso!");
      onUpdate();
    } catch (err) {
      console.error("Error saving PIX key:", err);
      toast.error("Erro ao salvar chave PIX");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="invictus-surface invictus-frame rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="font-semibold text-foreground">Chave PIX para saques</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Sua chave PIX será usada para receber seus saques. Usamos CPF como padrão.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-pix-key">Chave PIX (CPF)</Label>
        <div className="relative">
          <Input
            id="profile-pix-key"
            type="text"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={pixKey}
            onChange={(e) => handleChange(e.target.value)}
            className={
              validation.status === "invalid"
                ? "border-destructive pr-10"
                : validation.status === "valid"
                  ? "border-green-600 dark:border-green-500 pr-10"
                  : "pr-10"
            }
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {validation.status === "validating" && (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            )}
            {validation.status === "valid" && (
              <CheckCircle2 className="size-4 text-green-600 dark:text-green-500" />
            )}
            {validation.status === "invalid" && (
              <XCircle className="size-4 text-destructive" />
            )}
          </div>
        </div>

        {validation.status === "invalid" && (
          <p className="text-xs text-destructive">{validation.reason}</p>
        )}
        {validation.status === "valid" && validation.name && (
          <p className="text-xs text-green-600 dark:text-green-500">{validation.name}</p>
        )}
        {validation.status === "valid" && validation.fallback && (
          <p className="text-xs text-green-600 dark:text-green-500">
            CPF válido
          </p>
        )}

        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="size-3.5 mt-0.5 shrink-0" />
          <span>Usamos seu CPF como chave padrão para receber saques via PIX</span>
        </div>
      </div>

      <Button
        variant="goldOutline"
        className="w-full gap-2"
        onClick={handleSave}
        disabled={!canSave}
      >
        {saving ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <Save className="size-4" />
            Salvar chave PIX
          </>
        )}
      </Button>
    </div>
  );
}
