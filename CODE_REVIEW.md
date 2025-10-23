# Code Review Report - TopTen Segments

**Date:** 2025-10-23  
**Repository:** marekbenes-dev/topten-segments  
**Lines of Code:** ~2,690 (TypeScript/TSX)  
**Framework:** Next.js 15.5.3 with React 19.1.0

---

## Executive Summary

This is a comprehensive code review of the TopTen Segments application, a Next.js-based web application that integrates with the Strava API to display and analyze cycling/running segments and activities. The codebase is generally well-structured and follows modern React/Next.js patterns. Several issues were identified and fixed, including ESLint warnings, formatting issues, and missing configuration files.

### Overall Assessment: ⭐⭐⭐⭐ (Good)

**Strengths:**

- Well-organized Next.js App Router structure
- Proper use of TypeScript with strict mode enabled
- Good separation of concerns (lib, components, types)
- Server components used appropriately for data fetching
- Proper cookie-based authentication
- Client-side components marked with "use client" directive
- Comprehensive git hooks for code quality

**Areas for Improvement:**

- Missing error boundaries
- Some API routes lack comprehensive input validation
- Inconsistent error response formats
- Missing comprehensive test coverage
- Some security concerns with cookie handling

---

## Issues Fixed ✅

### 1. ESLint Warnings (5 → 0)

- **Fixed:** Exported `ExploreSegment` type that was being used but not exported
- **Fixed:** Removed unused `children` parameter in `RefactorActivitiesLayout`
- **Fixed:** Removed unused `SegMapLeaflet` import in segments page
- **Fixed:** Exported `MonthSummary` and `DetailedSegment` types for proper usage

### 2. Code Formatting

- **Fixed:** Applied Prettier formatting to `app/types/segment.ts`

### 3. Missing Configuration

- **Added:** Playwright configuration file (`playwright.config.ts`) for E2E tests

---

## Code Quality Analysis

### Architecture & Structure ⭐⭐⭐⭐⭐

**Excellent organization:**

```
app/
├── (authed)/          # Protected routes with auth
├── api/               # API routes
├── components/        # Shared components
├── types/            # TypeScript types
└── tests/            # E2E tests
```

**Recommendations:**

- ✅ Well-structured with proper route groups
- ✅ Good use of parallel routes (@form, @results)
- ✅ Proper separation of client/server components

### TypeScript Usage ⭐⭐⭐⭐

**Good practices observed:**

- Strict mode enabled
- Proper type definitions for API responses
- Good use of type inference

**Issues found:**

1. Some inline type definitions could be extracted to types files
2. Missing types for some Strava API responses

**Recommendations:**

```typescript
// Consider creating a comprehensive Strava types file
// app/types/strava.ts
export type StravaActivity = {
  // ... full Strava activity type
};

export type StravaSegment = {
  // ... full Strava segment type
};
```

### Error Handling ⭐⭐⭐

**Issues identified:**

1. **API Route Error Handling** - Inconsistent error responses:

```typescript
// app/api/segments/[id]/efforts/route.ts
// Some return NextResponse.json with error object
// Others throw errors

// Recommendation: Create a standard error handler
export function apiError(message: string, status = 500) {
  return NextResponse.json(
    { error: message, timestamp: new Date().toISOString() },
    { status },
  );
}
```

2. **Missing Error Boundaries:**

```typescript
// Recommendation: Add error boundaries
// app/components/error-boundary.tsx
"use client";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="error-container">
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

3. **API Error Handling in Components:**

```typescript
// app/components/segments/SegmentHistoryCard.tsx
// Line 74: Error handling could be more specific
catch ((e) => {
  if (e.name !== "AbortError") setError(String(e));
});

// Recommendation: Parse error messages more carefully
catch ((e) => {
  if (e.name === "AbortError") return;
  const message = e instanceof Error ? e.message : String(e);
  setError(message);
});
```

### Security Review ⭐⭐⭐

**Concerns identified:**

1. **Cookie Security:**

```typescript
// app/api/geo/route.ts
// Lines 7-29: Geo cookies are not httpOnly
res.cookies.set("strava_geo_lat", lat, {
  httpOnly: false, // ⚠️ Makes it accessible to JavaScript
  sameSite: "lax",
  path: "/",
  maxAge: 600,
  secure: process.env.NODE_ENV === "production",
});
```

**Recommendation:** Consider using session storage or encrypted cookies for sensitive data.

2. **Token Handling:**

```typescript
// app/api/refactor-activities/search/route.ts
// Line 40: Token fallback to env variable
const token =
  (await cookies()).get(StravaCookie.AccessToken)?.value ||
  process.env.STRAVA_TOKEN;
