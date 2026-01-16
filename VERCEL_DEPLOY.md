# 🚀 Deploying Backend to Vercel (Free)

Since Hostinger doesn't have Node.js on your plan, we will use **Vercel** which is free and very fast.

### **Step 1: Sign Up / Log In**

1.  Go to [https://vercel.com](https://vercel.com)
2.  Sign up with **GitHub**.

### **Step 2: Add New Project**

1.  On your dashboard, click **"Add New..."** -> **"Project"**.
2.  Find `Spark-LMS-Backend` in the list and click **"Import"**.

### **Step 3: Configure Settings**

- **Framework Preset**: Select **"Other"**.
- **Root Directory**: Leave as `./`.
- **Build Command**: Leave empty.
- **Output Directory**: Leave empty.
- **Install Command**: Leave as `npm install`.

### **Step 4: Environment Variables**

Expand the **Environment Variables** section and add:

| Key              | Value                                                                                                                     |
| :--------------- | :------------------------------------------------------------------------------------------------------------------------ |
| `MONGODB_URI`    | `mongodb+srv://theprogrammerco_db_user:umarawais0329@spark-lms.vglmqix.mongodb.net/spark-lms?retryWrites=true&w=majority` |
| `ADMIN_PASSWORD` | `Sajid@786`                                                                                                               |
| `NODE_ENV`       | `production`                                                                                                              |

### **Step 5: Deploy**

1.  Click **"Deploy"**.
2.  Wait ~1 minute.
3.  Once done, you will see a screenshot of your app.
4.  Click **"Continue to Dashboard"**.
5.  On the right side, copy your **Domains** URL (e.g., `https://spark-lms-backend.vercel.app`).

---

### **Step 6: Update Frontend**

**Paste that URL here** so I can update your Frontend to use the new Vercel backend!
