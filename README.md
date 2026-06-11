# LeetCode Mentorship Tracker 🏆

A soulful, typography-first web application designed to track, rank, and visualize LeetCode progress for a mentorship group. It strips away generic UI elements in favor of a grounded, brutalist-inspired aesthetic with meaningful micro-copy.

## 🌟 Features

- **Dynamic Leaderboard**: Ranks users based on a weighted scoring system (Easy × 50, Medium × 100, Hard × 200).
- **In-Depth Dashboards**: Clicking any user reveals their personal dashboard, showing their recent 8-day activity streak, weekly completion grid, and difficulty breakdown.
- **Real-Time Additions**: Add new mentees/users directly from the UI. The app validates the username against LeetCode before permanently saving it to the database.
- **Persistent Storage**: Fully integrated with MongoDB to ensure the leaderboard is shared globally and persists across sessions.
- **Soulful Design**: Features a charcoal-brown, warmth-focused color palette (`#1a1917`, `#e07a3a`) that emphasizes clarity, intent, and personality.

## 🛠 Tech Stack

- **Framework**: [Next.js 14+ (App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (using native Node.js driver)
- **API**: External LeetCode GraphQL wrapper for fetching real-time user stats.
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- Node.js (v18 or higher)
- A MongoDB Atlas account (Free tier works perfectly)

### 1. Clone & Install

```bash
git clone <repository-url>
cd website
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory (next to `package.json`) and add your MongoDB connection string:

```env
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"
```
*(Note: The app will automatically create a database named `MentorshipIDs` inside this cluster).*

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. If your database is completely empty on the first run, the app will automatically seed it with a list of default mentorship usernames!

## 💡 How it Works

1. **API Route (`/api/users`)**: A serverless Next.js route connects to MongoDB to handle `GET` (fetch all users) and `POST` (add a new user) requests. Caching is explicitly disabled (`force-dynamic`) to ensure the leaderboard is always up to date.
2. **Frontend Validation**: When a new user is added via the form, the frontend first queries the external LeetCode API. If the API returns an `errors` array (indicating an invalid username), the app blocks the database insertion and alerts the user.

## 🎨 Design Philosophy

This project actively avoids the "generic AI-generated look" (heavy shadows, excessive glassmorphism). Instead, it focuses on:
- **Typography First**: Content is structured cleanly using monospace elements for data and strong sans-serif headers.
- **Micro-copy**: Time-based greetings ("morning grind", "evening session") and streak-based motivations ("machine mode — don't stop") give the app a human touch.

---
*Built for the grind.*
