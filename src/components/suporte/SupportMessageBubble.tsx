import { Bot, User, Headset } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  senderType: "user" | "ai" | "agent";
  body: string | null;
  createdAt: string;
  senderName?: string;
  senderAvatar?: string;
  /** When rendered from the back-office perspective, "user" is left and "agent" is right */
  perspective?: "user" | "agent";
}

export function SupportMessageBubble({
  senderType,
  body,
  createdAt,
  senderName,
  senderAvatar,
  perspective = "user",
}: Props) {
  const isOwnMessage =
    perspective === "user" ? senderType === "user" : senderType === "agent";

  const time = new Date(createdAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const icon =
    senderType === "ai" ? (
      <Bot className="h-4 w-4 text-primary" />
    ) : senderType === "agent" ? (
      <Headset className="h-4 w-4 text-emerald-400" />
    ) : (
      <User className="h-4 w-4 text-muted-foreground" />
    );

  const label =
    senderType === "ai"
      ? "Assistente IA"
      : senderType === "agent"
        ? senderName || "Atendente"
        : senderName || "Você";

  return (
    <div
      className={cn(
        "flex gap-2 max-w-[85%]",
        isOwnMessage ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        {senderAvatar ? (
          <img
            src={senderAvatar}
            alt={label}
            className="h-7 w-7 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center border border-border">
            {icon}
          </div>
        )}
      </div>

      {/* Bubble */}
      <div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
          <span className="text-[9px] text-muted-foreground/60">{time}</span>
        </div>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words",
            isOwnMessage
              ? "bg-primary/20 text-foreground rounded-tr-sm"
              : senderType === "ai"
                ? "bg-muted/60 text-foreground rounded-tl-sm border border-primary/20"
                : "bg-muted/40 text-foreground rounded-tl-sm"
          )}
        >
          {body || ""}
        </div>
      </div>
    </div>
  );
}
