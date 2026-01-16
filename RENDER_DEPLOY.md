# 🚀 Deploying Backend to Render (Free)

Since Hostinger doesn't have Node.js on your plan, we will use **Render** (which is excellent and free).

### **Step 1: Sign Up / Log In**

1.  Go to [https://render.com](https://render.com)
2.  Click **"Get Started"** and sign in with **GitHub**.

### **Step 2: Create a New Web Service**

1.  Click the **"New +"** button (top right).
2.  Select **"Web Service"**.
3.  Under "Connect a repository", search for: `Spark-LMS-Backend`
4.  Click **"Connect"**.

### **Step 3: Configure Settings**

- **Name**: `spark-lms-backend` (or a unique name)
- **Region**: Frankfurt (or closest to you)
- **Branch**: `main`
- **Root Directory**: (Leave blank)
- **Runtime**: **Node**
- **Build Command**: `npm install`
- **Start Command**: `node index.js`
- **Instance Type**: **Free**

### **Step 4: Environment Variables (Crucial!)**

Scroll down to **"Environment Variables"** and click **"Add Environment Variable"** for each of these:

| Key              | Value                                                                                                                     |
| :--------------- | :------------------------------------------------------------------------------------------------------------------------ |
| `MONGODB_URI`    | `mongodb+srv://theprogrammerco_db_user:umarawais0329@spark-lms.vglmqix.mongodb.net/spark-lms?retryWrites=true&w=majority` |
| `ADMIN_PASSWORD` | `Sajid@786`                                                                                                               |
| `PORT`           | `3000`                                                                                                                    |
| `NODE_ENV`       | `production`                                                                                                              |

### **Step 5: Deploy**

1.  Click **"Create Web Service"**.
2.  Wait a few minutes. You will see logs scrolling.
3.  Once it says **"Live"**, look at the top left for your URL.
    - It will look like: `https://spark-lms-backend-xxxx.onrender.com`

---

### **Step 6: Update Frontend (After Deployment)**

Once you have that URL, **paste it here in the chat** so I can update your Frontend to talk to the new brain!
