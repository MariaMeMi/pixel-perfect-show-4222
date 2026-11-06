import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  validateUsername,
  validatePost,
  validateComment,
  isReportReason,
  isReactionKind,
  BIO_MAX,
} from "./rules";

type ServerCtx = {
  supabase: any;
  userId: string;
};

async function consumeLimit(ctx: ServerCtx, action: string, max: number, seconds: number): Promise<void> {
  const { data, error } = await ctx.supabase.rpc("forum_consume_limit", {
    k: `${action}:${ctx.userId}`,
    max_requests: max,
    seconds,
  });
  if (error) throw new Error(error.message);
  if (data !== true) throw new Error("rate_limited");
}

async function requireModerator(ctx: ServerCtx): Promise<void> {
  const { data, error } = await ctx.supabase.rpc("is_forum_moderator");
  if (error) throw new Error(error.message);
  if (data !== true) throw new Error("forbidden");
}

export const ensureCommunityProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { username: string; displayName: string; bio?: string }) => d)
  .handler(async ({ data, context }) => {
    const ctx = context as ServerCtx;
    const username = data.username.trim().toLowerCase();
    const displayName = data.displayName.trim().slice(0, 40);
    const bio = (data.bio ?? "").trim().slice(0, BIO_MAX);
    const usernameError = validateUsername(username);
    if (usernameError || !displayName) throw new Error(usernameError ?? "community.displayNameInvalid");
    await consumeLimit(ctx, "profile", 10, 3600);
    const { data: existing } = await ctx.supabase
      .from("community_profiles")
      .select("user_id")
      .ilike("username", username)
      .maybeSingle();
    if (existing && existing.user_id !== ctx.userId) throw new Error("community.usernameTaken");
    const { error } = await ctx.supabase.from("community_profiles").upsert(
      { user_id: ctx.userId, username, display_name: displayName, bio },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { username };
  });

export const createForumPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { categorySlug: string; title: string; body: string; imagePath?: string }) => d)
  .handler(async ({ data, context }) => {
    const ctx = context as ServerCtx;
    const postError = validatePost(data.title, data.body);
    if (postError) throw new Error(postError);
    if (data.imagePath && !data.imagePath.startsWith(`${ctx.userId}/`)) throw new Error("invalid_image");
    await consumeLimit(ctx, "post", 5, 3600);
    const { data: category, error: catError } = await ctx.supabase
      .from("forum_categories")
      .select("id")
      .eq("slug", data.categorySlug)
      .maybeSingle();
    if (catError || !category) throw new Error("community.categoryMissing");
    const { data: post, error } = await ctx.supabase
      .from("forum_posts")
      .insert({
        author_id: ctx.userId,
        category_id: category.id,
        title: data.title.trim(),
        body: data.body.trim(),
        image_path: data.imagePath ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: post.id as string };
  });

export const updateForumPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; title: string; body: string }) => d)
  .handler(async ({ data, context }) => {
    const ctx = context as ServerCtx;
    const postError = validatePost(data.title, data.body);
    if (postError) throw new Error(postError);
    const { error } = await ctx.supabase
      .from("forum_posts")
      .update({ title: data.title.trim(), body: data.body.trim() })
      .eq("id", data.id)
      .eq("author_id", ctx.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteForumPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const ctx = context as ServerCtx;
    const { error } = await ctx.supabase
      .from("forum_posts")
      .update({ status: "deleted" })
      .eq("id", data.id)
      .eq("author_id", ctx.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addForumComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { postId: string; parentId?: string; body: string }) => d)
  .handler(async ({ data, context }) => {
    const ctx = context as ServerCtx;
    const commentError = validateComment(data.body);
    if (commentError) throw new Error(commentError);
    await consumeLimit(ctx, "comment", 20, 3600);
    const { data: post } = await ctx.supabase
      .from("forum_posts")
      .select("id")
      .eq("id", data.postId)
      .eq("status", "visible")
      .maybeSingle();
    if (!post) throw new Error("community.postMissing");
    const { data: comment, error } = await ctx.supabase
      .from("forum_comments")
      .insert({
        post_id: data.postId,
        author_id: ctx.userId,
        parent_id: data.parentId ?? null,
        body: data.body.trim(),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: comment.id as string };
  });

export const deleteForumComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const ctx = context as ServerCtx;
    const { error } = await ctx.supabase
      .from("forum_comments")
      .update({ status: "deleted" })
      .eq("id", data.id)
      .eq("author_id", ctx.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleForumReaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { postId?: string; commentId?: string; kind: string }) => d)
  .handler(async ({ data, context }) => {
    const ctx = context as ServerCtx;
    if (!isReactionKind(data.kind)) throw new Error("invalid_kind");
    if (!data.postId && !data.commentId) throw new Error("invalid_target");
    await consumeLimit(ctx, "reaction", 120, 3600);
    const match = {
      user_id: ctx.userId,
      kind: data.kind,
      ...(data.postId ? { post_id: data.postId } : { comment_id: data.commentId }),
    };
    const { data: existing } = await ctx.supabase.from("forum_reactions").select("id").match(match).maybeSingle();
    if (existing) {
      const { error } = await ctx.supabase.from("forum_reactions").delete().eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { active: false };
    }
    const { error } = await ctx.supabase.from("forum_reactions").insert(match);
    if (error) throw new Error(error.message);
    return { active: true };
  });

export const reportForumContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { postId?: string; commentId?: string; reason: string; details?: string }) => d)
  .handler(async ({ data, context }) => {
    const ctx = context as ServerCtx;
    if (!isReportReason(data.reason)) throw new Error("invalid_reason");
    if (!data.postId && !data.commentId) throw new Error("invalid_target");
    await consumeLimit(ctx, "report", 10, 3600);
    const { error } = await ctx.supabase.from("forum_reports").insert({
      reporter_id: ctx.userId,
      post_id: data.postId ?? null,
      comment_id: data.commentId ?? null,
      reason: data.reason,
      details: (data.details ?? "").trim().slice(0, 500),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setForumBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; block: boolean }) => d)
  .handler(async ({ data, context }) => {
    const ctx = context as ServerCtx;
    if (data.userId === ctx.userId) throw new Error("invalid_target");
    if (data.block) {
      const { error } = await ctx.supabase
        .from("forum_blocks")
        .upsert({ blocker_id: ctx.userId, blocked_id: data.userId }, { onConflict: "blocker_id,blocked_id" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await ctx.supabase
        .from("forum_blocks")
        .delete()
        .eq("blocker_id", ctx.userId)
        .eq("blocked_id", data.userId);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

const MOD_ACTIONS = ["hide_post", "restore_post", "hide_comment", "restore_comment", "resolve_report", "dismiss_report"] as const;

export const moderateForumContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { action: string; postId?: string; commentId?: string; reportId?: string; note?: string }) => d)
  .handler(async ({ data, context }) => {
    const ctx = context as ServerCtx;
    if (!(MOD_ACTIONS as readonly string[]).includes(data.action)) throw new Error("invalid_action");
    await requireModerator(ctx);
    if (data.action === "hide_post" || data.action === "restore_post") {
      if (!data.postId) throw new Error("invalid_target");
      const { error } = await ctx.supabase
        .from("forum_posts")
        .update({ status: data.action === "hide_post" ? "hidden" : "visible" })
        .eq("id", data.postId);
      if (error) throw new Error(error.message);
    } else if (data.action === "hide_comment" || data.action === "restore_comment") {
      if (!data.commentId) throw new Error("invalid_target");
      const { error } = await ctx.supabase
        .from("forum_comments")
        .update({ status: data.action === "hide_comment" ? "hidden" : "visible" })
        .eq("id", data.commentId);
      if (error) throw new Error(error.message);
    } else {
      if (!data.reportId) throw new Error("invalid_target");
      const { error } = await ctx.supabase
        .from("forum_reports")
        .update({ status: data.action === "resolve_report" ? "resolved" : "dismissed" })
        .eq("id", data.reportId);
      if (error) throw new Error(error.message);
    }
    const { error: logError } = await ctx.supabase.from("forum_moderation_actions").insert({
      moderator_id: ctx.userId,
      action: data.action,
      post_id: data.postId ?? null,
      comment_id: data.commentId ?? null,
      report_id: data.reportId ?? null,
      note: (data.note ?? "").trim().slice(0, 500),
    });
    if (logError) throw new Error(logError.message);
    return { ok: true };
  });

export const getModerationQueue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as ServerCtx;
    await requireModerator(ctx);
    const { data: reports, error } = await ctx.supabase
      .from("forum_reports")
      .select("id, reason, details, status, created_at, post_id, comment_id")
      .eq("status", "open")
      .order("created_at", { ascending: true })
      .limit(100);
    if (error) throw new Error(error.message);
    const postIds = [...new Set((reports ?? []).map((r: any) => r.post_id).filter(Boolean))];
    const commentIds = [...new Set((reports ?? []).map((r: any) => r.comment_id).filter(Boolean))];
    const posts = postIds.length
      ? (await ctx.supabase.from("forum_posts").select("id, title, body, status, author_id").in("id", postIds)).data ?? []
      : [];
    const comments = commentIds.length
      ? (await ctx.supabase.from("forum_comments").select("id, body, status, author_id, post_id").in("id", commentIds)).data ?? []
      : [];
    return { reports: reports ?? [], posts, comments };
  });

export const isForumModerator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as ServerCtx;
    const { data } = await ctx.supabase.rpc("is_forum_moderator");
    return { moderator: data === true };
  });
