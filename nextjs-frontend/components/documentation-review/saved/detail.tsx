"use client";

import { useMemo } from "react";

import type { ReviewedSuggestion, SavedUpdateRead } from "@/app/openapi-client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Renders the full persisted Saved Update selected from the history panel.
 */
export function SavedUpdateDetail({ update }: { update: SavedUpdateRead }) {
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [],
  );
  const suggestions = update.reviewed_suggestions ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <CardTitle className="text-base">{update.title}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <SavedUpdateStatusBadges
                approvedCount={update.approved_count}
                rejectedCount={update.rejected_count}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {dateFormatter.format(new Date(update.created_at))}
          </p>
        </CardContent>
      </Card>

      {suggestions.map((reviewedSuggestion, index) => (
        <SavedSuggestionCard
          key={reviewedSuggestion.suggestion.id}
          position={index + 1}
          reviewedSuggestion={reviewedSuggestion}
          total={suggestions.length}
        />
      ))}
    </div>
  );
}

function SavedSuggestionCard({
  position,
  reviewedSuggestion,
  total,
}: {
  position: number;
  reviewedSuggestion: ReviewedSuggestion;
  total: number;
}) {
  const approved = reviewedSuggestion.decision === "approved";
  const suggestion = reviewedSuggestion.suggestion;
  const replacement = approved
    ? reviewedSuggestion.final_excerpt
    : suggestion.suggested_excerpt;

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base">Edit {position}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {suggestion.source_path}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {total > 1 ? (
              <Badge variant="outline">
                {position}/{total}
              </Badge>
            ) : null}
            <Badge variant={approved ? "default" : "destructive"}>
              {approved ? "Approved" : "Rejected"}
            </Badge>
            <Badge variant="outline">
              {Math.round(suggestion.confidence * 100)}%
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{suggestion.rationale}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <ReadOnlyExcerpt
            label="Original"
            value={suggestion.original_excerpt}
          />
          <ReadOnlyExcerpt
            label={approved ? "Saved replacement" : "Rejected suggestion"}
            value={replacement ?? ""}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SavedUpdateStatusBadges({
  approvedCount,
  rejectedCount,
}: {
  approvedCount: number;
  rejectedCount: number;
}) {
  return (
    <>
      {approvedCount > 0 ? (
        <Badge variant="default">{approvedCount} approved</Badge>
      ) : null}
      {rejectedCount > 0 ? (
        <Badge variant="destructive">{rejectedCount} rejected</Badge>
      ) : null}
    </>
  );
}

function ReadOnlyExcerpt({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <pre className="min-h-40 whitespace-pre-wrap rounded-md border bg-muted p-3 font-mono text-xs text-muted-foreground">
        {value}
      </pre>
    </div>
  );
}
