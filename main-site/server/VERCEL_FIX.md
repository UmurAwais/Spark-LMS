# 🔧 Vercel Deployment Fix

## ⚠️ Issue: FUNCTION_INVOCATION_FAILED

The error you're seeing is because **Vercel serverless functions have limitations**:

1. ❌ No persistent file system (uploads won't work)
2. ❌ 50MB deployment size limit
3. ❌ 10-second execution timeout

---

## ✅ Solution: Use Alternative Deployment

### **Recommended: Deploy to Render.com (FREE & Better for Backend)**

Render is better for backend APIs because:

- ✅ Persistent file system (uploads work)
- ✅ No timeout limits
- ✅ Free tier available
- ✅ Better for Express apps

---

## 🚀 Deploy Backend to Render

### **Step 1: Sign Up**

1. Go to https://render.com
2. Sign up with your GitHub account

### **Step 2: Create Web Service**

1. Click "New +" → "Web Service"
2. Connect your GitHub: `Spark-LMS-Backend`
3. Click "Connect"

### **Step 3: Configure**

Fill in these settings:

| Setting            | Value                      |
| ------------------ | -------------------------- |
| **Name**           | `spark-lms-backend`        |
| **Region**         | Singapore (closest to you) |
| **Branch**         | `main`                     |
| **Root Directory** | (leave empty)              |
| **Runtime**        | Node                       |
| **Build Command**  | `npm install`              |
| **Start Command**  | `node index.js`            |
| **Instance Type**  | **Free**                   |

### **Step 4: Add Environment Variables**

Click "Advanced" → "Add Environment Variable":

```
MONGODB_URI = mongodb+srv://theprogrammerco_db_user:umarawais0329@spark-lms.vglmqix.mongodb.net/spark-lms?retryWrites=true&w=majority

ADMIN_PASSWORD = Sajid@786

PORT = 4001

NODE_ENV = production
```

### **Step 5: Deploy**

1. Click "Create Web Service"
2. Wait 3-5 minutes for deployment
3. Your backend will be live at: `https://spark-lms-backend.onrender.com`

---

## 🌐 Alternative: Railway.app

### **Step 1: Sign Up**

1. Go to https://railway.app
2. Sign up with GitHub

### **Step 2: Deploy**

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose `Spark-LMS-Backend`
4. Railway auto-detects Node.js

### **Step 3: Add Environment Variables**

1. Click on your service
2. Go to "Variables" tab
3. Add the same environment variables as above

### **Step 4: Get URL**

1. Go to "Settings" tab
2. Click "Generate Domain"
3. Your backend will be at: `https://spark-lms-backend.up.railway.app`

---

## 📝 After Backend is Live

### **Update Frontend Configuration**

1. Create `.env` file in main-site folder:

```env
VITE_API_URL=https://spark-lms-backend.onrender.com
```

2. Update `src/config.js`:

```javascript
export const API_URL =
  import.meta.env.VITE_API_URL || "https://spark-lms-backend.onrender.com";
```

3. Commit and push:

```bash
git add .
git commit -m "Update API URL to production backend"
git push
```

---

## 🎯 Deploy Frontend to Vercel

Now that backend is on Render, deploy frontend to Vercel:

1. Go to https://vercel.com/new
2. Import `Spark-LMS` repository
3. Configure:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_URL` = `https://spark-lms-backend.onrender.com`
5. Click "Deploy"

---

## ✅ Final Setup

### **Your Live URLs:**

- **Frontend**: `https://spark-lms.vercel.app`
- **Backend**: `https://spark-lms-backend.onrender.com`
- **Admin**: `https://spark-lms.vercel.app/admin/login`

### **Test Your Backend:**

```
https://spark-lms-backend.onrender.com/api/health
```

Should return: `{"ok": true}`

---

## 💰 Cost Comparison

### **Render (Recommended)**

- **Free Tier**: 750 hours/month
- **Limitations**: Spins down after 15 min inactivity (takes 30s to wake up)
- **Upgrade**: $7/month for always-on

### **Railway**

- **Free Tier**: $5 credit/month
- **Limitations**: ~500 hours
- **Upgrade**: Pay as you go

### **Vercel**

- ❌ Not suitable for this backend (file uploads don't work)

---

## 🔄 Migration Steps

1. ✅ Push backend to GitHub (Done!)
2. ✅ Deploy backend to Render/Railway
3. ✅ Get backend URL
4. ✅ Update frontend .env
5. ✅ Deploy frontend to Vercel
6. ✅ Test everything

---

## 🆘 Troubleshooting

### **Backend not responding:**

- Check Render/Railway logs
- Verify environment variables are set
- Check MongoDB connection

### **CORS errors:**

- Update CORS in index.js to include your frontend URL
- Redeploy backend

### **File uploads not working:**

- Make sure you're using Render/Railway (not Vercel)
- Check uploads folder permissions

---

**Recommended Next Step**: Deploy to Render.com following the steps above!
