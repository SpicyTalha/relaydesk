import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { DeleteWorkspace, PasswordForm, ProfileForm, WorkspaceNameForm } from "@/components/settings-forms";
import { getProfile, getWorkspaceContext } from "@/lib/data/workspace";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage({ params }: PageProps<"/w/[slug]/settings">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-96 max-w-3xl" />}>
      <Settings params={params} />
    </Suspense>
  );
}

async function Settings({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [ws, profile] = await Promise.all([getWorkspaceContext(slug), getProfile()]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Settings" />
      <Card>
        <CardHeader>
          <CardTitle>Your profile</CardTitle>
          <CardDescription>Signed in as {profile.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm fullName={profile.fullName} />
        </CardContent>
      </Card>
      {!ws.isDemo && (
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>You&apos;ll need your current one. Forgot it? Sign out and use &ldquo;Forgot password?&rdquo;.</CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>
      )}
      {ws.isTeam && (
        <Card>
          <CardHeader>
            <CardTitle>Studio</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkspaceNameForm slug={slug} name={ws.name} disabled={!ws.isOwner} />
          </CardContent>
        </Card>
      )}
      {ws.isOwner && !ws.isDemo && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle>Delete studio</CardTitle>
            <CardDescription>Permanently removes every client space, file, comment and approval.</CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteWorkspace slug={slug} name={ws.name} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
