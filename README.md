<p align="center">
  <img src="https://smholdings.gr/logoetc.png" alt="SM Holdings" width="300" />
</p>

<h1 align="center">real-estate-backend</h1>

<p align="center">
  <strong>The backend that refuses to die, much like the technical debt it carries.</strong>
</p>

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-1.0.0-blue.svg" />
  <img alt="Node" src="https://img.shields.io/badge/node-18%2B-green.svg" />
  <img alt="NestJS" src="https://img.shields.io/badge/NestJS-11-red.svg" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-blue.svg" />
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-7.3-purple.svg" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-black.svg" />
</p>

---

## Overview

A backend API for a real estate platform. It manages properties, bookings, users, payments, and all the other things that keep you awake at 3 AM wondering why the production database just decided to take a vacation.

Built with NestJS because we wanted the verbosity of Java with the runtime errors of JavaScript. The best of both worlds, really.

---

## Tech Stack

Because listing dependencies is the closest thing we have to a personality.

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Runtime** | Node.js | 18+ | Executing our regrets |
| **Framework** | NestJS | 11.1.13 | Enterprise-grade decorators |
| **Language** | TypeScript | 5.9.3 | Pretending JavaScript has types |
| **ORM** | Prisma | 7.3.0 | Making SQL feel like a distant memory |
| **Database** | LibSQL | via adapter | Where the data goes to live, and occasionally die |
| **Auth** | Passport + JWT | 0.7.0 / 11.0.2 | Keeping the barbarians at the gate |
| **Validation** | Zod + class-validator | 4.3.6 / 0.14.3 | Trust issues, formalized |
| **Payments** | Stripe | 20.3.1 | Taking money from people, legally |
| **Email** | Nodemailer | 8.0.1 | Sending emails into the void |
| **File Storage** | Cloudinary | 2.9.0 | Where property photos go to be optimized beyond recognition |
| **API Docs** | Swagger | 11.2.6 | Documentation nobody reads |
| **Security** | Helmet | 8.1.0 | A false sense of security |
| **HTTP Client** | Axios | 1.13.5 | For when you need someone else's problems too |
| **Logging** | Morgan | 1.10.1 | Recording the exact moment things went wrong |
| **Rate Limiting** | Throttler | 6.5.0 | Protecting the server from its own users |

---

## Features

- **Property Management** -- Full CRUD. Create properties, read them, update them, and delete them when the client changes their mind for the fourth time.
- **Booking System** -- Conflict resolution included. The only conflict it cannot resolve is between you and the project deadline.
- **User Management** -- Multi-role system (Admin, Property Owner, Manager, User). A hierarchy of suffering.
- **Content Management** -- Dynamic editions and knowledge articles. Multilingual, because bugs should be accessible to everyone.
- **Payments** -- Stripe integration. The money flows in. The bugs flow out. Circle of life.
- **Analytics** -- Numbers on a dashboard. Whether they mean anything is a philosophical question.
- **Notifications** -- So users know exactly when something has gone wrong.
- **Messaging** -- Real-time communication between guests and hosts. Therapy not included.
- **Maintenance Requests** -- Track what is broken. The list is longer than this README.

---

## Getting Started

### Prerequisites

- **Node.js 18+** -- If you are still on Node 14, this README cannot help you. Nobody can.
- **yarn** or **npm** -- Pick one. Commit. Do not switch mid-project like a psychopath.
- A functioning database and the will to live (only one is strictly required).

### Installation

```bash
# Clone the repository. You know the drill.
git clone <repository-url>
cd stefanos-backend

# Install dependencies. This will take a while.
# Enough time to question your career choices.
yarn install

# Copy the environment template.
cp env.example .env

# Fill in the .env file with real values.
# If you commit your secrets to git, that is on you.
```

### Database Setup

```bash
# Initialize the database
yarn db:init

# Seed with sample data (optional, but recommended
# unless you enjoy staring at empty tables)
yarn db:seed
```

### Running the Server

```bash
# Development (with hot reload, because life is short)
yarn dev

# Production (for the brave)
yarn start:prod

# Debug mode (for when printf debugging has failed you)
yarn start:debug
```

The API will be available at `http://localhost:3001`. If it is not, check if something else is already squatting on that port. It usually is.

---

## Scripts

All the commands you will forget exist and then rediscover six months later.

