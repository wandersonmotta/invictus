import * as React from "react";
import { Smile } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmojiPopover } from "@/components/ui/emoji-popover";

export type FeedCommentComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

export const FeedCommentComposer = React.forwardRef<HTMLInputElement, FeedCommentComposerProps>(
  ({ value, onChange, onSubmit, disabled, placeholder = "Adicione um comentário…", className }, ref) => {
    const valueTrimmed = value.trim();
    const canPost = !disabled && valueTrimmed.length > 0;

    const insertEmojiAtCursor = (emoji: string) => {
      const el = (ref as React.RefObject<HTMLInputElement>)?.current;

      if (!el) {
        onChange(value + emoji);
        return;
      }

      const start = el.selectionStart ?? value.length;
      const end = el.selectionEnd ?? value.length;
      const next = value.slice(0, start) + emoji + value.slice(end);
      const nextCursor = start + emoji.length;

      onChange(next);

      // restore caret after controlled update
      queueMicrotask(() => {
        try {
          el.focus();
          el.setSelectionRange(nextCursor, nextCursor);
        } catch {
          // noop
        }
      });
    };

    return (
      <div className={cn("invictus-surface", className)}>
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/40 px-2 py-2">
          <EmojiPopover
            disabled={disabled}
            onPick={insertEmojiAtCursor}
            trigger={
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                <Smile />
                <span className="sr-only">Inserir emoji</span>
              </Button>
            }
          />

          <Input
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="h-9 border-0 bg-transparent px-2 py-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (canPost) onSubmit();
              }
            }}
          />

          <Button
            type="button"
            variant="ghost"
            className="h-9 rounded-full px-3"
            onClick={onSubmit}
            disabled={!canPost}
          >
            Postar
          </Button>
        </div>
      </div>
    );
  },
);
FeedCommentComposer.displayName = "FeedCommentComposer";
