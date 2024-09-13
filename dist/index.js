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
    constructor({ url, token, time, maxRequests }) {
        const redis = new redis_1.Redis({
            url,
            token,
        });
        this.ratelimit = new ratelimit_1.Ratelimit({
            redis,
            limiter: ratelimit_1.Ratelimit.slidingWindow(maxRequests, time),
        });
    }
    limit(ip) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.ratelimit.limit(ip);
        });
    }
    getRetryAfter(reset) {
        const now = Date.now();
        return Math.floor((reset - now) / 1000);
    }
    createRateLimitResponse(retryAfter) {
        return new Response("Too Many Requests", {
            status: 429,
            headers: {
                "retry-after": `${retryAfter}`,
            },
        });
    }
}
exports.Ratelimit = Ratelimit;