| Command | What It Does |
|---|---|
| `yarn build` | Compiles TypeScript. Prays nothing breaks. |
| `yarn dev` | Development server with hot reload. Your most-used command. |
| `yarn start` | Starts the server like a normal person. |
| `yarn start:prod` | Starts from compiled output. Production mode. No safety net. |
| `yarn start:debug` | Attaches a debugger. For when `console.log` is not enough. |
| `yarn format` | Prettier. Because tabs vs spaces wars are beneath us. |
| `yarn lint` | ESLint. It will find problems you did not know you had. |
| `yarn test` | Runs Jest. Results may vary. |
| `yarn test:watch` | Runs tests on every save. Masochism, automated. |
| `yarn test:cov` | Coverage report. A number to make management happy. |
| `yarn test:e2e` | End-to-end tests. The full horror show. |
| `yarn db:init` | Initializes the database schema. |
| `yarn db:seed` | Seeds the database with sample data. |

---

## Project Structure

```
src/
  app.module.ts            # The root of all evil
  app.controller.ts        # Health checks and existential dread
  main.ts                  # Where it all begins (and sometimes ends)
  index.ts                 # The other entry point, because one was not enough
  seed.ts                  # Populates the database with beautiful lies

  admin/                   # God mode
  analytics/               # Graphs that go up and to the right (hopefully)
  auth/                    # Keeping unauthorized users out (authorized ones too, sometimes)
    dto/                   # Data Transfer Objects. Bureaucracy for your data.
    strategies/            # Passport strategies. JWT, local, existential.
    utils/                 # Auth utilities. Where the magic happens.
  bookings/                # The money-making module
    dto/                   # More bureaucracy

prisma/
  schema.prisma            # The single source of truth. Guard it with your life.

scripts/
  init-db.js               # Database initialization. Run once. Pray twice.
```

---

## Dependencies

### Production (53 packages of varying trustworthiness)

The full list lives in `package.json`. Here are the highlights, or lowlights, depending on your perspective:

- **@nestjs/*** `^11.x` -- The framework. Seven packages deep. We are committed.
- **@prisma/client** `^7.3.0` -- ORM. Because writing raw SQL builds character, but we are not here for character development.
- **bcryptjs** `^3.0.3` -- Password hashing. The one thing we actually take seriously.
- **stripe** `^20.3.1` -- Payment processing. Handle with care and a lawyer.
- **zod** `^4.3.6` -- Schema validation. Trust nothing. Validate everything.
- **multer** `^2.0.2` -- File uploads. What could possibly go wrong.

### Development (27 packages that exist solely to yell at you)

- **typescript** `^5.9.3` -- The language. The myth. The compiler errors.
- **jest** `^30.2.0` -- Testing framework. Your tests pass locally. They will not pass in CI.
- **eslint** `^10.0.0` -- Linter. 847 rules, all of them angry.
- **prettier** `^3.8.1` -- Code formatter. Ending arguments since 2017.
- **prisma** `^7.3.0` -- CLI tools. For when you need to regenerate the client for the ninth time today.
- **supertest** `^7.2.2` -- HTTP testing. Simulating users so you do not have to.

---

## Environment Variables

See `env.example` for the full template. If that file does not exist, someone has made a grave mistake.

Key variables include:
- `DATABASE_URL` -- Your database connection string. Treat it like a nuclear launch code.
- `JWT_SECRET` -- If this leaks, everything leaks.
- `STRIPE_SECRET_KEY` -- Real money. Real consequences.
- `CLOUDINARY_*` -- Image storage credentials. Less catastrophic if leaked, but still embarrassing.
- `SMTP_*` -- Email configuration. For sending password resets into spam folders worldwide.

---

## Deployment

Optimized for **Render**, because Heroku decided free tiers were a phase.

1. Create a Web Service on Render.
2. Connect the repository.
3. Set build command to `yarn build`.
4. Set start command to `yarn start:prod`.
5. Add all environment variables.
6. Deploy.
7. Wait.
8. Refresh.
9. Check logs.
10. Fix the thing you forgot.
11. Redeploy.

---

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Write code that works.
4. Write tests that prove it works.
5. Open a Pull Request.
6. Wait for review.
7. Address feedback.
8. Wait for re-review.
9. Merge.
10. Discover it broke something else.

---

## License

MIT. Do whatever you want with it. We are not responsible for the consequences.

---

<p align="center"><sub>Built with mass amounts of mass-produced coffee and mass-produced existential dread by the SM Holdings engineering team.</sub></p>

---

<p align="center">
  Created by <a href="https://adinfinity.gr/">adinfinity</a>
</p>
