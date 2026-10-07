import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/** One Stripe client instance per server process, pinned to the SDK's API version. */
export function stripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
    client = new Stripe(key, { appInfo: { name: "Relaydesk (sample project)" }, maxNetworkRetries: 2 });
  }
  return client;
}

/** Tags Checkout Sessions so this flow can be compared in the Stripe Dashboard. */
export const CHECKOUT_INTEGRATION_ID = "relaydesk_upgrade_kqvmtzpl";
