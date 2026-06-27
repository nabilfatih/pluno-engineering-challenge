"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { FileText, Loader2, Save, Send } from "lucide-react";
import { useEffect, useState } from "react";

import type { DocumentationReviewResponse } from "@/app/openapi-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  "The Agents SDK docs should make it clearer that Python users read the final answer from result.final_output after Runner.run.";

export function DocumentationReviewWorkspace() {
  const queryClient = useQueryClient();
  const [review, setReview] = useState<DocumentationReviewResponse | null>(
    null,
  );
  const [reviewState, setReviewState] = useState<
    Record<string, SuggestionReviewState>
  >({});

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
      saveForm.reset(createSaveDefaults(result));
    },
  });

  const saveMutation = useMutation({
    mutationFn: saveReviewedDocumentationUpdate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["saved-documentation-updates"],
      });
    },
  });

  const requestForm = useForm({
    defaultValues: { request: exampleRequest },
    onSubmit: async ({ value }) => {
      const request = value.request.trim();
      if (request.length < 8) {
        return;
      }
      suggestionsMutation.mutate(request);
    },
  });

  const saveForm = useForm({
    defaultValues: { title: "", summary: "" },
    onSubmit: async ({ value }) => {
      if (!review) {
        return;
      }

      const payload = buildSavePayload(review, reviewState, value);
      saveMutation.mutate(payload);
    },
  });

  const suggestions = review?.suggestions ?? [];
  const activeError = suggestionsMutation.error ?? saveMutation.error;
  const canSave = suggestions.length > 0 && !saveMutation.isPending;

  useEffect(() => {
    if (!review) {
      return;
    }

    saveForm.reset(createSaveDefaults(review));
  }, [review, saveForm]);

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
                    Generate
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Save className="h-4 w-4" />
                    Save
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)_auto]"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void saveForm.handleSubmit();
                    }}
                  >
                    <saveForm.Field name="title">
                      {(field) => (
                        <div className="space-y-2">
                          <Label htmlFor={field.name}>Title</Label>
                          <Input
                            id={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(event) =>
                              field.handleChange(event.target.value)
                            }
                          />
                        </div>
                      )}
                    </saveForm.Field>
                    <saveForm.Field name="summary">
                      {(field) => (
                        <div className="space-y-2">
                          <Label htmlFor={field.name}>Summary</Label>
                          <Input
                            id={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(event) =>
                              field.handleChange(event.target.value)
                            }
                          />
                        </div>
                      )}
                    </saveForm.Field>
                    <Button
                      className="self-end"
                      type="submit"
                      disabled={!canSave}
                    >
                      {saveMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save
                    </Button>
                  </form>
                </CardContent>
              </Card>
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
