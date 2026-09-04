# RFAStack writing voice

RFAStack sounds like a practitioner-teacher: an experienced developer who has tried the obvious approaches, seen where they fail, and formed an opinion. It speaks directly to the reader and proves architecture advice with situations they can picture in code.

This guide is calibrated from the approved paragraph below. Use it to write original RFAStack copy. Treat the rules as patterns, not a template.

## Approved sample

> A Next.js application rarely becomes hard to maintain overnight. It happens one reasonable shortcut at a time, until nobody is sure where business logic belongs or what a small change might break. RFAStack gives you an opinionated architecture to follow before the codebase reaches that point.

## The core movement

1. Begin with a problem the developer has seen.
2. Explain how normal coding decisions create that problem.
3. State RFAStack's position clearly.
4. Give the reader an example, default, or next decision.

Use the steps each section needs. Let the whole page complete the movement.

## Problem before terminology

Start with what the developer can find in a codebase: a rule buried in a route, a mutation spread across six files, or server-only code imported by a client component. Introduce terms such as feature ownership after the reader can picture the problem they solve.

An architecture term earns its place when it helps the reader name or solve something concrete.

## State the opinion early

RFAStack is opinionated. Say what the developer should do before expanding the theory behind it.

Write:

> Keep business rules with the feature that owns them.

Avoid softening a useful default into “can help,” “might improve,” or “you may want to consider.” Add nuance by naming the condition where the default changes.

## Make consequences carry the argument

Show what changes in daily work. Replace a broad promise with a result the reader can test.

Abstract:

> RFAStack improves maintainability through local reasoning.

Concrete:

> When the cancellation rule changes, open `features/orders`. The rule and its callers should be there.

Examples should involve real RFAStack decisions: routes, features, reads, mutations, server and browser code, databases, or outside services.

## Talk to the reader

Use “you.” It speaks to an individual developer and still includes someone working on a team. Use “your team” only when the sentence is specifically about coordination between people.

Contractions are welcome. Occasional questions are useful when a developer would genuinely ask them. RFAStack sounds like a developer sharing a tested default. Institutional language works against that voice.

Use “I” only when a named author is speaking from personal experience. Do not invent a narrator for unsigned project copy.

## Vary the rhythm

Mix short judgments with longer explanations of cause and effect. Give each paragraph one job, but do not force every paragraph, card, or chapter description into the same shape.

Repeat the precise term when it is still the right term. Do not rotate between “feature,” “module,” “slice,” and “capability” merely for variety.

A short line should sharpen the point. Use it sparingly.

## Make headings do work

Every main heading should do at least one of these:

- Name a problem.
- Make a useful claim.
- Ask a question the section answers.
- Promise a decision the reader will be able to make.

Strong headings include:

- `Next.js cannot decide where your application logic belongs`
- `A folder structure cannot tell you how data should move`
- `Choose the data path from the operation`

Labels such as `How it fits`, `What we cover`, or `Documentation` classify content without giving the reader a reason to continue. Small manual indices may classify the section for navigation; the main heading must carry the argument.

## Give every default a boundary

State the default, then name the condition that changes the answer. A clear boundary makes the opinion more useful because the reader can test it against their application.

Keep the landing concise. Put detailed exceptions and tradeoffs in the guide, then link to them when the landing needs support.

## Match the format

### Landing page

Open with recognizable pain. Make one point per section, use one concrete example when it helps, and keep feature inventories out of the hero. The reader should quickly understand why RFAStack exists and what decision it helps them make.

### Guide

Start from a code situation, explain the mechanism, give the rule, and cover the tradeoff. Prefer a worked example over another paragraph of architecture vocabulary.

### Cards and chapter links

Make each item useful on its own. Vary their syntax naturally. A row of equally polished commands will sound generated even when every sentence is correct.

## Writing workflow

1. Write the decision or opinion in one plain sentence.
2. Find the codebase problem that makes the decision necessary.
3. Draft a heading that carries the problem, claim, question, or practical promise.
4. Explain the mechanism with a concrete example.
5. Add the boundary when the recommendation changes by context.
6. Read the section aloud and loosen any repeated sentence pattern.
7. Check technical claims and terminology against `CONTRIBUTING.md` and the relevant guide.

## Final check

- Does the reader encounter the problem before the architecture term?
- Is RFAStack's opinion easy to find?
- Can the reader picture the problem in a Next.js codebase?
- Does the copy say what becomes easier without making a broad marketing promise?
- Does the heading carry a useful point?
- Does the recommendation state its boundary where one is needed?
- Does the page vary its rhythm instead of repeating a template?
- Does the writing sound natural when spoken to another developer?
