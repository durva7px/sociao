# Ubiquitous Language — sociao

The shared vocabulary for sociao. We use these words with these meanings in conversation, tests, code and issues. If a word isn't here, we either add it or stop using it. Project scope and constraints live in [CONTEXT.md](CONTEXT.md).

**Status legend:** ✅ agreed · 🟡 proposed (not yet confirmed) · 💤 reserved (a later feature; the word is taken but not built yet)

## People and relationships

| Term | Meaning | Avoid saying | Status |
| ---- | ------- | ------------ | ------ |
| **User** | A person with an identity in sociao who can publish Posts and follow other Users. | member, account (unless we mean the sign-in credentials) | ✅ |
| **Author** | The User who published a given Post or Comment. A role, not a separate thing. | owner, poster | ✅ |
| **Follow** | A one-way relationship: a Follower subscribes to a Followee's Posts. | friend, connect | ✅ |
| **Follower** | The User who initiates a Follow. | subscriber, fan | ✅ |
| **Followee** | The User being followed. On screen, a User's Followees are listed under "Following". | friend | ✅ |
| **Remove (a Follower)** | The Followee ends a Follow that someone else started. | block, kick | 🟡 |
| **Profile** | The public face of a User: name, username, bio, avatar, website link, and the three counts. | page, wall | 🟡 |
| **Username** | A User's unique `@name`, chosen at Sign up from 3 suggestions or typed freely. Only lowercase letters, digits, `_` and `.`. Shown on Profile, Feed and lists. | handle (pick one), id | 🟡 |
| **Username suggestion** | One of the 3 available Usernames offered in Choose Username, built from the User's Name (rules in D-012). | recommendation | ✅ |
| **Name** | The User's display name, separate from their Username. Sign-up asks for "Full Name". | full name, display name (pick one) | 🟡 |

## Content

| Term | Meaning | Avoid saying | Status |
| ---- | ------- | ------------ | ------ |
| **Post** | A single thing a User publishes: a Caption, plus optional Media. | content, tweet, status | ✅ |
| **Media** | The single image or video optionally attached to a Post. | attachment, asset, file | ✅ |
| **Caption** | The Post's text, 1 to 1000 characters. Every Post has one. | body, text, description | ✅ |
| **Feed** | The list of Posts a User sees on Home. | timeline, wall, stream | ✅ |
| **Video Post** | A Post whose Media is a video. It opens in the Video viewer and has a View count. | reel, clip | 🟡 |
| **View count** | How many times a Video Post has been watched. | plays | 💤 |

## Reactions to Posts

| Term | Meaning | Avoid saying | Status |
| ---- | ------- | ------------ | ------ |
| **Like** | A User's single, reversible approval of a Post. At most one per User per Post. | heart, upvote, favourite | 🟡 |
| **Save** | A User's private, reversible bookmark of a Post. | bookmark (UI icon only), favourite | 🟡 |
| **Comment** | Text a User writes on a Post. | reply (that's different) | 💤 |
| **Reply** | A Comment on another Comment. One level deep. | sub-comment, thread | 💤 |
| **Share** | Sending a Post elsewhere. The mockups show a count. | repost | 💤 |

## Other features (named, not yet built)

| Term | Meaning | Status |
| ---- | ------- | ------ |
| **Story** | A short item shown in the Stories row, with a seen/unseen ring. | 💤 |
| **Live** | A badge on a Story showing its User is broadcasting now. | 💤 |
| **Conversation** | A private thread between two Users, listed in the Inbox. | 💤 |
| **Message** | One entry in a Conversation. | 💤 |
| **Notification** | An alert about activity relevant to the User. | 💤 |

## Session and auth

| Term | Meaning | Avoid saying | Status |
| ---- | ------- | ------------ | ------ |
| **Sign up** | The two-step process that creates a User: **Create Account** (Name, email, password), then **Choose Username**. The User exists only after the second step. | register | ✅ |
| **Create Account** | Step 1 of Sign up. Checks Name, email and password but stores nothing. | register page | ✅ |
| **Choose Username** | Step 2 of Sign up. The User picks a Username suggestion or types one, and the User is created. | username page | ✅ |
| **Log in / Log out** | Start or end a Session. The UI also says "Sign Out". | sign in (the mockup's "Sign in" link actually goes to sign-up) | 🟡 |
| **Session** | A database row proving requests come from a signed-in User. Its id travels in an `httpOnly` cookie. Log out deletes it. | token, JWT | ✅ |
| **Password rules** | At least 8 characters with an uppercase letter, a lowercase letter, a digit and a special character, and not containing the User's Username, email or Name. | password policy | ✅ |

## Decisions log

| Date | Decision |
| ---- | -------- |
| 2026-11-25 | Keep User, Post, Author, Follow, Follower, Followee and Feed as proposed |
| 2026-11-25 | A Post is a Caption (1–1000 chars) with optional Media, following the brief (DECISIONS D-003) |
| 2026-11-25 | Sign up is two steps; the User is created only at Choose Username (D-011) |
| 2026-11-25 | Session = database row + httpOnly cookie (D-005); Password rules (D-006); Username chosen at Sign up (D-007) |
