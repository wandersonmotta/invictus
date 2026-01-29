export type CommunityChannel = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
};

export type CommunityThread = {
  thread_id: string;
  channel_id: string;
  title: string;
  created_at: string;
  last_post_at: string;
  post_count: number;
  created_by: string;
  author_display_name: string;
  author_username: string | null;
  author_avatar_url: string | null;
};

export type CommunityPost = {
  post_id: string;
  thread_id: string;
  body: string | null;
  created_at: string;
  author_id: string;
  author_display_name: string;
  author_username: string | null;
  author_avatar_url: string | null;
  attachment_count: number;
};

export type CommunityAttachment = {
  id: string;
  post_id: string;
  storage_bucket: string;
  storage_path: string;
  file_name: string | null;
  content_type: string | null;
  size_bytes: number | null;
  created_at: string;
};