```

**Recommendation:** Remove fallback to env variable in production. Use proper token refresh flow.

3. **Input Validation:**

```typescript
// app/api/segments/[id]/efforts/route.ts
// Line 71-74: Minimal input validation
const idNum = Number(p.id);
if (!idNum) {
  return NextResponse.json({ error: "Invalid segment id" }, { status: 400 });
}

// Recommendation: Add more robust validation
const idNum = parseInt(p.id, 10);
if (!Number.isFinite(idNum) || idNum <= 0) {
  return NextResponse.json(
    { error: "Invalid segment id: must be a positive integer" },
    { status: 400 },
  );
}
```

4. **Rate Limiting:**

```typescript
// app/api/segments/[id]/efforts/route.ts
// Line 50: Hard-coded delay for API rate limiting
await new Promise((r) => setTimeout(r, 80));

// Recommendation: Implement proper rate limiting middleware
// Consider using a rate limiter like `express-rate-limit` or Redis-based solution
```

### Performance ⭐⭐⭐⭐

**Good practices:**

- Lazy loading with IntersectionObserver (SegmentHistoryCard)
- Proper caching strategies for Strava API calls
- Server-side rendering for initial page load

**Recommendations:**

1. **API Response Caching:**

```typescript
// app/api/segments/[id]/efforts/route.ts
// Line 26: Caching could be more aggressive
next: { revalidate: 3600, tags: [`segment-efforts-${segmentId}`] }

// Recommendation: Consider longer cache for historical data
// and implement cache invalidation when new efforts are added
```

2. **Image Optimization:**

```typescript
// No images currently, but when adding:
import Image from "next/image";
// Use Next.js Image component for automatic optimization
```

3. **Bundle Size:**

```bash
# Recommendation: Analyze bundle size
npx @next/bundle-analyzer
```

### Testing ⭐⭐⭐

**Current state:**

- 2 E2E tests with Playwright
- No unit tests
- No integration tests

**Recommendations:**

1. **Add Unit Tests:**

```typescript
// lib/__tests__/format.test.ts
import { fmtDuration } from "../format";

describe("fmtDuration", () => {
  it("formats hours, minutes, seconds", () => {
    expect(fmtDuration(3661)).toBe("1h 1m 1s");
  });

  it("formats without seconds when noSeconds is true", () => {
    expect(fmtDuration(3661, true)).toBe("1h 1m");
  });
});
```

2. **Add API Route Tests:**

```typescript
// app/api/geo/__tests__/route.test.ts
import { POST } from "../route";
import { NextRequest } from "next/server";

