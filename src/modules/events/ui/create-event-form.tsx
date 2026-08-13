"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Field, inputClass } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ImagePicker } from "@/modules/communities/ui/image-picker";
import { createEventAction } from "@/modules/events/actions";
import {
  EVENT_TAGS,
  EVENT_TAG_LABELS,
  MAX_EVENT_IMAGES,
  MAX_EVENT_TAGS,
} from "@/modules/events/tags";

export function CreateEventForm() {
  const [state, formAction] = useActionState(createEventAction, {});

  return (
    <form action={formAction} className="card flex flex-col gap-4 p-5">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <Field label="Event name" htmlFor="title" error={state.fieldErrors?.title}>
        <input
          id="title"
          name="title"
          className={inputClass}
          placeholder="Sunday potluck for newcomers"
          defaultValue={state.values?.title ?? ""}
        />
      </Field>
      <Field
        label="What is it about?"
        htmlFor="description"
        error={state.fieldErrors?.description}
      >
        <textarea
          id="description"
          name="description"
          rows={5}
          className={inputClass}
          placeholder="What will happen, who it is for, what to bring, how to find the group…"
          defaultValue={state.values?.description ?? ""}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Date and time"
          htmlFor="startsAt"
          error={state.fieldErrors?.startsAt}
        >
          <input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            className={inputClass}
            defaultValue={state.values?.startsAt ?? ""}
          />
        </Field>
        <Field label="City" htmlFor="cityName" error={state.fieldErrors?.cityName}>
          <input
            id="cityName"
            name="cityName"
            className={inputClass}
            placeholder="Toronto"
            defaultValue={state.values?.cityName ?? ""}
          />
        </Field>
      </div>
      <Field
        label="Place"
        htmlFor="locationName"
        error={state.fieldErrors?.locationName}
        hint="Venue or meeting point — add the address if it helps people find you."
      >
        <input
          id="locationName"
          name="locationName"
          className={inputClass}
          placeholder="Toronto Reference Library, 789 Yonge St"
          defaultValue={state.values?.locationName ?? ""}
        />
      </Field>
      <Field
        label="Tags"
        error={state.fieldErrors?.tags}
        hint={`What the event is about — pick up to ${MAX_EVENT_TAGS}.`}
      >
        <div className="flex flex-wrap gap-2">
          {EVENT_TAGS.map((tag) => (
            <label
              key={tag}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-sky-400"
            >
              <input type="checkbox" name="tags" value={tag} className="size-3.5 accent-sky-600" />
              {EVENT_TAG_LABELS[tag]}
            </label>
          ))}
        </div>
      </Field>
      <ImagePicker max={MAX_EVENT_IMAGES} />
      <div>
        <SubmitButton label="Publish event" />
      </div>
    </form>
  );
}
