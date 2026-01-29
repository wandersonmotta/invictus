export type FeedMode = "all" | "following";

export type FeedMediaItem = {
  storage_path: string;
  content_type: string | null;
  sort_order: number | null;
  trim_start_seconds?: number | null;
  trim_end_seconds?: number | null;
};

export type FeedPost = {
  post_id: string;
  created_at: string;
  caption: string | null;
  author_user_id: string;
  author_display_name: string;
  author_username: string | null;
  author_avatar_url: string | null;
  media: FeedMediaItem[];
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
};

export type FeedComment = {
  comment_id: string;
  created_at: string;
  body: string;
  author_user_id: string;
  author_display_name: string;
  author_username: string | null;
  author_avatar_url: string | null;
};
