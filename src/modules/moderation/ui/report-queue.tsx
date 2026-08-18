"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { reviewReportAction } from "@/modules/moderation/actions";
import type { OpenReport } from "@/modules/moderation/queries";

function ReportRow({ report }: { report: OpenReport }) {
  const [state, formAction] = useActionState(reviewReportAction, {});

  return (
    <li className="card flex flex-col gap-3 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-900">
          {report.targetType} #{report.targetId}
          {report.targetRemoved ? " (already removed)" : ""}
        </span>
        <span className="text-xs text-slate-500">
          reported by @{report.reporterHandle} on{" "}
          {report.createdAt.toLocaleDateString("en-CA")}
        </span>
      </div>
      {report.targetExcerpt ? (
        <p className="text-sm text-slate-700">{report.targetExcerpt}</p>
      ) : (
        <p className="text-sm text-slate-500">Content no longer exists.</p>
      )}
      <p className="text-sm text-slate-600">Reason: {report.reason}</p>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <form action={formAction} className="flex flex-wrap gap-2">
        <input type="hidden" name="reportId" value={report.id} />
        <Button type="submit" name="decision" value="remove">
          Remove content
        </Button>
        <Button type="submit" name="decision" value="dismiss" variant="secondary">
          Dismiss
        </Button>
      </form>
    </li>
  );
}

export function ReportQueue({ reports }: { reports: OpenReport[] }) {
  if (reports.length === 0) {
    return <p className="text-sm text-slate-600">No open reports. </p>;
  }
  return (
    <ul className="flex flex-col gap-4">
      {reports.map((report) => (
        <ReportRow key={report.id} report={report} />
      ))}
    </ul>
  );
}
