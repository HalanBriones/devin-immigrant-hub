"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Field, inputClass } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { createCommunityAction } from "@/modules/communities/actions";
import {
  COMMUNITY_TAGS,
  COMMUNITY_TAG_LABELS,
  MAX_COMMUNITY_TAGS,
} from "@/modules/communities/tags";

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
      <Field
        label="Tags"
        error={state.fieldErrors?.tags}
        hint={`What the community is about — pick up to ${MAX_COMMUNITY_TAGS}.`}
      >
        <div className="flex flex-wrap gap-2">
          {COMMUNITY_TAGS.map((tag) => (
            <label
              key={tag}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-sky-400"
            >
              <input type="checkbox" name="tags" value={tag} className="size-3.5 accent-sky-600" />
              {COMMUNITY_TAG_LABELS[tag]}
            </label>
          ))}
        </div>
      </Field>
      <div>
        <SubmitButton label="Create community" />
      </div>
    </form>
  );
}
