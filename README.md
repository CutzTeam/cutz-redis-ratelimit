# cutz-redis-ratelimit (1.0.1)

`cutz-redis-ratelimit` is a simple and efficient rate limiting library using Upstash Redis. It provides built-in methods for handling rate limiting, calculating retry times, and creating rate limit responses.

## Installation

Install the package using npm:

```bash
npm i cutz-redis-ratelimit
```

## Usage

### Importing the Library

```typescript
import { Ratelimit } from "cutz-redis-ratelimit";
```

### Creating a Ratelimit Instance

Create an instance of the `Ratelimit` class by providing the necessary configuration options:

```typescript
const ratelimit = new Ratelimit({
  url: process.env.UPSTASH_REDIS_URL ?? "",
  token: process.env.UPSTASH_REDIS_TOKEN ?? "",
  time: "10 s",
  maxRequests: 1,
});
```

### Using the Ratelimit Instance

Use the `ratelimit` instance to limit requests based on the client's IP address:

```typescript
import { NextResponse } from "next/server";
import { Ratelimit } from "cutz-redis-ratelimit";

const ratelimit = new Ratelimit({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
  windowSize: "10 s",
  maxRequests: 1,
});

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "";
  const { success, reset } = await ratelimit.limit(ip);

  if (!success) {
    const retryAfter = ratelimit.getRetryAfter(reset);
    return ratelimit.createRateLimitResponse(retryAfter);
  }

  try {
    return NextResponse.json(
      { message: "Request successful" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to do something...." },
      { status: 500 }
    );
  }
}
```

### API

#### Ratelimit Class

#### Constructor

```typescript
constructor(options: RatelimitOptions)
```

- options: An object containing the following properties:
  - url: The Upstash Redis URL.
  - token: The Upstash Redis token.
  - time: The time duration for the ratelimit (e.g., "10 s").
  - maxRequests: The maximum number of requests allowed within the window.

#### Methods

```typescript
limit(ip: string): Promise<{ success: boolean; reset: number; }>
```

Limits the number of requests based on the client's IP address.

- ip: The client's IP address.
- Returns a promise that resolves to an object containing:
  - success: A boolean indicating whether the request is allowed.
  - reset: The timestamp when the rate limit will reset.

```typescript
getRetryAfter(reset: number): number
```

Calculates the retry-after time in seconds.

- reset: The timestamp when the rate limit will reset.
- Returns the retry-after time in seconds.

```typescript
createRateLimitResponse(retryAfter: number): Response
```

Creates a rate limit response with the appropriate headers.

- retryAfter: The retry-after time in seconds.
- Returns a Response object with a 429 status code and the retry-after header.

### License

This project is licensed under the ISC License.
