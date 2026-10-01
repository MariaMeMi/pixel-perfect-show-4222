const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-xs text-destructive">Payments aren't live yet.</div>;
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="rounded-2xl border border-border bg-accent px-4 py-2 text-center text-xs text-accent-foreground">
        All payments made in the preview are in test mode.{" "}
        <a href="https://docs.lovable.dev/features/payments#test-and-live-environments" target="_blank" rel="noopener noreferrer" className="underline">Read more</a>
      </div>
    );
  }
  return null;
}
