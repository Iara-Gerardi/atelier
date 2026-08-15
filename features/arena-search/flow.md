# Arena Search — User Flow

## Diagram

```mermaid
sequenceDiagram
  participant User
  participant Frontend
  participant Backend

  User->>Frontend: 1. Type a query
  Frontend->>Backend: 2. Search Are.na (blocks + channels)
  alt within rate limit
    Backend-->>Frontend: 3. Results (or empty)
    Frontend-->>User: 4. Render results / empty state
    User->>Frontend: 5. Load more
    Frontend->>Backend: 6. Fetch next page
    Backend-->>Frontend: 7. Appended results
  else rate limited
    Backend-->>Frontend: 8. 429 rate limit
    Frontend-->>User: 9. Show rate-limited state
  end
```

## Interaction legend

1. **Type query** — Debounced input captures the search term.
2. **Search** — `useArenaSearch` requests blocks and channels.
3. **Results** — The API returns matches or an empty set.
4. **Render** — Results list or empty state shows.
5. **Load more** — The user requests the next page of results.
6. **Next page** — The hook fetches the following page.
7. **Append** — New results are appended below existing ones.
8. **Rate limited** — `useRateLimit` detects a 429.
9. **Rate-limited state** — A cooldown message replaces results.

## Third-party notes

- **Are.na API**: Receives the query and pagination cursor; returns matching blocks and channels (titles, thumbnails, ids).
