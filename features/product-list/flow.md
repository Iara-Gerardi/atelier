# Product List — User Flow

## Diagram

```mermaid
sequenceDiagram
  participant User
  participant Frontend
  participant Backend

  User->>Frontend: 1. Open list / change page
  Frontend->>Backend: 2. getProducts(page)
  alt products returned
    Backend-->>Frontend: 3. Page of products
    Frontend-->>User: 4. Render product cards
  else fetch fails
    Backend-->>Frontend: 5. Error
    Frontend-->>User: 6. Show error state
  end
```

## Interaction legend

1. **Open / paginate** — Mounting or clicking prev/next requests a page.
2. **Fetch page** — `getProducts` is called with the requested page number.
3. **Page data** — The action resolves with up to three products.
4. **Render cards** — Each product renders as a card with name and price.
5. **Error** — The action rejects.
6. **Error state** — The list swaps to an inline error message.
