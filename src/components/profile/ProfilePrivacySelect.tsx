import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ProfileVisibility = "members" | "mutuals" | "private";

export function ProfilePrivacySelect({
  value,
  onChange,
  disabled,
}: {
  value: ProfileVisibility;
  onChange: (next: ProfileVisibility) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="profile_visibility">Privacidade do perfil</Label>
      <Select value={value} onValueChange={(v) => onChange(v as ProfileVisibility)} disabled={disabled}>
        <SelectTrigger id="profile_visibility">
          <SelectValue placeholder="Escolha um nível" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="members">Visível para membros</SelectItem>
          <SelectItem value="mutuals">Somente conexões (mútuo)</SelectItem>
          <SelectItem value="private">Somente eu</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Controla se outros membros aprovados podem ver seu perfil no diretório/busca/mapa.
      </p>
    </div>
  );
}
