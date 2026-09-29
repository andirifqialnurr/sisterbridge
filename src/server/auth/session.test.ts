import { afterEach, describe, expect, it, vi } from "vitest";

import { getCurrentUser, getFixtureUser } from "./session";

const originalNodeEnv = process.env.NODE_ENV;
const originalFixtureMode = process.env.SISTER_FIXTURE_MODE;
const mutableEnvironment = process.env as Record<string, string | undefined>;

afterEach(() => {
  mutableEnvironment.NODE_ENV = originalNodeEnv;
  if (originalFixtureMode === undefined) {
    delete process.env.SISTER_FIXTURE_MODE;
  } else {
    mutableEnvironment.SISTER_FIXTURE_MODE = originalFixtureMode;
  }
});

const liveUser = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "operator@pt.example",
  name: "Operator",
  role: "OPERATOR",
  isActive: true,
};

describe("development session seam", () => {
  it("provides only the synthetic operator outside production", () => {
    mutableEnvironment.NODE_ENV = "development";
    mutableEnvironment.SISTER_FIXTURE_MODE = "true";

    expect(getFixtureUser()).toMatchObject({
      email: "developer@fixture.local",
      role: "OPERATOR",
    });
  });

  it("never provides the fixture user in production", () => {
    mutableEnvironment.NODE_ENV = "production";
    mutableEnvironment.SISTER_FIXTURE_MODE = "true";

    expect(getFixtureUser()).toBeNull();
  });

  it("allows local fixture mode to be explicitly disabled", () => {
    mutableEnvironment.NODE_ENV = "development";
    mutableEnvironment.SISTER_FIXTURE_MODE = "false";

    expect(getFixtureUser()).toBeNull();
  });
});

describe("getCurrentUser", () => {
  it("returns the fixture user without touching the session store in fixture mode", async () => {
    mutableEnvironment.NODE_ENV = "development";
    mutableEnvironment.SISTER_FIXTURE_MODE = "true";
    const lookup = vi.fn();

    await expect(getCurrentUser(new Headers(), lookup)).resolves.toMatchObject({
      email: "developer@fixture.local",
    });
    expect(lookup).not.toHaveBeenCalled();
  });

  it("maps an active better-auth session to the app user", async () => {
    mutableEnvironment.NODE_ENV = "production";
    const lookup = vi.fn().mockResolvedValue({ user: liveUser });

    await expect(getCurrentUser(new Headers(), lookup)).resolves.toEqual({
      id: liveUser.id,
      email: liveUser.email,
      name: liveUser.name,
      role: "OPERATOR",
    });
  });

  it("rejects missing sessions, inactive users, unknown roles, and lookup errors", async () => {
    mutableEnvironment.NODE_ENV = "production";

    await expect(getCurrentUser(new Headers(), vi.fn().mockResolvedValue(null))).resolves.toBeNull();
    await expect(
      getCurrentUser(new Headers(), vi.fn().mockResolvedValue({ user: { ...liveUser, isActive: false } })),
    ).resolves.toBeNull();
    await expect(
      getCurrentUser(new Headers(), vi.fn().mockResolvedValue({ user: { ...liveUser, role: "ROOT" } })),
    ).resolves.toBeNull();
    await expect(
      getCurrentUser(new Headers(), vi.fn().mockRejectedValue(new Error("db down"))),
    ).resolves.toBeNull();
  });
});
