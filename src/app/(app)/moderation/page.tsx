import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { listOpenReports } from "@/modules/moderation/queries";
import { isModerator } from "@/modules/moderation/roles";
import { ReportQueue } from "@/modules/moderation/ui/report-queue";

export const metadata: Metadata = { title: "Moderation — Immigrant Community Hub" };

export default async function ModerationPage() {
  const user = await requireUser();
  if (!isModerator(user)) notFound();

  const reports = await listOpenReports();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Moderation queue</h1>
        <p className="text-sm text-slate-600">
          Removing content hides it everywhere without deleting the record.
        </p>
      </header>
      <ReportQueue reports={reports} />
    </div>
  );
}
