# Connecting Your Corporate Firebase Project & Console Access Plan

This plan guides you through connecting your existing corporate Firebase/Google Cloud project (e.g., under `mranti.my`), inspecting live Firestore data in the Firebase Console, and managing team database access.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> - **Corporate Firebase Project Linking**: Rather than using a temporary auto-generated project, we will provide the exact procedure and configuration to link your organization's existing Firebase project.
> - **Console Access**: Direct links and instructions will be provided to access, view, and query your Firestore collections (`applications`, `reviews`, `notifications`, `settings`) in the official Firebase Console.
> - **Corporate Documentation**: A new guide `DOCS/FIREBASE_SETUP.md` will be added to the repository and the in-app Team Docs hub detailing Firestore setup, security rules deployment, and team IAM permissions.

---

## 1. Overview & Connection Architecture

When connecting your own corporate Firebase project:
1. **Corporate Project Ownership**: The database and data reside permanently inside your organization's Google Cloud / Firebase account.
2. **Configuration Synchronization**: The credentials in `firebase-applet-config.json` (or `.env` in standalone deployment) are updated with your corporate project's `projectId`, `apiKey`, and `firestoreDatabaseId`.
3. **Security Rules Deployment**: The existing hardened `firestore.rules` are deployed directly to your corporate database.

---

## 2. Step-by-Step Corporate Project Setup Workflow

### Step 1: Obtain Your Corporate Project ID
1. Navigate to the [Firebase Console](https://console.firebase.google.com/) signed in with your corporate Google Account (`danapengkomersialan@mranti.my`).
2. Select your existing corporate project (or click **Add Project** if creating a new dedicated one for the Commercialize Grant).
3. Click the gear icon ⚙️ &rarr; **Project settings**.
4. Note your **Project ID** (e.g. `mranti-commercialize-grant` or similar lowercase identifier).

### Step 2: Enable Cloud Firestore in Your Project
1. In the left navigation menu, click **Build** &rarr; **Firestore Database**.
2. Click **Create Database**.
3. Choose your database location:
   - Recommended for Malaysia: `asia-southeast1` (Singapore) or `asia-southeast2` (Jakarta) for lowest latency.
4. Select **Start in production mode**.

### Step 3: Register a Web App in Firebase
1. In **Project settings** &rarr; **General** tab, scroll to **Your apps**.
2. Click the Web icon `</>`.
3. App nickname: `commercialize-grant-web`.
4. Copy the generated `firebaseConfig` object containing:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

### Step 4: Connecting the Configuration to This Applet
- Provide your **Project ID** in chat so we can provision the database directly into your project via the Firebase tool, OR
- Update `firebase-applet-config.json` with your corporate web app credentials.

---

## 3. Direct Firebase Console Inspection Links

Once linked, your administrators and developers can inspect the live data and security rules using these direct console URLs:

- **Firestore Data Viewer**:
  `https://console.firebase.google.com/project/[YOUR_PROJECT_ID]/firestore/databases/(default)/data`
  *(Inspect individual `applications`, `reviews`, and `notifications` documents in real-time)*

- **Security Rules Editor & Monitor**:
  `https://console.firebase.google.com/project/[YOUR_PROJECT_ID]/firestore/rules`
  *(Review the active rule evaluation logs and denied requests)*

- **Team Members & Permissions (IAM)**:
  `https://console.firebase.google.com/project/[YOUR_PROJECT_ID]/settings/iam`
  *(Grant Viewer, Editor, or Admin roles to team members using their corporate emails)*

---

## 4. Deliverables

1. **`DOCS/FIREBASE_SETUP.md`**: Complete standalone Markdown guide in the repository for your IT/cloud team.
2. **In-App Integration**: Add `DOCS/FIREBASE_SETUP.md` to the in-app **Team Docs** viewer for 1-click reading and copying.
3. **Corporate Configuration Assistant**: An in-app settings card displaying your current Firebase connection status, project ID, and direct console links.
