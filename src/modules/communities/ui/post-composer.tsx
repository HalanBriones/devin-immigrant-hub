"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Field, inputClass } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { MAX_POST_IMAGES } from "@/lib/upload-limits";
import { createPostAction } from "@/modules/communities/actions";
import { ImagePicker } from "@/modules/communities/ui/image-picker";

export function PostComposer({ communityId }: { communityId: number }) {
  const [state, formAction] = useActionState(createPostAction, {});

  return (
    <form action={formAction} className="card flex flex-col gap-4 p-5">
      <h2 className="text-sm font-semibold text-slate-900">Start a discussion</h2>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <input type="hidden" name="communityId" value={communityId} />
      <Field label="Title" htmlFor="title" error={state.fieldErrors?.title}>
        <input
          id="title"
          name="title"
          className={inputClass}
          placeholder="Ask a question or share something useful"
          defaultValue={state.success ? "" : (state.values?.title ?? "")}
        />
      </Field>
      <Field label="Details" htmlFor="body" error={state.fieldErrors?.body}>
        <textarea
          id="body"
          name="body"
          rows={4}
          className={inputClass}
          defaultValue={state.success ? "" : (state.values?.body ?? "")}
        />
      </Field>
      <ImagePicker max={MAX_POST_IMAGES} />
      <div>
        <SubmitButton label="Publish post" />
      </div>
    </form>
  );
}
