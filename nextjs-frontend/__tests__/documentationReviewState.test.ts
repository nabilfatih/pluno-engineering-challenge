import type {
  DocumentationReviewResponse,
  EditSuggestion,
} from "@/app/openapi-client";
import {
  buildSavePayload,
  createReviewState,
} from "@/components/documentation-review/review-state";

const suggestion: EditSuggestion = {
  id: "suggestion-1",
  source_path: "agents-results.md",
  source_title: "Agents SDK results",
  original_excerpt: "Use result.final_output after Runner.run.",
  suggested_excerpt: "Read generated text from result.final_output.",
  rationale: "The request asks for a clearer result access note.",
  evidence: [
    {
      source_path: "agents-results.md",
      source_title: "Agents SDK results",
      source_url: "https://openai.github.io/openai-agents-python/results/",
      quote: "The final output is available as final_output.",
    },
  ],
  confidence: 0.87,
  review_narrative: "Grounded in the results documentation.",
};

const review: DocumentationReviewResponse = {
  request: "Clarify where Runner.run exposes the final text.",
  title: "Clarify Runner final output",
  suggestions: [suggestion],
  no_suggestions: null,
};

describe("documentation review state", () => {
  it("initializes every suggestion as approved with the generated excerpt", () => {
    expect(createReviewState([suggestion])).toEqual({
      "suggestion-1": {
        decision: "approved",
        finalExcerpt: "Read generated text from result.final_output.",
      },
    });
  });

  it("builds a save payload from the generated review title", () => {
    const payload = buildSavePayload(review, {
      "suggestion-1": {
        decision: "approved",
        finalExcerpt: "  Read generated text from result.final_output.  ",
      },
    });

    expect(payload).toEqual({
      request: review.request,
      title: "Clarify Runner final output",
      reviewed_suggestions: [
        {
          suggestion,
          decision: "approved",
          final_excerpt: "Read generated text from result.final_output.",
        },
      ],
    });
  });

  it("does not persist final excerpts for rejected suggestions", () => {
    const payload = buildSavePayload(review, {
      "suggestion-1": {
        decision: "rejected",
        finalExcerpt: "Do not use this.",
      },
    });

    expect(payload.reviewed_suggestions?.[0]).toMatchObject({
      decision: "rejected",
      final_excerpt: null,
    });
  });
});
