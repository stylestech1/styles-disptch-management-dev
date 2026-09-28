# Styles Dispatch EG System (Dev version) — README

> A detailed technical documentation describing every feature, tool, and structure inside **Styles Dispatch EG System**.

---

## Overview

**Styles Dispatch EG System** is a complete web application built with **Next.js (App Router)** and **TypeScript**, designed to manage logistics and dispatch operations efficiently. It enables administrators to manage drivers, trucks, loads (shipments), routes, pricing, and notes — all with a clean UI and real-time map integration.

---

## Table of Contents

1. Features
2. Tech Stack
3. Folder Structure
4. Running the Project
5. Detailed Feature Descriptions
6. API & Endpoints
7. Conclusion

---

## 1) Features

* **Authentication System (Login / Token Validation)**

  * Secure login using JWT stored in cookies/localStorage.
  * Protected admin routes using Next.js middleware.

* **Drivers Management**

  * Create, Read, Update, and Delete drivers.
  * Displays all registered drivers in a responsive table.
  * Integrated with Redux Toolkit and persisted state.

* **Trucks Management**

  * CRUD operations for trucks.
  * Supports truck type and temperature attributes.
  * Linked with loads for assignment.

* **Loads (Shipments) Management**

  * Full CRUD operations for loads.
  * Fields include: `origin`, `destination`, `driverId`, `truckId`, `pickupAtFrom`, `deliveredAt`, `cancelledAt`, `distanceMiles`, `totalPrice`, `pricePerMile`, `feesNumber`, and more.
  * Price per mile is automatically calculated.
  * Integrated with maps for address geolocation using **Nominatim**.

* **Notes System for Loads**

  * Add, edit, and delete notes per load.
  * Notes are stored per shipment and shown in a modal interface.

* **Mapping Integration (Nominatim)**

  * Real-time geolocation for pickup and destination addresses.
  * Uses `display_name` and coordinates for load creation.
  * Integrated with **Leaflet** and **React-Leaflet**.

* **Dynamic Tables and UI Enhancements**

  * Styled with **Tailwind CSS**.
  * Tables include sorting, alignment, and clean design.
  * Forms and modals are responsive and user-friendly.

* **Global State Management (Redux Toolkit + Persist)**

  * Centralized management for authentication, loads, and drivers.
  * State persistence using **redux-persist** for offline continuity.
  * Integration with localStorage and cookies.

* **Notifications (React Hot Toast)**

  * User feedback for success, errors, and warnings.

* **Code Quality and Linting**

  * Configured **ESLint** with `eslint-config-next`.
  * TypeScript strict mode enabled.

---

## 2) Tech Stack

| Category         | Tools / Libraries                                     |
| ---------------- | ----------------------------------------------------- |
| Framework        | **Next.js (v15.5.4)**                                 |
| Language         | **TypeScript (v5)**                                   |
| State Management | **Redux Toolkit**, **React Redux**, **Redux Persist** |
| UI               | **React**, **TailwindCSS**, **React Icons**           |
| Notifications    | **React Hot Toast**                                   |
| Mapping          | **Leaflet**, **React Leaflet**, **Nominatim API**     |
| Storage          | **localStorage**, **Cookies**                         |
| Code Quality     | **ESLint**, **Prettier**                              |

---

## 3) Folder Structure

```
styles-disptch-management/
│
├─ .next/                   # Next.js build directory
├─ node_modules/            # Dependencies
├─ public/                  # Static assets
├─ src/
│  ├─ app/                  # Next.js App Router pages
│  ├─ components/           # Reusable React components
│  ├─ constants/            # App-wide constants
│  ├─ data/                 # Static data or JSON seeds
│  ├─ hook/                 # Custom React hooks
│  ├─ redux/                # Redux slices, store, and persist config
│  ├─ types/                # TypeScript interfaces and types
│  ├─ utils/                # Utility and helper functions
│  ├─ global.d.ts           # Global TS definitions
│  └─ middleware.ts         # Next.js middleware for auth protection
│
├─ .env.local               # Environment variables
├─ eslint.config.mjs        # ESLint configuration
├─ next.config.ts           # Next.js configuration
├─ package.json             # Project dependencies and scripts
├─ postcss.config.mjs       # TailwindCSS config
├─ tsconfig.json            # TypeScript configuration
└─ README.md                # Project documentation
```

---

## 4) Running the Project

You can view the live project directly here:
👉 **[https://styles-disptch-management-dev.vercel.app/](https://styles-disptch-management-dev.vercel.app/)**

---

## 5) Detailed Feature Descriptions

### Authentication

* Handles login using JWT tokens stored in cookies/localStorage.
* Middleware (`middleware.ts`) ensures route protection for admin pages.
* Redirects to login when no token is present.

### Drivers

* Displays all drivers in a responsive table.
* CRUD operations via API or Redux async actions.
* Integrated with redux-persist for state retention.

### Trucks

* Manage truck records with type and temperature fields.
* Each truck can be assigned to specific loads.

### Loads

* Create, edit, and delete loads (shipments).
* Automatically calculates distance, total price, and price per mile.
* Uses **Nominatim** for address resolution.
* Displays results with Leaflet map components.

### Notes

* Add notes to each load.
* Edit or delete existing notes.
* Stored in Redux and persisted locally.

### UI / Tables

* Uses **TailwindCSS** for a professional and minimal UI.
* Tables include borders, zebra striping, and action buttons.
* Forms include validation and clear visual cues.

### Mapping

* Integrated with **Leaflet** and **React-Leaflet**.
* Allows selection of origin and destination addresses.
* Utilizes **Nominatim** for forward geocoding.

---

## 6) API & Endpoints

Expected API endpoints (handled via backend or external API):

* `POST /auth/login` — authenticate user and return JWT.
* `GET /drivers` — retrieve all drivers.
* `POST /drivers` — add new driver.
* `PUT /drivers/:id` — update driver info.
* `DELETE /drivers/:id` — remove driver.
* `GET /trucks` — fetch all trucks.
* `GET /loads` — get all loads.
* `POST /loads` — create new load.
* `PUT /loads/:id` — update load.
* `DELETE /loads/:id` — delete load.
* `POST /loads/:id/notes` — add note.
* `DELETE /loads/:id/notes/:noteId` — delete note.

---

## Conclusion

**Styles Dispatch EG System** is a powerful, modern logistics and dispatch management application built with scalability, usability, and maintainability in mind. Using **Next.js**, **TypeScript**, **Redux Toolkit**, and **Leaflet**, it delivers a complete experience for managing fleets, drivers, and shipments.

Its clean code structure, strong state management, and seamless UI/UX make it an ideal foundation for enterprise-grade dispatch operations.

> This project demonstrates best practices in TypeScript, Redux state handling, and geolocation integration — optimized for both performance and developer experience.
