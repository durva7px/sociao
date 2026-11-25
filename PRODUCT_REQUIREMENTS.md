# Product Requirements — sociao

The requirements we build against. They come from the assignment brief, plus our decisions where the brief is silent or the mockups are unclear. The words used are defined in [UBIQUITOUS_LANGUAGE.md](UBIQUITOUS_LANGUAGE.md), and the reasoning behind choices is in [DECISIONS.md](DECISIONS.md).

**Priority:** `MUST` · `SHOULD` · `BONUS` (from the brief's ordering)
**Status:** ⬜ not started · 🧪 tests written · 🔨 in progress (e.g. the server side is done but the screen isn't) · ✅ done · ❓ open question · ⏸ deferred

Each requirement has an id (e.g. `AUTH-03`) so tests, commits and conversations can point at it.

---

## Cross-cutting

| Id | Requirement | Priority | Status |
| -- | ----------- | -------- | ------ |
| GEN-01 | Mobile-sized web app: frontend, backend API and a real database (PostgreSQL, D-017) | MUST | 🔨 |
| GEN-02 | No hard-coded screen data. Everything comes from the database, and only seed data is loaded by a script | MUST | ⬜ |
| GEN-03 | Seed script loads at least 5 Users and 10 Posts, covering text-only, text + image and text + video Posts | MUST | ⬜ |
| GEN-04 | Loading, empty and error states on every screen we build | SHOULD | 🔨 |
| GEN-05 | Bottom navigation (Home, Video, +, Inbox, Profile) works on every main screen | BONUS | ⬜ |
| GEN-06 | Logged-out Users can't reach any screen except Log in and Sign up (they are redirected to Log in) | MUST | ✅ |

## Auth: Sign up (screen 2, "Create Account")

| Id | Requirement | Priority | Status |
| -- | ----------- | -------- | ------ |
| AUTH-01 | Sign up is two steps: (1) Create Account collects Name, email and password; (2) Choose Username. The User is created only when step 2 is submitted (D-011) | MUST | ✅ |
| AUTH-01a | Leaving before step 2 stores nothing in the database | MUST | ✅ |
| AUTH-02 | Email must be in a valid format (`local@domain.tld`), and is trimmed and lowercased (D-014) | MUST | ✅ |
| AUTH-03 | Email must be unique. A duplicate gets "An account with this email already exists", checked at step 1 and again at step 2 | MUST | ✅ |
| AUTH-03a | Name is 1 to 50 characters after trimming (D-014) | MUST | ✅ |
| AUTH-04 | Password is at least 8 characters, with at least one uppercase letter, one lowercase letter, one digit and one special character (anything that isn't a letter, digit or whitespace) | MUST | ✅ |
| AUTH-05 | Ignoring case, the password must not contain the Username or any Name word of 3+ letters, and must not exactly equal the email (D-013, D-019) | MUST | ✅ |
| AUTH-06 | Password is stored only as a hash, never as plain text | MUST | ✅ |
| AUTH-07 | Username is mandatory and set by the User during sign up | MUST | ✅ |
| AUTH-08 | Username is 3 to 30 characters of lowercase letters, digits, `_` and `.`. It starts with a letter or digit, doesn't end with `.`, and has no `..` (D-012) | MUST | ✅ |
| AUTH-09 | Username must be unique across all Users. If taken: "That username is taken", with fresh suggestions | MUST | ✅ |
| AUTH-10 | Step 2 suggests 3 available Usernames built from the Name, in the order set in D-012 | MUST | ✅ |
| AUTH-11 | A successful sign up logs the User in | MUST | ✅ |
| AUTH-12 | Show/hide password toggle | MUST | ✅ |
| AUTH-13 | Link to Log in | MUST | ✅ |

## Auth: Log in / Log out (screens 1 and 11)

| Id | Requirement | Priority | Status |
| -- | ----------- | -------- | ------ |
| AUTH-20 | Log in with email + password | MUST | ✅ |
| AUTH-21 | Login button stays disabled until the email format is valid and the password isn't empty (D-015) | MUST | ✅ |
| AUTH-22 | Show/hide password toggle | MUST | ✅ |
| AUTH-23 | Link to Create Account. _(The mockup's link says "Sign in". Ours says "Create Account")_ | MUST | ✅ |
| AUTH-24 | Wrong email or password shows one generic message, "Incorrect email or password" (D-015) | MUST | ✅ |
| AUTH-25 | A Session is a database row whose id is held in an `httpOnly` cookie. It expires 7 days after Log in (D-016) | MUST | ✅ |
| AUTH-26 | Log out deletes the Session and returns to Log in | MUST | ✅ |

## Home Feed (screen 3)

| Id | Requirement | Priority | Status |
| -- | ----------- | -------- | ------ |
| FEED-01 | Posts load from the API | MUST | ⬜ |
| FEED-02 | Displays text-only, text + image and text + video Posts | MUST | ⬜ |
| FEED-03 | Which Posts appear and in what order (for now: render the seed data) | MUST | ⏸ |
| FEED-04 | Like toggles and updates the count | MUST | ⬜ |
| FEED-05 | A Like is saved to the database and the count is correct after a refresh | MUST | ⬜ |
| FEED-06 | A User can't like the same Post twice | MUST | ⬜ |
| FEED-07 | Save toggles | MUST | ⬜ |
| FEED-08 | Post menu (…) | MUST | ⏸ |
| FEED-09 | Stories row (Add Story, Live badge, seen/unseen ring) | MUST | ⏸ |
| FEED-10 | Notifications and Messages icons in the header | MUST | ⏸ |

## Posts

| Id | Requirement | Priority | Status |
| -- | ----------- | -------- | ------ |
| POST-01 | A Post has a Caption of 1 to 1000 characters | MUST | ⬜ |
| POST-02 | A Post has optional Media: one image or one video | MUST | ⬜ |
| POST-03 | Create Post screen behind the + button (we design it) | BONUS | ⬜ |

## Profile (screens 7 and 8)

| Id | Requirement | Priority | Status |
| -- | ----------- | -------- | ------ |
| PROF-01 | Shows the signed-in User's real Name, Username and bio | SHOULD | ⬜ |
| PROF-02 | Following, Followers and Posts counts | SHOULD | ⬜ |
| PROF-03 | Post tab lists the User's own Posts | SHOULD | ⬜ |
| PROF-04 | Video tab: two-column grid of the User's Video Posts with View counts | SHOULD | ⬜ |
| PROF-05 | Tag tab can be an empty state | SHOULD | ⬜ |

## Bonus screens

| Id | Requirement | Priority | Status |
| -- | ----------- | -------- | ------ |
| VID-01 | Video viewer: full-screen video with Author, Caption and music line; Like, Comment, Share and Save with counts; X goes back | BONUS | ⬜ |
| CMT-01 | Comments sheet: total count, one level of Replies, like a Comment, reply, add a Comment | BONUS | ⬜ |
| MSG-01 | Messages inbox: Conversations with avatar, Name, last-message preview, time and unread dot. Opening clears unread | BONUS | ⬜ |
| MSG-02 | Chat thread: Messages from both Users in order with times, heart reaction, send a Message. Video and call icons are placeholders | BONUS | ⬜ |
| EDIT-01 | Edit Profile: change photo, Name, Username, bio and website link. Saving updates the Profile | BONUS | ⬜ |
| SET-01 | Settings: Edit Profile, Notifications, Light/Dark, Help & Support, Language, Log out | BONUS | ⬜ |
| FOL-01 | Followers list: avatar, Name, Username, Message or Remove, search, back | BONUS | ⬜ |
| FOL-02 | Following list: avatar, Name, Username, Message, search, back | BONUS | ⬜ |

## Deliverables

| Id | Requirement | Status |
| -- | ----------- | ------ |
| DEL-01 | Public GitHub repo with the full commit history | ⬜ |
| DEL-02 | README: how to run it, the schema, what's done and what isn't | ⬜ |
| DEL-03 | PROMPTS.md with the full prompt history | 🔨 |
| DEL-04 | One honest sentence on what the AI got wrong and how it was caught | ⬜ |
