import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { getPost, type ForumPost } from "@/lib/community/queries";
import { RequireSignIn } from "@/components/community/forum-ui";
import { PostForm } from "@/components/community/PostForm";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/community/edit/$id")({
  head: () => ({
    meta: [
      { title: "Edit post · Rose AI Community" },
      { name: "description", content: "Edit your community post." },
      { property: "og:title", content: "Edit post · Rose AI Community" },
      { property: "og:description", content: "Edit your community post." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditPostPage,
});

function EditPostPage() {
  const { id } = Route.useParams();
  const [post, setPost] = useState<ForumPost | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getPost(id).then((p) => {
      if (!cancelled) setPost(p);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (post === undefined) return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;
  if (post === null)
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">This post doesn't exist.</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/community">Back to community</Link>
        </Button>
      </div>
    );

  return (
    <div className="space-y-5">
      <div>
        <Link to="/community/post/$id" params={{ id }} className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to post
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Edit post</h1>
      </div>
      <RequireSignIn>
        {(userId) =>
          userId === post.author_id ? (
            <PostForm
              userId={userId}
              editPost={{ id: post.id, title: post.title, body: post.body, categorySlug: post.forum_categories?.slug ?? "" }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">You can only edit your own posts.</p>
          )
        }
      </RequireSignIn>
    </div>
  );
}
