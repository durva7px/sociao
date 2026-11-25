# Prompt history — sociao

Every prompt given to the AI (Claude Code, Opus 5.5) while building sociao, in order and verbatim, as the brief requires. Prompts are never edited or deleted after sending. Each entry has a short note on what the AI did in response.

---

## 1 · Set up the engineering skills

> /mattpocock-skills:setup-matt-pocock-skills

**Response:** Explored the empty folder, then asked about the issue tracker, triage labels and config file. Answers: no tracker preference (local markdown chosen), default labels, CLAUDE.md. Wrote `CLAUDE.md` and `docs/agents/{issue-tracker,triage-labels,domain}.md`.

---

## 2 · Requirements interview and shared vocabulary

> We are making a social app MVP. The app will enable users to post content, follow other users and consume content posted by other users as a primary function for now. We will follow test driven development, building features one by one. You don't build, commit and push anything without running it by me first. /mattpocock-skills:grill-me ask me requirements for the app and establish a shared vocabulary for us so that I can understand what you are doing better. Maintain a doc UBIQUITOUS_LANGUAGE.md for our shared design concept.

**Response:** Started `UBIQUITOUS_LANGUAGE.md` with seven proposed terms and asked round 1 (13 questions).

---

## 3 · Answers to round 1

> You can find the brief in D:\TheSDE\assignments\AI_Engineer_PROMPTING_ASSIGNMENT (1). It has all the references to how the app is supposed to work and look like.
> We need a fullstack app with frontend, backend and database. Let's just stick to a mobile sized webapp for now.
> A post in the MVP is a piece of media like image or video, with a text caption associated with it. Caption length is 1000 characters.
> For the rest of the specs related questions refer to the assignment document and get back to me if you still don't get your answer.
> Keep the words proposed for now.
> Context and ubiquitous_language should be two different docs.

**Response:** Read the full brief and mockups. Wrote `CONTEXT.md`, extended the glossary with the brief's terms, pointed the domain docs at `UBIQUITOUS_LANGUAGE.md`, and asked round 2 (11 questions).

---

## 4 · Answers to round 2

> 1. This is a take home assignment so we are building the app right now. We submit it once we have the MVP. Maintain PROMPTS.md to document the prompts I give you. Write tests wherever essential like login auth, post interactions, etc. We don't have a time constraint right now so we will follow TDD.
> 2. We will follow the requirements given in the assignment brief itself. Maintain the requirements in a product requirements doc so that I can keep track of them.
> 3. Will get back to the feed specs later. For now we will only render the seed data. You don't build the entire app at once anyways so we will go one feature at a time.
> 4. For the stack we will stick to the typescript end to end stack. Prisma seems like a good option. Maintain a DECISIONS.md as well justifying the choices I make here.
> 5. We will use a session row with it's ID in an httpOnly cookie since it's easier to manage. Password will be minimum 8 chars with at lease one uppercase letter, 1 lowercase letter, 1 number and 1 special character. Also, added security to ensure password doesn't contain the username, email or Name of the user.
> 6. Username is set by the user at the time of sign up. It is a mandatory step. To reduce cognitive overload, suggest 3 usernames based on the User's first and last name. Every username needs to be unique. Only allow lowercase alphabets, numbers, underscore and "." in username.
> 7. We will get to other decisions later.

**Response:** Created `PROMPTS.md` (this file), `PRODUCT_REQUIREMENTS.md` and `DECISIONS.md`. Moved the screen requirements out of `CONTEXT.md` into the requirements doc, updated the glossary, and asked round 3.

---

## 5 · Answers to round 3

> 1. Username will be set after the account is created on a subsequent page. If the user doesn't set a username, don't register their account in the database.
> 2. go ahead with the rules
> 3. suggestion format is also fine.
>
> 4 to 10. Go ahead with your suggestions
>
> 11. I have initialized the repo. Setup the workspaces
> 12. We will use pgqsl since we are aiming for a more production level architecture

**Response:** Recorded decisions D-011 to D-017 and updated the requirements and glossary. Scaffolded npm workspaces (`server/`, `client/`) with TypeScript, Vitest, Express, Prisma (PostgreSQL) and React + Vite, plus a `docker-compose.yml` for Postgres and one smoke test per workspace. Nothing committed.

---

## 6 · Review before committing

> Let me review first

**Response:** Held both commits. Listed the files to review, in a suggested reading order.

---

## 7 · Approve commits

> Looks good. Commit

**Response:** Made two commits: the docs, then the workspace scaffold. Not pushed.
