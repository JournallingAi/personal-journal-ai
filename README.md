# Sans Journal - AI-Powered Personal Journaling App

A beautiful, modern journaling application that combines personal reflection with AI-powered life coaching advice. Built with React, Node.js, and Google Gemini AI.

## ✨ Features

- **Personal Journaling**: Write daily entries with mood tracking and tags
- **AI Life Coaching**: Get personalized advice and insights for each entry
- **Mood Analytics**: Track your emotional patterns over time
- **Beautiful UI**: Modern, responsive design with Material-UI
- **Insights Dashboard**: Review all your AI coaching advice in one place
- **Analytics**: View statistics about your journaling habits

## 🚀 Quick Start

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- Google Gemini API key (free)

### Installation

1. **Clone or download this project**
   ```bash
   cd sans-journal
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Set up environment variables**
   - Copy `env.example` to `.env`
   - Add your Gemini API key:
   ```bash
   cp env.example .env
   ```
   - Edit `.env` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

5. **Get a Google Gemini API Key (FREE)**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Create a new API key (completely free!)
   - Add it to your `.env` file

### Running the Application

1. **Start the backend server**
   ```bash
   npm run dev
   ```
   The server will run on `http://localhost:5000`

2. **Start the React frontend** (in a new terminal)
   ```bash
   npm run client
   ```
   The app will open in your browser at `http://localhost:3000`

## 📱 How to Use

### Writing Journal Entries
1. Navigate to the **Journal** tab
2. Write your thoughts in the text area
3. Select your current mood from the dropdown
4. Add relevant tags (optional)
5. Click "Save Entry"

### Getting AI Coaching
1. After saving an entry, click "Get AI Coaching"
2. The AI will analyze your entry and provide:
   - Personal reflection
   - Actionable advice
   - Positive affirmations
   - Self-reflection questions

### Viewing Insights
- Go to the **Insights** tab to see all your AI coaching advice
- Review patterns and growth over time

### Analytics
- Visit the **Analytics** tab to see:
  - Total entries and insights
  - Mood distribution
  - Recent activity
  - Journaling patterns

## 🛠️ Technology Stack

- **Frontend**: React 18, Material-UI, React Router
- **Backend**: Node.js, Express.js
- **AI**: OpenAI GPT-3.5-turbo
- **Data Storage**: JSON file (simple, beginner-friendly)
- **Styling**: Material-UI with custom theme

## 📁 Project Structure

```
sans-journal/
├── server.js              # Express server
├── package.json           # Backend dependencies
├── env.example           # Environment variables template
├── journal_data.json     # Data storage (created automatically)
├── client/               # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.js
│   │   │   ├── Journal.js
│   │   │   ├── Insights.js
│   │   │   └── Analytics.js
│   │   └── App.js
│   └── package.json
└── README.md
```

## 🔧 API Endpoints

- `GET /api/entries` - Get all journal entries
- `POST /api/entries` - Create a new entry
- `POST /api/coaching/:entryId` - Get AI coaching for an entry
- `GET /api/analytics/mood` - Get mood analytics
- `GET /api/insights` - Get entries with AI insights

## 🎨 Customization

### Changing Colors
Edit the theme in `client/src/App.js`:
```javascript
const theme = createTheme({
  palette: {
    primary: {
      main: '#6B73FF', // Change this color
    },
    secondary: {
      main: '#FF6B9D', // Change this color
    },
  },
});
```

### Adding New Moods
Edit the moods array in `client/src/components/Journal.js`:
```javascript
const moods = [
  '😊 Happy', '😔 Sad', '😤 Angry', '😰 Anxious', 
  '😴 Tired', '🤔 Contemplative', '😌 Peaceful', '😤 Frustrated',
  '😎 Confident', '🥰 Grateful' // Add new moods here
];
```

## 🚀 Deployment

### Heroku Deployment
1. Create a Heroku account
2. Install Heroku CLI
3. Run these commands:
   ```bash
   heroku create your-app-name
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```
4. Set environment variables in Heroku dashboard

### Local Production Build
```bash
cd client
npm run build
cd ..
npm start
```

## 🤝 Contributing

This is a learning project! Feel free to:
- Add new features
- Improve the UI/UX
- Fix bugs
- Add more AI coaching capabilities

## 📝 License

MIT License - feel free to use this project for learning and personal use.

## 🆘 Troubleshooting

### Common Issues

1. **"Failed to get coaching advice"**
   - Check your OpenAI API key in `.env`
   - Ensure you have credits in your OpenAI account

2. **"Failed to fetch entries"**
   - Make sure the backend server is running
   - Check that the server is on port 5000

3. **Frontend not connecting to backend**
   - Verify both servers are running
   - Check that the API_BASE_URL in components matches your backend URL

### Getting Help
- Check the browser console for errors
- Verify all dependencies are installed
- Ensure your OpenAI API key is valid

## 🎯 Next Steps

Once you're comfortable with this app, consider adding:
- User authentication
- Database integration (MongoDB, PostgreSQL)
- More advanced AI features
- Export functionality
- Mobile app version
- Social features

Happy journaling! 📖✨ 