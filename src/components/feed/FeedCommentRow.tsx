import * as React from "react";
import { Heart } from "lucide-react";

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

      <div className="min-w-0 flex-1 space-y-1">
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{comment.author_display_name}</span>
          {comment.author_username ? <span className="ml-2">{comment.author_username}</span> : null}
        </div>

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
          <>
            <div className="text-sm text-foreground">{comment.body}</div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={comment.liked_by_me ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={onToggleLike}
                disabled={likeDisabled}
                aria-label={comment.liked_by_me ? "Descurtir comentário" : "Curtir comentário"}
              >
                <Heart
                  className={comment.liked_by_me ? "text-foreground" : "text-muted-foreground"}
                  size={14}
                  fill={comment.liked_by_me ? "currentColor" : "none"}
                />
                {comment.like_count}
              </Button>

              {isMe && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={onStartEdit}
                    disabled={editDisabled}
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                    onClick={onDelete}
                    disabled={deleteDisabled}
                  >
                    Apagar
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
