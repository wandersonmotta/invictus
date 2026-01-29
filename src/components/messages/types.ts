export type ConversationFolder = "inbox" | "requests";

export type ThreadRow = {
  conversation_id: string;
  type: "direct" | "group";
  title: string;
  avatar_urls: string[];
  last_message_at: string | null;
  accepted: boolean;
};
