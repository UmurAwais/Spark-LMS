# 🚀 Spark LMS - Deployment Guide

## Complete Guide to Make Your Site Live

---

## **Method 1: Deploy to Vercel (Recommended - FREE)**

### **Prerequisites:**
1. GitHub account (you already have this ✅)
2. Vercel account (free) - Sign up at https://vercel.com

---

### **STEP 1: Deploy Backend (API Server)**

#### 1.1 Create Separate Repository for Backend
```bash
cd "C:\Users\AbdullahComputer\Desktop\Spark Trainings\main-site\server"
git init
git add .
git commit -m "Initial backend commit"
```

#### 1.2 Create New GitHub Repository
1. Go to https://github.com/new
2. Name: `spark-lms-backend`
3. Make it **Private** (to protect your API keys)
4. Click "Create repository"

#### 1.3 Push Backend to GitHub
```bash
git remote add origin https://github.com/UmurAwais/spark-lms-backend.git
git branch -M main
git push -u origin main
```

#### 1.4 Deploy to Vercel
1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import `spark-lms-backend` repository
4. **Framework Preset**: Other
5. **Root Directory**: `./`
6. **Build Command**: Leave empty
7. **Output Directory**: Leave empty
8. Click "Deploy"

#### 1.5 Add Environment Variables in Vercel
In Vercel Dashboard → Your Project → Settings → Environment Variables:

Add these variables:
```
MONGODB_URI = mongodb+srv://theprogrammerco_db_user:umarawais0329@spark-lms.vglmqix.mongodb.net/spark-lms?retryWrites=true&w=majority
ADMIN_PASSWORD = Sajid@786
PORT = 4001
NODE_ENV = production
```

#### 1.6 Get Your Backend URL
After deployment, you'll get a URL like:
```
https://spark-lms-backend.vercel.app
```
**Save this URL - you'll need it for the frontend!**

---

### **STEP 2: Deploy Frontend (Main Site)**

#### 2.1 Update Frontend Configuration
Create/Update `.env` file in main-site folder:
```env
VITE_API_URL=https://spark-lms-backend.vercel.app
```

#### 2.2 Update config.js
Edit `src/config.js`:
```javascript
export const API_URL = import.meta.env.VITE_API_URL || 'https://spark-lms-backend.vercel.app';

export async function apiFetch(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  // ... rest of the code
}
```

#### 2.3 Build the Frontend
```bash
cd "C:\Users\AbdullahComputer\Desktop\Spark Trainings\main-site"
npm run build
```

#### 2.4 Deploy to Vercel
1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import `Spark-LMS` repository
4. **Framework Preset**: Vite
5. **Root Directory**: `./`
6. **Build Command**: `npm run build`
7. **Output Directory**: `dist`
8. Click "Deploy"

#### 2.5 Add Environment Variables
In Vercel Dashboard → Your Project → Settings → Environment Variables:
```
VITE_API_URL = https://spark-lms-backend.vercel.app
```

#### 2.6 Redeploy
After adding environment variables:
1. Go to "Deployments" tab
2. Click "..." on latest deployment
3. Click "Redeploy"

---

### **STEP 3: Configure Custom Domain (Optional)**

#### 3.1 For Frontend
1. In Vercel → Your Frontend Project → Settings → Domains
2. Add your domain: `sparktrainings.com`
3. Follow DNS configuration instructions

#### 3.2 For Backend
1. In Vercel → Your Backend Project → Settings → Domains
2. Add subdomain: `api.sparktrainings.com`
3. Update frontend `.env` to use new domain

---

## **Method 2: Deploy to Render (Alternative - FREE)**

### **Backend Deployment:**
1. Go to https://render.com
2. Sign up/Login
3. Click "New" → "Web Service"
4. Connect GitHub repository: `spark-lms-backend`
5. Settings:
   - **Name**: spark-lms-backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Instance Type**: Free
6. Add Environment Variables (same as above)
7. Click "Create Web Service"

### **Frontend Deployment:**
1. Click "New" → "Static Site"
2. Connect GitHub repository: `Spark-LMS`
3. Settings:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. Add Environment Variables
5. Click "Create Static Site"

---

## **Method 3: Deploy to Railway (Alternative)**

### **Backend:**
1. Go to https://railway.app
2. "New Project" → "Deploy from GitHub repo"
3. Select `spark-lms-backend`
4. Add environment variables
5. Deploy

### **Frontend:**
1. Build locally: `npm run build`
2. Deploy `dist` folder to Netlify or Vercel

---

## **Important Configuration Updates**

### **Update CORS in Backend (index.js)**
```javascript
const corsOptions = {
  origin: [
    'https://your-frontend-url.vercel.app',
    'http://localhost:5173' // Keep for local development
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-admin-token"],
  credentials: true,
};
```

### **Update File Upload Paths**
For production, you'll need to use cloud storage (like AWS S3 or Cloudinary) for file uploads instead of local storage.

---

## **Post-Deployment Checklist**

✅ Backend is live and responding
✅ Frontend is live and loading
✅ MongoDB connection working
✅ Admin login working
✅ File uploads working (or cloud storage configured)
✅ Environment variables set correctly
✅ CORS configured properly
✅ Custom domain configured (if applicable)

---

## **Testing Your Live Site**

1. **Backend Health Check:**
   ```
   https://your-backend-url.vercel.app/api/health
   ```
   Should return: `{"ok": true}`

2. **Frontend:**
   ```
   https://your-frontend-url.vercel.app
   ```
   Should load your homepage

3. **Admin Login:**
   ```
   https://your-frontend-url.vercel.app/admin/login
   ```
   Should load admin login page

---

## **Troubleshooting**

### **Issue: API calls failing**
- Check CORS settings in backend
- Verify VITE_API_URL is correct
- Check browser console for errors

### **Issue: Environment variables not working**
- Redeploy after adding env vars
- Check variable names (VITE_ prefix for frontend)

### **Issue: File uploads not working**
- Use cloud storage (Cloudinary, AWS S3)
- Update multer configuration

---

## **Cost Estimate**

### **Free Tier (Recommended for Start):**
- Vercel: Free (both frontend & backend)
- MongoDB Atlas: Free (512MB)
- **Total: $0/month**

### **Paid Tier (For Growth):**
- Vercel Pro: $20/month (both)
- MongoDB Atlas: $9/month (2GB)
- Cloudinary: $0-89/month
- **Total: ~$29-109/month**

---

## **Next Steps After Deployment**

1. ✅ Test all features on live site
2. ✅ Set up monitoring (Vercel Analytics)
3. ✅ Configure backup strategy
4. ✅ Set up SSL certificate (automatic with Vercel)
5. ✅ Add custom domain
6. ✅ Set up email notifications
7. ✅ Configure CDN for faster loading

---

## **Support & Resources**

- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas: https://www.mongodb.com/docs/atlas/
- Vite Deployment: https://vitejs.dev/guide/static-deploy.html

---

**Need Help?** Contact me or check the documentation above!

Good luck with your deployment! 🚀
