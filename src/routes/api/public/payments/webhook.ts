import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import { grantPlus, isPaidPlusSession } from "@/lib/plus.server";
import { recordPayment, recordRefund, upsertSubscription } from "@/lib/pro/pro.server";

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") return Response.json({ received: true, ignored: "invalid env" });
        const env: StripeEnv = rawEnv;
        try {
          const event = await verifyWebhook(request, env);
          const o = event.data.object;
          switch (event.type) {
            case "checkout.session.completed":
            case "checkout.session.async_payment_succeeded": {
              const userId = o.metadata?.userId;
              if (userId && isPaidPlusSession(o)) await grantPlus(userId, o, env);
              break;
            }
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted":
              if (o.metadata?.product === "rosea_pro") await upsertSubscription(o, env);
              break;
            case "invoice.paid":
              await recordPayment(o, env);
              break;
            case "charge.refunded":
              await recordRefund(o, env);
              break;
          }
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
