import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

// AUTH-06: passwords are stored only as a hash. The library behind this is a detail;
// these tests pin the behaviour any choice must have.

describe("hashPassword / verifyPassword (AUTH-06)", () => {
  const password = "Sunset#2024";

  it("never returns the password itself", async () => {
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash).not.toContain(password);
  });

  it("salts each hash, so the same password hashes differently each time", async () => {
    expect(await hashPassword(password)).not.toBe(await hashPassword(password));
  });

  it("verifies the correct password", async () => {
    const hash = await hashPassword(password);

    expect(await verifyPassword(password, hash)).toBe(true);
  });

  it("rejects a wrong password, including one differing only by case", async () => {
    const hash = await hashPassword(password);

    expect(await verifyPassword("Sunset#2025", hash)).toBe(false);
    expect(await verifyPassword("sunset#2024", hash)).toBe(false);
  });
});
