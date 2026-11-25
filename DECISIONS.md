# Decisions — sociao

Each decision records what we chose, the alternatives, and why. Newest at the bottom. A decision is changed by adding a new entry that supersedes it, never by editing the old one.

---

## D-001 · Mobile-sized web app, full stack

**Date:** 2026-11-25 · **Status:** accepted

**Choice:** A web app laid out for a phone-width screen, with a frontend, a backend API and a real database.

**Alternatives:** A native or React Native mobile app, or a frontend talking to a backend-as-a-service.

**Why:** The brief allows either a mobile app or a mobile-sized web app. A web app runs in any browser with no emulator or app store, which makes it easier to build, test and review. Keeping a separate backend and database makes the data model and API visible, and the brief says those are assessed.

---

## D-002 · Follow the assignment brief as the source of requirements

**Date:** 2026-11-25 · **Status:** accepted

**Choice:** Requirements come from the brief and are tracked in [PRODUCT_REQUIREMENTS.md](PRODUCT_REQUIREMENTS.md). The mockups are a design brief. Where they're unclear or wrong, we decide, record it here, and tell the reviewers.

**Why:** The submission is graded against the brief.

---

## D-003 · A Post is a Caption with optional Media

**Date:** 2026-11-25 · **Status:** accepted (supersedes the earlier "Media required" idea)

**Choice:** Every Post has a Caption of 1 to 1000 characters and optionally one piece of Media (an image or a video).

**Alternatives:** Media required on every Post.

**Why:** The brief's Feed must show text-only, text + image and text + video Posts, and D-002 makes the brief the source of truth. The 1000-character Caption limit is our own choice. It's long enough for real captions and short enough to keep Feed cards readable.

---

## D-004 · TypeScript end to end, with Prisma

**Date:** 2026-11-25 · **Status:** accepted (database engine still open)

**Choice:**
- **Frontend:** React with Vite.
- **Backend:** Node with Express.
- **Database layer:** Prisma.
- **Tests:** Vitest, Supertest for the API, and React Testing Library for screens.
- **Language:** TypeScript throughout.

**Alternatives:** Next.js as a single full-stack framework; Python (FastAPI) or Go for the backend; raw SQL or Drizzle instead of Prisma.

**Why:**
- **One language** across frontend, backend and tests, so the shapes of API data can be shared and every file reads the same way.
- **React + Vite** is a light, fast setup for a mobile-sized single-page app.
- **Express** is minimal and well known, so there's little framework behaviour to explain.
- **Prisma** gives us a readable schema file to show reviewers, generated TypeScript types, migrations and a built-in seeding hook (which covers GEN-03).
- **Vitest** has the same API on the frontend and backend, so there's one test runner to learn.

---

## D-005 · Sessions stored in the database, identified by an httpOnly cookie

**Date:** 2026-11-25 · **Status:** accepted

**Choice:** Logging in creates a `Session` row in the database. Its random id is sent to the browser in an `httpOnly` cookie, and each request looks the Session up. Log out deletes the row.

**Alternatives:** A signed token (JWT) in a cookie or in browser storage.

**Why:**
- **Easier to manage:** Log out and revoking access are just deleting a row. A JWT stays valid until it expires unless we build a deny-list.
- **Safer:** an `httpOnly` cookie can't be read by JavaScript, which protects the Session from injected scripts.
- **Easy to explain:** the Session is plainly visible in the schema.
- **Cost:** one extra database lookup per request, which is negligible at this scale.

---

## D-006 · Password rules

**Date:** 2026-11-25 · **Status:** accepted (exact containment rule still open)

**Choice:** A password is at least 8 characters, with at least one uppercase letter, one lowercase letter, one digit and one special character. It must not contain the User's Username, email or Name. It's stored only as a hash.

**Why:** The brief asks us to define password rules. The character mix guards against short, simple passwords. Banning a User's own identifiers stops the most guessable passwords (like `Gustavo.levin1!`), which pass a pure character-mix check. Hashing is required by the brief.

---

## D-007 · Username chosen at sign up, with 3 suggestions

**Date:** 2026-11-25 · **Status:** accepted (length and placement still open)

**Choice:** Username is a required part of sign up. The app suggests 3 available Usernames based on the User's first and last name, and the User can pick one or type their own. Usernames are unique and use only lowercase letters, digits, `_` and `.`.

**Alternatives:** Generate the Username automatically and let the User change it later.

