import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getModerationQueue, isForumModerator, moderateForumContent } from "@/lib/community/functions";
import { RequireSignIn, timeAgo } from "@/components/community/forum-ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/community/moderation")({
  head: () => ({
    meta: [
      { title: "Moderation · Rose AI Community" },
      { name: "description", content: "Community moderation queue." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ModerationPage,
});

type Queue = {
  reports: { id: string; reason: string; details: string; created_at: string; post_id: string | null; comment_id: string | null }[];
  posts: { id: string; title: string; body: string; status: string; author_id: string }[];
  comments: { id: string; body: string; status: string; author_id: string; post_id: string }[];
};

function ModerationPage() {
  return (
    <RequireSignIn>
      {() => <ModerationInner />}
    </RequireSignIn>
  );
}

function ModerationInner() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const { moderator } = await isForumModerator({ data: {} });
    setAllowed(moderator);
    if (moderator) setQueue((await getModerationQueue({ data: {} })) as Queue);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (allowed === null) return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;
  if (!allowed)
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">This area is for community moderators.</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/community">Back to community</Link>
        </Button>
      </div>
    );

  const act = async (key: string, action: string, target: { postId?: string; commentId?: string; reportId?: string }) => {
    setBusy(key);
    try {
      await moderateForumContent({ data: { action, ...target } });
      await reload();
    } finally {
      setBusy(null);
    }
  };

  const reports = queue?.reports ?? [];

  return (
    <div className="space-y-5">
      <div>
        <Link to="/community" className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Community
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <ShieldCheck className="h-6 w-6 text-primary" /> Moderation queue
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{reports.length} open report{reports.length === 1 ? "" : "s"}</p>
      </div>

      {reports.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nothing to review — all reports are handled.
        </p>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const post = queue?.posts.find((p) => p.id === r.post_id);
            const comment = queue?.comments.find((c) => c.id === r.comment_id);
            return (
              <div key={r.id} className="space-y-3 rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 font-medium text-destructive">{r.reason}</span>
                  <span>{timeAgo(r.created_at)}</span>
                </div>
                {r.details && <p className="text-xs text-muted-foreground">Reporter note: {r.details}</p>}
                {post && (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-sm font-semibold text-foreground">{post.title}</p>
                    <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{post.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Status: {post.status}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {post.status !== "hidden" ? (
                        <Button size="sm" variant="destructive" disabled={busy === r.id} onClick={() => act(r.id, "hide_post", { postId: post.id, reportId: r.id })}>
                          Hide post
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => act(r.id, "restore_post", { postId: post.id, reportId: r.id })}>
                          Restore post
                        </Button>
                      )}
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/community/post/$id" params={{ id: post.id }}>View</Link>
                      </Button>
                    </div>
                  </div>
                )}
                {comment && (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="line-clamp-3 text-xs text-muted-foreground">{comment.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Status: {comment.status}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {comment.status !== "hidden" ? (
                        <Button size="sm" variant="destructive" disabled={busy === r.id} onClick={() => act(r.id, "hide_comment", { commentId: comment.id, reportId: r.id })}>
                          Hide comment
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => act(r.id, "restore_comment", { commentId: comment.id, reportId: r.id })}>
                          Restore comment
                        </Button>
                      )}
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/community/post/$id" params={{ id: comment.post_id }}>View</Link>
                      </Button>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 border-t border-border pt-3">
                  <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => act(r.id, "resolve_report", { reportId: r.id })}>
                    Mark resolved
                  </Button>
                  <Button size="sm" variant="ghost" disabled={busy === r.id} onClick={() => act(r.id, "dismiss_report", { reportId: r.id })}>
                    Dismiss
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
