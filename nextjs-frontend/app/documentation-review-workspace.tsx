"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { FileText, Loader2, Save, Send } from "lucide-react";
import { useState } from "react";

import type { DocumentationReviewResponse } from "@/app/openapi-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { SavedUpdatesPanel } from "@/components/documentation-review/saved-updates-panel";
import {
  SuggestionCard,
  SuggestionSkeleton,
} from "@/components/documentation-review/suggestion-card";
import {
  buildSavePayload,
  createReviewState,
  createSaveDefaults,
  type SuggestionReviewState,
} from "@/components/documentation-review/review-state";
import {
  listSavedDocumentationUpdates,
  requestDocumentationSuggestions,
  saveReviewedDocumentationUpdate,
} from "@/lib/documentationReviewClient";

const exampleRequest =
  "We don't support agents as_tool anymore, other agents should only be invoked via handoff.";

export function DocumentationReviewWorkspace() {
  const queryClient = useQueryClient();
  const [review, setReview] = useState<DocumentationReviewResponse | null>(
    null,
  );
  const [reviewState, setReviewState] = useState<
    Record<string, SuggestionReviewState>
  >({});
  const [saveFormError, setSaveFormError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const savedUpdatesQuery = useQuery({
    queryKey: ["saved-documentation-updates"],
    queryFn: listSavedDocumentationUpdates,
  });

  const suggestionsMutation = useMutation({
    mutationFn: requestDocumentationSuggestions,
    onSuccess: (result) => {
      const suggestions = result.suggestions ?? [];
      setReview(result);
      setReviewState(createReviewState(suggestions));
      setSaveFormError(null);
      setSaveSuccess(null);
    },
  });

  const saveMutation = useMutation({
    mutationFn: saveReviewedDocumentationUpdate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["saved-documentation-updates"],
      });
      setSaveFormError(null);
      setSaveSuccess("Reviewed update saved.");
    },
  });

  const requestForm = useForm({
    defaultValues: { request: exampleRequest },
    onSubmit: async ({ value }) => {
      const request = value.request.trim();
      if (request.length < 8) {
        setSaveSuccess(null);
        setSaveFormError("Request must be at least 8 characters.");
        return;
      }
      suggestionsMutation.reset();
      saveMutation.reset();
      setReview(null);
      setReviewState({});
      setSaveSuccess(null);
      setSaveFormError(null);
      suggestionsMutation.mutate(request);
    },
  });

  const suggestions = review?.suggestions ?? [];
  const activeError = suggestionsMutation.error ?? saveMutation.error;
  const canSave = suggestions.length > 0 && !saveMutation.isPending;

  function handleSaveReviewedUpdate() {
    if (!review) {
      return;
    }

    saveMutation.reset();
    setSaveSuccess(null);
    setSaveFormError(null);

    const approvedSuggestionWithoutExcerpt = suggestions.some((suggestion) => {
      const state = reviewState[suggestion.id];
      return state?.decision === "approved" && !state.finalExcerpt.trim();
    });

    if (approvedSuggestionWithoutExcerpt) {
      setSaveFormError("Approved suggestions need replacement text.");
      return;
    }

    const payload = buildSavePayload(
      review,
      reviewState,
      createSaveDefaults(review),
    );
    saveMutation.mutate(payload);
  }

  return (
    <main className="dark min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Badge variant="secondary" className="w-fit">
              Pluno Challenge
            </Badge>
            <h1 className="text-3xl font-semibold tracking-normal">
              Documentation Review
            </h1>
          </div>
          <Badge variant="outline" className="w-fit">
            Agents SDK
          </Badge>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Request
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void requestForm.handleSubmit();
                  }}
                >
                  <requestForm.Field name="request">
                    {(field) => (
                      <Textarea
                        aria-label="Documentation update request"
                        className="min-h-32 resize-y"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                      />
                    )}
                  </requestForm.Field>
                  <Button
                    type="submit"
                    disabled={suggestionsMutation.isPending}
                  >
                    {suggestionsMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    {suggestionsMutation.isPending ? "Generating" : "Generate"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {activeError ? (
              <Alert variant="destructive">
                <AlertTitle>Request failed</AlertTitle>
                <AlertDescription>
                  {activeError instanceof Error
                    ? activeError.message
                    : "The request could not be completed."}
                </AlertDescription>
              </Alert>
            ) : null}

            {saveFormError ? (
              <Alert variant="destructive">
                <AlertTitle>Review not saved</AlertTitle>
                <AlertDescription>{saveFormError}</AlertDescription>
              </Alert>
            ) : null}

            {saveSuccess ? (
              <Alert>
                <AlertTitle>Saved</AlertTitle>
                <AlertDescription>{saveSuccess}</AlertDescription>
              </Alert>
            ) : null}

            {suggestionsMutation.isPending ? <SuggestionSkeleton /> : null}

            {review?.no_suggestions ? (
              <Alert>
                <AlertTitle>No suggestions</AlertTitle>
                <AlertDescription>
                  {review.no_suggestions.review_narrative}
                </AlertDescription>
              </Alert>
            ) : null}

            {suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                state={reviewState[suggestion.id]}
                onChange={(nextState) =>
                  setReviewState((current) => ({
                    ...current,
                    [suggestion.id]: nextState,
                  }))
                }
              />
            ))}

            {suggestions.length > 0 ? (
              <form
                className="flex justify-end"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSaveReviewedUpdate();
                }}
              >
                <Button
                  className="w-full sm:w-auto"
                  type="submit"
                  disabled={!canSave}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {saveMutation.isPending ? "Saving" : "Save review"}
                </Button>
              </form>
            ) : null}
          </section>

          <SavedUpdatesPanel
            isLoading={savedUpdatesQuery.isLoading}
            updates={savedUpdatesQuery.data ?? []}
          />
        </div>
      </div>
    </main>
  );
}
