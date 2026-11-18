# Dine Line

Dine Line is an AI phone receptionist for small and medium restaurants. Restaurants create an account and enter their info (hours, menu, policies, transfer phone number). Later, a voice AI will use that info to answer customer calls.

This repository is the website part, built for SOEN 287 (Fall 2026).

## Team members

- Alexis Boudreau

## Tech stack

- Node.js + Express
- express-session for login sessions
- EJS templates
- Plain HTML, CSS and JavaScript on the front end
- JSON files for data storage (read and written with `fs`)
- bcrypt for password hashing
- dotenv for secrets

## Features

- Landing page
- Register, log in and log out
- Passwords hashed with bcrypt
- Live validation on the register form (email format, password length, passwords match)
- Dashboard that only logged-in users can open
- Create and edit restaurant info: name, transfer phone number, opening hours per day, and policies
- Add, edit and delete menu items (name, price, description, allergens)
- Server-side validation on every form, with errors shown and the user's input kept
- Each user can only see and change their own restaurant

## Planned

- Public restaurant page at `/r/:slug`
- Connecting restaurant info to Vapi so the AI can answer phone calls

## Setup and run

You need [Node.js](https://nodejs.org/) 18 or newer.

1. Install the dependencies:
   ```bash
   npm install
   ```
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and set `SESSION_SECRET` to a long random string. You can generate one with:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
4. Start the server:
   ```bash
   npm start
   ```
5. Open http://localhost:3000 in your browser.

## Project structure

```
server.js           Starts the app: sessions, middleware and routes
routes/auth.js      Register, log in and log out
routes/dashboard.js Dashboard, restaurant info and menu items
middleware/         requireLogin (protects pages) and redirectIfLoggedIn
lib/jsonStore.js    Reads and writes the JSON files in data/
lib/validation.js   Server-side form validation
lib/slug.js         Makes the restaurant's URL name (e.g. chez-alex)
views/              EJS pages, with a shared header and footer in partials/
public/             CSS, browser JavaScript and the landing page
data/               users.json and restaurants.json
.env.example        Template for the .env file (secrets are never committed)
SPEC.md             Project spec
ai-log.md           Notes on what the AI got wrong and how it was fixed
```
