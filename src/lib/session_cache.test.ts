import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";
import { clearSessionQueryCache, sessionCacheIdentity } from "./session_cache";

it("partitions session identities by account, session, role and activity, never token", () => {
  const original = { user: { id: "first", role: "ADMIN", isActive: true }, session: { id: "session-one", token: "not-a-cache-key" } };
  const key = sessionCacheIdentity(original);
  expect(key).not.toContain("not-a-cache-key");
  expect(sessionCacheIdentity(null)).toBe("anonymous");
  expect(sessionCacheIdentity(undefined)).toBe("anonymous");
  expect(sessionCacheIdentity({ ...original, user: { ...original.user, id: "second" } })).not.toBe(key);
  expect(sessionCacheIdentity({ ...original, user: { ...original.user, role: "VIEWER" } })).not.toBe(key);
  expect(sessionCacheIdentity({ ...original, user: { ...original.user, isActive: false } })).not.toBe(key);
  expect(sessionCacheIdentity({ ...original, session: { id: "session-two" } })).not.toBe(key);
});

it("cancels before clearing all query and mutation data", async () => {
  const client = new QueryClient();
  client.setQueryData(["business", "rows"], { private: "previous-user" });
  client.setQueryData(["overview", "session"], { role: "ADMIN" });
  await client.getMutationCache().build(client, { mutationFn: async () => ({ private: "mutation" }) }).execute(undefined);
  const cancel = vi.spyOn(client, "cancelQueries");
  const clear = vi.spyOn(client, "clear");
  await clearSessionQueryCache(client);
  expect(cancel).toHaveBeenCalledWith(undefined, { silent: true });
  expect(cancel.mock.invocationCallOrder[0]).toBeLessThan(clear.mock.invocationCallOrder[0]);
  expect(client.getQueryCache().getAll()).toHaveLength(0);
  expect(client.getMutationCache().getAll()).toHaveLength(0);
});

it("removes previous results from mounted observers as well as the cache", async () => {
  const client = new QueryClient();
  const key = ["restricted", "rows"];
  client.setQueryData(key, "previous-admin-data");
  const observer = new QueryObserver(client, {
    queryKey: key, staleTime: Infinity, retry: false,
    queryFn: async () => { throw new Error("new session forbidden"); },
  });
  const unsubscribe = observer.subscribe(() => {});
  expect(observer.getCurrentResult().data).toBe("previous-admin-data");
  await clearSessionQueryCache(client);
  expect(observer.getCurrentResult().data).toBeUndefined();
  expect(client.getQueryCache().getAll()).toHaveLength(0);
  unsubscribe();
});

it("does not repopulate the cache when an old request resolves after cancellation", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let resolve!: (value: string) => void;
  const deferred = new Promise<string>(done => { resolve = done; });
  const pending = client.fetchQuery({ queryKey: ["previous-user", "private"], queryFn: () => deferred }).catch(() => undefined);
  await clearSessionQueryCache(client);
  resolve("previous-user-data");
  await pending;
  expect(client.getQueryCache().getAll()).toHaveLength(0);
});

it("still clears retained data if cancellation fails", async () => {
  const client = new QueryClient();
  client.setQueryData(["private"], "previous-user-data");
  vi.spyOn(client, "cancelQueries").mockRejectedValueOnce(new Error("cancel failed"));
  await expect(clearSessionQueryCache(client)).rejects.toThrow("cancel failed");
  expect(client.getQueryCache().getAll()).toHaveLength(0);
});
