# LOOP Backend

Backend API for **LOOP - AI Customer Feedback Intelligence Platform**.

Built with **Node.js**, **Express**, **MongoDB**, **Mongoose**, and **Google Gemini AI**.

---

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Google Gemini API

---

## Project Structure

```
src/
│
├── config/
│
├── controllers/
│
├── middleware/
│
├── models/
│
├── routes/
│
├── services/
│
├── utils/
│
├── uploads/
│
├── app.js
└── server.js
```

---

## Getting Started

Install dependencies

```bash
npm install
```

Start development server

```bash
npm run dev
```

Run production server

```bash
npm start
```

---

## Environment Variables

Create

```
.env
```

Example

```
PORT=5000

MONGODB_URI=

JWT_SECRET=

GEMINI_API_KEY=

CLIENT_URL=http://localhost:5173
```

---

## Development Status

- Server Setup
- MongoDB Connection
- Authentication
- Feedback APIs
- AI Services
- Reports
- Analytics