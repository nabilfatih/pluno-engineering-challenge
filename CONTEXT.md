# Pluno Documentation Review

This context names the product workflow for turning a natural-language documentation change into reviewed documentation edit suggestions.

## Language

**Documentation Update Request**:
A natural-language description of what changed in the referenced documentation or what the user wants updated.
_Avoid_: Query, prompt, ticket

**Target Documentation Source**:
A documentation page or excerpt that the app may propose changing.
_Avoid_: Context blob, scraped data

**Reference Documentation Source**:
A documentation page or excerpt used to guide implementation or reasoning, but not offered as an edit target.
_Avoid_: Background context, prompt data

**Edit Suggestion**:
A proposed documentation change with enough evidence for a user to review, revise, approve, or reject it.
_Avoid_: AI response, patch, recommendation

**Review Narrative**:
A plain-language explanation that helps the user understand an Edit Suggestion or a group of Edit Suggestions. It is not the source of truth for the saved documentation change.
_Avoid_: Free-form output, chat answer

**Review Title**:
A concise label for one documentation review session, generated from the Documentation Update Request. It names the overall user intent, not an individual Target Documentation Source.
_Avoid_: Source title, page title, first suggestion title

**No-Suggestions Result**:
A review outcome that explains why the app could not produce grounded, apply-ready Edit Suggestions for a Documentation Update Request.
_Avoid_: Empty result, all good

**Review Decision**:
The user's choice to approve, reject, or revise an Edit Suggestion.
_Avoid_: Status, moderation

**Saved Update**:
The persisted final documentation change produced from approved or revised Edit Suggestions. It should preserve enough before-and-after content for a maintainer to apply or export the update.
_Avoid_: Final answer, submission

**Grounding Check**:
A verification that an Edit Suggestion is tied to an exact excerpt in a Target Documentation Source before it can be shown or saved.
_Avoid_: Validation, safety check
