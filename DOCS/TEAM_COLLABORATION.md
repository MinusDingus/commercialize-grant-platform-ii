# Team Collaboration & Google Gemini Workflow

This guide details how your team members can clone, collaborate, and use Google Gemini to evolve the Commercialize Grant Management Platform.

---

## 1. Setting Up the Team GitHub Repository

To share this codebase with your team so everyone can access and edit it:

### Step 1: Create a Free GitHub Repository
1. Log in to [GitHub](https://github.com) (free account).
2. Click **New Repository**.
3. Name it: `commercialize-grant-platform`.
4. Visibility: Choose **Private** (recommended for institutional grant operations) or Public.
5. Do **not** check "Initialize with README" (we already have a complete one).
6. Click **Create repository**.

### Step 2: Initialize Git and Push Code
Open your terminal in the root of this project:
```bash
# Initialize git if not already done
git init

# Add all files (respects .gitignore)
git add .

# Create initial commit
git commit -m "feat: initial commit of commercialize grant platform and documentation suite"

# Link to your GitHub repository
git remote add origin https://github.com/YOUR_ORGANIZATION_OR_USERNAME/commercialize-grant-platform.git

# Set main branch and push
git branch -M main
git push -u origin main
```

---

## 2. Onboarding Team Members

Send these instructions to new colleagues joining the project:

1. **Clone the Project**:
   ```bash
   git clone https://github.com/YOUR_ORGANIZATION_OR_USERNAME/commercialize-grant-platform.git
   cd commercialize-grant-platform
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Setup Environment**:
   ```bash
   cp .env.example .env
   ```
   Add your Google Gemini API key if using server-side AI features.
4. **Launch Local Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 3. How to Use Google Gemini to Modify Code

Because your team has subscribed to **Google Gemini Pro**, you can use Gemini to rapidly build new features, generate test datasets, or refactor code.

### Option A: Using Google AI Studio Build (Recommended)
1. Open [Google AI Studio](https://aistudio.google.com).
2. Import or connect this GitHub repository.
3. You can prompt Gemini directly to add new features.

#### Example Gemini Prompts for Common Enhancements:
- **Add a new scoring dimension**:
  > *"Add a 6th rubric dimension in `src/types/grant.ts` and `DualReviewerModal.tsx` for 'Intellectual Property Protection & Freedom to Operate' with a 15% weight, and recalculate the weights so they sum to 100%."*

- **Customize email templates**:
  > *"Add a new email notification template in `EmailCenter.tsx` for 'Committee Pitch Scheduled' that invites the applicant to pitch to the Commercialization Grant Committee."*

- **Add new analytics charts**:
  > *"In `TreemapChart.tsx`, add a secondary tab with a horizontal bar chart showing Total Funding Requested grouped by Malaysian State."*

### Option B: Using VS Code with Gemini Code Assist
1. Install the official **Google Cloud Code** or Gemini extension in VS Code.
2. Sign in with your Google account that has Gemini Pro.
3. Gemini will provide smart multi-line completions, automated unit test generation, and code explanations.

---

## 4. Git Branching & Contribution Workflow

To prevent team members from overwriting each other's work:

1. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/add-new-scoring-criteria
   ```
2. **Make Changes and Test**:
   ```bash
   npm run lint
   npm run build
   ```
3. **Commit with Clear Message**:
   ```bash
   git add .
   git commit -m "feat: add intellectual property dimension to reviewer rubric"
   ```
4. **Push Branch & Open Pull Request**:
   ```bash
   git push origin feature/add-new-scoring-criteria
   ```
   Open a Pull Request on GitHub for a colleague to review before merging into `main`.
