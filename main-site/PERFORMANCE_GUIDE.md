# Performance Optimization Guide for Spark LMS

## Current Optimizations Implemented ✅

### 1. **Frontend Caching**

- ✅ LocalStorage caching for courses (5-minute expiry)
- ✅ Courses load instantly from cache on repeat visits
- ✅ Background refresh keeps data fresh

### 2. **Backend Optimizations**

- ✅ HTTP cache headers for images (7-day cache)
- ✅ Static file serving with ETag support
- ✅ CORS optimized for production

### 3. **Code Splitting & Lazy Loading**

- ✅ React Router handles route-based code splitting automatically
- ✅ Images use lazy loading with `loading="lazy"` attribute

## Additional Optimizations Needed

### 🔧 **Image Optimization** (CRITICAL - Do This First!)

Your course images are large PNGs (~500KB-2MB each). Optimize them:

**Option 1: Use Online Tools (Easiest)**

1. Go to https://tinypng.com or https://squoosh.app
2. Upload all course images from `server/uploads/courses/`
3. Download optimized versions (should be 50-100KB each)
4. Replace original files
5. Commit and push

**Option 2: Use Command Line (Faster for bulk)**

```bash
# Install sharp (image optimizer)
npm install -g sharp-cli

# Optimize all images in uploads folder
cd server/uploads/courses
for file in *.png; do
  sharp -i "$file" -o "optimized-$file" resize 800 --quality 80
done
```

**Expected Results:**

- Before: 500KB-2MB per image
- After: 50-100KB per image
- **10-20x faster image loading!**

### 🚀 **Railway Optimization**

Railway might be going to sleep (free tier). Solutions:

**Option 1: Keep-Alive Ping (Free)**
Add this to your frontend to ping the backend every 5 minutes:

```javascript
// In src/App.jsx or main component
useEffect(() => {
  const keepAlive = setInterval(() => {
    fetch(
      "https://spark-lms-backend-production.up.railway.app/api/health"
    ).catch(() => {});
  }, 5 * 60 * 1000); // Every 5 minutes

  return () => clearInterval(keepAlive);
}, []);
```

**Option 2: Upgrade Railway Plan**

- Railway Hobby plan ($5/month) = no sleep, faster performance

### ⚡ **Additional Frontend Optimizations**

1. **Preload Critical Resources**
   Add to `index.html`:

```html
<link
  rel="preconnect"
  href="https://spark-lms-backend-production.up.railway.app"
/>
<link
  rel="dns-prefetch"
  href="https://spark-lms-backend-production.up.railway.app"
/>
```

2. **Lazy Load Images**
   Already using `loading="lazy"` - ✅ Good!

3. **Reduce Bundle Size**

```bash
# Analyze bundle
npm run build
npx vite-bundle-visualizer
```

### 📊 **Performance Targets**

| Metric                | Current    | Target | Status                     |
| --------------------- | ---------- | ------ | -------------------------- |
| First Load (cached)   | ~500ms     | <1s    | ✅ Achieved                |
| First Load (no cache) | ~3-5s      | <2s    | ⚠️ Need image optimization |
| Image Load Time       | ~2-3s      | <500ms | ⚠️ Need compression        |
| API Response          | ~200-500ms | <300ms | ✅ Good                    |

## Quick Wins (Do These Now!)

1. **Optimize Images** - Will give you the biggest improvement
2. **Add Keep-Alive Ping** - Prevents Railway cold starts
3. **Enable Gzip** - Already enabled on Vercel ✅

## Monitoring

Use these tools to measure performance:

- Chrome DevTools → Network tab
- Lighthouse (Chrome DevTools → Lighthouse)
- https://pagespeed.web.dev/

**Target Lighthouse Scores:**

- Performance: 90+
- Best Practices: 95+
- SEO: 95+
