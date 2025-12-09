# 🚀 Quick Deployment Steps

## **Fastest Way to Deploy (15 minutes)**

### **1. Install Vercel CLI**

```bash
npm install -g vercel
```

### **2. Deploy Backend**

```bash
cd server
vercel
```

Follow prompts:

- Link to existing project? **No**
- Project name: **spark-lms-backend**
- Directory: **./server**
- Override settings? **No**

After deployment, copy the URL (e.g., `https://spark-lms-backend.vercel.app`)

### **3. Add Backend Environment Variables**

```bash
vercel env add MONGODB_URI
# Paste: mongodb+srv://theprogrammerco_db_user:umarawais0329@spark-lms.vglmqix.mongodb.net/spark-lms?retryWrites=true&w=majority

vercel env add ADMIN_PASSWORD
# Paste: Sajid@786

vercel env add PORT
# Paste: 4001
```

### **4. Deploy Frontend**

```bash
cd ..
vercel
```

Follow prompts:

- Link to existing project? **No**
- Project name: **spark-lms-frontend**
- Directory: **./**
- Override settings? **No**

### **5. Add Frontend Environment Variable**

```bash
vercel env add VITE_API_URL
# Paste your backend URL: https://spark-lms-backend.vercel.app
```

### **6. Redeploy Both**

```bash
cd server
vercel --prod

cd ..
vercel --prod
```

### **Done! 🎉**

Your site is now live at the URLs provided by Vercel!

---

## **Alternative: Use Vercel Dashboard (Easier)**

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure as shown in DEPLOYMENT_GUIDE.md
4. Click Deploy

**This is the recommended method for beginners!**
