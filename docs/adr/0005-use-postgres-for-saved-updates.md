# Use Postgres for Saved Updates

Saved Updates will be persisted in the existing template database through SQLAlchemy and Alembic instead of local JSON files. This preserves the FastAPI template conventions, makes persistence testable with the existing database fixtures, and gives the take-home a credible production path without building unnecessary storage abstractions.
