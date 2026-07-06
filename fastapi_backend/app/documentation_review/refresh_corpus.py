from http.client import HTTPResponse
from pathlib import Path
from typing import cast
from urllib.request import urlopen

PAGES = {
    "agents-overview.html": "https://developers.openai.com/api/docs/guides/agents",
    "agents-quickstart.html": "https://developers.openai.com/api/docs/guides/agents/quickstart",
    "tools-agents-sdk.html": "https://developers.openai.com/api/docs/guides/tools",
    "agents-results.html": "https://developers.openai.com/api/docs/guides/agents/results",
}


def main() -> None:
    """Refresh raw official docs pages for maintainers to curate into snapshots."""

    output_dir = Path(__file__).with_name("corpus_raw")
    output_dir.mkdir(exist_ok=True)

    for filename, url in PAGES.items():
        with cast(HTTPResponse, urlopen(url, timeout=20)) as response:
            body: bytes = response.read()
            _ = output_dir.joinpath(filename).write_bytes(body)


if __name__ == "__main__":
    main()
