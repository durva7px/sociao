import { describe, expect, it } from "vitest";
import { checkUsername, usernameCandidates } from "./username.rules.js";

// Pure Username rules for Choose Username (Sign up step 2). No database.

describe("checkUsername (AUTH-08, D-012)", () => {
  it.each(["gus", "gustavo.levin", "gustavo_levin", "g.l_2024", "2gus", "gus_", "a".repeat(30)])(
    "accepts %s",
    (username) => {
      expect(checkUsername(username)).toEqual([]);
    },
  );

  it("rejects fewer than 3 characters", () => {
    expect(checkUsername("gu")).toContain("username_too_short");
  });

  it("rejects more than 30 characters", () => {
    expect(checkUsername("a".repeat(31))).toContain("username_too_long");
  });

  it.each(["Gustavo", "gus-levin", "gus levin", "gús", "gus@levin"])(
    "rejects characters outside a-z, 0-9, _ and . (%s)",
    (username) => {
      expect(checkUsername(username)).toContain("username_invalid_chars");
    },
  );

  it.each([".gus", "_gus"])("must start with a letter or digit (%s)", (username) => {
    expect(checkUsername(username)).toContain("username_bad_start");
  });

  it("must not end with a dot", () => {
    expect(checkUsername("gus.")).toContain("username_trailing_dot");
  });

  it("must not contain two dots in a row", () => {
    expect(checkUsername("gus..levin")).toContain("username_double_dot");
  });

  it("rejects an empty Username as too short", () => {
    expect(checkUsername("")).toContain("username_too_short");
  });
});

describe("usernameCandidates (AUTH-10, D-012)", () => {
  // Fixed "random" digits so the output is predictable in tests.
  const digits = () => "42";

  it("builds candidates from first and last name in the agreed order", () => {
    expect(usernameCandidates("Gustavo Levin", digits)).toEqual([
      "gustavo.levin",
      "gustavo_levin",
      "gustavolevin",
      "glevin",
      "gustavo.levin42",
    ]);
  });

  it("uses the first and last word when the Name has more than two", () => {
    expect(usernameCandidates("Ana Maria Silva", digits)[0]).toBe("ana.silva");
  });

  it("converts accented letters to plain ones", () => {
    expect(usernameCandidates("José Núñez", digits)[0]).toBe("jose.nunez");
  });

  it("drops characters that aren't letters or digits", () => {
    expect(usernameCandidates("Conan O'Brien-Smith", digits)[0]).toBe("conan.obriensmith");
  });

  it("ignores case and extra spaces", () => {
    expect(usernameCandidates("  GUSTAVO   levin ", digits)[0]).toBe("gustavo.levin");
  });

  it("gives a one-word Name variants with _, . and digits", () => {
    expect(usernameCandidates("Gustavo", digits)).toEqual([
      "gustavo",
      "gustavo_42",
      "gustavo.42",
      "gustavo42",
    ]);
  });

  it("only ever returns Usernames that pass checkUsername", () => {
    for (const name of ["Al", "X Y", "Ö", "a".repeat(40) + " " + "b".repeat(40), "!!!"]) {
      for (const candidate of usernameCandidates(name, digits)) {
        expect(checkUsername(candidate), `${name} -> ${candidate}`).toEqual([]);
      }
    }
  });

  it("never returns duplicates", () => {
    const candidates = usernameCandidates("Gustavo Levin", digits);
    expect(new Set(candidates).size).toBe(candidates.length);
  });
});
