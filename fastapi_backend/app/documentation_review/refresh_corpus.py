from pathlib import Path
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
        with urlopen(url, timeout=20) as response:
            output_dir.joinpath(filename).write_bytes(response.read())


if __name__ == "__main__":
    main()
