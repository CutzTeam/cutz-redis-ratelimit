import nock from "nock";
import { Ratelimit } from "../src/index";
import { describe, it, expect, beforeAll } from "@jest/globals";

describe("Ratelimit", () => {
  let ratelimit: Ratelimit;

  beforeAll(() => {
    ratelimit = new Ratelimit({
      url: "https://fake-redis-url",
      token: "fake-token",
      time: "10 s",
      maxRequests: 1,
      logging: true,
      whitelist: ["127.0.0.1"],
      blacklist: ["203.0.113.1"],
      blacklistConfig: {
        blockDuration: 7200 * 1000,
        message: "Your IP has been blacklisted.",
      },
    });
  });

  it("should allow whitelisted IP", async () => {
    const result = await ratelimit.limit("127.0.0.1");
    expect(result.success).toBe(true);
  });

  it("should block blacklisted IP", async () => {
    const result = await ratelimit.limit("203.0.113.1");
    expect(result.success).toBe(false);
  });

  it("should rate limit IP", async () => {
    nock("https://fake-redis-url")
      .post("/")
      .reply(200, { success: true, reset: Date.now() + 10000 });

    const result = await ratelimit.limit("192.168.1.1");
    expect(result.success).toBe(true);
  }, 10000);
});