**Why:** Usernames appear across the app (Profile, Feed, Followers), so the User should choose theirs rather than inherit a generated one. Offering suggestions keeps the choice quick and cuts the effort of inventing a unique name. Allowing only lowercase means uniqueness can't be fooled by case (`Gustavo` vs `gustavo`).

**Deviation from the mockup:** the Create Account mockup has no Username field. We add one and will tell the reviewers.

---

## D-008 · Test-driven development, one feature at a time

**Date:** 2026-11-25 · **Status:** accepted

**Choice:** Each feature starts with failing tests, then the code that makes them pass. Tests cover the essential behaviour (auth rules, Post interactions such as Like and Save). Nothing is built, committed or pushed without the developer's approval.

**Why:** Tests pin the brief's rules down precisely (for example "a User can't like the same Post twice") and show reviewers that the code was checked rather than pasted. Going one feature at a time keeps each commit small and reviewable, which the brief asks for.

---

## D-009 · Feed contents deferred

**Date:** 2026-11-25 · **Status:** accepted for now

**Choice:** For now the Feed renders the seed data. Which Posts appear and in what order will be decided later.

**Why:** It lets us build the Feed screen and Likes without settling the Follow model first.

---

## D-010 · Separate documents for context, vocabulary, requirements, decisions and prompts

**Date:** 2026-11-25 · **Status:** accepted

**Choice:**
- `CONTEXT.md`: what and why.
- `UBIQUITOUS_LANGUAGE.md`: the words we use.
- `PRODUCT_REQUIREMENTS.md`: what must be built.
- `DECISIONS.md`: why we chose what we chose.
- `PROMPTS.md`: every prompt, verbatim.

**Why:** Each file answers one question, so it stays short and easy to keep current. `PROMPTS.md` is a deliverable required by the brief.

---

## D-011 · Sign up is two steps, and the User is created only at the end

**Date:** 2026-11-25 · **Status:** accepted (refines D-007)

**Choice:** Sign up runs in two steps:
1. **Create Account:** Name, email and password. The server checks them (email format and not already used, Password rules except the Username check) **without saving anything**.
2. **Choose Username:** pick one of the 3 suggestions or type one. Only then does the client send all four fields in a single request. The server re-checks everything, including that the password doesn't contain the Username, creates the User, and logs them in.

If the User leaves before step 2, nothing is stored. The step-1 values live only in the browser's memory, never in local storage, because they include the password.

**Alternatives:** A Username field on the same form; or saving a "pending" User after step 1.

**Why:** It's the developer's choice. It keeps the Create Account screen as the mockup shows it and makes the Username its own deliberate step. Creating the User only in the final request means no half-registered Users can exist. The server re-checks at step 2 because a client could skip step 1, and the email might have been taken in the meantime.

**Trade-offs:**
- Refreshing the page during step 2 loses the step-1 values, so the User starts again.
- If the password contains the chosen Username, step 2 says so. The User can pick another Username or go back and change the password.

---

## D-012 · Username shape and suggestions

**Date:** 2026-11-25 · **Status:** accepted (completes D-007)

**Rules:**
- 3 to 30 characters.
- Only lowercase letters, digits, `_` and `.`.
- Starts with a letter or digit.
- Doesn't end with `.`.
- No `..`.
- Unique.

**Suggestions**, e.g. for "Gustavo Levin", in this order:
1. `gustavo.levin`
2. `gustavo_levin`
3. `gustavolevin`
4. `glevin`
5. `gustavo.levin` plus 2 random digits

The server returns the first 3 that are free. Accented letters are converted to plain ones (é → e), and other characters are dropped. A one-word Name gets `.`, `_` and digit variants.

**Why:** These rules block look-alike names (`.gus`, `gus..levin`) and keep Usernames safe inside URLs. Suggestions are only useful if they're actually available, so the server checks them against the database.

---

## D-013 · Exact password containment rule and special characters

**Date:** 2026-11-25 · **Status:** accepted (completes D-006)

**Choice:** Comparisons ignore case. A password is rejected if it contains:
- the Username;
- the part of the email before `@`;
- any word of the Name that's 3 or more letters long.

A "special character" is anything that isn't a letter, digit or whitespace.

**Why:** A precise rule is testable. Skipping Name words shorter than 3 letters ("Al", "Li") avoids rejecting many reasonable passwords over a tiny match.

---

## D-014 · Email and Name handling

**Date:** 2026-11-25 · **Status:** accepted

**Choice:**
- **Email:** trimmed and lowercased before it's stored or compared, and validated with a simple `local@domain.tld` check.
- **Name:** 1 to 50 characters after trimming. One word is allowed.

