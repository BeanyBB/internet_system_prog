# Chirp

A Twitter-style social media app built with React, Node.js/Express, and SQLite.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

## Setup

### 1. Install backend dependencies

```bash
cd backend
npm install
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

---

## Running the App

You need **two terminals** open at the same time.

### Terminal 1 — Backend

```bash
cd backend
npm run dev
```

Runs on `http://localhost:4000`

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

Runs on `http://localhost:5173`

Open **http://localhost:5173** in your browser.

---

## Seed Data (Optional)

Populates the app with 20 fake users, posts, likes, comments, and follow relationships.

```bash
cd backend
npm run seed
```

After seeding you can log in as any fake account:

| Username | Password |
|---|---|
| `alex_codes` | `chirp123` |
| `sarah_travels` | `chirp123` |
| `fitnessmike` | `chirp123` |
| `foodie_jane` | `chirp123` |
| `gamer_lou` | `chirp123` |
| *(any of the 20 seeded users)* | `chirp123` |

---

## Project Structure

```
internet_system_prog/
├── backend/
│   ├── src/
│   │   ├── index.js      # Express API server and all routes
│   │   ├── db.js         # SQLite setup and schema
│   │   └── seed.js       # Fake data seed script
│   ├── data/             # SQLite database files (auto-created on first run)
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/        # Feed, Profile, Search, Post, Settings pages
    │   ├── components/   # Navbar, PostCard, ProtectedRoute
    │   ├── App.jsx       # Routes and auth state
    │   ├── api.js        # Fetch wrapper
    │   └── styles.css
    └── package.json
```

---

## Features

- Sign up, log in, log out
- Create and delete posts (280 character limit)
- Like posts and comments
- Comment on posts
- Follow and unfollow users
- Feed toggle — All posts or Following only
- Search for users by username
- Public user profiles with follower/following counts
- Edit bio and upload a profile picture
