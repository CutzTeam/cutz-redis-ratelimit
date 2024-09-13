import { Duration, Ratelimit as UpstashRatelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface BlacklistConfig {
  blockDuration: number;
  message: string;
}

interface RatelimitOptions {
  url: string;
  token: string;
  time: Duration;
  maxRequests: number;
  logging?: boolean;
  whitelist?: string[];
  blacklist?: string[];
  blacklistConfig?: BlacklistConfig;
}

export class Ratelimit {
  private ratelimit: UpstashRatelimit;
  private redis: Redis;
  private whitelist: Set<string>;
  private blacklist: Set<string>;
  private blacklistConfig: BlacklistConfig;
  private logging: boolean;

  constructor({
    url,
    token,
    time,
    maxRequests,
    logging = false,
    whitelist = [],
    blacklist = [],
    blacklistConfig = { blockDuration: 3600 * 1000, message: "Access Denied" },
  }: RatelimitOptions) {
    this.redis = new Redis({
      url,
      token,
    });

    this.ratelimit = new UpstashRatelimit({
      redis: this.redis,
      limiter: UpstashRatelimit.slidingWindow(maxRequests, time),
    });

    this.whitelist = new Set(whitelist);
    this.blacklist = new Set(blacklist);
    this.blacklistConfig = blacklistConfig;
    this.logging = logging;
  }

  private log(message: string) {
    if (this.logging) {
      console.log(message);
    }
  }

  async limit(ip: string) {
    if (this.whitelist.has(ip)) {
      this.log(`IP ${ip} is whitelisted.`);
      return { success: true, reset: 0 };
    }

    if (this.blacklist.has(ip)) {
      this.log(`IP ${ip} is blacklisted.`);
      return {
        success: false,
        reset: Date.now() + this.blacklistConfig.blockDuration,
      };
    }

    try {
      const result = await this.ratelimit.limit(ip);
      this.log(`IP ${ip} rate limit result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.log(`Error limiting IP ${ip}: ${error}`);
      throw new Error("Rate limiting failed");
    }
  }

  getRetryAfter(reset: number): number {
    const now = Date.now();
    return Math.floor((reset - now) / 1000);
  }

  createRateLimitResponse(retryAfter: number): Response {
    this.log(`Creating rate limit response with retry-after: ${retryAfter}`);
    return new Response("Too Many Requests", {
      status: 429,
      headers: {
        "retry-after": `${retryAfter}`,
      },
    });
  }

  createBlacklistResponse(): Response {
    this.log(
      `Creating blacklist response with message: ${this.blacklistConfig.message}`
    );
    return new Response(this.blacklistConfig.message, {
      status: 403,
    });
  }

  updateConfig({ time, maxRequests }: { time: Duration; maxRequests: number }) {
    this.log(
      `Updating rate limit config: time=${JSON.stringify(
        time
      )}, maxRequests=${maxRequests}`
    );
    this.ratelimit = new UpstashRatelimit({
      redis: this.redis,
      limiter: UpstashRatelimit.slidingWindow(maxRequests, time),
    });
  }
}
