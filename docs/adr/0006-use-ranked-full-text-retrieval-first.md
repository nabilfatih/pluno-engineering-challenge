# Use Ranked Full-Text Retrieval Before Vector Search

The first Documentation Review workflow will use in-process ranked full-text retrieval over curated markdown snapshots, with section chunking, exact-symbol matching, title/path boosts, and domain aliases. This fits the Agents SDK documentation update problem because straightforward requests often include exact API names such as `as_tool` or `handoff`; vector or hybrid search remains a stretch goal and production improvement once the core agent, review, and save workflow is working.