**Why:** Lowercasing stops `Gus@Mail.com` and `gus@mail.com` becoming two accounts. A strict standards-level email parser rejects real addresses and adds nothing for this app.

---

## D-015 · Log in: when the button turns on, and the error messages

**Date:** 2026-11-25 · **Status:** accepted

**Choice:**
- **Login button:** enabled when the email format is valid and the password isn't empty. The full Password rules apply only at sign up.
- **Log in errors:** wrong email *or* wrong password gives one message, "Incorrect email or password".
- **Sign up errors:** these are specific ("An account with this email already exists", "That username is taken", plus fresh suggestions).

**Why:** Applying the Password rules at Log in would reveal the rules and could lock out older accounts. A single Log in message stops anyone probing which emails are registered. Sign up has to reveal a duplicate email anyway: the brief requires it to be handled.

---

## D-016 · Sessions last 7 days

**Date:** 2026-11-25 · **Status:** accepted (completes D-005)

**Choice:** A Session expires 7 days after Log in, and Log out deletes it immediately. There's no "remember me".

**Why:** It's long enough not to annoy the User and short enough to limit the damage if a cookie leaks. Expiry is just a timestamp on the Session row.

---

## D-017 · PostgreSQL in Docker; npm workspaces

**Date:** 2026-11-25 · **Status:** accepted (completes D-004)

**Choice:**
- **Database:** PostgreSQL, run locally with `docker compose`. The test suite uses a separate test database.
- **Repo layout:** one repo with npm workspaces: `server/` (Express, Prisma, API tests) and `client/` (React, Vite, screen tests).

**Alternatives:** SQLite; a hosted Postgres; separate repos.

**Why:**
- **Postgres** is the production-grade choice: real concurrency, strict constraints (e.g. a database-level unique `(userId, postId)` rule for Likes) and the same engine in development and production.
- **Docker** means reviewers don't have to install Postgres; `docker compose up` is enough.
- **Workspaces** keep the frontend and backend apart but let them share one install and one `npm test`.

---

## D-018 · Pin Prisma to stable 7.x, using the `pg` driver adapter

**Date:** 2026-11-25 · **Status:** accepted

**Choice:** The `prisma` CLI and `@prisma/client` are both pinned to `^7.10.1`. The database URL is in `server/prisma.config.ts`, not in `schema.prisma`, and the app connects through `@prisma/adapter-pg`.

**Why:**
- A plain `npm install prisma` picked `8.0.0-rc.35`, a release candidate that doesn't match the 7.x client. We stay on stable releases and keep the CLI and client versions together.
- Prisma 7 requires the URL in its config file and a driver adapter in the client.

**Known issue:** `npm audit` reports a high-severity ReDoS in `effect`, which comes in through `@prisma/config`. It's a dependency of the Prisma CLI (a development tool), not of the running app, and the only "fix" offered is downgrading to Prisma 6. We accept it and will check again before submitting.

---

## D-019 · Password vs email: an exact match only

**Date:** 2026-11-25 · **Status:** accepted (replaces the email part of D-013)

**Choice:** The "doesn't contain" rule applies only to the **Name** (words of 3+ letters) and the **Username**, ignoring case. For the email, the password is rejected only if it **exactly equals** the email address. Case and surrounding spaces are ignored, the same normalisation as D-014.

**Why:** It's the developer's call. Checking for the email's local part anywhere inside the password raised edge cases (a short local part like `an@` would block too many passwords) for little security gain. Using the email itself as the password is the case that actually matters.

---

## D-020 · Postgres on host port 5433; Prisma's new `prisma-client` generator

**Date:** 2026-11-25 · **Status:** accepted (amends D-017 and D-018)

**Choice:**
- **Port:** the Docker Postgres is exposed on host port **5433**.
- **Prisma client:** generated with the Prisma 7 `prisma-client` generator into `server/src/generated/prisma` (gitignored). `npm install` regenerates it through `postinstall`.
- **Tests:** `server/.env.test` points at `sociao_test` and is committed, because it holds only the local Docker credentials. The test setup refuses to run against any other database, and applies migrations before the suite starts.

**Why:**
- **Port:** a native Postgres on the development machine already listens on 5432. Prisma reached it instead of the container and failed with `P1010: access denied`. Moving the container is safer than touching the local install, and it avoids the same clash on reviewers' machines.
- **Generator:** the older `prisma-client-js` generator couldn't resolve `@prisma/client` in this npm-workspaces layout. The newer generator writes the client into our own source tree, so imports are explicit and don't depend on how packages are hoisted.
- **Tests:** a guarded, separate test database means tests can wipe tables freely without ever touching dev data.

