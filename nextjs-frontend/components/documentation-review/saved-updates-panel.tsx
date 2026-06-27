"use client";

import { History } from "lucide-react";
import { useMemo } from "react";

import type { SavedUpdateSummary } from "@/app/openapi-client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export function SavedUpdatesPanel({
  isLoading,
  updates,
}: {
  isLoading: boolean;
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
      <Card className="sticky top-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Saved
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <div key={update.id} className="space-y-3">
              <div className="space-y-1">
                <h2 className="text-sm font-medium">{update.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {update.summary}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">
                  {update.approved_count} approved
                </Badge>
                <Badge variant="secondary">
                  {update.rejected_count} rejected
                </Badge>
                <span>{dateFormatter.format(new Date(update.created_at))}</span>
              </div>
              <Separator />
            </div>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}
