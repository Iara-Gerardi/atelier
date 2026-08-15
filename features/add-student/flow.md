# Add Student — User Flow

## Diagram

```mermaid
sequenceDiagram
  participant User
  participant Frontend
  participant Backend

  User->>Frontend: 1. Open form (professor/admin)
  Frontend-->>User: 2. Render email form
  User->>Frontend: 3. Submit student email
  Frontend->>Backend: 4. Create student record
  alt accepted
    Backend-->>Frontend: 5. Success
    Frontend-->>User: 6. Success status card
  else rejected
    Backend-->>Frontend: 7. Error (e.g. already enrolled)
    Frontend-->>User: 8. Error status card
  end
```

## Interaction legend

1. **Open form** — Gated node; only professor/admin reach it, others see NotFound.
2. **Render form** — The email field and Submit button appear.
3. **Submit** — The user enters an email and clicks Submit.
4. **Create record** — The submit handler attempts to enroll the student.
5. **Success** — The handler resolves.
6. **Success card** — The flow transitions to AddStudentStatus in `success`.
7. **Error** — The handler rejects the submission.
8. **Error card** — The flow transitions to AddStudentStatus in `error`.