---

## D-021 · Hash passwords with bcrypt (`bcryptjs`), cost 12

**Date:** 2026-11-25 · **Status:** accepted

**Choice:** Passwords are hashed with bcrypt through the pure-JavaScript `bcryptjs` package, at a cost factor of 12. All hashing goes through `server/src/auth/password.ts`, so the library can be swapped in one place.

**Alternatives:** native `bcrypt`; `argon2` (the newer recommended algorithm); Node's built-in `scrypt`.

**Why:**
- **Established:** bcrypt is a long-proven password hash. Its salt is built in, and so is its cost factor.
- **No compilers:** `bcryptjs` needs no native build step, so `npm install` works on any machine, including Windows, without build tools.
- **Cost 12** takes a few hundred milliseconds per hash: slow enough to resist guessing, fast enough for sign-up and log-in.
- **Not argon2:** it's stronger on paper but a native module. That's a setup risk with little benefit at this scale.

---

## D-022 · Username suggestions for one-word and unusable Names

**Date:** 2026-11-25 · **Status:** accepted (completes D-012)

**Choice:**
- **One word,** e.g. "Gustavo": `gustavo`, `gustavo_NN`, `gustavo.NN`, `gustavoNN`, where `NN` is random digits.
- **Too few valid candidates,** e.g. "Al" or "Ö": candidates that break the Username rules are dropped, and the server keeps adding random-digit variants until it has 3 free ones.
- **No usable letters,** e.g. "!!!": the stem falls back to `user`.
- **Long Names:** words are shortened so every suggestion fits within 30 characters.

**Why:** Choose Username must always offer 3 valid, free options, whatever Name the User typed.

---

## D-023 · Session cookie settings

**Date:** 2026-11-25 · **Status:** accepted (completes D-005)

**Choice:**
- **Name and value:** the cookie is `sociao_session`. Its value is a random 256-bit Session id (43 characters).
- **Flags:** `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Max-Age` of 7 days.
- **`Secure`:** added only when `NODE_ENV=production`.

**Why:**
- `HttpOnly` stops page scripts from reading the cookie.
- `SameSite=Lax` blocks most cross-site request forgery while still allowing normal links into the app.
- A 256-bit random id can't be guessed.
- `Secure` (HTTPS only) would break local development over plain HTTP, so it's limited to production.

---

## D-024 · Log in and Log out behaviour

**Date:** 2026-11-25 · **Status:** accepted

**Choice:**
- **One answer for every failed Log in.** Wrong password, unknown email, and missing or malformed fields all get `401 { error: "Incorrect email or password" }`.
- **No timing leak.** For an unknown email, the server still checks the password against a dummy bcrypt hash, so the response takes as long as for a real account.
- **Several Sessions per User** are allowed (one per device). Log out deletes only the current Session, returns `204`, and clears the cookie. Logging out while already logged out also returns `204`.
- **Expired Sessions** are deleted when they're next presented. There's no background cleanup job.
- **`GET /auth/me`** returns the logged-in User, or `401`. The `requireUser` guard behind it will protect every logged-in-only route (GEN-06).

**Why:**
- A single message, plus equal timing, stops anyone probing which emails have accounts.
- A separate 400 for malformed input would tell the User nothing new, because the Login button is disabled until the fields are valid (D-015).
- Per-device Sessions match how people use apps.
- Deleting expired Sessions when they're next used is enough at this scale.

---

## D-025 · Auth screens: routing, labels, where the rules live, styling

**Date:** 2026-11-25 · **Status:** accepted

**Choice:**
1. **Libraries:** `react-router` for screens and redirects. `@testing-library/user-event` lets tests type and click like a person.
2. **Label fixes to the mockups:**
   - Log in's password field is "Password" (the mockup says "Create Password").
   - Log in's sign-up link reads "Create Account" (the mockup says "Sign in").
   - Step 1's button is **Continue**, because nothing is created yet. Step 2's button is **Create Account**.
3. **The server is the only judge of sign-up rules.** The client lists the password rules as text and shows the server's per-field messages. The only check the client makes itself is the Log in button's (valid email, non-empty password; D-015).
4. **Username input** lowercases as you type.
5. **Step-1 details** live in React memory (a context) only: never in local storage, session storage or the history state. Back keeps them, and a refresh loses them (D-011).
6. **Placeholder Home** with the mockup's "Social" heading and a temporary Log out button. Log out moves to Settings, and the Feed replaces the placeholder later.
7. **Styling** uses CSS Modules (built into Vite), shared CSS variables for colours and spacing, and a layout capped at phone width.

