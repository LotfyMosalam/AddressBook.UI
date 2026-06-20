# Address Book — Frontend

Angular 20 frontend for the Address Book system. Built with standalone components, Signal-based state management, Angular Material, and a clean layered architecture.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 20 (standalone components) |
| State | Angular Signals (`signal`, `computed`) |
| UI Library | Angular Material 20 |
| HTTP | Angular `HttpClient` with typed observables |
| Forms | `NonNullableFormBuilder` + reactive forms |
| Styling | SCSS |
| Language | TypeScript 5.9 |

---

## Features

- **Authentication** — Login & Register with JWT, route guards, token persistence in localStorage
- **Address Book** — Paginated list, sortable columns, inline photo upload with SVG progress ring, delete with confirmation, optimistic UI updates
- **Advanced Search** — Debounced filter panel (global search, full name, email, phone, address, job, department, date of birth range) — all filtering is server-side
- **Export** — Download full address book as `.xlsx` via blob response
- **Jobs CRUD** — Create, edit, delete jobs with immediate reflection in Address Book dropdowns
- **Departments CRUD** — Same pattern as Jobs
- **Toasts** — Global success/error notification system

---

## Project Structure

```
src/app/
├── core/
│   ├── guards/           # authGuard, noAuthGuard
│   ├── interceptors/     # jwtInterceptor — attaches Bearer token to every request
│   ├── services/         # BaseApiService, AuthService (facade), ToastService
│   └── stores/           # AuthStore, AddressStore, LookupStore
├── features/
│   ├── addresses/        # address-list, address-form-modal, address-detail, services
│   ├── auth/             # login, register
│   ├── jobs/             # job-list, jobs.service
│   └── departments/      # department-list, departments.service
├── layout/
│   ├── main-layout/      # shell wrapping sidebar + navbar
│   ├── navbar/
│   └── sidebar/
└── shared/
    ├── components/       # confirm-dialog, crud-table, name-form-modal, toast
    ├── models/           # TypeScript interfaces for all entities
    └── utils/            # custom validators, localStorage helpers
```

### State Architecture

All application state lives in three root-level stores (`providedIn: 'root'`). Components only read **readonly signals** and call store methods — no direct HTTP calls in components.

| Store | Responsibility |
|---|---|
| `AuthStore` | JWT token, current user, login / register / logout |
| `AddressStore` | Address list, filters, pagination, sort, CRUD, photo upload, Excel export |
| `LookupStore` | Jobs and departments lists, lazy caching, CRUD operations |

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **Angular CLI** 20: `npm install -g @angular/cli`
- **Address Book API** (.NET 9) running — default URL: `https://localhost:7278`

### Install dependencies

```bash
npm install
```

### Run development server

```bash
npm start
```

Opens at `http://localhost:4200`. API calls go to `https://localhost:7278/api`.

### Build for production

```bash
npm run build
```

Output: `dist/address-book.ui/`

### Run unit tests

```bash
npm test
```

Runs via Karma + Jasmine in Chrome.

---

## Environment Configuration

`src/environments/environment.ts` — used in development:

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'https://localhost:7278/api',
  staticBaseUrl: 'https://localhost:7278',
};
```

For production, edit `src/environments/environment.prod.ts` and update `apiBaseUrl` to your deployed API URL.

---

## API Endpoints Used

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/auth/login` | Login, returns JWT |
| `POST` | `/auth/register` | Register, returns JWT |
| `GET` | `/addresses` | Paginated address list |
| `GET` | `/addresses/search` | Filtered + paginated search |
| `GET` | `/addresses/export` | Download `.xlsx` blob |
| `GET` | `/addresses/{id}` | Single address |
| `POST` | `/addresses` | Create address |
| `PUT` | `/addresses/{id}` | Update address |
| `DELETE` | `/addresses/{id}` | Delete address |
| `POST` | `/addresses/{id}/photo` | Upload contact photo |
| `GET` | `/jobs` | List all jobs |
| `POST` | `/jobs` | Create job |
| `PUT` | `/jobs/{id}` | Update job |
| `DELETE` | `/jobs/{id}` | Delete job |
| `GET` | `/departments` | List all departments |
| `POST` | `/departments` | Create department |
| `PUT` | `/departments/{id}` | Update department |
| `DELETE` | `/departments/{id}` | Delete department |
