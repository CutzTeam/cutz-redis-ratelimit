"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ratelimit = void 0;
const ratelimit_1 = require("@upstash/ratelimit");
const redis_1 = require("@upstash/redis");
class Ratelimit {
    constructor({ url, token, time, maxRequests, logging = false, whitelist = [], blacklist = [], blacklistConfig = { blockDuration: 3600 * 1000, message: "Access Denied" }, }) {
        this.redis = new redis_1.Redis({
            url,
            token,
        });
        this.ratelimit = new ratelimit_1.Ratelimit({
            redis: this.redis,
            limiter: ratelimit_1.Ratelimit.slidingWindow(maxRequests, time),
        });
        this.whitelist = new Set(whitelist);
        this.blacklist = new Set(blacklist);
        this.blacklistConfig = blacklistConfig;
        this.logging = logging;
    }
    log(message) {
        if (this.logging) {
            console.log(message);
        }
    }
    limit(ip) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const result = yield this.ratelimit.limit(ip);
                this.log(`IP ${ip} rate limit result: ${JSON.stringify(result)}`);
                return result;
            }
            catch (error) {
                this.log(`Error limiting IP ${ip}: ${error}`);
                throw new Error("Rate limiting failed");
            }
        });
    }
    getRetryAfter(reset) {
        const now = Date.now();
        return Math.floor((reset - now) / 1000);
    }
    createRateLimitResponse(retryAfter) {
        this.log(`Creating rate limit response with retry-after: ${retryAfter}`);
        return new Response("Too Many Requests", {
            status: 429,
            headers: {
                "retry-after": `${retryAfter}`,
            },
        });
    }
    createBlacklistResponse() {
        this.log(`Creating blacklist response with message: ${this.blacklistConfig.message}`);
        return new Response(this.blacklistConfig.message, {
            status: 403,
        });
    }
    updateConfig({ time, maxRequests }) {
        this.log(`Updating rate limit config: time=${JSON.stringify(time)}, maxRequests=${maxRequests}`);
        this.ratelimit = new ratelimit_1.Ratelimit({
            redis: this.redis,
            limiter: ratelimit_1.Ratelimit.slidingWindow(maxRequests, time),
        });
    }
}
exports.Ratelimit = Ratelimit;
