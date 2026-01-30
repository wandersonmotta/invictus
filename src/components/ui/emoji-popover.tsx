import * as React from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const DEFAULT_EMOJIS = [
  "😀",
  "😁",
  "😂",
  "🤣",
  "😊",
  "😍",
  "🥰",
  "😘",
  "😎",
  "🤝",
  "🙏",
  "👏",
  "💪",
  "🔥",
  "✨",
  "💯",
  "🎯",
  "🚀",
  "👊",
  "✅",
  "⚡️",
  "🧠",
  "📌",
  "🫡",
  "😅",
  "😮",
  "😢",
  "😡",
  "👍",
  "❤️",
  "🖤",
];

export function EmojiPopover({
  onPick,
  trigger,
  disabled,
}: {
  onPick: (emoji: string) => void;
  trigger: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild disabled={disabled}>
        {trigger}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={10}
        className="z-[60] w-72 invictus-surface invictus-frame border-border/70 p-3"
      >
        <div className="grid grid-cols-8 gap-1">
          {DEFAULT_EMOJIS.map((e) => (
            <Button
              key={e}
              type="button"
              variant="ghost"
              className="h-8 w-8 p-0 text-base"
              onClick={() => onPick(e)}
              aria-label={`Inserir emoji ${e}`}
            >
              <span aria-hidden>{e}</span>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
