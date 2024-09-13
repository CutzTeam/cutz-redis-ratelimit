import { Duration } from "@upstash/ratelimit";
interface RatelimitOptions {
    url: string;
    token: string;
    time: Duration;
    maxRequests: number;
}
export declare class Ratelimit {
    private ratelimit;
    constructor({ url, token, time, maxRequests }: RatelimitOptions);
    limit(ip: string): Promise<{
        success: boolean;
        limit: number;
        remaining: number;
        reset: number;
        pending: Promise<unknown>;
        reason?: "timeout" | "cacheBlock" | "denyList";
        deniedValue?: string | undefined;
    }>;
    getRetryAfter(reset: number): number;
    createRateLimitResponse(retryAfter: number): Response;
}
export {};
