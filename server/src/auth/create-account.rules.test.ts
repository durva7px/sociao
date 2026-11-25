import { describe, expect, it } from "vitest";
import {
  checkEmail,
  checkName,
  checkPassword,
  normalizeEmail,
} from "./create-account.rules.js";

// Pure rules for Create Account (Sign up step 1). No database involved.
// Each rule returns a list of failure codes; an empty list means "passes".
// Codes (not messages) are asserted so wording can change without breaking tests.

describe("normalizeEmail (AUTH-02, D-014)", () => {
  it("trims surrounding spaces and lowercases", () => {
    expect(normalizeEmail("  Gus.Levin@Mail.COM ")).toBe("gus.levin@mail.com");
  });
});

describe("checkEmail (AUTH-02)", () => {
  it.each(["gus@mail.com", "gus.levin+tag@sub.mail.co"])("accepts %s", (email) => {
    expect(checkEmail(email)).toEqual([]);
  });

  it.each([
    ["", "empty"],
    ["gusmail.com", "no @"],
    ["gus@mail", "no dot in domain"],
    ["gus @mail.com", "contains a space"],
    ["@mail.com", "no local part"],
  ])("rejects %j (%s)", (email) => {
    expect(checkEmail(email)).toEqual(["invalid_email"]);
  });
});

describe("checkName (AUTH-03a, D-014)", () => {
  it("accepts a one-word Name", () => {
    expect(checkName("Gustavo")).toEqual([]);
  });

  it("accepts exactly 50 characters", () => {
    expect(checkName("a".repeat(50))).toEqual([]);
  });

  it("rejects an empty or whitespace-only Name", () => {
    expect(checkName("")).toEqual(["name_required"]);
    expect(checkName("   ")).toEqual(["name_required"]);
  });

  it("rejects more than 50 characters after trimming", () => {
    expect(checkName("a".repeat(51))).toEqual(["name_too_long"]);
  });

  it("measures length after trimming", () => {
    expect(checkName(`  ${"a".repeat(50)}  `)).toEqual([]);
  });
});

describe("checkPassword: character rules (AUTH-04, D-006, D-013)", () => {
  const owner = { name: "Gustavo Levin", email: "gus@mail.com" };

  it("accepts a password meeting every rule", () => {
    expect(checkPassword("Sunset#2024", owner)).toEqual([]);
  });

  it("rejects fewer than 8 characters", () => {
    expect(checkPassword("Sun#20a", owner)).toContain("too_short");
  });

  it("accepts exactly 8 characters", () => {
    expect(checkPassword("Sunse#20", owner)).toEqual([]);
  });

  it("requires an uppercase letter", () => {
    expect(checkPassword("sunset#2024", owner)).toContain("missing_uppercase");
  });

  it("requires a lowercase letter", () => {
    expect(checkPassword("SUNSET#2024", owner)).toContain("missing_lowercase");
  });

  it("requires a digit", () => {
    expect(checkPassword("Sunset#abcd", owner)).toContain("missing_digit");
  });

  it("requires a special character", () => {
    expect(checkPassword("Sunset2024a", owner)).toContain("missing_special");
  });

  it("does not count a space as the special character", () => {
    expect(checkPassword("Sunset 2024", owner)).toContain("missing_special");
  });

  it("reports every failed rule at once", () => {
    expect(checkPassword("abc", owner)).toEqual([
      "too_short",
      "missing_uppercase",
      "missing_digit",
      "missing_special",
    ]);
  });
});

describe("checkPassword: must not contain the User's identity (AUTH-05, D-013)", () => {
  const owner = { name: "Gustavo Levin", email: "gus.l@mail.com" };

  it("rejects a password containing a Name word, ignoring case", () => {
    expect(checkPassword("LEVIN#2024a", owner)).toContain("contains_name");
    expect(checkPassword("myGustavo#1", owner)).toContain("contains_name");
  });

  it("ignores Name words shorter than 3 letters", () => {
    expect(checkPassword("Alright#2024", { name: "Al Li", email: "x.y.z@mail.com" })).toEqual([]);
  });

  // D-019: for the email, only an exact match is rejected (case and spaces ignored).
  it("rejects a password that exactly equals the email, ignoring case", () => {
    const user = { name: "Gustavo Levin", email: "Gus1@mail.com" };
    expect(checkPassword("Gus1@mail.com", user)).toEqual(["matches_email"]);
    expect(checkPassword("GUS1@MAIL.COM", user)).toContain("matches_email");
  });

  it("allows a password that merely contains part of the email", () => {
    expect(checkPassword("Sunset#gus.l9", owner)).toEqual([]);
    expect(checkPassword("Gus.l@mail.com1", owner)).toEqual([]);
  });

  it("rejects a password containing the Username when one is given (step 2)", () => {
    expect(checkPassword("Gl3v1n#gus_l", { ...owner, username: "gus_l" })).toContain("contains_username");
  });

  it("skips the Username check when no Username is known yet (step 1)", () => {
    expect(checkPassword("Sunset#2024", owner)).not.toContain("contains_username");
  });
});
