"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Field, inputClass } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { createCommunityAction } from "@/modules/communities/actions";

export function CreateCommunityForm() {
  const [state, formAction] = useActionState(createCommunityAction, {});

  return (
    <form action={formAction} className="card flex flex-col gap-4 p-5">
      <h2 className="text-sm font-semibold text-slate-900">Start a community</h2>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <Field label="Name" htmlFor="name" error={state.fieldErrors?.name}>
        <input
          id="name"
          name="name"
          className={inputClass}
          placeholder="Chileans in Vancouver"
          defaultValue={state.values?.name ?? ""}
        />
      </Field>
      <Field label="Description" htmlFor="description" error={state.fieldErrors?.description}>
        <input
          id="description"
          name="description"
          className={inputClass}
          placeholder="What is this community for?"
          defaultValue={state.values?.description ?? ""}
        />
      </Field>
      <Field label="Type" htmlFor="kind" error={state.fieldErrors?.kind}>
        <select id="kind" name="kind" className={inputClass} defaultValue="topic">
          <option value="topic">Topic</option>
          <option value="city">City</option>
          <option value="province">Province</option>
          <option value="origin">Country of origin</option>
        </select>
      </Field>
      <div>
        <SubmitButton label="Create community" />
      </div>
    </form>
  );
}
