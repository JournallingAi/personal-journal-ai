# AI-Powered Personal Journaling App

A comprehensive AI-powered personal journaling application with life coaching advice, built with React, Node.js, and AI integration.

## 🚀 Features

- **AI-Powered Insights**: Get personalized coaching advice based on your journal entries
- **Mood Tracking**: Track your emotional well-being over time
- **Secure Authentication**: Phone number/OTP and Google OAuth support
- **Profile Management**: Comprehensive user profile system
- **Responsive Design**: Beautiful Material-UI interface
- **Real-time Updates**: Instant feedback and insights

## 🛠️ Tech Stack

- **Frontend**: React 19, Material-UI, Emotion
- **Backend**: Node.js, Express.js
- **AI Integration**: Google Gemini AI, OpenAI
- **Authentication**: JWT, Google OAuth
- **Database**: JSON file-based storage
- **Deployment**: GitHub Actions, Vercel, Railway

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Google Gemini AI API key
- OpenAI API key (optional)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/JournallingAi/personal-journal-ai.git
   cd personal-journal-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd client && npm install
   cd ..
   ```

3. **Environment setup**
   ```bash
   cp env.example .env
   # Edit .env with your API keys
   ```

4. **Start development servers**
   ```bash
   # Terminal 1: Backend
   npm run dev
   
   # Terminal 2: Frontend
   npm run client
   ```

## 🚀 Deployment

### GitHub Actions Setup

This project uses GitHub Actions for automated deployment to Vercel (frontend) and Railway (backend).

#### 1. Frontend Deployment (Vercel)

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Create a new project

2. **Get Vercel Credentials**
   - Go to Vercel Dashboard → Settings → Tokens
   - Create a new token
   - Copy your Organization ID and Project ID

3. **Add GitHub Secrets**
   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `VERCEL_TOKEN`: Your Vercel token
     - `VERCEL_ORG_ID`: Your Vercel organization ID
     - `VERCEL_PROJECT_ID`: Your Vercel project ID

#### 2. Backend Deployment (Railway)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub
   - Create a new project

2. **Get Railway Token**
   - Go to Railway Dashboard → Account → Tokens
   - Create a new token

3. **Add GitHub Secrets**
   - Add to your GitHub repository secrets:
     - `RAILWAY_TOKEN`: Your Railway token
     - `RAILWAY_SERVICE`: Your Railway service name

#### 3. Environment Variables

**Frontend (Vercel)**
- `REACT_APP_API_URL`: Your Railway backend URL
- `REACT_APP_GOOGLE_CLIENT_ID`: Google OAuth client ID
- `REACT_APP_GOOGLE_CLIENT_SECRET`: Google OAuth client secret

**Backend (Railway)**
- `GEMINI_API_KEY`: Your Google Gemini AI API key
- `OPENAI_API_KEY`: Your OpenAI API key (optional)
- `JWT_SECRET`: JWT signing secret
- `SESSION_SECRET`: Session encryption secret

### Manual Deployment

#### Option 1: Vercel + Railway (Recommended)

1. **Deploy Backend to Railway**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and deploy
   railway login
   railway up
   ```

2. **Deploy Frontend to Vercel**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy from client directory
   cd client
   vercel --prod
   ```

#### Option 2: Heroku

1. **Create Heroku app**
   ```bash
   heroku create your-journal-app
   ```

2. **Deploy**
   ```bash
   git push heroku main
   ```

#### Option 3: DigitalOcean App Platform

1. **Create app in DigitalOcean dashboard**
2. **Connect GitHub repository**
3. **Configure build settings**
4. **Deploy automatically**

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# AI Services
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

# Authentication
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret

# Server
PORT=5001
NODE_ENV=development

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### API Endpoints

- `POST /api/entries` - Create journal entry
- `GET /api/entries` - Get user's journal entries
- `POST /api/mood-followup/:entryId` - Submit mood follow-up
- `POST /api/ai-coaching` - Get AI coaching advice
- `POST /api/auth/phone` - Phone authentication
- `POST /api/auth/verify-otp` - OTP verification
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

## 📱 Usage

1. **Sign up/Login** using phone number or Google account
2. **Write journal entries** about your day, thoughts, or feelings
3. **Get AI insights** and personalized coaching advice
4. **Track your mood** and emotional patterns
5. **Manage your profile** and preferences

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI for intelligent insights
- Material-UI for beautiful components
- React community for excellent tooling
- OpenAI for additional AI capabilities

## 📞 Support

For support, email support@yourjournal.com or create an issue in this repository.

---

**Made with ❤️ for better mental health and personal growth** 