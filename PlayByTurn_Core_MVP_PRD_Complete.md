# **Product Requirements Document (PRD): PlayByTurn Core MVP**

## **1. Product Overview**
**Product Name:** PlayByTurn (Core MVP)  
**Platform:** Responsive Web Application (Mobile-first design)  
**Target Launch:** V1 (Core Features Only)  

**Objective:**
To provide casual racket and paddle sports players with a lightweight, easy-to-use web application that automates the tedious parts of organizing weekend games. The MVP focuses strictly on session configuration, automated matchmaking, live score tracking, and a shareable spectator view. 

---

## **2. Target Audience & User Persona**
**Primary Persona: The "Weekend Organizer" (e.g., Alex)**
*   **Profile:** A casual sports enthusiast who organizes weekly padel or badminton games for a group of 4 to 12 friends.
*   **Pain Points:** Spends too much time figuring out who plays who, tracking who has sat out too long, and doing mental math to figure out the overall winner.
*   **Needs:** A frictionless way to input player names, let an algorithm generate the matches, and allow everyone to see the score easily on their phones.

---

## **3. User Stories**
*   **As an organizer**, I want to input the number of players and courts so that the app can automatically generate a fair match schedule without manual calculation.
*   **As an organizer**, I want to select the specific sport (e.g., Tennis vs. Badminton) so that the score tracker reflects the correct scoring rules.
*   **As an organizer**, I want to input player genders so the matchmaking engine can properly balance Mixed Doubles matches.
*   **As a player**, I want to tap a simple, large button on my phone to update the score between points or sets, so it doesn't disrupt the flow of the game.
*   **As a spectator/friend**, I want to click a link to view live scores and current standings without having to create an account.

---

## **4. Core User Flows**

### **Flow 1: Onboarding & Dashboard Access**
1.  **Landing Page:** User navigates to the app.
2.  **Authentication:** User signs up/logs in (Google OAuth or Email/Password).
3.  **Dashboard:** User views session history or initiates a new game.

### **Flow 2: Session Setup & Automated Matchmaking**
1.  **Initiate:** Click "Create New Session".
2.  **Parameters:** Select sport and format (Singles, Fixed Doubles, Mixed Doubles, Americano).
3.  **Resource Input:** Add participant names and genders (M/F), then specify available courts (1-4).
4.  **Generate:** The engine calculates the bracket and directs to the Active Session Hub.

### **Flow 3: Gameplay & Live Score Tracking**
1.  **Start Match:** Open the match from the Active Session Hub.
2.  **Log Points:** Tap the Big Button UI during the game to update scores based on sport-specific logic.
3.  **End Match:** Finalize the match once win conditions are met.
4.  **Data Sync:** Standings and leaderboards update instantly.

### **Flow 4: Spectator Sharing**
1.  **Generate Link:** Organizer clicks "Share" to generate a read-only URL.
2.  **Distribute & Spectate:** Friends click the link to view real-time scores and standings without logging in.

---

## **5. UI/UX Screen Requirements**

*   **Screen 1: Landing Page & Auth:** Clear CTA ("Create a Session") and simple login/signup modal. Spectator links bypass this.
*   **Screen 2: Organizer Dashboard:** Scrollable list of active/past sessions. Sticky FAB for "+ New Session".
*   **Screen 3: Session Setup:** Tappable tiles for sports/formats. Fast name input with M/F gender toggles. Massive "Generate Matches" button. Includes inline validation for edge cases (e.g., gender imbalance).
*   **Screen 4: Active Session Hub:** Sticky header with "Share Link". Tabs for Live Matches (tappable to open tracker), Up Next/Resting queue, and Real-Time Leaderboard.
*   **Screen 5: Live Score Tracker (In-Game):** Vertical 50/50 split with massive tap zones. Bold typography reflecting sport logic. Includes "Undo" button and screen-wake lock.
*   **Screen 6: Spectator View:** No-auth access. Horizontal carousel of live matches and a clean, sortable standings table below. Read-only mode.

