import {
  listDocumentationUpdates,
  proposeDocumentationSuggestions,
  saveDocumentationUpdate,
} from "@/app/clientService";
import type {
  DocumentationReviewResponse,
  HttpValidationError,
  SaveReviewedUpdateRequest,
  SavedUpdateRead,
  SavedUpdateSummary,
} from "@/app/openapi-client";

/**
 * Requests AI-generated documentation edit suggestions from FastAPI.
 */
export async function requestDocumentationSuggestions(
  request: string,
): Promise<DocumentationReviewResponse> {
  try {
    const response = await proposeDocumentationSuggestions<true>({
      body: { request },
      throwOnError: true,
    });

    return response.data;
  } catch (error) {
    throw normalizeClientError(error);
  }
}

/**
 * Persists a reviewed documentation update after user approval or rejection.
 */
export async function saveReviewedDocumentationUpdate(
  payload: SaveReviewedUpdateRequest,
): Promise<SavedUpdateRead> {
  try {
    const response = await saveDocumentationUpdate<true>({
      body: payload,
      throwOnError: true,
    });

    return response.data;
  } catch (error) {
    throw normalizeClientError(error);
  }
}

/**
 * Lists saved documentation updates for the review sidebar.
 */
export async function listSavedDocumentationUpdates(): Promise<
  Array<SavedUpdateSummary>
> {
  try {
    const response = await listDocumentationUpdates<true>({
      throwOnError: true,
    });

    return response.data;
  } catch (error) {
    throw normalizeClientError(error);
  }
}

function normalizeClientError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (isRecord(error)) {
    const detail = error.detail;

    if (typeof detail === "string") {
      return new Error(detail);
    }

    if (isValidationError(error)) {
      const message = error.detail
        ?.map((item) => item.msg)
        .filter((message): message is string => Boolean(message))
        .join("; ");

      if (message) {
        return new Error(message);
      }
    }
  }

  if (typeof error === "string" && error) {
    return new Error(error);
  }

  return new Error("The request could not be completed.");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidationError(error: unknown): error is HttpValidationError {
  return (
    isRecord(error) &&
    Array.isArray(error.detail) &&
    error.detail.every((item) => isRecord(item) && typeof item.msg === "string")
  );
}
