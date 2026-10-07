import type { Plan } from "@/lib/data/workspace";

export type PlanInfo = {
  id: Plan;
  name: string;
  price: number;
  lookupKey: string | null;
  tagline: string;
  /** Byte limits copy private.plan_limit() exactly, so the meter and the database agree. */
  limits: { clients: number | null; team: number | null; storageBytes: number; aiPerMonth: number };
  features: string[];
};

/** Mirrors private.plan_limit() in the database, which is what actually enforces the limits. */
export const PLANS: PlanInfo[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    lookupKey: null,
    tagline: "For trying Relaydesk with your first clients.",
    limits: { clients: 2, team: 2, storageBytes: 262_144_000, aiPerMonth: 0 },
    features: ["2 client spaces", "2 team seats", "250 MB storage", "Unlimited client users"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    lookupKey: "relaydesk_pro_monthly",
    tagline: "For a small studio with a full client roster.",
    limits: { clients: 15, team: 10, storageBytes: 21_474_836_480, aiPerMonth: 50 },
    features: ["15 client spaces", "10 team seats", "20 GB storage", "AI revision checklists (50 a month)"],
  },
  {
    id: "studio",
    name: "Studio",
    price: 79,
    lookupKey: "relaydesk_studio_monthly",
    tagline: "For agencies that never want to think about limits.",
    limits: { clients: null, team: null, storageBytes: 107_374_182_400, aiPerMonth: 300 },
    features: ["Unlimited client spaces", "Unlimited team seats", "100 GB storage", "AI revision checklists (300 a month)"],
  },
];

export const planById = (id: Plan) => PLANS.find((p) => p.id === id)!;
export const planByLookupKey = (key: string | null | undefined) => PLANS.find((p) => p.lookupKey && p.lookupKey === key) ?? null;
