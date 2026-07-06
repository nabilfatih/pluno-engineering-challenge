import re
from dataclasses import dataclass
from typing import Sequence

from .corpus_loader import DocumentationSource


STOPWORDS = {
    "about",
    "after",
    "from",
    "into",
    "that",
    "the",
    "this",
    "with",
    "would",
}

ALIASES = {
    "agent": ["Agent(", "agents-as-tools", "agent-as-tool", "as_tool", "handoff"],
    "delegate": ["delegation", "specialist agents", "handoffs", "handoff"],
    "delegation": ["delegate", "specialist agents", "handoffs", "handoff"],
    "handoff": ["handoffs", "specialist agents", "last_agent", "delegation"],
    "invoke": ["invoked", "specialist agents", "handoffs", "handoff"],
    "output": ["output_type", "AgentOutputSchema", "structured outputs"],
    "run": ["Runner.run", "final_output", "run history"],
    "specialist": ["specialist agents", "handoffs", "handoff", "as_tool"],
    "tool": ["function_tool", "tools", "tool call", "as_tool", "agent-as-tool"],
}

CODE_SYMBOLS = {
    "Agent(",
    "Runner.run",
    "as_tool",
    "final_output",
    "function_tool",
    "handoffs",
    "last_agent",
}


@dataclass(frozen=True)
class DocumentationChunk:
    """Searchable section from a documentation snapshot."""

    source_path: str
    source_title: str
    source_url: str
    source_kind: str
    heading: str
    text: str


def retrieve_documentation(
    request: str,
    sources: Sequence[DocumentationSource],
    limit: int = 6,
) -> list[DocumentationChunk]:
    """Return the highest-scoring documentation chunks for a user request."""

    chunks = [chunk for source in sources for chunk in chunk_source(source)]
    scored = [(score_chunk(request, chunk), chunk) for chunk in chunks]
    ranked = [
        chunk
        for score, chunk in sorted(scored, key=lambda item: item[0], reverse=True)
        if score > 0
    ]

    if ranked:
        return ranked[:limit]

    return chunks[:limit]


def chunk_source(source: DocumentationSource) -> list[DocumentationChunk]:
    """Split a documentation source into heading-based chunks."""

    chunks: list[DocumentationChunk] = []
    current_heading = source.title
    current_lines: list[str] = []

    for line in source.content.splitlines():
        if line.startswith("#"):
            _append_chunk(chunks, source, current_heading, current_lines)
            current_heading = line.strip("# ").strip() or source.title
            current_lines = [line]
            continue

        current_lines.append(line)

    _append_chunk(chunks, source, current_heading, current_lines)
    return chunks


def score_chunk(request: str, chunk: DocumentationChunk) -> int:
    """Score one chunk by exact terms, phrase matches, and domain aliases."""

    request_terms = _terms(request)
    haystack = f"{chunk.source_title} {chunk.heading} {chunk.text}".lower()
    score = 0

    for term in request_terms:
        if term in haystack:
            score += 3
        for alias in ALIASES.get(term, []):
            if alias.lower() in haystack:
                score += 5

    for phrase in _phrases(request):
        if phrase in haystack:
            score += 8

    for symbol in CODE_SYMBOLS:
        symbol_text = symbol.lower()
        if symbol_text in request.lower() and symbol_text in haystack:
            score += 30

    if chunk.source_kind == "target":
        score += 1

    return score


def render_chunks(chunks: Sequence[DocumentationChunk]) -> str:
    """Render retrieved chunks into compact text for an agent prompt or tool."""

    sections = []
    for chunk in chunks:
        sections.append(
            "\n".join(
                [
                    f"Source path: {chunk.source_path}",
                    f"Source title: {chunk.source_title}",
                    f"Source URL: {chunk.source_url}",
                    f"Source kind: {chunk.source_kind}",
                    f"Heading: {chunk.heading}",
                    chunk.text.strip(),
                ]
            )
        )

    return "\n\n---\n\n".join(sections)


def _append_chunk(
    chunks: list[DocumentationChunk],
    source: DocumentationSource,
    heading: str,
    lines: list[str],
) -> None:
    text = "\n".join(lines).strip()
    if not text:
        return

    chunks.append(
        DocumentationChunk(
            source_path=source.path,
            source_title=source.title,
            source_url=source.source_url,
            source_kind=source.kind,
            heading=heading,
            text=text,
        )
    )


def _terms(text: str) -> list[str]:
    words = re.findall(r"[a-zA-Z][a-zA-Z0-9_]{2,}", text.lower())
    return [word for word in words if word not in STOPWORDS]


def _phrases(text: str) -> list[str]:
    normalized = re.sub(r"\s+", " ", text.lower())
    matches = []

    for aliases in ALIASES.values():
        for alias in aliases:
            phrase = alias.lower()
            if phrase in normalized:
                matches.append(phrase)

    return matches
