"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Field, inputClass } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { MAX_COMMENT_IMAGES } from "@/lib/upload-limits";
import { createCommentAction } from "@/modules/communities/actions";
import { ImagePicker } from "@/modules/communities/ui/image-picker";

export function CommentForm({ postId }: { postId: number }) {
  const [state, formAction] = useActionState(createCommentAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <input type="hidden" name="postId" value={postId} />
      <Field label="Add a comment" htmlFor="body" error={state.fieldErrors?.body}>
        <textarea
          id="body"
          name="body"
          rows={3}
          className={inputClass}
          placeholder="Share what worked for you"
          defaultValue={state.success ? "" : (state.values?.body ?? "")}
        />
      </Field>
      <ImagePicker max={MAX_COMMENT_IMAGES} />
      <div>
        <SubmitButton label="Post comment" />
      </div>
    </form>
  );
}
