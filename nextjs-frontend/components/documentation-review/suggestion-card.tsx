"use client";

import { Check, X } from "lucide-react";

import type { EditSuggestion } from "@/app/openapi-client";
import type { SuggestionReviewState } from "@/components/documentation-review/review-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

export function SuggestionCard({
  position,
  suggestion,
  state,
  total,
  onChange,
}: {
  position: number;
  suggestion: EditSuggestion;
  state: SuggestionReviewState;
  total: number;
  onChange: (state: SuggestionReviewState) => void;
}) {
  const approved = state.decision === "approved";
  const hasMultipleSuggestions = total > 1;

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
            {hasMultipleSuggestions ? (
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
          <ExcerptBlock label="Original" value={suggestion.original_excerpt} />
          <div className="space-y-2">
            <Label htmlFor={`${suggestion.id}-replacement`}>Replacement</Label>
            <Textarea
              id={`${suggestion.id}-replacement`}
              className="min-h-40 resize-y font-mono text-xs"
              disabled={!approved}
              value={state.finalExcerpt}
              onChange={(event) =>
                onChange({ ...state, finalExcerpt: event.target.value })
              }
            />
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant={approved ? "default" : "outline"}
            onClick={() => onChange({ ...state, decision: "approved" })}
          >
            <Check className="mr-2 h-4 w-4" />
            Approve
          </Button>
          <Button
            type="button"
            variant={!approved ? "destructive" : "outline"}
            onClick={() => onChange({ ...state, decision: "rejected" })}
          >
            <X className="mr-2 h-4 w-4" />
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function SuggestionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-10 w-40" />
      </CardContent>
    </Card>
  );
}

function ExcerptBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <pre className="min-h-40 whitespace-pre-wrap rounded-md border bg-muted p-3 font-mono text-xs text-muted-foreground">
        {value}
      </pre>
    </div>
  );
}
