"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Field, inputClass } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ImagePicker } from "@/modules/communities/ui/image-picker";
import { createListingAction } from "@/modules/marketplace/actions";
import {
  LISTING_CATEGORIES,
  LISTING_CATEGORY_LABELS,
  MAX_LISTING_IMAGES,
} from "@/modules/marketplace/categories";
import type { FilterOptions } from "@/modules/marketplace/ui/listing-filters";

const PRICE_HINTS: Record<string, string> = {
  housing: "Monthly rent in CAD. Leave empty if it varies.",
  buy_sell: "Asking price in CAD. Leave empty for free items.",
};

export function CreateListingForm({ options }: { options: FilterOptions }) {
  const [state, formAction] = useActionState(createListingAction, {});
  const [category, setCategory] = useState(
    state.values?.category ?? "housing",
  );
  const [provinceCode, setProvinceCode] = useState(
    state.values?.provinceCode ?? "",
  );

  const cities = provinceCode
    ? options.cities.filter((city) => city.provinceCode === provinceCode)
    : [];

  return (
    <form action={formAction} className="card flex flex-col gap-4">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <Field label="Category" htmlFor="category" error={state.fieldErrors?.category}>
        <select
          id="category"
          name="category"
          className={inputClass}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          {LISTING_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {LISTING_CATEGORY_LABELS[value]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Title" htmlFor="title" error={state.fieldErrors?.title}>
        <input
          id="title"
          name="title"
          className={inputClass}
          placeholder="Bright 1-bedroom near Broadway station"
          defaultValue={state.values?.title ?? ""}
        />
      </Field>

      <Field
        label="Description"
        htmlFor="description"
        error={state.fieldErrors?.description}
      >
        <textarea
          id="description"
          name="description"
          rows={6}
          className={inputClass}
          placeholder="Everything a newcomer should know before contacting you."
          defaultValue={state.values?.description ?? ""}
        />
      </Field>

      <Field
        label="Price (CAD)"
        htmlFor="price"
        error={state.fieldErrors?.price}
        hint={PRICE_HINTS[category]}
      >
        <input
          id="price"
          name="price"
          type="number"
          min="0"
          step="1"
          className={inputClass}
          placeholder="1800"
          defaultValue={state.values?.price ?? ""}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Province"
          htmlFor="provinceCode"
          error={state.fieldErrors?.provinceCode}
        >
          <select
            id="provinceCode"
            name="provinceCode"
            className={inputClass}
            value={provinceCode}
            onChange={(event) => setProvinceCode(event.target.value)}
          >
            <option value="">Select…</option>
            {options.provinces.map((province) => (
              <option key={province.code} value={province.code}>
                {province.nameEn}
              </option>
            ))}
          </select>
        </Field>

        <Field label="City" htmlFor="cityId" error={state.fieldErrors?.cityId}>
          <select
            id="cityId"
            name="cityId"
            className={inputClass}
            defaultValue={state.values?.cityId ?? ""}
            disabled={cities.length === 0}
          >
            <option value="">Select…</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="Community (optional)"
        htmlFor="communityId"
        error={state.fieldErrors?.communityId}
        hint="Link the listing to a community so its members find it faster."
      >
        <select
          id="communityId"
          name="communityId"
          className={inputClass}
          defaultValue={state.values?.communityId ?? ""}
        >
          <option value="">No community</option>
          {options.communities.map((community) => (
            <option key={community.id} value={community.id}>
              {community.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Contact email"
          htmlFor="contactEmail"
          error={state.fieldErrors?.contactEmail}
          hint="Shown publicly. Email or phone is required."
        >
          <input
            id="contactEmail"
            name="contactEmail"
            type="email"
            className={inputClass}
            placeholder="you@example.com"
            defaultValue={state.values?.contactEmail ?? ""}
          />
        </Field>

        <Field
          label="Contact phone"
          htmlFor="contactPhone"
          error={state.fieldErrors?.contactPhone}
        >
          <input
            id="contactPhone"
            name="contactPhone"
            className={inputClass}
            placeholder="+1 604 555 0134"
            defaultValue={state.values?.contactPhone ?? ""}
          />
        </Field>
      </div>

      <Field label="Photos">
        <ImagePicker max={MAX_LISTING_IMAGES} />
      </Field>

      <div>
        <SubmitButton label="Publish listing" />
      </div>
    </form>
  );
}
