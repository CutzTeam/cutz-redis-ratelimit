import { Duration } from "@upstash/ratelimit";
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
export declare class Ratelimit {
    private ratelimit;
    private redis;
    private whitelist;
    private blacklist;
    private blacklistConfig;
    private logging;
    constructor({ url, token, time, maxRequests, logging, whitelist, blacklist, blacklistConfig, }: RatelimitOptions);
    private log;
    limit(ip: string): Promise<{
        success: boolean;
        limit: number;
        remaining: number;
        reset: number;
        pending: Promise<unknown>;
        reason?: "timeout" | "cacheBlock" | "denyList";
        deniedValue?: string | undefined;
    } | {
        success: boolean;
        reset: number;
    }>;
    getRetryAfter(reset: number): number;
    createRateLimitResponse(retryAfter: number): Response;
    createBlacklistResponse(): Response;
    updateConfig({ time, maxRequests }: {
        time: Duration;
        maxRequests: number;
    }): void;
}
export {};
