import { Bot, User, Headset, Check, CheckCheck, FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Attachment {
  id: string;
  file_name: string | null;
  content_type: string | null;
  storage_path: string;
  publicUrl?: string;
}

interface Props {
  senderType: "user" | "ai" | "agent";
  body: string | null;
  createdAt: string;
  senderName?: string;
  senderAvatar?: string;
  perspective?: "user" | "agent";
  readAt?: string | null;
  attachments?: Attachment[];
}

export function SupportMessageBubble({
  senderType,
  body,
  createdAt,
  senderName,
  senderAvatar,
  perspective = "user",
  readAt,
  attachments,
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

  const showStatus = perspective === "user" && senderType === "user";

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

          {/* Attachments */}
          {attachments && attachments.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {attachments.map((att) => {
                const isImage = att.content_type?.startsWith("image/");
                if (isImage && att.publicUrl) {
                  return (
                    <a key={att.id} href={att.publicUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={att.publicUrl}
                        alt={att.file_name || "Anexo"}
                        className="max-w-[240px] max-h-[200px] rounded-lg object-cover border border-border mt-1"
                      />
                    </a>
                  );
                }
                return (
                  <a
                    key={att.id}
                    href={att.publicUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-primary hover:underline"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {att.file_name || "Arquivo"}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Status indicators for user messages */}
        {showStatus && (
          <div className="flex justify-end mt-0.5">
            {readAt ? (
              <CheckCheck className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Check className="h-3.5 w-3.5 text-muted-foreground/60" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