**Why:**
- **One source of truth:** keeping the rules on the server means they can't drift apart between two copies. The cost is a round trip before step 1 errors appear, which is acceptable for a sign-up form.
- **Accurate labels:** they describe what each button actually does.
- **CSS Modules:** they keep styles scoped to each screen with no extra dependency or build setup.

---

## D-026 · Post and Like schema; counts are computed

**Date:** 2026-11-25 · **Status:** accepted

**Choice:**
- **`Post`:** `id`, `authorId`, `caption`, optional `mediaType` (`IMAGE` | `VIDEO`) and `mediaUrl`, and `createdAt`. Two database `CHECK` constraints back up the app's rules:
  - the Caption is 1–1000 characters;
  - `mediaType` and `mediaUrl` are both set or both empty.
- **`Like`:** primary key `(userId, postId)`, with an index on `postId`.
- **Computed values:** `likeCount` and `likedByMe` are never stored. Every Feed request works them out from the `Like` rows: a count, and "does a row exist for this viewer?".
- **`User.avatarUrl`:** optional. Users without one show their initials.

**Why:**
- The composite key makes "a User can't like the same Post twice" (FEED-06) a database guarantee, not just app logic.
- Computed counts can't drift from the real Likes, which satisfies "count is correct after refresh" (FEED-05).
- `likedByMe` depends on who's viewing, so it can't be a column on `Post`.
- The `CHECK` constraints keep the data valid even if a bug or a manual edit bypasses the API.

**Later:** if Likes grow very large, add a cached `likeCount` on `Post`, updated in the same transaction as each Like.

---

## D-027 · Seed data

**Date:** 2026-11-25 · **Status:** accepted

**Choice:**
- **Contents:** 6 fictional Users with names from the mockups, all with the demo password `Sociao#2024` (listed in the README). 12 Posts spread over the last few days: 4 text-only, 5 image and 3 video. Likes spread across Users, so some Posts are already liked by Gustavo.
- **Media:** images and avatars are public stock links (`picsum.photos`, `i.pravatar.cc`). Videos come from Google's public sample-video bucket.
- **Running it:** `npm run db:seed` clears every table and reseeds, so running it twice gives the same result.

**Why:**
- The brief requires at least 5 Users and 10 Posts covering text, image and video.
- Stock links keep large files out of the repo, and since each Post only stores a `mediaUrl`, switching to self-hosted files is a seed-only change.
- **Downside:** seed media needs an internet connection to load.

---

## D-028 · Feed API, paging, Like endpoints and unbuilt buttons

**Date:** 2026-11-25 · **Status:** accepted

**Choice:**
- **`GET /feed`** is logged-in only. It returns every User's Posts, newest first (D-009), in pages of 10. Each page carries an opaque `nextCursor`, an encoded "older than this Post" marker built from `createdAt` and `id` (the id breaks ties), or `null` on the last page.
- **Each Post** includes `id`, `caption`, `createdAt`, `media` (`{ type, url }` or `null`), `author` (`id`, `name`, `username`, `avatarUrl`), `likeCount` and `likedByMe`.
- **`PUT /posts/:id/like`** and **`DELETE /posts/:id/like`** are both idempotent and return `{ likeCount, likedByMe }`. An unknown Post gets 404.
- **The client** updates the heart and count instantly and rolls back if the request fails.
- **Comment, Share, Save and the "…" menu** are shown but disabled, with no counts, until those features exist.

**Why:**
- Cursor paging stays correct while new Posts arrive, which page numbers don't.
- Idempotent endpoints make double-taps and retries harmless.
- An instant update makes Like feel immediate, and the rollback keeps the screen honest when the server says no.
- Fake zeros would misrepresent features that don't exist yet.

---

## D-029 · Replace the seed video source

**Date:** 2026-11-25 · **Status:** accepted (amends D-027)

**Choice:** Seed videos now come from MDN's CC0 sample clip and test-videos.co.uk's 10-second test clips.

**Why:** During the browser check, every video in Google's `gtv-videos-bucket` returned **403 Forbidden**, so the Video Posts showed nothing. The new URLs were checked and answer with real `video/mp4` content. This is a known risk of hotlinked seed media (D-027). Self-hosting the files under `server/public/seed/` remains the fallback.
