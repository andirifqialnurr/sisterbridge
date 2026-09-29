import { afterEach, describe, expect, it, vi } from "vitest";

const sisterGetMock = vi.hoisted(() => vi.fn());
const clearTokenMock = vi.hoisted(() => vi.fn());

vi.mock("../http_client", () => ({ sisterGet: sisterGetMock }));
vi.mock("../token_provider", () => ({ clearSisterTokenCache: clearTokenMock }));

import { SisterApiError } from "../errors";
import { fetchSisterJson } from "./replica_fetch";

afterEach(() => {
  vi.useRealTimers();
  sisterGetMock.mockReset();
  clearTokenMock.mockReset();
});

describe("fetchSisterJson", () => {
  it("re-authorizes once after a 401", async () => {
    sisterGetMock
      .mockRejectedValueOnce(new SisterApiError(401, "SISTER_HTTP_401"))
      .mockResolvedValueOnce([{ id: 1 }]);

    await expect(fetchSisterJson("/referensi/agama")).resolves.toEqual({
      ok: true,
      payload: [{ id: 1 }],
    });
    expect(clearTokenMock).toHaveBeenCalledTimes(1);
  });

  it("retries gateway errors and gives up after three attempts", async () => {
    vi.useFakeTimers();
    sisterGetMock.mockRejectedValue(new SisterApiError(503, "SISTER_HTTP_503"));

    const pending = fetchSisterJson("/referensi/semester");
    await vi.runAllTimersAsync();

    await expect(pending).resolves.toMatchObject({ ok: false, status: 503 });
    expect(sisterGetMock).toHaveBeenCalledTimes(3);
  });

  it("does not retry client errors", async () => {
    sisterGetMock.mockRejectedValue(new SisterApiError(400, "SISTER_HTTP_400", "Input data tidak valid"));

    await expect(fetchSisterJson("/kolaborator_eksternal")).resolves.toEqual({
      ok: false,
      status: 400,
      code: "SISTER_HTTP_400",
      message: "Input data tidak valid",
    });
    expect(sisterGetMock).toHaveBeenCalledTimes(1);
  });
});
