/** Shape every form Server Action returns, so forms can show errors without a reload. */
export type FormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  /** Echoed back so a failed submit doesn't wipe what the user typed. */
  values?: Record<string, string>;
  success?: string;
};

export const initialFormState: FormState = {};

export function fieldErrorsOf(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
