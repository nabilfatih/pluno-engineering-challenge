import type {
  DocumentationReviewResponse,
  EditSuggestion,
  SaveReviewedUpdateRequest,
} from "@/app/openapi-client";

export type SuggestionReviewState = {
  decision: "approved" | "rejected";
  finalExcerpt: string;
};

/** Creates editable reviewer state from grounded backend suggestions. */
export function createReviewState(
  suggestions: Array<EditSuggestion>,
): Record<string, SuggestionReviewState> {
  return Object.fromEntries(
    suggestions.map((suggestion) => [
      suggestion.id,
      {
        decision: "approved" as const,
        finalExcerpt: suggestion.suggested_excerpt,
      },
    ]),
  );
}

/** Converts the current review decisions into the save API contract. */
export function buildSavePayload(
  review: DocumentationReviewResponse,
  reviewState: Record<string, SuggestionReviewState>,
): SaveReviewedUpdateRequest {
  return {
    request: review.request,
    title: review.title,
    reviewed_suggestions: (review.suggestions ?? []).map((suggestion) => {
      const state = reviewState[suggestion.id];
      const decision = state?.decision ?? "rejected";

      return {
        suggestion,
        decision,
        final_excerpt:
          decision === "approved" ? state?.finalExcerpt.trim() : null,
      };
    }),
  };
}
