import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Flag, Heart, HandHeart, Lightbulb, MessageCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getSignedMediaUrl, type ForumPost } from "@/lib/community/queries";
import { REACTION_KINDS, REPORT_REASONS, type ReactionKind, type ReportReason } from "@/lib/community/rules";
import { reportForumContent } from "@/lib/community/functions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function timeAgo(iso: string): string {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function CommunityNotice() {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-card p-3.5 text-xs text-muted-foreground">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <p>
        A kind, educational space — not medical advice. Never share personal details like emails, phone numbers or
        private photos. <Link to="/community/guidelines" className="font-medium text-primary underline">Community guidelines</Link>
      </p>
    </div>
  );
}

export function PostCard({ post, commentCount }: { post: ForumPost; commentCount?: number | undefined }) {
  const author = post.community_profiles;
  return (
    <Link
      to="/community/post/$id"
      params={{ id: post.id }}
      className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-full bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">
          {post.forum_categories?.name ?? "Community"}
        </span>
        <span>{timeAgo(post.created_at)}</span>
      </div>
      <h3 className="mt-2 font-semibold leading-snug text-foreground">{post.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.body}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        {author ? (
          <span className="font-medium text-foreground/80">{author.display_name} · @{author.username}</span>
        ) : (
          <span>Community member</span>
        )}
        <span className="flex items-center gap-1">
          <MessageCircle className="h-3.5 w-3.5" /> {commentCount ?? 0}
        </span>
      </div>
    </Link>
  );
}

const REACTION_ICONS: Record<ReactionKind, typeof Heart> = { heart: Heart, support: HandHeart, helpful: Lightbulb };
const REACTION_LABELS: Record<ReactionKind, string> = { heart: "Love", support: "Support", helpful: "Helpful" };

export function ReactionBar({
  targetKey,
  counts,
  mine,
  onToggle,
  disabled,
}: {
  targetKey: string;
  counts: Record<string, number>;
  mine: Set<string>;
  onToggle: (kind: ReactionKind) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {REACTION_KINDS.map((kind) => {
        const Icon = REACTION_ICONS[kind];
        const key = `${targetKey}:${kind}`;
        const active = mine.has(key);
        return (
          <button
            key={kind}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(kind)}
            title={REACTION_LABELS[kind]}
            className={cn(
              "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
              active
                ? "border-primary bg-primary/10 font-medium text-primary"
                : "border-border text-muted-foreground hover:border-primary/40",
              disabled && "opacity-50",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {counts[key] ?? 0}
          </button>
        );
      })}
    </div>
  );
}

export function ReportButton({ postId, commentId, signedIn }: { postId?: string; commentId?: string; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const submit = async () => {
    setState("sending");
    try {
      await reportForumContent({ data: { ...(postId ? { postId } : {}), ...(commentId ? { commentId } : {}), reason, details } });
      setState("done");
    } catch {
      setState("error");
    }
  };

  if (!signedIn) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <Flag className="h-3.5 w-3.5" /> Report
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Report this content</DialogTitle>
          </DialogHeader>
          {state === "done" ? (
            <p className="text-sm text-muted-foreground">Thank you. Our moderation team will review this.</p>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                {REPORT_REASONS.map((r) => (
                  <label key={r} className="flex items-center gap-2 text-sm">
                    <input type="radio" name="report-reason" checked={reason === r} onChange={() => setReason(r)} />
                    {r === "spam" && "Spam or advertising"}
                    {r === "harassment" && "Harassment or unkind behaviour"}
                    {r === "medical-advice" && "Harmful medical advice"}
                    {r === "personal-info" && "Shares personal information"}
                    {r === "other" && "Something else"}
                  </label>
                ))}
              </div>
              <Textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Anything else we should know? (optional)" rows={3} />
              {state === "error" && <p className="text-xs text-destructive">Couldn't send the report. Please try again.</p>}
              <Button onClick={submit} disabled={state === "sending"} className="w-full">
                {state === "sending" ? "Sending…" : "Send report"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function SignedImage({ path, alt }: { path: string; alt: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    getSignedMediaUrl(path).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [path]);
  if (!url) return <div className="h-48 w-full animate-pulse rounded-2xl bg-muted" />;
  return <img src={url} alt={alt} className="w-full rounded-2xl object-cover" />;
}

/** Renders children only for signed-in users; otherwise a sign-in prompt. */
export function RequireSignIn({ children }: { children: (userId: string) => ReactNode }) {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setUserId(data.session?.user.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT") return;
      supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);
  if (userId === undefined) return <div className="h-24 animate-pulse rounded-2xl bg-muted" />;
  if (userId === null)
    return (
      <div className="rounded-2xl border border-border bg-card p-5 text-center">
        <p className="text-sm text-muted-foreground">Sign in to join the conversation.</p>
        <Button asChild className="mt-3">
          <Link to="/welcome">Sign in</Link>
        </Button>
      </div>
    );
  return <>{children(userId)}</>;
}
