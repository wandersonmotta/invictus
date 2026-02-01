import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { AuthBackground } from "@/components/auth/AuthBackground";
import invictusLogo from "@/assets/invictus-logo.png";

export default function AguardandoAprovacao() {
  const { signOut } = useAuth();

  return (
    <main className="relative min-h-svh grid place-items-center p-4 sm:p-6">
      <AuthBackground />

      <div className="invictus-auth-surface invictus-auth-frame relative z-10 w-full max-w-lg rounded-2xl p-8 text-center">
        <img
          src={invictusLogo}
          alt="Invictus"
          className="mx-auto h-16 w-auto mb-6 drop-shadow-lg"
        />

        <h1 className="text-2xl font-bold text-foreground mb-4">
          Olá, futuro membro Invictus!
        </h1>

        <p className="text-lg text-foreground/90 mb-6 leading-relaxed">
          Você, a partir desse momento, vai fazer parte de algo grandioso.
        </p>

        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 mb-8">
          <p className="text-sm text-muted-foreground">
            Aguarde enquanto validamos o seu convite e o seu usuário.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() => void signOut()}
          className="min-w-[120px]"
        >
          Sair
        </Button>
      </div>
    </main>
  );
}
