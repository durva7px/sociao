# Context — sociao

What we are building and why, and under which constraints. This file is the entry point to the project docs.

| Question | Where |
| -------- | ----- |
| What words do we use? | [UBIQUITOUS_LANGUAGE.md](UBIQUITOUS_LANGUAGE.md) |
| What must be built, and what's the status? | [PRODUCT_REQUIREMENTS.md](PRODUCT_REQUIREMENTS.md) |
| Why did we choose X? | [DECISIONS.md](DECISIONS.md) |
| What was the AI asked? | [PROMPTS.md](PROMPTS.md) |

## Source

The brief is `AI-First_Engineer_Live_Build_Assignment.pdf` (TheSDE, 18 Nov 2026), with mockups for 13 screens, in `D:\TheSDE\assignments\AI_Engineer_PROMPTING_ASSIGNMENT (1)\`. We are doing it as a **take-home assignment** with no time limit, and we submit once the MVP is done.

## Product

**Sociao** is a small social app. Users publish Posts, follow other Users, and read Posts from others in a Feed. It is a mobile-sized web app with a frontend, a backend API and a real database.

## What reviewers look at

From the brief:
- How the AI was prompted and directed.
- Backend and data modelling (we must be able to explain the schema).
- The frontend.
- How well we understand the code we ship.
- How we learn when stuck.

## Process constraints

- **TDD, one feature at a time.** The AI builds, commits and pushes nothing without the developer's go-ahead.
- **From the brief:**
  - Keep every prompt, verbatim, in PROMPTS.md.
  - Read everything the AI produces.
  - Make small, clear commits.
  - Don't start from a pre-built social app template.
- **Submission:**
  - A public GitHub repo with the full commit history.
  - A README (how to run it, the schema, done / not done).
  - PROMPTS.md.
  - One honest sentence on what the AI got wrong and how it was caught.
