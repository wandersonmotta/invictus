import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarCropDialog } from "@/components/profile/AvatarCropDialog";
import { toast } from "sonner";
import invictusLogo from "@/assets/INVICTUS-GOLD_1.png";

interface Props {
  onComplete: () => void;
}

export function SuporteProfileSetup({ onComplete }: Props) {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropSave = async (blob: Blob) => {
    setAvatarBlob(blob);
    setAvatarPreview(URL.createObjectURL(blob));
  };

  const canSave = firstName.trim() && lastName.trim() && avatarBlob;

  const handleSave = async () => {
    if (!canSave || !user) return;
    setSaving(true);

    try {
      // Upload avatar
      const path = `${user.id}/avatar_${Date.now()}.jpg`;
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, avatarBlob, { contentType: "image/jpeg", upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = urlData?.publicUrl;

      // Update profile
      const displayName = `${firstName.trim()} ${lastName.trim()}`;
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          display_name: displayName,
          avatar_url: avatarUrl,
        })
        .eq("user_id", user.id);

      if (profileErr) throw profileErr;

      toast.success("Perfil configurado com sucesso!");
      onComplete();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col items-center gap-2">
          <img src={invictusLogo} alt="Invictus" className="h-6 w-auto" />
          <h1 className="text-lg font-semibold">Configure seu perfil</h1>
          <p className="text-sm text-muted-foreground text-center">
            Antes de começar, preencha seu nome e adicione uma foto de perfil.
          </p>
        </div>

        {/* Avatar */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative h-24 w-24 rounded-full border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden hover:border-primary/50 transition-colors"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <Camera className="h-8 w-8 text-muted-foreground" />
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Nome</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Sobrenome</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Seu sobrenome"
            />
          </div>
        </div>

        <Button className="w-full" disabled={!canSave || saving} onClick={handleSave}>
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : "Salvar e continuar"}
        </Button>
      </div>

      <AvatarCropDialog
        open={cropOpen}
        onOpenChange={setCropOpen}
        imageSrc={cropSrc}
        onCancel={() => setCropSrc(null)}
        onSave={handleCropSave}
      />
    </div>
  );
}
