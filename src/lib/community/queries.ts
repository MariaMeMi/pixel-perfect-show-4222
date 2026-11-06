import { supabase } from "@/integrations/supabase/client";

export type ForumCategory = { id: string; slug: string; name: string; description: string; sort: number };
export type ForumProfile = { user_id: string; username: string; display_name: string; bio: string };
export type ForumPost = {
  id: string;
  title: string;
  body: string;
  image_path: string | null;
  status: string;
  created_at: string;
  author_id: string;
  category_id: string;
  community_profiles: { username: string; display_name: string } | null;
  forum_categories: { slug: string; name: string } | null;
};
export type ForumComment = {
  id: string;
  post_id: string;
  parent_id: string | null;
  body: string;
  status: string;
  created_at: string;
  author_id: string;
  community_profiles: { username: string; display_name: string } | null;
};

const POST_SELECT = "id,title,body,image_path,status,created_at,author_id,category_id,community_profiles(username,display_name),forum_categories(slug,name)";

export async function listCategories(): Promise<ForumCategory[]> {
  const { data } = await supabase.from("forum_categories").select("id,slug,name,description,sort").order("sort");
  return (data ?? []) as ForumCategory[];
}

export async function getCategoryBySlug(slug: string): Promise<ForumCategory | null> {
  const { data } = await supabase.from("forum_categories").select("id,slug,name,description,sort").eq("slug", slug).maybeSingle();
  return (data as ForumCategory | null) ?? null;
}

export type PostListOptions = { categoryId?: string; search?: string; page?: number; perPage?: number; authorId?: string };

export async function listPosts(opts: PostListOptions = {}): Promise<{ posts: ForumPost[]; total: number }> {
  const page = opts.page ?? 0;
  const perPage = opts.perPage ?? 20;
  let q = supabase
    .from("forum_posts")
    .select(POST_SELECT, { count: "exact" })
    .eq("status", "visible")
    .order("created_at", { ascending: false })
    .range(page * perPage, page * perPage + perPage - 1);
  if (opts.categoryId) q = q.eq("category_id", opts.categoryId);
  if (opts.authorId) q = q.eq("author_id", opts.authorId);
  const search = opts.search?.trim();
  if (search) q = q.or(`title.ilike.%${search}%,body.ilike.%${search}%`);
  const { data, count } = await q;
  return { posts: (data ?? []) as unknown as ForumPost[], total: count ?? 0 };
}

export async function getPost(id: string): Promise<ForumPost | null> {
  const { data } = await supabase.from("forum_posts").select(POST_SELECT).eq("id", id).neq("status", "deleted").maybeSingle();
  return (data as unknown as ForumPost | null) ?? null;
}

export async function listComments(postId: string): Promise<ForumComment[]> {
  const { data } = await supabase
    .from("forum_comments")
    .select("id,post_id,parent_id,body,status,created_at,author_id,community_profiles(username,display_name)")
    .eq("post_id", postId)
    .neq("status", "deleted")
    .order("created_at");
  return (data ?? []) as unknown as ForumComment[];
}

export type ReactionSummary = { counts: Record<string, number>; mine: Set<string> };

/** Reactions keyed as `${post|comment}:${id}:${kind}`. */
export async function getReactions(postId: string, userId: string | null): Promise<ReactionSummary> {
  const { data } = await supabase.from("forum_reactions").select("post_id,comment_id,user_id,kind").eq("post_id", postId);
  const commentIds = (await listComments(postId)).map((c) => c.id);
  const commentReactions = commentIds.length
    ? (await supabase.from("forum_reactions").select("post_id,comment_id,user_id,kind").in("comment_id", commentIds)).data ?? []
    : [];
  const counts: Record<string, number> = {};
  const mine = new Set<string>();
  for (const r of [...(data ?? []), ...commentReactions]) {
    const key = r.post_id ? `post:${r.post_id}:${r.kind}` : `comment:${r.comment_id}:${r.kind}`;
    counts[key] = (counts[key] ?? 0) + 1;
    if (userId && r.user_id === userId) mine.add(key);
  }
  return { counts, mine };
}

export async function getCommentCounts(postIds: string[]): Promise<Record<string, number>> {
  if (!postIds.length) return {};
  const { data } = await supabase.from("forum_comments").select("post_id").in("post_id", postIds).eq("status", "visible");
  const counts: Record<string, number> = {};
  for (const row of data ?? []) counts[row.post_id] = (counts[row.post_id] ?? 0) + 1;
  return counts;
}

export async function getProfileByUsername(username: string): Promise<ForumProfile | null> {
  const { data } = await supabase
    .from("community_profiles")
    .select("user_id,username,display_name,bio")
    .ilike("username", username)
    .maybeSingle();
  return (data as ForumProfile | null) ?? null;
}

export async function getMyCommunityProfile(userId: string): Promise<ForumProfile | null> {
  const { data } = await supabase
    .from("community_profiles")
    .select("user_id,username,display_name,bio")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as ForumProfile | null) ?? null;
}

export async function getMyBlockedIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase.from("forum_blocks").select("blocked_id").eq("blocker_id", userId);
  return new Set((data ?? []).map((r) => r.blocked_id as string));
}

export async function getSignedMediaUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from("community-media").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function uploadCommunityImage(userId: string, file: File): Promise<string> {
  const ext = file.type === "image/png" ? "png" : "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("community-media").upload(path, file, { contentType: file.type });
  if (error) throw new Error(error.message);
  return path;
}

export async function getSessionUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}
