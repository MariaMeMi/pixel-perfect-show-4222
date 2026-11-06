import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { RequireSignIn } from "@/components/community/forum-ui";
import { PostForm } from "@/components/community/PostForm";

export const Route = createFileRoute("/community/new")({
  head: () => ({
    meta: [
      { title: "New post · Rose AI Community" },
      { name: "description", content: "Start a discussion in the Rose AI community." },
      { property: "og:title", content: "New post · Rose AI Community" },
      { property: "og:description", content: "Start a discussion in the Rose AI community." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewPostPage,
});

function NewPostPage() {
  return (
    <div className="space-y-5">
      <div>
        <Link to="/community" className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Community
        </Link>
        <h1 className="text-2xl font-bold text-foreground">New post</h1>
      </div>
      <RequireSignIn>{(userId) => <PostForm userId={userId} />}</RequireSignIn>
    </div>
  );
}
