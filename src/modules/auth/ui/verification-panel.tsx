"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { VerificationBadge } from "@/components/ui/badge";
import { Field, inputClass } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  confirmPhoneVerificationAction,
  resendEmailVerificationAction,
  startPhoneVerificationAction,
} from "@/modules/auth/actions";
import type { ActionState } from "@/lib/forms";

function EmailSection({ email, verified }: { email: string; verified: boolean }) {
  const [state, formAction] = useActionState(
    async (): Promise<ActionState> => resendEmailVerificationAction(),
    {},
  );

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Email</h2>
          <p className="text-sm text-slate-600">{email}</p>
        </div>
        <VerificationBadge label="Email verified" verified={verified} />
      </div>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      {verified ? null : (
        <form action={formAction}>
          <SubmitButton label="Resend verification link" variant="secondary" />
        </form>
      )}
    </section>
  );
}

function PhoneSection({ phone, verified }: { phone: string | null; verified: boolean }) {
  const [startState, startAction] = useActionState(startPhoneVerificationAction, {});
  const [confirmState, confirmAction] = useActionState(confirmPhoneVerificationAction, {});

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Phone number</h2>
          <p className="text-sm text-slate-600">{phone ?? "Not added yet"}</p>
        </div>
        <VerificationBadge label="Phone verified" verified={verified} />
      </div>

      {verified ? null : (
        <>
          {startState.error ? <Alert tone="error">{startState.error}</Alert> : null}
          {startState.success ? <Alert tone="success">{startState.success}</Alert> : null}
          <form action={startAction} className="flex flex-col gap-3">
            <Field
              label="Phone number"
              htmlFor="phone"
              hint="Canadian or international format, e.g. +14165551234"
              error={startState.fieldErrors?.phone}
            >
              <input
                id="phone"
                name="phone"
                defaultValue={phone ?? ""}
                className={inputClass}
                autoComplete="tel"
              />
            </Field>
            <SubmitButton label="Send code" variant="secondary" />
          </form>

          {confirmState.error ? <Alert tone="error">{confirmState.error}</Alert> : null}
          {confirmState.success ? <Alert tone="success">{confirmState.success}</Alert> : null}
          <form action={confirmAction} className="flex flex-col gap-3">
            <Field label="6-digit code" htmlFor="code" error={confirmState.fieldErrors?.code}>
              <input
                id="code"
                name="code"
                inputMode="numeric"
                maxLength={6}
                className={inputClass}
              />
            </Field>
            <SubmitButton label="Verify phone" />
          </form>
        </>
      )}
    </section>
  );
}

export function VerificationPanel({
  email,
  emailVerified,
  phone,
  phoneVerified,
}: {
  email: string;
  emailVerified: boolean;
  phone: string | null;
  phoneVerified: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <EmailSection email={email} verified={emailVerified} />
      <PhoneSection phone={phone} verified={phoneVerified} />
    </div>
  );
}
