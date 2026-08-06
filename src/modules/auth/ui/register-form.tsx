"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Field, inputClass } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { registerAction } from "@/modules/auth/actions";

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <Field label="Display name" htmlFor="displayName" error={state.fieldErrors?.displayName}>
        <input id="displayName" name="displayName" className={inputClass} autoComplete="name" />
      </Field>
      <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
        <input id="email" name="email" type="email" className={inputClass} autoComplete="email" />
      </Field>
      <Field
        label="Password"
        htmlFor="password"
        hint="At least 10 characters."
        error={state.fieldErrors?.password}
      >
        <input
          id="password"
          name="password"
          type="password"
          className={inputClass}
          autoComplete="new-password"
        />
      </Field>
      <SubmitButton label="Create account" />
    </form>
  );
}
