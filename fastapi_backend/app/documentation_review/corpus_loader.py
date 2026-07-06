from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class DocumentationSource:
    """A local snapshot of one documentation page the reviewer may inspect."""

    path: str
    title: str
    source_url: str
    kind: str
    content: str


def load_documentation_sources() -> list[DocumentationSource]:
    """Load committed documentation snapshots from the package corpus."""

    corpus_dir = Path(__file__).with_name("corpus")
    sources: list[DocumentationSource] = []

    for source_file in sorted(corpus_dir.glob("*.md")):
        text = source_file.read_text(encoding="utf-8")
        metadata, content = _split_metadata(text)
        sources.append(
            DocumentationSource(
                path=source_file.name,
                title=metadata.get("title", source_file.stem),
                source_url=metadata.get("source_url", ""),
                kind=metadata.get("kind", "target"),
                content=content.strip(),
            )
        )

    return sources


def target_source_paths(sources: list[DocumentationSource]) -> list[str]:
    """Return source paths that are eligible for Edit Suggestions."""

    return [source.path for source in sources if source.kind == "target"]


def _split_metadata(text: str) -> tuple[dict[str, str], str]:
    metadata: dict[str, str] = {}
    lines = text.splitlines()

    for index, line in enumerate(lines):
        if line.strip() == "---":
            content = "\n".join(lines[index + 1 :])
            return metadata, content

        if ":" in line:
            key, value = line.split(":", 1)
            metadata[key.strip().lower()] = value.strip()

    return metadata, text
