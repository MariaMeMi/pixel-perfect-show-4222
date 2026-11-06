import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ImagePlus, X } from "lucide-react";
import { listCategories, getMyCommunityProfile, uploadCommunityImage, type ForumCategory } from "@/lib/community/queries";
import { createForumPost, ensureCommunityProfile, updateForumPost } from "@/lib/community/functions";
import { validatePost, validateUsername, TITLE_MAX, BODY_MAX } from "@/lib/community/rules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function PostForm({
  userId,
  editPost,
}: {
  userId: string;
  editPost?: { id: string; title: string; body: string; categorySlug: string };
}) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [categorySlug, setCategorySlug] = useState(editPost?.categorySlug ?? "");
  const [title, setTitle] = useState(editPost?.title ?? "");
  const [body, setBody] = useState(editPost?.body ?? "");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [cats, profile] = await Promise.all([listCategories(), getMyCommunityProfile(userId)]);
      if (cancelled) return;
      setCategories(cats);
      setHasProfile(Boolean(profile));
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const pickImage = (file: File | null) => {
    setImage(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
    if (!file) setConsent(false);
  };

  const submit = async () => {
    setError(null);
    if (hasProfile === false) {
      const usernameError = validateUsername(username.trim().toLowerCase());
      if (usernameError) {
        setError("Choose a username of 3–20 lowercase letters, numbers or underscores.");
        return;
      }
      if (!displayName.trim()) {
        setError("Choose a display name — this is shown instead of your real name.");
        return;
      }
    }
    if (!categorySlug) {
      setError("Please choose a category.");
      return;
    }
    if (validatePost(title, body)) {
      setError(`Title needs ${TITLE_MAX} characters or fewer (3 minimum) and the post can't be empty (${BODY_MAX} max).`);
      return;
    }
    if (image && !consent) {
      setError("Please confirm you have the right to share this photo.");
      return;
    }
    setSaving(true);
    try {
      if (hasProfile === false) {
        await ensureCommunityProfile({ data: { username: username.trim().toLowerCase(), displayName: displayName.trim() } });
      }
      if (editPost) {
        await updateForumPost({ data: { id: editPost.id, title, body } });
        navigate({ to: "/community/post/$id", params: { id: editPost.id } });
        return;
      }
      let imagePath: string | undefined;
      if (image) imagePath = await uploadCommunityImage(userId, image);
      const { id } = await createForumPost({ data: { categorySlug, title, body, ...(imagePath ? { imagePath } : {}) } });
      navigate({ to: "/community/post/$id", params: { id } });
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      if (message === "rate_limited") setError("You're posting too quickly — please wait a little and try again.");
      else if (message === "community.usernameTaken") setError("That username is taken — try another one.");
      else setError("Couldn't save your post. Please try again.");
      setSaving(false);
    }
  };

  if (hasProfile === null) return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;

  return (
    <div className="space-y-4">
      {hasProfile === false && (
        <div className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <h2 className="text-sm font-semibold text-foreground">Choose your community name</h2>
          <p className="text-xs text-muted-foreground">
            The community is pseudonymous — your real name, email and skin data are never shown.
          </p>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name (e.g. Rose)" maxLength={40} />
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username (lowercase, 3–20 characters)" maxLength={20} />
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-foreground">Category</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={Boolean(editPost)}
              onClick={() => setCategorySlug(c.slug)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                categorySlug === c.slug ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40",
                editPost && "opacity-60",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give your post a title" maxLength={TITLE_MAX} />
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share your experience, question or tip…" rows={7} maxLength={BODY_MAX} />

      {!editPost && (
        <div className="space-y-2">
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => pickImage(e.target.files?.[0] ?? null)}
          />
          {imagePreview ? (
            <div className="relative">
              <img src={imagePreview} alt="Selected to upload" className="max-h-56 w-full rounded-2xl object-cover" />
              <button
                type="button"
                onClick={() => pickImage(null)}
                className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 text-muted-foreground shadow"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground hover:border-primary/40"
            >
              <ImagePlus className="h-4 w-4" /> Add a photo (optional)
            </button>
          )}
          {image && (
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
              I have the right to share this photo and I consent to publishing it in the community. I won't upload photos of
              other people without their permission.
            </label>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={submit} disabled={saving} className="w-full">
        {saving ? "Saving…" : editPost ? "Save changes" : "Publish post"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Educational space — please don't give or ask for medical advice, doses or diagnoses.
      </p>
    </div>
  );
}
