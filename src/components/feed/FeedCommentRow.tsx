import * as React from "react";
import { Heart } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";

import type { FeedComment } from "@/features/feed/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  comment: FeedComment;
  isMe: boolean;
  isEditing: boolean;
  editBody: string;
  onEditBodyChange: (v: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
  onToggleLike: () => void;
  likeDisabled?: boolean;
  editDisabled?: boolean;
  deleteDisabled?: boolean;
  saveDisabled?: boolean;
};

export function FeedCommentRow({
  comment,
  isMe,
  isEditing,
  editBody,
  onEditBodyChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onToggleLike,
  likeDisabled,
  editDisabled,
  deleteDisabled,
  saveDisabled,
}: Props) {
  const username = comment.author_username?.replace(/^@/, "") || comment.author_display_name;
  const likeLabel = comment.like_count === 1 ? "curtida" : "curtidas";
  const likeCountText = new Intl.NumberFormat("pt-BR").format(comment.like_count);
  const timeAgo = React.useMemo(() => {
    try {
      return formatDistanceToNowStrict(new Date(comment.created_at), { addSuffix: false, locale: ptBR });
    } catch {
      return "";
    }
  }, [comment.created_at]);

  return (
    <div className="flex gap-3">
      {comment.author_avatar_url ? (
        <img
          src={comment.author_avatar_url}
          alt={`Avatar de ${comment.author_display_name}`}
          className="h-8 w-8 rounded-full border border-border/70 object-cover"
          loading="lazy"
        />
      ) : (
        <div className="h-8 w-8 rounded-full border border-border/70 invictus-surface" />
      )}

      <div className="min-w-0 flex-1">

        {isEditing ? (
          <div className="flex gap-2">
            <Input
              value={editBody}
              onChange={(e) => onEditBodyChange(e.target.value)}
              placeholder="Edite seu comentário…"
              className="h-8 text-sm"
            />
            <Button type="button" size="sm" onClick={onSaveEdit} disabled={saveDisabled}>
              Salvar
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={onCancelEdit}>
              Cancelar
            </Button>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm text-foreground leading-snug">
                <span className="font-semibold">{username}</span>
                <span className="ml-2 whitespace-pre-wrap break-words">{comment.body}</span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {timeAgo ? <span>{timeAgo}</span> : null}
                <span className="font-medium">{likeCountText} {likeLabel}</span>
                <span className="font-medium">Responder</span>

                {isMe && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={onStartEdit}
                      disabled={editDisabled}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                      onClick={onDelete}
                      disabled={deleteDisabled}
                    >
                      Apagar
                    </Button>
                  </>
                )}
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-0.5 h-8 w-8 shrink-0"
              onClick={onToggleLike}
              disabled={likeDisabled}
              aria-label={comment.liked_by_me ? "Descurtir comentário" : "Curtir comentário"}
            >
              <Heart
                className={comment.liked_by_me ? "text-foreground" : "text-muted-foreground"}
                size={18}
                fill={comment.liked_by_me ? "currentColor" : "none"}
              />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
