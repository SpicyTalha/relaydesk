"use server";

import type { FormState } from "@/lib/form-state";

// Implemented together with the demo seed (see docs/BLUEPRINT.md, decision 5).
export async function startDemo(): Promise<FormState> {
  return { error: "The demo is not set up on this environment yet." };
}
