# 🚨 GitHub Actions Deployment Troubleshooting Guide

## Current Issues & Solutions

### **Issue 1: Frontend Build Failing (Exit Code 249)**

**Symptoms:**
- Frontend build step fails with "Process completed with exit code 249"
- Build works locally but fails in GitHub Actions

**Root Cause:**
- Environment variable issues in CI/CD
- Missing or incorrect build configuration

**Solutions:**
1. **Check Environment Variables:**
   ```bash
   # In GitHub repository → Settings → Secrets and variables → Actions
   # Ensure these are set:
   VERCEL_TOKEN=your_vercel_token
   VERCEL_ORG_ID=your_vercel_org_id
   VERCEL_PROJECT_ID=your_vercel_project_id
   ```

2. **Force Clean Build:**
   ```bash
   # Locally test:
   cd client
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

3. **Check Node Version Compatibility:**
   - Ensure local Node.js version matches GitHub Actions (18.x)

### **Issue 2: Railway Deployment Failing**

**Symptoms:**
- "a value is required for '--service <SERVICE>' but none was supplied"
- Backend deployment job fails

**Root Cause:**
- `RAILWAY_SERVICE` secret not set
- Railway CLI expecting service name

**Solutions:**
1. **Set Railway Service Secret:**
   ```bash
   # In GitHub repository → Settings → Secrets and variables → Actions
   RAILWAY_SERVICE=your_service_name
   ```

2. **Alternative: Deploy Without Service Name:**
   - Remove `--service` flag if you only have one service
   - Or set the service name in Railway dashboard

3. **Check Railway Token:**
   ```bash
   # Ensure RAILWAY_TOKEN is valid and has deployment permissions
   ```

### **Issue 3: Missing Test Scripts**

**Symptoms:**
- "Missing script: test" error
- Test job fails

**Root Cause:**
- Backend package.json missing test scripts

**Solutions:**
1. **Add Test Scripts to package.json:**
   ```json
   {
     "scripts": {
       "test": "echo \"No tests specified\" && exit 0",
       "test:ci": "echo \"No tests specified\" && exit 0"
     }
   }
   ```

2. **Or Disable Tests Temporarily:**
   - Comment out test job in workflow
   - Focus on deployment first

## 🔧 Quick Fixes

### **Option 1: Use Simple Workflow**
1. Use `simple-deploy.yml` instead of `deploy.yml`
2. This workflow has better error handling and debugging

### **Option 2: Manual Deployment**
1. Deploy frontend to Vercel manually
2. Deploy backend to Railway manually
3. Skip GitHub Actions temporarily

### **Option 3: Fix Secrets First**
1. Set up all required secrets
2. Test with minimal workflow
3. Add complexity gradually

## 📋 Required Secrets Checklist

### **Vercel (Frontend)**
- [ ] `VERCEL_TOKEN` - Your Vercel API token
- [ ] `VERCEL_ORG_ID` - Your Vercel organization ID
- [ ] `VERCEL_PROJECT_ID` - Your Vercel project ID

### **Railway (Backend)**
- [ ] `RAILWAY_TOKEN` - Your Railway API token
- [ ] `RAILWAY_SERVICE` - Your Railway service name (optional)

## 🚀 Step-by-Step Recovery

### **Step 1: Verify Local Build**
```bash
# Test frontend build locally
cd client
npm run build

# Test backend locally
npm start
```

### **Step 2: Check Secrets**
1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Verify all required secrets are set
3. Check secret values are correct

### **Step 3: Test Minimal Workflow**
1. Use `simple-deploy.yml` workflow
2. Push to trigger deployment
3. Monitor GitHub Actions logs

### **Step 4: Debug Step by Step**
1. Start with build-and-test job only
2. Add frontend deployment
3. Add backend deployment
4. Monitor each step for errors

## 🔍 Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Process completed with exit code 249` | Build environment issue | Check Node version, dependencies |
| `Missing script: test` | No test script in package.json | Add test scripts or disable tests |
| `--service <SERVICE> required` | Railway service not specified | Set RAILWAY_SERVICE secret |
| `Unable to resolve action` | Action doesn't exist | Update action version or use alternative |

## 📞 Get Help

1. **Check GitHub Actions Logs** - Look for specific error messages
2. **Verify Local Build** - Ensure it works on your machine
3. **Check Secrets** - Verify all required secrets are set
4. **Use Simple Workflow** - Start with `simple-deploy.yml`
5. **Manual Deployment** - Deploy manually while fixing automation

## 🎯 Next Steps

1. **Immediate**: Use `simple-deploy.yml` workflow
2. **Short-term**: Fix missing secrets and test scripts
3. **Long-term**: Optimize and add advanced features

---

**Remember**: Start simple, get it working, then add complexity! 