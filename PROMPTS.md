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

---

## 8 · Start Create Account (step 1), test-first

> Yes, write the tests

**Response:** Wrote failing tests only (the red step): unit tests for the Name, email and Password rules, and API tests for `POST /auth/signup/check`. Ran them to confirm they fail. Proposed the `User` model and test-database setup needed to make them pass. No implementation yet.

---

## 9 · Change the password identity rule; approve schema

> For the password just apply the rule for the name and user name. The password just shouldn't exactly match the email. Rest all is fine

**Response:** Recorded D-019 (replacing the email part of D-013) and updated AUTH-05 and the tests. Then did the green step: added the `User` and `Session` models with a first migration, set up the separate test database, and implemented the Create Account rules and `POST /auth/signup/check`. Not committed.

---

## 10 · Approve commit

> Yes, commit

**Response:** Committed Create Account (step 1) as one commit. Not pushed.

---

## 11 · Start Choose Username (step 2), test-first

> Yes, write the tests

**Response:** Wrote failing tests only: unit tests for the Username rules, Username suggestions and password hashing, and API tests for `GET /auth/username-suggestions` and `POST /auth/signup`. Ran them to confirm they fail. Asked for a hashing library and two small rule choices before implementing.

---

## 12 · Approve choices, go green on Choose Username

> Approve, go green

**Response:** Recorded D-021 to D-023 (bcryptjs at cost 12, one-word and fallback suggestions, cookie settings). Implemented the Username rules, password hashing, Sessions, `GET /auth/username-suggestions` and `POST /auth/signup`, and made the tests pass. Not committed.

---

## 13 · Approve commit

> Yes, commit

**Response:** Committed Choose Username (sign-up step 2) as one commit. Not pushed.

---

## 14 · Push

> Push first

**Response:** Pushed `main` (4 commits) to `origin` on GitHub. This entry is committed with the next feature.

---

## 15 · Start Log in / Log out, test-first

> Yes, write the tests

**Response:** Wrote failing API tests for `POST /auth/login`, `POST /auth/logout` and `GET /auth/me`, and ran them to confirm they fail. No implementation yet.

---

## 16 · Approve Log in / Log out behaviour, go green

> Approve, go green

**Response:** Recorded D-024. Added cookie parsing, Session lookup and a `requireUser` guard. Implemented `POST /auth/login`, `POST /auth/logout` and `GET /auth/me`, and made the tests pass. Not committed.

---

## 17 · Manual check in Postman; approve commit

> I tested the auth routes in Postman. Seems good. CommiT

**Response:** Committed Log in / Log out and `GET /auth/me`, together with prompt log entries 14 to 17. Not pushed.

---

## 18 · Next feature: auth screens

> Auth screens

**Response:** Wrote failing screen tests (React Testing Library) for Log in, Create Account, Choose Username, the logged-out redirect and Log out. Installed `react-router` and `@testing-library/user-event` so the tests can run. Ran them to confirm they fail, and listed the UI choices to approve before implementing.

---

## 19 · Approve UI choices, go green on the auth screens

> Approve, go green

**Response:** Recorded D-025. Built the client API module, auth state, the Log in, Create Account, Choose Username and placeholder Home screens, the route guards and CSS Modules styling, and made the screen tests pass. Checked the full flow in the browser (sign up, reload, log out, wrong password, log in). Found that Create Account kept a field's error after it was edited; added a failing test, then fixed it. Not committed.

---

## 20 · Approve commit

> Yes, commit

**Response:** Committed the auth screens as one commit, leaving `.claude/launch.json` out. Not pushed.

---

## 21 · Next feature: seed data and Feed

> Yes, seed and Feed

**Response:** Before writing tests, asked one round of design questions about the Post, Like and avatar schema, seed contents and media, the Feed API shape, paging and the Like endpoints. These are data-modelling choices the brief says reviewers will look at. No code yet.

---

## 22 · Question: how is likedByMe maintained?

> How are the posts liked by the user being maintained? likedByMe is a property in which table? How is this being coordinated with the Post model?

**Response:** Explained that `likedByMe` isn't stored in any table. It's worked out on each Feed request from the `Like` table for the logged-in viewer, alongside the computed `likeCount`. Showed the schema relations and the query.

---

## 23 · Approve the seed and Feed design

> Ok makes sense. Go ahead with the proposed solutions

**Response:** Recorded D-026 to D-028. Test-first on the server: the Post and Like schema (with database check constraints), the seed script, `GET /feed` with cursor paging, and the Like / unlike endpoints. Then test-first on the client: the Feed screen with Post cards, the Like toggle (instant update, rolled back on failure), loading, empty and error states, and "load more". Seeded the dev database and checked the Feed in the browser. The check found that Google's sample-video bucket (the seed video source) now answers 403, so the videos were blank; switched to MDN and test-videos.co.uk clips and recorded D-029. Not committed.

---

## 24 · Approve commits

> Yes, commit both

**Response:** Made two commits: the server side (schema, seed, Feed and Like API) with the docs, then the client Feed screen. `.claude/` stays out. Not pushed.

---

## 25 · README, then Profile

> README, then Profile

**Response:** Wrote README.md (how to run, demo accounts, schema with a diagram, API, tests, done / not done) and added root scripts for migrating and seeding. Checked the setup commands. Then asked a design round for the Profile screens.

---

## 26 · Approve the Profile design

> Approved

**Response:** Picked up the developer's own change (D-030: the seed resets only its own Users) and built on it. Recorded D-031 and D-032. Test-first on the server: the Follow model, `bio`, `viewCount`, `GET /users/:username`, `GET /users/:username/posts` and Follow / Unfollow. Test-first on the client: the Profile screen (Post, Video and Tag tabs), other Users' Profiles with Follow, links from Feed Authors, the bottom navigation and count formatting. Moved the Feed's paging and Post shape into a shared helper, so the Profile tabs reuse them. The full suite was flaky: the seed test file sometimes skipped all its tests. The cause was a new Profile test leaving a `gustavo.levin` User in the shared test database, which hit the D-030 edge case. Fixed by resetting the test database before seeding, and confirmed with 4 clean runs in a row. Checked Profile, the Video tab and Follow / Unfollow in the browser. Updated the README. Not committed.

---

## 27 · Approve commits

> Yes, commit both

**Response:** Made two commits: the server side of Profile (Follow model, Profile and Follow API, seed Follows) with the docs, then the client (Profile screen, Follow toggle, bottom navigation). `.claude/` stays out. Not pushed.
