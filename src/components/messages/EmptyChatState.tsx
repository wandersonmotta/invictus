import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";

export function EmptyChatState({
  onNewMessage,
  ctaLabel = "Nova mensagem",
}: {
  onNewMessage: () => void;
  ctaLabel?: string;
}) {
  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-border/70 invictus-surface invictus-frame">
        <Send className="h-8 w-8 text-foreground" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-semibold">Suas mensagens</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Envie mensagens privadas e converse com membros e grupos.
      </p>
      <div className="mt-4 flex justify-center">
        <Button onClick={onNewMessage} className="h-11">
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}
