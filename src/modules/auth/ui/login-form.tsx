"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Field, inputClass } from "@/components/ui/field";
import { loginAction } from "@/modules/auth/actions";
import { SubmitButton } from "@/components/ui/submit-button";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
        <input id="email" name="email" type="email" className={inputClass} autoComplete="email" />
      </Field>
      <Field label="Password" htmlFor="password" error={state.fieldErrors?.password}>
        <input
          id="password"
          name="password"
          type="password"
          className={inputClass}
          autoComplete="current-password"
        />
      </Field>
      <SubmitButton label="Sign in" />
    </form>
  );
}
