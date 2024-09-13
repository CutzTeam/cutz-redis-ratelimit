import { Duration, Ratelimit as UpstashRatelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface RatelimitOptions {
  url: string;
  token: string;
  time: Duration;
  maxRequests: number;
}

export class Ratelimit {
  private ratelimit: UpstashRatelimit;

  constructor({ url, token, time, maxRequests }: RatelimitOptions) {
    const redis = new Redis({
      url,
      token,
    });

    this.ratelimit = new UpstashRatelimit({
      redis,
      limiter: UpstashRatelimit.slidingWindow(maxRequests, time),
    });
  }

  async limit(ip: string) {
    return this.ratelimit.limit(ip);
  }

  getRetryAfter(reset: number): number {
    const now = Date.now();
    return Math.floor((reset - now) / 1000);
  }

  createRateLimitResponse(retryAfter: number): Response {
    return new Response("Too Many Requests", {
      status: 429,
      headers: {
        "retry-after": `${retryAfter}`,
      },
    });
  }
}