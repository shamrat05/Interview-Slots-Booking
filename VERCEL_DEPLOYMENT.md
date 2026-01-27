# 🚀 Vercel Deployment Guide

## ✅ What Changed

Your application now uses **direct Redis connection** instead of `@vercel/kv`, which means:
- ✅ Only **ONE** environment variable needed: `REDIS_URL`
- ✅ Works immediately on Vercel after deployment
- ✅ No need to set up Vercel KV
- ✅ Simpler configuration

## 📋 Deployment Steps

### Step 1: Add Environment Variable to Vercel

You need to add your Redis URL to Vercel. Choose **ONE** of these methods:

#### Option A: Using Vercel Dashboard (Recommended)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project: **interview-scheduler**
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name**: `REDIS_URL`
   - **Value**: `redis://default:XTjs3lXaPhdShW0XAYQdhAkg6xIDfE5l@redis-14920.c292.ap-southeast-1-1.ec2.cloud.redislabs.com:14920`
   - **Environment**: Select all (Production, Preview, Development)
5. Click **Save**

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link your project (if not already linked)
vercel link

# Add the environment variable
vercel env add REDIS_URL production

# When prompted, paste:
redis://default:XTjs3lXaPhdShW0XAYQdhAkg6xIDfE5l@redis-14920.c292.ap-southeast-1-1.ec2.cloud.redislabs.com:14920

# Also add to preview
vercel env add REDIS_URL preview

# And development
vercel env add REDIS_URL development
```

### Step 2: Deploy Your Code

```bash
# Commit all changes
git add .
git commit -m "Switch to direct Redis connection for Vercel deployment"

# Push to your repository
git push origin main
```

Vercel will automatically deploy your application when you push to your repository.

### Step 3: Verify Deployment

1. Wait for the deployment to complete (check Vercel dashboard)
2. Visit your deployed URL: `https://your-app.vercel.app`
3. Test the application - slots should load correctly now

## 🔧 Alternative: Manual Deployment via CLI

If you prefer to deploy via CLI:

```bash
# Deploy to production
vercel --prod

# Or just deploy to preview
vercel
```

## 📝 Environment Variables Summary

Your Vercel project needs **only this one** environment variable:

| Variable | Value | Required |
|----------|-------|----------|
| `REDIS_URL` | `redis://default:XTjs3lXaPhdShW0XAYQdhAkg6xIDfE5l@redis-14920.c292.ap-southeast-1-1.ec2.cloud.redislabs.com:14920` | ✅ Yes |
| `ADMIN_SECRET` | Your admin password (e.g., `admin123`) | ✅ Yes |
| `START_HOUR` | `9` | Optional (has default) |
| `END_HOUR` | `17` | Optional (has default) |
| `SLOT_DURATION_MINUTES` | `60` | Optional (has default) |
| `BREAK_DURATION_MINUTES` | `15` | Optional (has default) |
| `BOOKING_DAYS` | `3` | Optional (has default) |

### Adding Other Environment Variables

If you want to customize the slot configuration on Vercel:

```bash
vercel env add ADMIN_SECRET production
vercel env add START_HOUR production
vercel env add END_HOUR production
# ... and so on
```

Or add them via the Vercel Dashboard.

## ✅ Verification Checklist

After deployment, verify that:

- [ ] Application loads without errors
- [ ] Slots are displayed correctly
- [ ] Booking functionality works
- [ ] Admin panel works with your `ADMIN_SECRET`
- [ ] No console errors related to Redis/KV

## 🐛 Troubleshooting

### Issue: Still getting KV errors

**Solution**: Make sure you've:
1. Pushed the latest code (with updated `lib/slots.ts`)
2. Added `REDIS_URL` to Vercel environment variables
3. Redeployed after adding the environment variable

### Issue: Connection timeout to Redis

**Possible causes**:
1. Redis instance is not accessible from Vercel's servers
2. Firewall/security group blocking Vercel IPs
3. Redis credentials are incorrect

**Solution**: 
- Check Redis Labs dashboard for connection settings
- Ensure Redis instance allows connections from anywhere (or whitelist Vercel IPs)
- Verify credentials are correct

### Issue: Deployment succeeds but slots don't load

**Solution**:
1. Check Vercel deployment logs: Dashboard → Deployments → Your Deployment → Logs
2. Look for Redis connection errors
3. Verify `REDIS_URL` is set correctly in environment variables

## 🎯 Expected Result

After successful deployment:

✅ Your application will be live at `https://your-app.vercel.app`  
✅ Slots will load from Redis  
✅ Users can book slots  
✅ All data persists in Redis  
✅ Admin panel works correctly  

## 📚 Additional Resources

- [Vercel Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)
- [Redis Labs Documentation](https://docs.redis.com/)
- Your local documentation:
  - `REDIS_SETUP.md` - Complete Redis setup guide
  - `REDIS_QUICK_REFERENCE.md` - Quick command reference
  - `REDIS_INTEGRATION_SUMMARY.md` - What was implemented

## 🔄 Rollback Plan

If something goes wrong, you can quickly rollback:

1. Go to Vercel Dashboard → Deployments
2. Find a previous working deployment
3. Click the three dots (•••) → Promote to Production

---

**You're all set!** 🎉 Just add the `REDIS_URL` to Vercel and deploy.
