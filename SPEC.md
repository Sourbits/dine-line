# Dine Line — Project Spec

SOEN 287 course project (Fall 2026). Solo.

## What it is
Dine Line is an AI phone receptionist for small and medium restaurants. Restaurants create an account
and enter their info (hours, menu, policies, transfer number). Later, a voice AI (Vapi) will use that
info to answer customer calls and transfer to a human when needed.

**For the Nov 12 milestone, there is no AI/Vapi yet.** The milestone is the website: public pages,
accounts, login, and a dashboard where a restaurant manages its own info.

## Stack (match the SOEN 287 course demo code, chapter 6)
- Node.js + Express
- express-session for login sessions (no JWT)
- EJS templates for pages that show data
- Plain HTML/CSS/JavaScript on the front end (no frameworks)
- Data stored in JSON files, read/written with `fs` (no SQL database)
- bcrypt for password hashing
- dotenv for secrets (session secret comes from `.env`)

## Pages and routes

### Public (no login)
| Route | Method | What it does |
|---|---|---|
| `/` | GET | Landing page: what Dine Line is, Sign up and Log in buttons |
| `/r/:slug` | GET | Public info page for one restaurant (name, hours, menu, policies). 404 page if the slug doesn't exist |
| `/register` | GET | Registration form |
| `/register` | POST | Create account, then log in and go to dashboard |
| `/login` | GET | Login form |
| `/login` | POST | Check email + password, start session, go to dashboard |

### Logged in only (redirect to `/login` if not logged in)
| Route | Method | What it does |
|---|---|---|
| `/dashboard` | GET | Shows this restaurant's info and menu, with forms to edit |
| `/dashboard/info` | POST | Update restaurant name, hours, policies, transfer phone number |
| `/dashboard/menu` | POST | Add a menu item |
| `/dashboard/menu/:id/edit` | POST | Edit a menu item |
| `/dashboard/menu/:id/delete` | POST | Delete a menu item |
| `/logout` | POST | Destroy session, go to `/` |

Logged-in users who visit `/login` or `/register` are sent to `/dashboard`.

## Data (JSON files in `data/`)

### `data/users.json`
An array of users:
- `id`: unique string
- `email`: lowercase, unique
- `passwordHash`: bcrypt hash (never the plain password)
- `createdAt`: date string

### `data/restaurants.json`
An array of restaurants, one per user:
- `id`: unique string
- `ownerId`: the `id` of the user who owns it
- `name`: restaurant name
- `slug`: URL-friendly name for the public page (e.g. `chez-alex`), unique
- `phone`: transfer phone number
- `hours`: one entry per day (`mon` to `sun`), each with `open`, `close`, or `closed: true`
- `policies`: `reservation`, `cancellation`, `other` (text)
- `menu`: array of items, each with `id`, `name`, `price` (number), `description`, `allergens` (list of strings)

## Rules (from the course outline — these are graded)
1. **Passwords are hashed** with bcrypt. Never stored or logged in plain text.
2. **Per-user data isolation:** a logged-in user can only see and change their own restaurant.
   The server always finds the restaurant using the `userId` in the session, never an id sent by the browser.
   Editing or deleting a menu item checks that it belongs to the logged-in user's restaurant.
3. **Server-side validation on every form**, even if the browser already checks:
   - email format, password at least 8 characters, email not already registered
   - restaurant name required, max length limits on all text fields
   - price is a number ≥ 0, phone number format, hours are valid times
   - On error: show the form again with a clear error message and the user's input kept. Never crash.
4. **No crashing on bad or missing input.** Missing fields, wrong types, unknown ids, empty or missing
   JSON files all give a proper error page or message.
5. **No XSS:** user text shown on pages (especially the public `/r/:slug` page) must be escaped.
   In EJS, use `<%= %>`, never `<%- %>`, for user data.
6. **No secrets in code:** the session secret is read from `.env` (`SESSION_SECRET`). `.env` is in `.gitignore`.
   Include a `.env.example` with placeholder values.
7. **No debug mode** in the normal run configuration.
8. **Front end:** semantic HTML5 (`header`, `nav`, `main`, `section`, `footer`), works at phone width,
   every input has a `<label>` connected to it.
9. **Dynamic JavaScript feature:** live validation on the register form (show errors as the user types:
   email format, password length, passwords match), and on the menu item form (price must be a number).
10. **Code organized into files:** e.g. `routes/`, `views/`, `public/`, `data/`, plus a helper file
    for reading/writing JSON.

## Folder structure (suggested)
```
dine-line/
  server.js            starts the app
  routes/              auth routes, dashboard routes, public routes
  lib/                 JSON read/write helpers, validation helpers
  views/               EJS templates (+ partials for header/footer)
  public/              CSS, client-side JS, images
  data/                users.json, restaurants.json (start as [])
  .env.example
  .gitignore           node_modules, .env
  README.md
  SPEC.md
  ai-log.md            notes on what the AI got wrong and how I fixed it
```

## Milestone scope (Nov 12)
Must work for the demo:
- Landing page
- Register, login, logout with hashed passwords
- Dashboard protected (redirects when logged out)
- Live validation on the register form
- Server-side validation; bad input shows errors instead of crashing

Should work if time allows:
- Editing restaurant info and menu items, saved to JSON
- Public `/r/:slug` page

## Later (after the milestone)
- Connect restaurant info to Vapi so the AI can answer calls
- Deploy online
- Project report and final demo (Dec 1–3)

## How to work with me (instructions for the AI agent)
- **Build one small step at a time.** Never build the whole app at once. After each step, stop and
  explain what you wrote in plain language so I can understand and commit it.
- I'm learning Express. Explain new concepts (middleware, routes, `req`/`res`, sessions) when they first
  appear. Keep the code simple and close to the style of the course demo code.
- Don't add libraries beyond the stack above without asking.
- Point out anything security-related you are doing and why.