describe("POST /api/geo", () => {
  it("sets geo cookies", async () => {
    const req = new NextRequest("http://localhost:3000/api/geo", {
      method: "POST",
      body: JSON.stringify({ lat: 50.0, lng: 14.0, radiusKm: 5 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    // Check cookies...
  });
});
```

3. **Increase E2E Coverage:**

- Test authenticated flows
- Test error states
- Test loading states
- Test segment history visualization

### Code Documentation ⭐⭐⭐

**Current state:**

- Minimal inline comments
- Some helpful comments explaining complex logic
- No JSDoc comments

**Recommendations:**

1. **Add JSDoc Comments:**

```typescript
/**
 * Calculates geographic bounds from a center point and radius
 * @param lat - Center latitude in degrees
 * @param lng - Center longitude in degrees
 * @param radiusKm - Radius in kilometers
 * @returns Tuple of [swLat, swLng, neLat, neLng]
 */
export function boundsFromCenterRadius(
  lat: number,
  lng: number,
  radiusKm: number,
) {
  // ... implementation
}
```

2. **Add README Sections:**

```markdown
## Environment Variables

- `CLIENT_ID` - Strava OAuth client ID
- `CLIENT_SECRET` - Strava OAuth client secret
- `REDIRECT_URI` - OAuth redirect URI

## Architecture

[Detailed architecture explanation]

## API Routes

[Document each API route with examples]
```

### Accessibility ⭐⭐⭐

**Issues identified:**

1. **Missing ARIA Labels:**

```tsx
// app/(authed)/(shell)/activities/[year]/page.tsx
// Line 66: Link has aria-disabled but not proper ARIA handling
<Link
  prefetch={false}
  href={`/activities/${prevYear}`}
  className="border rounded px-3 py-2 hover:bg-gray-50"
  aria-disabled={prevYear < 2010}
>
```

**Recommendation:** Use proper button disabling or pointer-events-none class.

2. **Focus Management:**

```tsx
// Recommendation: Ensure keyboard navigation works properly
// Test with Tab key through all interactive elements
```

### Code Smells & Refactoring Opportunities

1. **Magic Numbers:**

```typescript
// lib/geo.ts
const kmPerDegLat = 111.32; // ⚠️ Magic number

// Recommendation: Extract to named constant
const KM_PER_DEGREE_LATITUDE = 111.32;
```

2. **Duplicate Code:**

```typescript
// Multiple files fetch from Strava API with similar patterns
// Recommendation: Create a reusable Strava API client
// lib/strava-client.ts
export class StravaClient {
  constructor(private token: string) {}

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`https://www.strava.com/api/v3${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!res.ok) throw new Error(`Strava API error: ${res.status}`);
    return res.json();
  }
}
```

3. **Long Functions:**

```typescript
// app/(authed)/(shell)/activities/[year]/page.tsx
// The component is 246 lines - consider breaking into smaller components
// Recommendation: Extract MonthCard component
```

---

## Specific File Issues

### app/api/refactor-activities/search/route.ts

**Issues:**

1. Line 88-98: Inconsistent error handling
2. Line 54: Fetches all activities - could be slow for users with many activities
3. No pagination for results

**Recommendations:**

- Implement streaming or pagination
- Add query parameter for limiting results
- Standardize error handling

### app/(authed)/(shell)/activities/[year]/page.tsx

**Issues:**

1. Very long component (246 lines)
2. Complex rendering logic
3. Inline styles and classes

**Recommendations:**

- Extract `MonthCard` component
- Extract logic to custom hooks
- Use CSS modules or Tailwind @apply

### app/components/segments/SegmentHistoryCard.tsx

**Issues:**

1. Inline SVG rendering logic
2. Mixed concerns (data fetching + visualization)

**Recommendations:**

- Extract `Sparkline` to separate component
- Consider using a charting library (recharts, visx)
- Add prop types documentation

---

## Dependencies Review

### Production Dependencies ✅

All production dependencies are up to date and appropriate:

- `next@15.5.3` - Latest version
- `react@19.1.0` - Latest version
- `leaflet@1.9.4` - For maps
- `jsonwebtoken@9.0.2` - For JWT handling

### Development Dependencies ✅

Well-configured dev tools:

- ESLint with Next.js config
- Prettier for formatting
- Playwright for E2E testing
- TypeScript 5.9.2

### Security Audit

```bash
npm audit
# Result: 0 vulnerabilities found ✅
```

---

## Recommendations Summary

### High Priority 🔴

1. **Add Error Boundaries** - Prevent entire app crashes
2. **Implement Proper Error Handling** - Standardize error responses
3. **Add Input Validation** - Validate all user inputs and API parameters
4. **Improve Cookie Security** - Review cookie settings for sensitive data
5. **Add Rate Limiting** - Protect against API abuse

### Medium Priority 🟡

1. **Add Unit Tests** - Test utility functions and business logic
2. **Create Strava API Client** - Reduce code duplication
3. **Add JSDoc Comments** - Improve code documentation
4. **Refactor Long Components** - Break down complex components
5. **Implement Proper Token Refresh** - Handle expired tokens gracefully

### Low Priority 🟢

1. **Add Bundle Analysis** - Monitor bundle size
2. **Improve Accessibility** - Add ARIA labels and keyboard navigation
3. **Add More E2E Tests** - Increase test coverage
4. **Extract Magic Numbers** - Use named constants
5. **Add Storybook** - Component documentation and testing

---

## Next Steps

1. ✅ **Fixed:** ESLint warnings and formatting issues
2. ✅ **Added:** Playwright configuration file
3. **Review and implement high-priority recommendations**
4. **Add unit tests for utility functions**
5. **Create standard error handling patterns**
6. **Document API routes and environment variables**

---

## Conclusion

The TopTen Segments codebase is well-structured and follows modern best practices. The main areas for improvement are error handling, testing, and security hardening. The fixes applied in this review (ESLint warnings, formatting, and configuration) have improved code quality. The recommendations above provide a clear path for further improvements.

**Overall Rating: 4/5 ⭐⭐⭐⭐**

The application is production-ready with the understanding that the high-priority security and error handling recommendations should be addressed for a robust production deployment.
