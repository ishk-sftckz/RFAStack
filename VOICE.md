# RFAStack writing voice

RFAStack sounds like a practitioner-teacher: an experienced developer who has tried the obvious approaches, seen where they fail, and formed an opinion. It speaks directly to the reader and proves architecture advice with situations they can picture in code.

This guide is calibrated from the approved paragraph below. Use it to write original RFAStack copy. Treat the rules as patterns, not a template.

## Approved sample

> A Next.js application rarely becomes hard to maintain overnight. It happens one reasonable shortcut at a time, until nobody is sure where business logic belongs or what a small change might break. RFAStack gives you an opinionated architecture to follow before the codebase reaches that point.

## The core movement

1. State the topic or responsibility and why it matters to the application.
2. Explain the risk or design need that makes it worth addressing.
3. State the recommendation clearly.
4. Give the reader an example, default, or next decision.

Use the steps each section needs. Let the whole page complete the movement.

## Establish the concern before the example

Open guides by naming the concern, explaining why it matters in a full-stack Next.js application, and introducing the recommended approach. Do not default to an imagined sequence such as “You add a login redirect…” or make readers work through an order-cancellation story before learning what the page teaches.

For example:

> Protecting resources is a core responsibility when building a full-stack Next.js application. You must control who can access private data and who can perform operations that change it.

Follow that opening with the approach, such as multiple layers of protection, then use code examples to explain how it works. Keep the reason specific: private data and server operations need access controls. Avoid unsupported claims such as “security is more important than ever” or generic phrases such as “in today’s digital world.”

Use concrete code situations where they help explain the mechanism: a rule buried in a route, a mutation spread across several files, or server-only code imported by a client component. An architecture term earns its place when it helps the reader name or solve the concern.

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

Give the instruction directly. Avoid recurring introductions such as “RFAStack uses,” “In RFAStack,” “RFAStack recommends,” or “For RFAStack.” The reader is already in the guide; repeating the project name makes the advice sound like an outside description.

Choose wording that matches the strength of the advice:

- Use “Use…” or “Keep…” for a clear instruction.
- Use “You should…” for advice addressed to the reader.
- Use “We recommend…” when stating an opinion with tradeoffs. “We” represents the guide’s recommendations, not an invented team history.
- Use “Must…” or “You must…” when a requirement is necessary, such as enforcing authorization. Do not turn every preference into a requirement.

For example:

| Avoid | Write |
| --- | --- |
| RFAStack uses four directories at the top of `src`. | Use four directories at the top of `src`. |
| In RFAStack, data protection belongs in feature server modules. | Keep data protection in the feature’s server modules. |
| RFAStack recommends Proxy for authenticated areas. | We recommend Proxy for early redirects around authenticated areas. |

Vary direct instructions and explanations naturally. Do not replace every project-name introduction with “We recommend.” Keep the project name where it identifies the project, such as the title, approved introduction, attribution, or licensing text.

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

Start with the responsibility and its relevance, then introduce the recommended approach. Explain the mechanism with a worked example and cover the tradeoff. A code scenario can support the explanation without becoming the introduction.

### Cards and chapter links

Make each item useful on its own. Vary their syntax naturally. A row of equally polished commands will sound generated even when every sentence is correct.

## Writing workflow

1. Write the decision or opinion in one plain sentence.
2. Identify the application concern that makes the decision necessary and state it directly in the opening.
3. Draft a heading that carries the problem, claim, question, or practical promise.
4. Explain the mechanism with a concrete example.
5. Add the boundary when the recommendation changes by context.
6. Read the section aloud and loosen any repeated sentence pattern.
7. Check technical claims and terminology against `CONTRIBUTING.md` and the relevant guide.

## Final check

- Does the introduction name the concern, explain why it matters, and introduce the approach before a detailed example?
- Is the recommendation easy to find, and does its wording distinguish advice from requirements?
- Does guide prose address the reader directly without repeated “RFAStack uses” or “In RFAStack” framing?
- Can the reader picture the problem in a Next.js codebase?
- Does the copy say what becomes easier without making a broad marketing promise?
- Does the heading carry a useful point?
- Does the recommendation state its boundary where one is needed?
- Does the page vary its rhythm instead of repeating a template?
- Does the writing sound natural when spoken to another developer?
