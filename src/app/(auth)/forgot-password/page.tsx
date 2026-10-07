import type { Metadata } from "next";
import { AuthHeading } from "@/components/auth/signup-steps";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-8">
      <AuthHeading title="Forgot your password?">Enter the email you signed up with and we&apos;ll send you a link to set a new one.</AuthHeading>
      <ForgotPasswordForm />
    </div>
  );
}
