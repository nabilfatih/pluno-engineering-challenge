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
import { SavedUpdateDetail } from "@/components/documentation-review/saved/detail";
import { SavedUpdatesPanel } from "@/components/documentation-review/saved/panel";
import {
  SuggestionCard,
  SuggestionSkeleton,
} from "@/components/documentation-review/suggestion-card";
import {
  buildSavePayload,
  createReviewState,
  type SuggestionReviewState,
} from "@/components/documentation-review/review-state";
import {
  getSavedDocumentationUpdate,
  listSavedDocumentationUpdates,
  requestDocumentationSuggestions,
  saveReviewedDocumentationUpdate,
} from "@/lib/review-client";

export function DocumentationReviewWorkspace() {
  const queryClient = useQueryClient();
  const [review, setReview] = useState<DocumentationReviewResponse | null>(
    null,
  );
  const [reviewState, setReviewState] = useState<
    Record<string, SuggestionReviewState>
  >({});
  const [selectedSavedUpdateId, setSelectedSavedUpdateId] = useState<
    string | null
  >(null);
  const [formError, setFormError] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const savedUpdatesQuery = useQuery({
    queryKey: ["saved-documentation-updates"],
    queryFn: listSavedDocumentationUpdates,
  });

  const savedUpdateDetailQuery = useQuery({
    enabled: Boolean(selectedSavedUpdateId),
    queryKey: ["saved-documentation-update", selectedSavedUpdateId],
    queryFn: () => getSavedDocumentationUpdate(selectedSavedUpdateId ?? ""),
  });

  const suggestionsMutation = useMutation({
    mutationFn: requestDocumentationSuggestions,
    onSuccess: (result) => {
      const suggestions = result.suggestions ?? [];
      setReview(result);
      setReviewState(createReviewState(suggestions));
      setSelectedSavedUpdateId(null);
      setFormError(null);
    },
  });

  const saveMutation = useMutation({
    mutationFn: saveReviewedDocumentationUpdate,
    onSuccess: async (savedUpdate) => {
      await queryClient.invalidateQueries({
        queryKey: ["saved-documentation-updates"],
      });
      queryClient.setQueryData(
        ["saved-documentation-update", savedUpdate.id],
        savedUpdate,
      );
      setReview(null);
      setReviewState({});
      setSelectedSavedUpdateId(savedUpdate.id);
      setFormError(null);
    },
  });

  const requestForm = useForm({
    defaultValues: { request: "" },
    onSubmit: async ({ value }) => {
      const request = value.request.trim();
      if (request.length < 8) {
        setFormError({
          title: "Request not generated",
          message: "Request must be at least 8 characters.",
        });
        return;
      }
      suggestionsMutation.reset();
      saveMutation.reset();
      setReview(null);
      setReviewState({});
      setSelectedSavedUpdateId(null);
      setFormError(null);
      suggestionsMutation.mutate(request);
    },
  });

  const suggestions = review?.suggestions ?? [];
  const savedUpdateDetailError = selectedSavedUpdateId
    ? savedUpdateDetailQuery.error
    : null;
  const activeError =
    suggestionsMutation.error ?? saveMutation.error ?? savedUpdateDetailError;
  const activeErrorTitle = savedUpdateDetailError
    ? "Saved update not loaded"
    : "Request failed";
  const canSave = suggestions.length > 0 && !saveMutation.isPending;

  function handleSaveReviewedUpdate() {
    if (!review) {
      return;
    }

    saveMutation.reset();
    setFormError(null);

    const approvedSuggestionWithoutExcerpt = suggestions.some((suggestion) => {
      const state = reviewState[suggestion.id];
      return state?.decision === "approved" && !state.finalExcerpt.trim();
    });

    if (approvedSuggestionWithoutExcerpt) {
      setFormError({
        title: "Review not saved",
        message: "Approved suggestions need replacement text.",
      });
      return;
    }

    const payload = buildSavePayload(review, reviewState);
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
                        placeholder="Describe the documentation change"
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
                <AlertTitle>{activeErrorTitle}</AlertTitle>
                <AlertDescription>
                  {activeError instanceof Error
                    ? activeError.message
                    : "The request could not be completed."}
                </AlertDescription>
              </Alert>
            ) : null}

            {formError ? (
              <Alert variant="destructive">
                <AlertTitle>{formError.title}</AlertTitle>
                <AlertDescription>{formError.message}</AlertDescription>
              </Alert>
            ) : null}

            {selectedSavedUpdateId ? (
              <>
                {savedUpdateDetailQuery.isLoading ? (
                  <SuggestionSkeleton />
                ) : null}
                {savedUpdateDetailQuery.data ? (
                  <SavedUpdateDetail update={savedUpdateDetailQuery.data} />
                ) : null}
              </>
            ) : (
              <>
                {suggestionsMutation.isPending ? <SuggestionSkeleton /> : null}

                {review?.no_suggestions ? (
                  <Alert>
                    <AlertTitle>No suggestions</AlertTitle>
                    <AlertDescription>
                      {review.no_suggestions.review_narrative}
                    </AlertDescription>
                  </Alert>
                ) : null}

                {suggestions.length > 0 ? (
                  <Card>
                    <CardHeader className="space-y-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <CardTitle className="text-base">
                          {review?.title}
                        </CardTitle>
                        <Badge variant="outline">
                          {suggestions.length}{" "}
                          {suggestions.length === 1 ? "edit" : "edits"}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ) : null}

                {suggestions.map((suggestion, index) => (
                  <SuggestionCard
                    key={suggestion.id}
                    position={index + 1}
                    suggestion={suggestion}
                    state={reviewState[suggestion.id]}
                    total={suggestions.length}
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
              </>
            )}
          </section>

          <SavedUpdatesPanel
            isLoading={savedUpdatesQuery.isLoading}
            selectedUpdateId={selectedSavedUpdateId}
            updates={savedUpdatesQuery.data ?? []}
            onSelect={(savedUpdateId) => {
              setSelectedSavedUpdateId(savedUpdateId);
              setFormError(null);
            }}
          />
        </div>
      </div>
    </main>
  );
}
