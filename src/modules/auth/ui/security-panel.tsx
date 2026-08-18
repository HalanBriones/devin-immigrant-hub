"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { signOutOtherSessionsAction } from "@/modules/auth/actions";
import type { ActionState } from "@/lib/forms";

export function SecurityPanel({ activeSessions }: { activeSessions: number }) {
  const [state, formAction] = useActionState(
    async (): Promise<ActionState> => signOutOtherSessionsAction(),
    {},
  );

  return (
    <section className="card flex flex-col gap-3 p-5">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Signed-in devices</h2>
        <p className="text-sm text-slate-600">
          {activeSessions} active {activeSessions === 1 ? "session" : "sessions"}. Sessions
          expire after 14 days.
        </p>
      </div>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <form action={formAction}>
        <SubmitButton label="Sign out other devices" variant="secondary" />
      </form>
    </section>
  );
}
