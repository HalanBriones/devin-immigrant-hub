"use client";

import { useEffect, useState } from "react";

const linkClass =
  "rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-sky-400 hover:text-sky-700";

export function InviteShare({
  slug,
  communityName,
}: {
  slug: string;
  communityName: string;
}) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const inviteUrl = origin ? `${origin}/c/${slug}?invite=1` : "";
  const message = `Join the ${communityName} community on Immigrant Community Hub: ${inviteUrl}`;

  async function copy() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="card flex flex-col gap-3 p-5">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Invite people</h2>
        <p className="text-xs text-slate-500">
          Share this link — anyone can read the community, and it prompts them to
          join when they open it.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          readOnly
          value={inviteUrl}
          aria-label="Invitation link"
          onFocus={(event) => event.currentTarget.select()}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
        />
        <button type="button" onClick={copy} className={linkClass} disabled={!inviteUrl}>
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      {inviteUrl ? (
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noreferrer"
            className={linkClass}
          >
            WhatsApp
          </a>
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(`Join the ${communityName} community`)}`}
            target="_blank"
            rel="noreferrer"
            className={linkClass}
          >
            Telegram
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteUrl)}`}
            target="_blank"
            rel="noreferrer"
            className={linkClass}
          >
            Facebook
          </a>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noreferrer"
            className={linkClass}
          >
            X
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent(`Join ${communityName}`)}&body=${encodeURIComponent(message)}`}
            className={linkClass}
          >
            Email
          </a>
        </div>
      ) : null}
    </section>
  );
}
