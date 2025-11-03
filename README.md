# 07-18-2025-next.js-template

## SSR and Browser API Usage

This template includes safeguards for server-side rendering (SSR) issues with browser APIs. 

### When to Force Dynamic Rendering

Add `export const dynamic = 'force-dynamic';` to pages that use:
- `navigator` (geolocation, online status, share API)
- `window` (localStorage, sessionStorage, innerWidth/Height)
- Browser-only APIs (Web APIs, PWA features)

### Performance Considerations

- **Static pages** (no browser APIs): Keep static for best performance
- **Dynamic pages** (use browser APIs): Add the dynamic export
- **Mixed apps**: Use selective dynamic rendering per page

### Example Usage

```typescript
// For pages using browser APIs
'use client';
export const dynamic = 'force-dynamic';

import { useGeolocation } from '@/hooks/use-geolocation';

export default function WeatherPage() {
  // This page uses browser APIs, so it needs dynamic rendering
}
```
