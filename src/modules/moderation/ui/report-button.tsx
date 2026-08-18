"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { inputClass } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { reportContentAction } from "@/modules/moderation/actions";

export function ReportButton({
  targetType,
  targetId,
}: {
  targetType: "post" | "comment" | "listing" | "event";
  targetId: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(reportContentAction, {});

  if (state.success) {
    return <p className="text-xs text-emerald-700">{state.success}</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-slate-500 underline-offset-2 hover:underline"
      >
        Report
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <textarea
        name="reason"
        rows={2}
        className={inputClass}
        placeholder="What is wrong with this content?"
      />
      {state.fieldErrors?.reason ? (
        <p className="text-xs text-rose-600">{state.fieldErrors.reason}</p>
      ) : null}
      <div className="flex items-center gap-2">
        <SubmitButton label="Send report" variant="secondary" />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-slate-500 underline-offset-2 hover:underline"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
