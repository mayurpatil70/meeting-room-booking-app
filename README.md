# Meeting Room Booking System

## Prerequisites

- Node.js (v18+)
- PostgreSQL (Neon.tech)

## Setup and Run Instructions

1. **Clone the repository.**
2. **Database:** Execute the SQL script located in the documentation (or your cloud provider console) to create the `rooms` and `bookings` tables, and seed the initial rooms.
3. **Backend:**
   - `cd backend`
   - `npm install`
   - Create a `.env` file with `DATABASE_URL=your_postgres_connection_string`
   - Run `node src/server.js` (runs on port 5000)
4. **Frontend:**
   - Open a new terminal and `cd frontend`
   - `npm install`
   - Run `npm run dev` (runs on port 5173)

## Architecture & Data Model

The application uses a standard Node.js/Express backend communicating with a PostgreSQL database, paired with a React frontend. The data model is simple: a `rooms` table for static seed data and a `bookings` table that references `room_id`. All business rules regarding time constraints (15-minute boundaries, business hours, same-day rule) are separated into pure, testable utility functions (`validators.js`) to keep the Express controllers lean.

## Concurrency Approach (Important)

To ensure two simultaneous overlapping requests cannot succeed, I chose **PostgreSQL Exclusion Constraints** rather than application-level locks. By enabling the `btree_gist` extension, I added an exclusion constraint on the `bookings` table that checks for overlapping `tstzrange` (time ranges) for the same `room_id` where the status is 'confirmed'.
This is vastly superior to a "check-then-insert" method in Node.js because it prevents race conditions entirely at the database level. If a conflict occurs, Postgres throws error `23P01`, which the backend intercepts to return a clear 409 Conflict status.

## Trade-offs and Left Out

Due to the strict timebox:

- **Visual Polish:** I prioritized raw functionality and correct state updates over a highly styled UI. Native HTML5 form validation is used alongside server validation.
- **Automated Test Runner:** While I architected the business rules into pure, easily testable functions, I did not configure Jest or a test runner suite in the interest of completing the core API and concurrency requirements.

## Declaration
Name: [Mayur Sharad Patil]
email:mayurthinks7@gmail.com
portfolio: https://mayurspatil-portfolio.vercel.app
other project URL: https://traco-webapp.vercel.app
https://forexnotes.vercel.app
https://secure-bankapp.vercel.app

Date: October 1, 2026
