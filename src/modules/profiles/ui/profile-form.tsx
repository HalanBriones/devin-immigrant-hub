"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Field, inputClass } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { COUNTRIES } from "@/lib/countries";
import { updateProfileAction } from "@/modules/profiles/actions";
import type { PublicProfile } from "@/modules/profiles/queries";

export type ProfileFormOptions = {
  provinces: { code: string; nameEn: string }[];
  cities: { id: number; name: string; provinceCode: string }[];
  languages: { code: string; nameEn: string }[];
  interests: { id: number; nameEn: string }[];
};

export function ProfileForm({
  profile,
  options,
  submitLabel = "Save profile",
}: {
  profile: PublicProfile;
  options: ProfileFormOptions;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(updateProfileAction, {});
  const [provinceCode, setProvinceCode] = useState(profile.provinceCode ?? "");
  const citiesForProvince = options.cities.filter((city) => city.provinceCode === provinceCode);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Display name" htmlFor="displayName" error={state.fieldErrors?.displayName}>
          <input
            id="displayName"
            name="displayName"
            defaultValue={profile.displayName}
            className={inputClass}
          />
        </Field>
        <Field
          label="Handle"
          htmlFor="handle"
          hint="Your public profile lives at /u/handle"
          error={state.fieldErrors?.handle}
        >
          <input
            id="handle"
            name="handle"
            defaultValue={profile.handle}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Bio" htmlFor="bio" error={state.fieldErrors?.bio}>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={profile.bio ?? ""}
          className={inputClass}
          placeholder="Tell the community who you are and how you can help."
        />
      </Field>

      <Field label="Profile photo URL" htmlFor="avatarUrl" error={state.fieldErrors?.avatarUrl}>
        <input
          id="avatarUrl"
          name="avatarUrl"
          defaultValue={profile.avatarUrl ?? ""}
          className={inputClass}
          placeholder="https://…"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field
          label="Country of origin"
          htmlFor="countryOfOrigin"
          error={state.fieldErrors?.countryOfOrigin}
        >
          <select
            id="countryOfOrigin"
            name="countryOfOrigin"
            defaultValue={profile.countryOfOrigin ?? ""}
            className={inputClass}
          >
            <option value="">Select…</option>
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Province" htmlFor="provinceCode" error={state.fieldErrors?.provinceCode}>
          <select
            id="provinceCode"
            name="provinceCode"
            value={provinceCode}
            onChange={(event) => setProvinceCode(event.target.value)}
            className={inputClass}
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
            defaultValue={profile.cityId ? String(profile.cityId) : ""}
            className={inputClass}
            disabled={citiesForProvince.length === 0}
          >
            <option value="">Select…</option>
            {citiesForProvince.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="Occupation (optional)"
        htmlFor="occupation"
        error={state.fieldErrors?.occupation}
      >
        <input
          id="occupation"
          name="occupation"
          defaultValue={profile.occupation ?? ""}
          className={inputClass}
        />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-slate-700">Languages spoken</legend>
        <div className="flex flex-wrap gap-2">
          {options.languages.map((language) => (
            <label
              key={language.code}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                name="languages"
                value={language.code}
                defaultChecked={profile.languages.includes(language.code)}
              />
              {language.nameEn}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-slate-700">Interests</legend>
        <div className="flex flex-wrap gap-2">
          {options.interests.map((interest) => (
            <label
              key={interest.id}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                name="interests"
                value={interest.id}
                defaultChecked={profile.interests.includes(interest.id)}
              />
              {interest.nameEn}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
