---
name: ocrjs-docs-expert
description: >
  Expert guidance on the ocrjs project's auto-generated API documentation located in
  `packages/docs/api/md`. Use this skill whenever you need to confirm what is possible,
  clarify method signatures, understand error-handling contracts, or verify architectural
  boundaries before writing or reviewing implementation code. Trigger this skill for any
  question involving IImage, ITensor, IModel, IErrorable, infra-contract interfaces,
  model-onnx-web-adapter APIs, or any situation where you would otherwise guess at an
  ocrjs interface rather than consulting the canonical source of truth. Always prefer
  this skill over reading raw TypeScript source when the question is "what does this
  API look like?" rather than "how is this implemented internally?"
---

# ocrjs Documentation Expert

This skill establishes the auto-generated Markdown documentation in `packages/docs/api/md`
as the **single source of truth** for the `ocrjs` project's public API. Its purpose is
to ensure that every implementation proposal, architectural decision, and code review
is grounded in the actual interface specifications — not assumptions, stale memory, or
inferred types from implementation details.

---

## When to Use This Skill

Reach for this skill whenever you encounter any of the following:

- **API signature lookup** — argument types, return types, overloads, or generic constraints for any `ocrjs` interface or class.
- **Reachability analysis** — determining whether a desired behavior is achievable with existing primitives, or whether a higher-level abstraction layer is required.
- **Error-contract verification** — confirming which methods return `IErrorable<T>` and what error shapes are defined.
- **Architectural boundary enforcement** — checking whether a proposed implementation respects the boundaries between `IImage`, `ITensor`, `IModel`, and related abstractions.
- **Parameter semantics** — understanding the physical or algorithmic meaning of numeric parameters (e.g., thresholds, kernel sizes, block sizes) as documented in JSDoc comments.
- **Cross-package compatibility** — validating that a call pattern is compatible across `infra-contract` and `model-onnx-web-adapter`.

---

## Documentation Layout

```
packages/docs/api/md/
├── README.md                             ← top-level index; start here for orientation
├── @ocrjs/infra-contract/               ← core interface contracts (IImage, ITensor, IModel, IErrorable, …)
└── @ocrjs/model-onnx-web-adapter/       ← concrete ONNX-based adapter implementations
...
```

Every public interface, class, enum, and type alias has its own Markdown file generated
directly from TSDoc/JSDoc annotations on the TypeScript source. These files are the
authoritative record of the public API.

---

## Mandatory Workflow

Follow these steps in order. **Do not skip step 1.**

### Step 1 — Read the documentation first

Before looking at any `.ts` source file, open and read the relevant Markdown in
`packages/docs/api/md`. Use directory listing or search to locate the right file:

```
# List all files under infra-contract
list_directory packages/docs/api/md/@ocrjs/infra-contract

# Grep for a specific interface or method
grep_search "adaptiveThreshold" packages/docs/api/md
```

Read the Markdown fully. Pay special attention to:
- The method's **signature block** (parameters, generics, return type).
- All **JSDoc `@param` and `@returns` annotations** — these often contain recommended
  values, valid ranges, and behavioral notes not visible in the type alone.
- Any **`@remarks`** or **`@example`** sections.

### Step 2 — Identify `IErrorable<T>` obligations

The majority of `ocrjs` primitives return `IErrorable<T>` rather than `T` directly.
Before proposing any call site, confirm:

1. Does this method return `IErrorable<T>`?
2. What does the `error` field look like when the call fails?
3. Is the caller required to check `result.ok` / `result.error` before consuming the value?

Always communicate this obligation explicitly to the user. Omitting error-path handling
is the most common source of runtime bugs when working with `ocrjs` primitives.

### Step 3 — Map the parameter semantics

For numeric parameters (thresholds, block sizes, constants), do not guess their meaning
from the name alone. The JSDoc comments — rendered in the Markdown — frequently contain:

- The **algorithmic role** of the parameter (e.g., "offset subtracted from the mean in
  adaptive thresholding").
- **Recommended starting values** and typical ranges.
- **Edge-case behavior** (what happens at 0, negative values, or values outside the
  documented range).

Cite these descriptions when explaining parameters to the user.

### Step 4 — Assess primitive completeness

After reading the relevant interfaces, explicitly answer:

> *Can the desired behavior be implemented using only the existing primitives?*

If yes, sketch the call chain referencing concrete method names from the documentation.

If no, identify:
- Which capability is missing from the primitive layer.
- What higher-level abstraction or utility layer would need to be introduced.
- Whether this gap is an intentional design boundary or an unimplemented feature.

---

## Reporting Standards

When answering a question using this skill, structure your response as follows:

1. **Source** — Which Markdown file(s) did you consult? Name them explicitly.
2. **Signature** — Reproduce the exact method signature from the documentation (not
   reconstructed from memory).
3. **Error contract** — State whether `IErrorable<T>` applies and what error handling
   is required.
4. **Parameter notes** — Summarize any JSDoc guidance on parameter semantics that is
   relevant to the user's question.
5. **Feasibility verdict** — State clearly whether the goal is achievable with current
   primitives, and why.

---

## Hard Constraints

| Constraint | Reason |
|---|---|
| Always read `api/md` before any `.ts` source | Source files reflect implementation; docs reflect the intended public contract. |
| Never infer a method signature from usage examples | Examples may use outdated APIs or bypass the public interface. |
| Never omit `IErrorable<T>` error-path analysis | Callers that ignore the error path produce silently broken behavior. |
| Do not comment on runtime performance or browser compatibility | The documentation covers interface contracts only. Benchmark tests and browser-specific test suites are the authoritative sources for runtime characteristics. |
| Do not speculate about undocumented behavior | If a behavior is not in `api/md`, state that it is not documented and recommend either reading the source or writing a test to confirm. |

---

## Quick Reference: Key Interfaces

The following are the most frequently consulted interfaces. When in doubt about which
file to open, start with these.

| Interface | Location |
|---|---|
| `IImage` | `@ocrjs/infra-contract/interfaces/IImage.md` |
| `ITensor` | `@ocrjs/infra-contract/interfaces/ITensor.md` |
| `IModel` | `@ocrjs/infra-contract/interfaces/IModel.md` |
| `IErrorable<T>` | `@ocrjs/infra-contract/interfaces/IErrorable.md` |
| ONNX adapter entry point | `@ocrjs/model-onnx-web-adapter/` (check index) |

If a file does not exist at the expected path, fall back to `README.md` at the package
root and follow the links it provides.
