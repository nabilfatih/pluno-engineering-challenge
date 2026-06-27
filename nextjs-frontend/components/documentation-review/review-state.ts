import type {
  DocumentationReviewResponse,
  EditSuggestion,
  SaveReviewedUpdateRequest,
} from "@/app/openapi-client";

export type SuggestionReviewState = {
  decision: "approved" | "rejected";
  finalExcerpt: string;
  reviewerNote: string;
};

export function createReviewState(
  suggestions: Array<EditSuggestion>,
): Record<string, SuggestionReviewState> {
  return Object.fromEntries(
    suggestions.map((suggestion) => [
      suggestion.id,
      {
        decision: "approved" as const,
        finalExcerpt: suggestion.suggested_excerpt,
        reviewerNote: "",
      },
    ]),
  );
}

export function createSaveDefaults(review: DocumentationReviewResponse) {
  const firstSuggestion = review.suggestions?.[0];

  if (!firstSuggestion) {
    return {
      title: "No suggestions",
      summary: review.no_suggestions?.reason ?? "No grounded suggestions.",
    };
  }

  return {
    title: firstSuggestion.source_title,
    summary: firstSuggestion.rationale,
  };
}

export function buildSavePayload(
  review: DocumentationReviewResponse,
  reviewState: Record<string, SuggestionReviewState>,
  values: { title: string; summary: string },
): SaveReviewedUpdateRequest {
  return {
    request: review.request,
    title: values.title.trim(),
    summary: values.summary.trim(),
    reviewed_suggestions: (review.suggestions ?? []).map((suggestion) => {
      const state = reviewState[suggestion.id];
      const decision = state?.decision ?? "rejected";

      return {
        suggestion,
        decision,
        final_excerpt:
          decision === "approved" ? state?.finalExcerpt.trim() : null,
        reviewer_note: state?.reviewerNote.trim() || null,
      };
    }),
  };
}
