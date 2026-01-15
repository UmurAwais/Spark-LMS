# 🚀 Deployment Guide for Hostinger

Your site is `sparktrainings.com`. We will deploy the **Frontend** to the main domain and the **Backend** to a subdomain (`api.sparktrainings.com`).

---

## **Part 1: Deploying the Backend (API)**

Since you want the entire site on Hostinger, we need to set up the Node.js server first.

### **1. Create Subdomain**

1.  Log in to **Hostinger hPanel**.
2.  Go to **Websites** -> **Manage**.
3.  Search for **Subdomains**.
4.  Create a new subdomain: `api.sparktrainings.com`.
5.  Folder name: `public_html/api` (or default).

### **2. Set Up Node.js Application**

1.  Search for **Node.js** in hPanel (under "Advanced").
2.  Click **Create Application**.
3.  **Settings**:
    - **Node.js Version**: 18.x or 20.x (Recommended).
    - **Application Mode**: Production.
    - **Application Root**: `public_html/api` (matches your subdomain folder).
    - **Main Configuration File**: `index.js` (NOT package.json).
4.  Click **Create**.

### **3. Upload Server Files**

1.  Go to **File Manager**.
2.  Navigate to `public_html` -> `api`.
3.  **Delete** the default files automatically created by Hostinger.
4.  **Upload** the contents of your local `server` folder:
    - `e:\Spark LMS\main-site\server\`
    - **Do NOT upload `node_modules`.**
    - Ensure `package.json` and `index.js` are in the root of `public_html/api`.

### **4. Install Dependencies**

1.  Go back to **Node.js** settings in hPanel.
2.  Click **NPM Install** button.
    - _Note: If this fails or takes too long, you might need to use SSH, but usually the button works._

### **5. Configure Environment Variables**

1.  In the **Node.js** section, find **Environment Variables**.
2.  Add the following (Key = Value):
    - `MONGODB_URI` = `mongodb+srv://theprogrammerco_db_user:umarawais0329@spark-lms.vglmqix.mongodb.net/spark-lms?retryWrites=true&w=majority`
    - `ADMIN_PASSWORD` = `Sajid@786`
    - `PORT` = `3000` (or whatever Hostinger assigns, usually it handles this automatically, but setting 3000 is safe).

### **6. Start the Server**

1.  Click **Restart** or **Start** in the Node.js panel.
2.  Your API should now be live at `https://api.sparktrainings.com`.
3.  Test it: `https://api.sparktrainings.com/api/courses` (or any valid endpoint).

---

## **Part 2: Deploying the Frontend (Main Site)**

The Frontend has already been built with the new API URL (`https://api.sparktrainings.com`).

### **1. Access File Manager**

1.  Navigate to `public_html` (the root for `sparktrainings.com`).
2.  **Delete** existing default files (e.g., `default.php`).

### **2. Upload Frontend Files**

1.  On your computer, go to: `e:\Spark LMS\main-site\dist`
2.  **Select ALL files inside `dist`** (`assets`, `index.html`, `.htaccess`, etc.).
3.  **Drag and update** them into Hostinger's `public_html` folder.

### **3. Verify**

1.  Visit `https://sparktrainings.com`.
2.  Check if courses load (this allows verifying the API connection).
3.  Refresh the page on a sub-page (e.g., `/courses`) to test the `.htaccess` (SPA routing).

---

## **Troubleshooting**

- **404 on API**: Verify the subdomain maps to the correct folder. Check if `index.js` is the entry point.
- **Database Error**: Check `MONGODB_URI` in Environment Variables.
- **Page Not Found on Refresh**: Ensure `.htaccess` was uploaded to `public_html`.
