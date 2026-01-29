import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

import { AvatarCropDialog } from "@/components/profile/AvatarCropDialog";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProfilePrivacySelect, type ProfileVisibility } from "@/components/profile/ProfilePrivacySelect";

const profileSchema = z.object({
  first_name: z.string().trim().min(1, "Nome obrigatório").max(30, "Máximo 30 caracteres"),
  last_name: z.string().trim().min(1, "Sobrenome obrigatório").max(30, "Máximo 30 caracteres"),
  username: z
    .string()
    .trim()
    .max(21, "Máximo 21 caracteres")
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => {
        const t = (v ?? "").trim();
        if (!t) return true;
        return /^@[a-z0-9._]{3,20}$/.test(t);
      },
      "@ inválido (use @ + 3 a 20 caracteres: a-z, 0-9, . e _)"
    ),
  postal_code: z
    .string()
    .trim()
    .min(8, "CEP obrigatório")
    .max(9, "CEP inválido")
    .refine((v) => v.replace(/\D/g, "").length === 8, "CEP inválido (use 8 dígitos)"),
  bio: z
    .string()
    .trim()
    .max(800, "Máximo 800 caracteres")
    .optional()
    .or(z.literal("")),
  expertisesCsv: z
    .string()
    .trim()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .or(z.literal("")),

  profile_visibility: z.enum(["members", "mutuals", "private"]).default("members"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

type LoadedProfile = {
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  region: string | null;
  postal_code: string | null;
  city: string | null;
  state: string | null;
  location_lat: number | null;
  location_lng: number | null;
  expertises: string[] | null;
  access_status: string | null;
  profile_visibility: ProfileVisibility | null;
};

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

function formatCep(v: string) {
  const d = onlyDigits(v).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

function normalizeUsernameInput(v: string | undefined) {
  const raw = (v ?? "").trim().toLowerCase();
  if (!raw) return null;
  return raw.startsWith("@") ? raw : `@${raw}`;
}

function normalizeExpertises(csv: string | undefined) {
  const items = (csv ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10)
    .map((s) => s.slice(0, 40));
  // remove duplicates (case-insensitive)
  const seen = new Set<string>();
  return items.filter((i) => {
    const k = i.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function ProfileForm({ userId, onSaved }: { userId: string; onSaved?: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [profile, setProfile] = React.useState<LoadedProfile | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [cropOpen, setCropOpen] = React.useState(false);
  const [pendingImageSrc, setPendingImageSrc] = React.useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      username: "",
      postal_code: "",
      bio: "",
      expertisesCsv: "",
      profile_visibility: "members",
    },
    mode: "onSubmit",
  });

  const loadProfile = React.useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "display_name, first_name, last_name, username, avatar_url, bio, region, postal_code, city, state, location_lat, location_lng, expertises, access_status, profile_visibility",
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      setLoading(false);
      toast({
        title: "Erro ao carregar perfil",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const p = (data ?? null) as LoadedProfile | null;
    setProfile(p);
    form.reset({
      first_name: p?.first_name ?? "",
      last_name: p?.last_name ?? "",
      username: p?.username ?? "",
      postal_code: p?.postal_code ? formatCep(p.postal_code) : "",
      bio: p?.bio ?? "",
      expertisesCsv: (p?.expertises ?? []).join(", "),
      profile_visibility: (p?.profile_visibility ?? "members") as ProfileVisibility,
    });
    setLoading(false);
  }, [form, toast, userId]);

  React.useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const onSubmit = form.handleSubmit(async (values) => {
    setSaving(true);
    const expertises = normalizeExpertises(values.expertisesCsv);

     // CEP obrigatório: resolve cidade/UF + salva coordenadas (backend)
    const { data: locData, error: locError } = await supabase.functions.invoke("resolve-location-from-cep", {
      body: { postal_code: values.postal_code },
    });

    if (locError || (locData as any)?.error || !(locData as any)?.ok) {
      setSaving(false);
      toast({
        title: "CEP inválido",
        description: locError?.message ?? (locData as any)?.error ?? "Não foi possível validar seu CEP.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      user_id: userId,
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      username: normalizeUsernameInput(values.username) || null,
      bio: values.bio?.trim() || null,
      expertises,
      profile_visibility: values.profile_visibility,
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "user_id" })
      .select(
        "display_name, first_name, last_name, username, avatar_url, bio, region, postal_code, city, state, location_lat, location_lng, expertises, access_status, profile_visibility",
      )
      .maybeSingle();

    setSaving(false);
    if (error) {
      const msg = (error as any)?.message as string | undefined;
      // unique index on lower(username)
      if (msg?.toLowerCase().includes("profiles_username_lower_unique")) {
        toast({
          title: "Esse @ já está em uso",
          description: "Escolha outro @ (letras minúsculas, números, . e _).",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }

    setProfile((data ?? null) as LoadedProfile | null);
    toast({ title: "Perfil salvo" });
    onSaved?.();
  });

  async function uploadAvatarBlob(blob: Blob) {
    setUploading(true);
    const objectPath = `${userId}/avatar-${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(objectPath, blob, {
      upsert: true,
      contentType: "image/jpeg",
      cacheControl: "3600",
    });

    if (uploadError) {
      setUploading(false);
      toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
      return;
    }

    const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(objectPath);
    const avatarUrl = publicData.publicUrl;

    const { error: updateError, data: updated } = await supabase
      .from("profiles")
      .upsert({ user_id: userId, avatar_url: avatarUrl }, { onConflict: "user_id" })
      .select(
        "display_name, first_name, last_name, username, avatar_url, bio, region, postal_code, city, state, location_lat, location_lng, expertises, access_status, profile_visibility",
      )
      .maybeSingle();

    setUploading(false);
    if (updateError) {
      toast({ title: "Erro ao salvar foto", description: updateError.message, variant: "destructive" });
      return;
    }

    setProfile((updated ?? null) as LoadedProfile | null);
    toast({ title: "Foto atualizada" });
    onSaved?.();
  }

  const accessStatus = profile?.access_status ?? null;
  const isLimited = accessStatus && accessStatus !== "approved";

  return (
    <section className="space-y-4">
      {isLimited ? (
        <Card className="invictus-surface invictus-frame border-border/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Acesso limitado</CardTitle>
            <CardDescription>
              Seu acesso está pendente. Você já pode completar seu perfil (foto, bio, expertises e região), mas outras áreas
              continuarão bloqueadas até aprovação.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card className="invictus-surface invictus-frame border-border/70">
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Complete seus dados para liberar sua melhor apresentação.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className={cn("h-32 w-32", uploading && "opacity-60")}>
              <AvatarImage src={profile?.avatar_url ?? undefined} alt="Foto do perfil" />
              <AvatarFallback>
                {(profile?.display_name?.[0] ?? profile?.first_name?.[0] ?? "U").toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    if (!f.type.startsWith("image/")) {
                      toast({
                        title: "Arquivo inválido",
                        description: "Envie uma imagem (PNG/JPG/WebP).",
                        variant: "destructive",
                      });
                      e.currentTarget.value = "";
                      return;
                    }
                    const maxBytes = 5 * 1024 * 1024;
                    if (f.size > maxBytes) {
                      toast({ title: "Imagem muito grande", description: "Máximo 5MB.", variant: "destructive" });
                      e.currentTarget.value = "";
                      return;
                    }

                    const url = URL.createObjectURL(f);
                    setPendingImageSrc(url);
                    setCropOpen(true);
                  }
                  // reset to allow re-uploading same file
                  e.currentTarget.value = "";
                }}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={uploading || loading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? "Enviando..." : "Trocar foto"}
              </Button>
              <p className="text-xs text-muted-foreground">PNG/JPG/WebP • até 5MB • formato circular</p>
            </div>
          </div>

          <AvatarCropDialog
            open={cropOpen}
            onOpenChange={(open) => {
              setCropOpen(open);
              if (!open && pendingImageSrc) {
                URL.revokeObjectURL(pendingImageSrc);
                setPendingImageSrc(null);
              }
            }}
            imageSrc={pendingImageSrc}
            onCancel={() => {
              if (pendingImageSrc) URL.revokeObjectURL(pendingImageSrc);
              setPendingImageSrc(null);
            }}
            onSave={async (blob) => {
              await uploadAvatarBlob(blob);
              if (pendingImageSrc) URL.revokeObjectURL(pendingImageSrc);
              setPendingImageSrc(null);
            }}
          />

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">Nome</Label>
                <Input
                  id="first_name"
                  disabled={loading || saving}
                  placeholder="Seu nome"
                  autoComplete="given-name"
                  {...form.register("first_name")}
                />
                {form.formState.errors.first_name ? (
                  <p className="text-xs text-destructive">{form.formState.errors.first_name.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Sobrenome</Label>
                <Input
                  id="last_name"
                  disabled={loading || saving}
                  placeholder="Seu sobrenome"
                  autoComplete="family-name"
                  {...form.register("last_name")}
                />
                {form.formState.errors.last_name ? (
                  <p className="text-xs text-destructive">{form.formState.errors.last_name.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">CEP</Label>
                <Input
                  id="postal_code"
                  disabled={loading || saving}
                  placeholder="00000-000"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  {...form.register("postal_code", {
                    onChange: (e) => {
                      const next = formatCep(e.target.value);
                      form.setValue("postal_code", next, { shouldValidate: false });
                    },
                  })}
                />
                {form.formState.errors.postal_code ? (
                  <p className="text-xs text-destructive">{form.formState.errors.postal_code.message}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">Obrigatório. Ao salvar, vamos preencher automaticamente Cidade/UF.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">@ do usuário</Label>
              <Input
                id="username"
                disabled={loading || saving}
                placeholder="@seu.usuario"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                {...form.register("username", {
                  onBlur: (e) => {
                    const normalized = normalizeUsernameInput(e.target.value) ?? "";
                    form.setValue("username", normalized, { shouldValidate: true, shouldDirty: true });
                  },
                })}
              />
              {form.formState.errors.username ? (
                <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Opcional. Use @ + letras minúsculas, números, . e _</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  disabled
                  value={profile?.city ?? ""}
                  placeholder="—"
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">UF</Label>
                <Input
                  id="state"
                  disabled
                  value={profile?.state ?? ""}
                  placeholder="—"
                  readOnly
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                disabled={loading || saving}
                placeholder="Conte em poucas linhas sua experiência e foco de atuação"
                {...form.register("bio")}
              />
              {form.formState.errors.bio ? (
                <p className="text-xs text-destructive">{form.formState.errors.bio.message}</p>
              ) : null}
            </div>

            <ProfilePrivacySelect
              value={(form.watch("profile_visibility") ?? "members") as ProfileVisibility}
              disabled={loading || saving}
              onChange={(next) => form.setValue("profile_visibility", next, { shouldDirty: true })}
            />

            <div className="space-y-2">
              <Label htmlFor="expertisesCsv">Expertises</Label>
              <Input
                id="expertisesCsv"
                disabled={loading || saving}
                placeholder="Ex.: Vendas, Gestão, Marketing (separe por vírgula)"
                {...form.register("expertisesCsv")}
              />
              <p className="text-xs text-muted-foreground">Até 10 itens (máx. 40 caracteres cada).</p>
              {form.formState.errors.expertisesCsv ? (
                <p className="text-xs text-destructive">{form.formState.errors.expertisesCsv.message}</p>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={loading || saving}>
                {saving ? "Salvando..." : "Salvar perfil"}
              </Button>
              <Button type="button" variant="secondary" disabled={loading} onClick={() => void loadProfile()}>
                Recarregar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
