# 🚀 Hostinger Git Deployment Guide

We will use **Git** to keep your site updated. This is better than manual uploading because you can just click "Update" in Hostinger later.

---

## **Part 1: Deploying the Backend (API)**

Repo: `https://github.com/UmurAwais/Spark-LMS-Backend`

1.  **Create Subdomain (if not done):**

    - Go to Hostinger **Websites** -> **Manage**.
    - **Subdomains**: Create `api.sparktrainings.com`.
    - Folder: `public_html/api`.

2.  **Create Node.js App:**

    - Go to **Advanced** -> **Node.js**.
    - Create Application:
      - **Root**: `public_html/api`
      - **Version**: 18.x or 20.x
      - **Mode**: Production
      - **Main File**: `index.js`
    - Click **Create**.

3.  **Connect Git:**

    - Wait for the app to be created.
    - Go to **Advanced** -> **Git**.
    - **Repository**: `https://github.com/UmurAwais/Spark-LMS-Backend`
    - **Branch**: `main`
    - **Directory**: `public_html/api`
      - _Note: If Hostinger complains the directory creates conflicts, you might need to Delete the `public_html/api` folder files first via File Manager, then try connecting Git again._
    - Click **Create** or **Pull**.

4.  **Install & Start:**
    - Go back to **Node.js** settings.
    - Click **NPM Install** button.
    - **Environment Variables**: Add `MONGODB_URI`, `PORT=3000`, etc.
    - Click **Restart**.
    - **Verify**: Visit `https://api.sparktrainings.com`. It should say "Spark LMS Backend is Running!".

---

## **Part 2: Deploying the Frontend (Website)**

Repo: `https://github.com/UmurAwais/Spark-LMS` (Branch: `hostinger-build`)

Since Hostinger's standard Git pull doesn't "build" the website, we use a special script I created to push the _ready-to-use_ files to a special branch called `hostinger-build`.

### **Step 1: Push the Build (Do this on your PC)**

1.  Double-click the `deploy-frontend.bat` file I created in your `main-site` folder.
2.  Wait for it to say **SUCCESS**.
    - This creates a `hostinger-build` branch on your GitHub with the contents of the `dist` folder.

### **Step 2: Connect Git on Hostinger**

1.  Go to Hostinger **Advanced** -> **Git**.
2.  **Add Repository**:
    - **Repository**: `https://github.com/UmurAwais/Spark-LMS`
    - **Branch**: `hostinger-build` <-- **VERY IMPORTANT**
    - **Directory**: `public_html` (leave empty or slash for root domain)
3.  Click **Create**.
    - _Note: Ensure `public_html` is empty first (except for `.well-known` etc). Delete old files if needed._

### **Step 3: Auto-Deploy (Optional)**

- Hostinger allows setting up a Webhook so it updates automatically when you push.
- Otherwise, just click **"Pull"** in the Git section whenever you update the site using the script.

---

## **Summary**

- **Backend**: Updates via `main` branch of `Spark-LMS-Backend`.
- **Frontend**: Updates via `hostinger-build` branch of `Spark-LMS` (managed by double-clicking `deploy-frontend.bat`).
