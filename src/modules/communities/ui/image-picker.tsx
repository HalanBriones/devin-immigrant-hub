"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/upload-limits";

export function ImagePicker({ max }: { max: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [names, setNames] = useState<string[]>([]);
  const [tooMany, setTooMany] = useState(false);
  const { pending } = useFormStatus();

  // React resets the file input once the action settles, so drop the filenames with it.
  useEffect(() => {
    if (!pending) return;
    return () => {
      setNames([]);
      setTooMany(false);
    };
  }, [pending]);

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length > max) {
      setTooMany(true);
      event.target.value = "";
      setNames([]);
      return;
    }
    setTooMany(false);
    setNames(files.map((file) => file.name));
  }

  function clear() {
    if (inputRef.current) inputRef.current.value = "";
    setNames([]);
    setTooMany(false);
  }

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 transition-colors hover:border-sky-300 hover:text-sky-700">
        <span aria-hidden>🖼</span>
        Add photos
        <input
          ref={inputRef}
          type="file"
          name="images"
          accept={ACCEPTED_IMAGE_TYPES}
          multiple={max > 1}
          onChange={onChange}
          className="sr-only"
        />
      </label>
      {tooMany ? (
        <p className="text-xs text-rose-600">
          Choose at most {max} {max === 1 ? "image" : "images"}.
        </p>
      ) : (
        <p className="text-xs text-slate-500">
          JPEG, PNG, GIF or WebP · up to {max} {max === 1 ? "image" : "images"}{" "}
          · {MAX_IMAGE_BYTES / (1024 * 1024)} MB each
        </p>
      )}
      {names.length > 0 ? (
        <ul className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          {names.map((name) => (
            <li key={name} className="rounded-full bg-slate-100 px-2.5 py-1">
              {name}
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={clear}
              className="font-medium text-sky-700"
            >
              Clear
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
