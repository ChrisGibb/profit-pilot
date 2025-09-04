
# Product Description Prompt for "ProfitPilot" - An E-commerce Profitability Calculator

## 1. Core Concept & High-Level Goal

You are to build "ProfitPilot," a sophisticated, interactive web application designed for e-commerce managers, digital marketers, and business owners. Its primary purpose is to serve as a financial modeling and forecasting tool that calculates marketing profitability based on a comprehensive set of user-provided business metrics. The application should allow users to instantly see the impact of changing inputs and to model the potential effects of new marketing initiatives through a "what-if" scenario planning feature.

---

## 2. Core Features & Functionality

### **Feature 1: Granular Input Dashboard**

The user must be able to input a wide range of business metrics, logically grouped into collapsible sections for clarity.

*   **Paid Ads Section:**
    *   Separate subsections for "Meta Ads" and "Google Ads."
    *   Each ad platform must have two distinct funnels:
        *   **Prospecting:** For attracting new customers.
        *   **Remarketing:** For re-engaging past visitors/customers.
    *   Inputs for each funnel: `Budget`, `Cost Per Click (CPC)`, `Bounce Rate (%)`, and `Conversion Rate (%)`.
    *   Display a dynamically calculated "Total Budget" for each platform (e.g., Total Meta Budget = Prospecting Budget + Remarketing Budget).

*   **Organic & Profitability Section:**
    *   **Organic:** `Organic Sessions` (number of visitors from non-paid channels) and `Organic First Purchase CR (%)`.
    *   **First Purchase Economics:** `Average Order Value (AOV)` and `Gross Margin (%)`.
    *   **Repeat Purchase Economics:** `Repeat Purchase CR (%)`, `AOV (Repeat Purchase)`, and `Gross Margin (Repeat Purchase)`.
    *   **Fixed Costs:** `Fixed Marketing OPEX` (Operational Expenditure).

*   **Global Settings:** Allow the user to select their currency (USD, EUR, PLN), which should update currency symbols across the entire UI.

### **Feature 2: Real-Time Calculated Results Panel**

As a user modifies any input, a dedicated results panel must update instantly without a "submit" button. This panel is the core output of the tool.

*   **Primary Metric (Most Prominent):**
    *   **Marketing Profit:** The final "bottom line" result. Display it in a large font and color-code it (green for positive, red for negative).
    *   Formula: `Total Gross Profit - (Total Ads Budget + Marketing OPEX + Scenario Costs)`

*   **Key Performance Indicators (KPIs):**
    *   **Total Marketing Cost:** The sum of all ad budgets and fixed costs.
    *   **Blended Cost Per Session (CPS):** Total Ads Budget / (Paid Sessions + Organic Sessions).
    *   **Total Sessions:** Broken down into `Paid Sessions` and `Organic Sessions`.
    *   **Blended Average Order Value (AOV):** Total Revenue / Total Purchases.
    *   **Blended Conversion Rate (CR):** Total Purchases / Total Sessions.

*   **Drill-Downs:** For blended metrics (AOV, CR), provide a breakdown showing the values for "First Purchase" and "Repeat Purchase" separately.

*   **Tooltips:** Every calculated metric must have a `HelpCircle` icon with a tooltip that explains its formula in simple terms.

### **Feature 3: "What-If" Scenario Planning**

This is a crucial feature for strategic decision-making.

*   **Scenario Management:**
    *   Provide a list of pre-defined, toggle-able scenarios (e.g., "CRO Project," "SEO Campaign," "Hire Ad Agency").
    *   Allow users to create, edit, and delete their own **Custom Scenarios**.

*   **Scenario Definition (via a multi-step form/dialog):**
    *   **Step 1 (Details):** Scenario `Name`, `Description`, and total `Investment Cost`.
    *   **Step 2 (Select Metrics):** User checks which of the input metrics this scenario will affect (e.g., SEO campaign affects `Organic Sessions`).
    *   **Step 3 (Define Impact):** For each selected metric, the user defines the expected impact as either a **Percentage Change** or an **Absolute Value**. The user must provide three estimates for the impact: `Pessimistic`, `Realistic`, and `Optimistic`.

*   **Global Estimation Control:** A global control must allow the user to apply an estimation level (`Pessimistic`, `Realistic`, `Optimistic`) across all active scenarios at once. An "Individual" option should also be available to let each scenario use its own saved estimate level.

*   **Scenario Impact Display:**
    *   When scenarios are active, the main "Calculated Results" panel must show the new forecasted numbers.
    *   Display a **delta indicator** (an up/down arrow with the value difference) next to each metric, showing the change from the baseline (no scenarios active).
    *   Calculate and display **"Added by Scenarios"** (the change in Contribution Margin) and **"Scenarios ROI"** ((Added Contribution Margin / Total Scenario Cost) * 100).

### **Feature 4: Google Analytics (GA4) Integration**

*   **Authentication:** Implement a "Sign in with Google" button using Firebase Authentication. The sign-in flow must request `analytics.readonly` scope to view GA4 data.
*   **Property Selection:** After signing in, replace any manual input with a dynamic, two-step dropdown selection:
    1.  Fetch and display a list of GA4 Accounts the user has access to.
    2.  Once an account is selected, fetch and display a list of GA4 Properties within it.
*   **Data Import:** Once a property is selected, a button should trigger a call to the GA4 Data API to fetch the total `sessions` for a given date range. This data should then populate the `Organic Sessions` input field in the main dashboard.

---

## 3. Tech Stack & Architecture

*   **Frontend Framework:** Next.js with the App Router.
*   **Language:** TypeScript.
*   **UI Components:** ShadCN UI library.
*   **Styling:** Tailwind CSS.
*   **State Management:** React Hooks and Context API.
*   **AI/Server-side Logic:** Genkit for creating server-side flows (e.g., for calling Google Analytics APIs).
*   **Authentication:** Firebase Authentication (Google Sign-In).

---

## 4. UI/UX & Design Language

*   **Overall Vibe:** Professional, clean, data-dense but not cluttered. It should feel like a premium financial tool.
*   **Layout:** A two-column layout on desktop.
    *   **Left Column (Wider):** Contains the "Business Inputs" and "Scenario Planning" cards.
    *   **Right Column (Narrower):** Contains the "Calculated Results" card, which should be `sticky` so it's always visible as the user scrolls through the inputs.
*   **Color Palette:**
    *   **Primary:** A deep, trustworthy blue (`#003049`).
    *   **Accent/Highlight:** A vibrant, attention-grabbing orange or yellow (`#F77F00`) for primary buttons, highlights, and the logo elements.
    *   **Destructive/Negative:** A clear red for negative numbers and delete actions.
    *   **Positive:** A clear green for positive numbers and indicators.
*   **Typography:**
    *   **Headlines:** A bold, impactful sans-serif font like 'Montserrat'.
    *   **Body/Labels:** A clean, highly readable sans-serif font like 'Assistant'.
*   **Component Style:**
    *   Use `Card` components to group sections.
    *   Inputs should have clear labels and units (`$`, `%`).
    *   Use subtle animations and transitions to make the interface feel responsive, especially when results update.
*   **Responsiveness:** The layout must adapt gracefully to tablet and mobile screens, likely collapsing to a single-column view.
