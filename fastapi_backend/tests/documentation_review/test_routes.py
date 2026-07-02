from collections.abc import Iterator, Sequence

from fastapi import status
from httpx import ASGITransport, AsyncClient
import pytest

from app.documentation_review.corpus_loader import (
    DocumentationSource,
    load_documentation_sources,
)
from app.documentation_review.module import DocumentationReviewModule
from app.documentation_review.routes import get_documentation_review_module
from app.documentation_review.schemas import (
    EditSuggestion,
    GeneratedDocumentationReview,
    SuggestionEvidence,
)
from app.main import app


class FakeReviewer:
    """Reviewer adapter used to exercise routes without live OpenAI calls."""

    async def review(
        self,
        request: str,
        sources: Sequence[DocumentationSource],
    ) -> GeneratedDocumentationReview:
        return GeneratedDocumentationReview(suggestions=[_suggestion()])


@pytest.fixture
def fake_review_module() -> Iterator[DocumentationReviewModule]:
    """Override the route module with a deterministic fake reviewer."""

    module = DocumentationReviewModule(
        reviewer=FakeReviewer(),
        sources=load_documentation_sources(),
    )
    app.dependency_overrides[get_documentation_review_module] = lambda: module

    yield module

    app.dependency_overrides.pop(get_documentation_review_module, None)


@pytest.mark.asyncio(loop_scope="function")
async def test_review_and_save_workflow(
    test_client: AsyncClient,
    fake_review_module: DocumentationReviewModule,
) -> None:
    """The web workflow can generate, review, save, and list an update."""

    suggest_response = await test_client.post(
        "/documentation-reviews/suggestions",
        json={"request": "Clarify that Runner.run returns final_output."},
    )

    assert suggest_response.status_code == status.HTTP_200_OK
    suggestion_payload = suggest_response.json()["suggestions"][0]
    assert suggestion_payload["source_path"] == "agents-quickstart.md"

    save_response = await test_client.post(
        "/documentation-reviews/saved-updates",
        json={
            "request": "Clarify that Runner.run returns final_output.",
            "title": "Clarify Runner output",
            "summary": "Adds the Python result field to the quickstart copy.",
            "reviewed_suggestions": [
                {
                    "suggestion": suggestion_payload,
                    "decision": "approved",
                    "final_excerpt": suggestion_payload["suggested_excerpt"],
                }
            ],
        },
    )

    assert save_response.status_code == status.HTTP_200_OK
    saved = save_response.json()
    assert saved["approved_count"] == 1
    assert saved["rejected_count"] == 0

    list_response = await test_client.get("/documentation-reviews/saved-updates")

    assert list_response.status_code == status.HTTP_200_OK
    assert list_response.json()[0]["title"] == "Clarify Runner output"


@pytest.mark.asyncio(loop_scope="function")
async def test_save_rejects_rejected_suggestion_with_final_excerpt() -> None:
    """Malformed Review Decisions are rejected before persistence."""

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://localhost:8000",
    ) as client:
        save_response = await client.post(
            "/documentation-reviews/saved-updates",
            json={
                "request": "Clarify that Runner.run returns final_output.",
                "title": "Clarify Runner output",
                "summary": "Rejected suggestions should not persist replacements.",
                "reviewed_suggestions": [
                    {
                        "suggestion": _suggestion().model_dump(mode="json"),
                        "decision": "rejected",
                        "final_excerpt": "This replacement must not be saved.",
                    }
                ],
            },
        )

    assert save_response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert "Rejected suggestions cannot include final_excerpt." in save_response.text


def _suggestion() -> EditSuggestion:
    original_excerpt = (
        "Start with one focused agent and one turn. The SDK handles the model call "
        "and returns a result object with the final output plus the run history."
    )
    return EditSuggestion(
        id="quickstart-run-output",
        source_path="agents-quickstart.md",
        source_title="Agents SDK quickstart",
        original_excerpt=original_excerpt,
        suggested_excerpt=(
            "Start with one focused agent and one turn. The SDK handles the model "
            "call and returns a result object with final_output plus the run history."
        ),
        rationale="The replacement names the Python field the developer will inspect.",
        evidence=[
            SuggestionEvidence(
                source_path="agents-results.md",
                source_title="Agents SDK results and state",
                source_url=(
                    "https://developers.openai.com/api/docs/guides/agents/results"
                ),
                quote="The final answer to show the user: final_output in Python.",
            )
        ],
        confidence=0.86,
        review_narrative="This is a small targeted quickstart copy update.",
    )
