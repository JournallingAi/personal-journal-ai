# 🚀 Complete Deployment Guide for AI Journaling App

This guide will walk you through deploying your AI journaling app using GitHub Actions to get a live domain.

## 🎯 Deployment Options

### **Option 1: Vercel (Frontend) + Railway (Backend) - RECOMMENDED**
- **Frontend**: Free hosting with custom domain support
- **Backend**: Free tier with 500 hours/month
- **Database**: JSON file storage (persistent)

### **Option 2: Vercel (Frontend) + Render (Backend)**
- **Frontend**: Free hosting with custom domain support
- **Backend**: Free tier with sleep after inactivity
- **Database**: JSON file storage (persistent)

### **Option 3: Netlify (Frontend) + Heroku (Backend)**
- **Frontend**: Free hosting with custom domain support
- **Backend**: Free tier (discontinued, but existing apps work)

## 🚀 Step-by-Step Deployment

### **Phase 1: Frontend Deployment (Vercel)**

#### 1.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" and choose "Continue with GitHub"
3. Authorize Vercel to access your GitHub account

#### 1.2 Create New Project
1. Click "New Project"
2. Import your GitHub repository: `JournallingAi/personal-journal-ai`
3. Set project name: `ai-journal-frontend`
4. Click "Deploy"

#### 1.3 Get Vercel Credentials
1. Go to **Settings** → **General**
2. Copy your **Project ID**
3. Go to **Settings** → **Tokens**
4. Create a new token and copy it
5. Go to **Settings** → **General**
6. Copy your **Team ID** (Organization ID)

#### 1.4 Configure Environment Variables
1. Go to **Settings** → **Environment Variables**
2. Add the following variables:
   ```
   REACT_APP_API_URL=https://your-backend-url.railway.app
   REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
   REACT_APP_GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

### **Phase 2: Backend Deployment (Railway)**

#### 2.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Click "Login with GitHub"
3. Authorize Railway to access your GitHub account

#### 2.2 Create New Project
1. Click "New Project"
2. Choose "Deploy from GitHub repo"
3. Select your repository: `JournallingAi/personal-journal-ai`
4. Set project name: `ai-journal-backend`

#### 2.3 Configure Backend
1. Railway will automatically detect it's a Node.js app
2. Go to **Variables** tab
3. Add the following environment variables:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   JWT_SECRET=your_jwt_secret_key
   SESSION_SECRET=your_session_secret
   PORT=5001
   NODE_ENV=production
   ```

#### 2.4 Deploy Backend
1. Railway will automatically deploy when you push to main branch
2. Wait for deployment to complete
3. Copy the generated URL (e.g., `https://ai-journal-backend-production.up.railway.app`)

#### 2.5 Update Frontend API URL
1. Go back to Vercel dashboard
2. Update `REACT_APP_API_URL` with your Railway backend URL
3. Redeploy the frontend

### **Phase 3: GitHub Actions Setup**

#### 3.1 Add GitHub Secrets
1. Go to your GitHub repository: `JournallingAi/personal-journal-ai`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Add the following secrets:

   **Vercel Secrets:**
   ```
   VERCEL_TOKEN=your_vercel_token
   VERCEL_ORG_ID=your_team_id
   VERCEL_PROJECT_ID=your_project_id
   ```

   **Railway Secrets:**
   ```
   RAILWAY_TOKEN=your_railway_token
   RAILWAY_SERVICE=ai-journal-backend
   ```

#### 3.2 Get Railway Token
1. Go to Railway dashboard
2. Click your profile → **Account Settings**
3. Go to **Tokens** tab
4. Create a new token and copy it

#### 3.3 Test GitHub Actions
1. Make a small change to your code
2. Commit and push to main branch
3. Go to **Actions** tab in GitHub
4. Watch the deployment workflow run

### **Phase 4: Custom Domain Setup**

#### 4.1 Frontend Domain (Vercel)
1. Go to Vercel dashboard → **Settings** → **Domains**
2. Click "Add Domain"
3. Enter your domain (e.g., `journal.yourdomain.com`)
4. Follow DNS configuration instructions
5. Wait for DNS propagation (up to 48 hours)

#### 4.2 Backend Domain (Railway)
1. Go to Railway dashboard → **Settings** → **Domains**
2. Add custom domain if needed
3. Update frontend environment variable with new backend URL

## 🔧 Configuration Files

The following files have been created for you:

### **GitHub Actions Workflow** (`.github/workflows/deploy.yml`)
- Automatically deploys frontend to Vercel
- Automatically deploys backend to Railway
- Runs tests before deployment

### **Vercel Configuration** (`client/vercel.json`)
- Build configuration for React app
- Route handling for SPA
- Environment variable configuration

### **Railway Configuration** (`railway.json`)
- Backend deployment settings
- Health check configuration
- Restart policy

### **Docker Configuration** (`Dockerfile`, `.dockerignore`)
- Containerization support
- Alternative deployment option

## 🧪 Testing Your Deployment

### **1. Check Backend Health**
```bash
curl https://your-backend.railway.app/api/health
```

### **2. Test Frontend**
- Open your Vercel URL
- Try to create an account
- Test journal entry creation
- Verify AI insights are working

### **3. Monitor Logs**
- **Vercel**: Dashboard → Functions → View logs
- **Railway**: Dashboard → Deployments → View logs

## 🚨 Troubleshooting

### **Common Issues:**

#### **Frontend Build Fails**
- Check if all dependencies are in `package.json`
- Verify environment variables are set
- Check build logs in Vercel dashboard

#### **Backend Deployment Fails**
- Verify all environment variables are set in Railway
- Check if port 5001 is available
- Review Railway deployment logs

#### **API Connection Issues**
- Verify `REACT_APP_API_URL` is correct
- Check CORS settings in backend
- Ensure backend is running and accessible

#### **Environment Variables Not Working**
- Redeploy after adding new variables
- Check variable names match exactly
- Verify variables are set in correct environment

## 📱 Mobile App Deployment

### **PWA Features**
Your app already includes PWA features:
- Service worker for offline functionality
- App manifest for mobile installation
- Responsive design for all devices

### **App Store Deployment**
- **iOS**: Use Expo or React Native
- **Android**: Use Expo or React Native
- **Web App**: Already PWA-ready

## 🔒 Security Considerations

### **Environment Variables**
- Never commit API keys to GitHub
- Use GitHub Secrets for sensitive data
- Rotate API keys regularly

### **HTTPS**
- Vercel and Railway provide HTTPS by default
- Custom domains should also use HTTPS
- Update Google OAuth redirect URIs

### **CORS Settings**
- Configure CORS to only allow your frontend domain
- Remove development CORS settings in production

## 📊 Monitoring & Analytics

### **Vercel Analytics**
- Built-in performance monitoring
- Real user metrics
- Error tracking

### **Railway Monitoring**
- Resource usage tracking
- Deployment history
- Log aggregation

## 🎉 Success!

Once deployed, your app will be available at:
- **Frontend**: `https://your-domain.vercel.app`
- **Backend**: `https://your-backend.railway.app`

### **Next Steps:**
1. Test all functionality thoroughly
2. Set up monitoring and alerts
3. Configure custom domain
4. Set up SSL certificates
5. Monitor performance and usage

---

**Need Help?** Create an issue in the GitHub repository or check the deployment logs for specific error messages. 