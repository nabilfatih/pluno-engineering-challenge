"use client";

import { History } from "lucide-react";
import { useMemo } from "react";

import type { SavedUpdateSummary } from "@/app/openapi-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Shows Saved Update history and lets reviewers load a persisted review.
 */
export function SavedUpdatesPanel({
  isLoading,
  onSelect,
  selectedUpdateId,
  updates,
}: {
  isLoading: boolean;
  onSelect: (savedUpdateId: string) => void;
  selectedUpdateId: string | null;
  updates: Array<SavedUpdateSummary>;
}) {
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [],
  );

  return (
    <aside>
      <Card className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Saved
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-[calc(100vh-8rem)] space-y-1 overflow-y-auto">
          {isLoading ? (
            <>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </>
          ) : null}
          {!isLoading && updates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved updates.</p>
          ) : null}
          {updates.map((update) => (
            <Button
              key={update.id}
              aria-pressed={selectedUpdateId === update.id}
              className={cn(
                "h-auto w-full justify-start whitespace-normal border border-transparent p-3 text-left",
                selectedUpdateId === update.id
                  ? "border-border bg-accent text-accent-foreground"
                  : "hover:bg-accent",
              )}
              type="button"
              variant="ghost"
              onClick={() => onSelect(update.id)}
            >
              <div className="min-w-0 space-y-2">
                <h2 className="line-clamp-2 text-sm font-medium">
                  {update.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs font-normal text-muted-foreground">
                  <SavedUpdateBadges update={update} />
                  <span>
                    {dateFormatter.format(new Date(update.created_at))}
                  </span>
                </div>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}

function SavedUpdateBadges({ update }: { update: SavedUpdateSummary }) {
  const hasApproved = update.approved_count > 0;
  const hasRejected = update.rejected_count > 0;

  if (!hasApproved && !hasRejected) {
    return <Badge variant="outline">No changes</Badge>;
  }

  return (
    <>
      {hasApproved ? (
        <Badge variant="default">{update.approved_count} approved</Badge>
      ) : null}
      {hasRejected ? (
        <Badge variant="destructive">{update.rejected_count} rejected</Badge>
      ) : null}
    </>
  );
}
