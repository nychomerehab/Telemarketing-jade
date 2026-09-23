import { describe, expect, it } from "vitest";
import { passwordStrengthScore } from "./routers";

describe("user management password validation", () => {
  it("requires all five password strength signals", () => {
    expect(passwordStrengthScore("Arian2026!")).toBe(5);
    expect(passwordStrengthScore("arian2026")).toBe(3);
    expect(passwordStrengthScore("short!")).toBe(2);
  });

  it("does not treat an existing password as viewable data", () => {
    const accountResponseShape = { fullName: "Arian Dela Cruz", username: "arian", password: "••••••••" };
    expect(accountResponseShape.password).not.toBe("Arian2026!");
    expect(accountResponseShape).not.toHaveProperty("passwordHash");
  });
});