---

## **6. Matchmaking Algorithm & Logic**

### **Variables**
*   $P$ = Total number of players
*   $C$ = Total number of courts
*   $S$ = Slots per match (2 for Singles, 4 for Doubles)
*   Capacity = $C \times S$ 

### **Format-Specific Rules**
*   **Singles:** Standard queue prioritizing longest resting players.
*   **Fixed Doubles:** Rotates static teams rather than individuals.
*   **Mixed Doubles:** Separates queues by gender; strictly pairs 1M+1F vs 1M+1F.
*   **Americano:** Deterministic round-robin matrix guaranteeing everyone partners with and plays against everyone exactly once.

### **Rotation Priority**
1.  Lowest total matches played.
2.  Longest time spent in the `RESTING` queue.
3.  Attempt to break consecutive play streaks (e.g., resting after 3 straight games).

### **Edge Cases Handled**
*   **Insufficient Players:** Blocks generation (e.g., 3 players for Doubles).
*   **Over-allocation of Courts:** Ignores/hides unused courts if Capacity exceeds $P$.
*   **Mixed Doubles Imbalance:** If M/F ratio breaks the 1:1 team requirement, limits active courts to available viable pairs and warns the organizer.
*   **Indivisible Player Counts:** Guarantees proper rest rotation for odd numbers (e.g., 5 players on 2 courts).

---

## **7. Data Schema & Database Models**

**1. User Model** (The Organizer)
*   `id` (UUID, PK), `name`, `email`, `authProvider`, `passwordHash`

**2. Session Model** (The Event)
*   `id` (UUID, PK), `organizerId` (FK), `title`, `sport`, `format`, `status`, `spectatorCode`

**3. Player Model** (Session-Specific Roster)
*   `id` (UUID, PK), `sessionId` (FK), `name`, `gender` (Enum: MALE, FEMALE), `matchesPlayed`, `matchesWon`, `pointsWon`, `pointDifferential`

**4. Court Model**
*   `id` (UUID, PK), `sessionId` (FK), `name`

**5. Match Model** (Connects logic, courts, and players)
*   `id` (UUID, PK), `sessionId` (FK), `courtId` (FK), `status`
*   `team1Player1Id`, `team1Player2Id`, `team2Player1Id`, `team2Player2Id`
*   `winningTeam`
*   `scoreData` (JSONB) - *Stores sport-specific game states (e.g., 15-30-40, sets, games, or simple rally totals).*

---

## **8. Technical Stack**

| Tier | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | **Next.js (React) + Tailwind CSS** | Mobile-first responsiveness, fast rendering, decoupled architecture for future native app porting. |
| **State Management** | **TanStack Query** | Flawless server state management and caching. |
| **Backend & DB** | **Supabase (PostgreSQL)** | Managed database with native JSONB support and built-in Auth. |
| **Real-Time Engine** | **Supabase Realtime** | WebSockets broadcast database changes (like score updates) to all spectator views instantly. |
| **Matchmaking Logic** | **Supabase Edge Functions** | Serverless functions (Deno/TS) process complex algorithms on demand without a heavy backend server. |
| **Hosting & CI/CD** | **Vercel + GitHub Actions** | Automated deployments and global CDN. |

---

## **9. Out of Scope (For V1)**
*   E-commerce and physical merchandise integrations.
*   Tiered SaaS subscriptions and paywalls.
*   Native Mobile Apps (App Store / Google Play).
*   Offline mode functionality (requires active internet for V1).

---

## **10. Future Considerations (V2 & Beyond)**
*   **Native App Migration:** Rebuild in React Native/Flutter sharing the exact same backend API.
*   **Push Notifications:** Alerts for "Your turn to play".
*   **Offline Sync:** Local score tracking that pushes to the server once reconnected.
*   **Advanced Features:** AI video highlights, Elo rating systems, injury substitutions.
