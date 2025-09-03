const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());
app.use(session({
  secret: JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Serve static files only in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
}

// Initialize Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'demo-key');

// Data storage (simple JSON file for beginners)
const DATA_FILE = 'journal_data.json';

// Helper function to read data
async function readData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return default structure
    return { entries: [], insights: [] };
  }
}

// Helper function to write data
async function writeData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// Authentication helper functions
async function readUsers() {
  try {
    const data = await fs.readFile('users_data.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { users: [] };
  }
}

async function writeUsers(data) {
  await fs.writeFile('users_data.json', JSON.stringify(data, null, 2));
}

// Normalize phone numbers to digits-only so the same number maps to the same user
function normalizePhoneNumber(phoneNumber) {
  return (phoneNumber || '')
    .toString()
    .trim()
    .replace(/[^0-9]/g, '');
}

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map();

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Enhanced Pattern Analysis Functions
const analyzePersonalPatterns = (allEntries, currentEntry) => {
  const negativeMoods = ['😰 Anxious', '😢 Crying', '😤 Frustrated', '😡 Angry', 'Sad'];
  const isNegativeMood = negativeMoods.some(mood => currentEntry.mood.includes(mood));
  
  // Find similar past entries
  const similarEntries = allEntries.filter(entry => {
    // Match by mood type
    const moodMatch = entry.mood === currentEntry.mood;
    
    // Match by tags
    const tagMatch = entry.tags && currentEntry.tags && 
      entry.tags.some(tag => currentEntry.tags.includes(tag));
    
    // Match by content keywords
    const contentKeywords = extractKeywords(currentEntry.content);
    const entryKeywords = extractKeywords(entry.content);
    const keywordMatch = contentKeywords.some(keyword => 
      entryKeywords.includes(keyword)
    );
    
    return (moodMatch || tagMatch || keywordMatch) && entry.moodFollowUp;
  });
  
  // Analyze coping strategies effectiveness
  const copingAnalysis = analyzeCopingStrategies(similarEntries);
  
  // Calculate personal difficulty score
  const difficultyScore = calculatePersonalDifficulty(currentEntry, similarEntries);
  
  return {
    similarEntries,
    copingAnalysis,
    difficultyScore,
    isNegativeMood,
    personalPatterns: extractPersonalPatterns(similarEntries)
  };
};

const extractKeywords = (content) => {
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'];
  
  return content.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.includes(word));
};

const analyzeCopingStrategies = (entries) => {
  const strategies = {};
  
  entries.forEach(entry => {
    if (entry.moodFollowUp?.what_helped) {
      const strategy = entry.moodFollowUp.what_helped.toLowerCase();
      const success = entry.moodFollowUp.feeling_better === 'yes';
      
      if (!strategies[strategy]) {
        strategies[strategy] = { count: 0, successes: 0 };
      }
      strategies[strategy].count++;
      if (success) strategies[strategy].successes++;
    }
  });
  
  // Calculate effectiveness scores
  Object.keys(strategies).forEach(strategy => {
    strategies[strategy].effectiveness = 
      (strategies[strategy].successes / strategies[strategy].count) * 10;
  });
  
  return strategies;
};

const calculatePersonalDifficulty = (currentEntry, similarEntries) => {
  if (similarEntries.length === 0) return 5; // Neutral if no similar experiences
  
  const successRate = similarEntries.filter(entry => 
    entry.moodFollowUp?.feeling_better === 'yes'
  ).length / similarEntries.length;
  
  // Lower success rate = higher difficulty
  const baseDifficulty = (1 - successRate) * 10;
  
  // Adjust based on emotional intensity keywords
  const intensityKeywords = ['very', 'extremely', 'terribly', 'awfully', 'completely'];
  const intensityMultiplier = intensityKeywords.some(keyword => 
    currentEntry.content.toLowerCase().includes(keyword)
  ) ? 1.3 : 1;
  
  return Math.min(10, Math.max(1, baseDifficulty * intensityMultiplier));
};

const extractPersonalPatterns = (entries) => {
  const patterns = {
    commonTriggers: {},
    effectiveStrategies: [],
    recoveryPatterns: {},
    emotionalIntensity: 0
  };
  
  // Analyze triggers
  entries.forEach(entry => {
    const keywords = extractKeywords(entry.content);
    keywords.forEach(keyword => {
      patterns.commonTriggers[keyword] = (patterns.commonTriggers[keyword] || 0) + 1;
    });
  });
  
  // Get most effective strategies
  const strategies = analyzeCopingStrategies(entries);
  patterns.effectiveStrategies = Object.entries(strategies)
    .filter(([_, data]) => data.effectiveness >= 7)
    .sort((a, b) => b[1].effectiveness - a[1].effectiveness)
    .slice(0, 3)
    .map(([strategy, _]) => strategy);
  
  return patterns;
};

// Enhanced Personalized AI Prompt Engineering
const generatePersonalizedPrompt = (currentEntry, patternAnalysis) => {
  const { similarEntries, copingAnalysis, personalPatterns } = patternAnalysis;
  
  let prompt = `You are a highly personalized AI coach analyzing this specific user's journal entry. 

CURRENT ENTRY:
Content: "${currentEntry.content}"
Mood: ${currentEntry.mood}
Tags: ${currentEntry.tags?.join(', ') || 'None'}

PERSONAL PATTERN ANALYSIS:
- User has ${similarEntries.length} similar past experiences
- Most effective coping strategies: ${personalPatterns.effectiveStrategies.join(', ')}
- Common triggers: ${Object.keys(personalPatterns.commonTriggers).slice(0, 5).join(', ')}

PAST SUCCESSFUL STRATEGIES (ranked by effectiveness):
${Object.entries(copingAnalysis)
  .filter(([_, data]) => data.effectiveness >= 6)
  .sort((a, b) => b[1].effectiveness - a[1].effectiveness)
  .slice(0, 5)
  .map(([strategy, data]) => `- "${strategy}" (${data.effectiveness.toFixed(1)}/10 effectiveness, used ${data.count} times)`)
  .join('\n')}

SIMILAR PAST EXPERIENCES:
${similarEntries.slice(0, 3).map(entry => 
  `- "${entry.content}" (${entry.mood}) - What helped: "${entry.moodFollowUp?.what_helped || 'Not specified'}" - Felt better: ${entry.moodFollowUp?.feeling_better || 'Unknown'}`
).join('\n')}

INSTRUCTIONS:
1. **Personalized Reflection**: Connect this current situation to their past patterns
2. **Evidence-Based Advice**: Recommend strategies that have worked for them before
3. **Pattern Recognition**: Point out any recurring themes in their emotional responses
4. **Personalized Action Plan**: Create specific, actionable steps based on their successful past strategies
5. **Empowerment**: Acknowledge their growth and learning from past experiences

Provide a structured response with:
**Personal Pattern Recognition**
**Evidence-Based Personalized Advice** 
**Actionable Steps Based on Your History**
**Positive Affirmation Based on Your Growth**`;

  return prompt;
};

// Enhanced Capability Assessment Prompt
const generateCapabilityAssessmentPrompt = (currentEntry, patternAnalysis) => {
  const { difficultyScore, similarEntries, copingAnalysis } = patternAnalysis;
  
  let prompt = `You are analyzing this user's personal capability to handle their current situation based on their unique history.

CURRENT SITUATION:
Content: "${currentEntry.content}"
Mood: ${currentEntry.mood}
Tags: ${currentEntry.tags?.join(', ') || 'None'}

PERSONAL DIFFICULTY ANALYSIS:
- Calculated Difficulty Score: ${difficultyScore.toFixed(1)}/10
- Similar Past Experiences: ${similarEntries.length}
- Success Rate with Similar Issues: ${similarEntries.length > 0 ? 
    ((similarEntries.filter(e => e.moodFollowUp?.feeling_better === 'yes').length / similarEntries.length) * 100).toFixed(1) : 'N/A'}%

PERSONAL CAPABILITY FACTORS:
${similarEntries.length > 0 ? `
- Your proven coping strategies: ${Object.keys(copingAnalysis).slice(0, 3).join(', ')}
- Your emotional recovery patterns: Based on ${similarEntries.length} similar experiences
- Your growth indicators: ${similarEntries.filter(e => e.moodFollowUp?.feeling_better === 'yes').length} successful recoveries` : 
  '- No similar past experiences found (this is a new challenge for you)'}

INSTRUCTIONS:
Provide a detailed, personalized capability assessment including:

**Personal Difficulty Breakdown** (Why this specific situation is challenging for YOU)
**Your Proven Strengths** (What has worked for you in similar situations)
**Personal Growth Indicators** (How you've improved over time)
**Specific Capability Factors** (Your unique patterns and abilities)
**Personalized Confidence Level** (Based on your history, not generic advice)

Make this assessment deeply personal and specific to this user's patterns, not generic advice.`;

  return prompt;
};

// API Routes

// Authentication endpoints
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber || phoneNumber.length < 10) {
      return res.status(400).json({ error: 'Valid phone number required' });
    }

    const normalized = normalizePhoneNumber(phoneNumber);
    const otp = generateOTP();
    otpStore.set(normalized, { otp, timestamp: Date.now() });

    // In production, integrate with SMS service like Twilio
    console.log(`OTP for ${normalized}: ${otp}`);

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    const normalized = normalizePhoneNumber(phoneNumber);
    const storedOTP = otpStore.get(normalized);
    if (!storedOTP || storedOTP.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Check if OTP is expired (5 minutes)
    if (Date.now() - storedOTP.timestamp > 5 * 60 * 1000) {
      otpStore.delete(normalized);
      return res.status(400).json({ error: 'OTP expired' });
    }

    // Get or create user (by normalized phone)
    const usersData = await readUsers();
    let user = usersData.users.find(u => normalizePhoneNumber(u.phoneNumber) === normalized);

    if (!user) {
      user = {
        id: Date.now().toString(),
        phoneNumber: normalized,
        createdAt: new Date().toISOString(),
        journalEntries: []
      };
      usersData.users.push(user);
      await writeUsers(usersData);
    } else {
      // Merge duplicate users with the same normalized phone into this one and reassign entries
      const duplicates = usersData.users.filter(u => normalizePhoneNumber(u.phoneNumber) === normalized && u.id !== user.id);
      if (duplicates.length > 0) {
        const data = await readData();
        for (const dup of duplicates) {
          // Reassign entries from duplicate userId to the primary user's id
          for (const entry of data.entries) {
            if (entry.userId === dup.id) {
              entry.userId = user.id;
            }
          }
          // Remove duplicate user from users list
          const idx = usersData.users.findIndex(u => u.id === dup.id);
          if (idx !== -1) usersData.users.splice(idx, 1);
        }
        await writeData(data);
        await writeUsers(usersData);
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, phoneNumber: user.phoneNumber },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    otpStore.delete(normalized);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

app.post('/api/auth/google', async (req, res) => {
  try {
    const { googleToken, userInfo } = req.body;
    
    // In production, verify the Google token with Google's API
    // For now, we'll trust the frontend token
    
    const usersData = await readUsers();
    let user = usersData.users.find(u => u.googleId === userInfo.googleId);
    
    if (!user) {
      user = {
        id: Date.now().toString(),
        googleId: userInfo.googleId,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        createdAt: new Date().toISOString(),
        journalEntries: []
      };
      usersData.users.push(user);
      await writeUsers(usersData);
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, googleId: user.googleId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to authenticate with Google' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const usersData = await readUsers();
    const user = usersData.users.find(u => u.id === req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      phoneNumber: user.phoneNumber,
      email: user.email,
      name: user.name,
      picture: user.picture,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// Profile management endpoints
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const usersData = await readUsers();
    const user = usersData.users.find(u => u.id === req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      phoneNumber: user.phoneNumber,
      email: user.email,
      name: user.name,
      picture: user.picture,
      dateOfBirth: user.dateOfBirth,
      location: user.location,
      occupation: user.occupation,
      education: user.education,
      bio: user.bio,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, dateOfBirth, location, occupation, education, bio } = req.body;
    
    const usersData = await readUsers();
    const userIndex = usersData.users.findIndex(u => u.id === req.user.userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update user profile
    usersData.users[userIndex] = {
      ...usersData.users[userIndex],
      name: name || usersData.users[userIndex].name,
      email: email || usersData.users[userIndex].email,
      phone: phone || usersData.users[userIndex].phone,
      dateOfBirth: dateOfBirth || usersData.users[userIndex].dateOfBirth,
      location: location || usersData.users[userIndex].location,
      occupation: occupation || usersData.users[userIndex].occupation,
      education: education || usersData.users[userIndex].education,
      bio: bio || usersData.users[userIndex].bio
    };
    
    await writeUsers(usersData);
    
    res.json({
      id: usersData.users[userIndex].id,
      phoneNumber: usersData.users[userIndex].phoneNumber,
      email: usersData.users[userIndex].email,
      name: usersData.users[userIndex].name,
      picture: usersData.users[userIndex].picture,
      dateOfBirth: usersData.users[userIndex].dateOfBirth,
      location: usersData.users[userIndex].location,
      occupation: usersData.users[userIndex].occupation,
      education: usersData.users[userIndex].education,
      bio: usersData.users[userIndex].bio,
      createdAt: usersData.users[userIndex].createdAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.delete('/api/auth/account', authenticateToken, async (req, res) => {
  try {
    const usersData = await readUsers();
    const userIndex = usersData.users.findIndex(u => u.id === req.user.userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove user from users array
    usersData.users.splice(userIndex, 1);
    await writeUsers(usersData);
    
    // Also remove user's journal entries
    try {
      const journalData = await readData();
      journalData.entries = journalData.entries.filter(entry => entry.userId !== req.user.userId);
      await writeData(journalData);
    } catch (journalError) {
      console.error('Error removing journal entries:', journalError);
    }
    
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Get all journal entries
app.get('/api/entries', authenticateToken, async (req, res) => {
  try {
    const data = await readData();
    // Filter entries for the authenticated user
    const userEntries = data.entries.filter(entry => entry.userId === req.user.userId);
    res.json(userEntries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// Create a new journal entry
app.post('/api/entries', authenticateToken, async (req, res) => {
  try {
    const { content, mood, tags } = req.body;
    const data = await readData();
    
    const newEntry = {
      id: Date.now().toString(),
      userId: req.user.userId,
      content,
      mood,
      tags: tags || [],
      timestamp: new Date().toISOString(),
      aiInsight: null
    };
    
    data.entries.unshift(newEntry);
    await writeData(data);
    
    res.json(newEntry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

// Delete a journal entry
app.delete('/api/entries/:entryId', authenticateToken, async (req, res) => {
  try {
    const { entryId } = req.params;
    const data = await readData();
    
    const entryIndex = data.entries.findIndex(e => 
      (e.id === entryId || e.id === parseInt(entryId)) && e.userId === req.user.userId
    );
    
    if (entryIndex === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    // Remove the entry from the array
    data.entries.splice(entryIndex, 1);
    await writeData(data);
    
    res.json({ success: true, message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Delete entry error:', error);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// AI coaching endpoint (Generic responses)
app.post('/api/coaching/:entryId', async (req, res) => {
  try {
    const { entryId } = req.params;
    const data = JSON.parse(await fs.readFile('journal_data.json', 'utf8'));
    const entries = data.entries || [];
    const entry = entries.find(e => e.id === entryId || e.id === parseInt(entryId));
    
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // Create a fallback response when AI is not available
    const fallbackResponse = `**Reflection:** Take a moment to reflect on what's happening in your life right now. What emotions are you experiencing?

**Practice Self-Compassion:** Be kind to yourself. Remember that it's okay to have difficult days and challenging emotions.

**Actionable Advice:** Consider what small step you could take today to move forward. Even tiny progress counts.

**Positive Affirmation:** You are stronger than you think, and you have the power to create positive change in your life.`;

    let coachingAdvice;
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `You are a compassionate life coach. The person has shared this journal entry:

"${entry.content}"
Mood: ${entry.mood}
Tags: ${entry.tags?.join(', ') || 'None'}

Please provide thoughtful, encouraging advice with these sections:
**Reflection** - Acknowledge their feelings and situation
**Practice Self-Compassion** - Encourage self-kindness
**Actionable Advice** - Give 2-3 specific, practical steps they can take
**Positive Affirmation** - End with an empowering message

Keep it warm, practical, and supportive.`;

      const result = await model.generateContent(prompt);
      coachingAdvice = result.response.text();
    } catch (aiError) {
      console.log('AI service unavailable, using fallback response');
      coachingAdvice = fallbackResponse;
    }
    
    // Update the entry with the insight
    entry.aiInsight = coachingAdvice;
    
    // Save the updated data
    await fs.writeFile('journal_data.json', JSON.stringify(data, null, 2));
    
    res.json({ coachingAdvice });
  } catch (error) {
    console.error('Coaching error:', error);
    res.status(500).json({ error: 'Failed to get coaching advice' });
  }
});

// Handle follow-up questions
app.post('/api/coaching/:entryId/followup', async (req, res) => {
  try {
    const { entryId } = req.params;
    const { question } = req.body;
    const data = await readData();
    const entry = data.entries.find(e => e.id === entryId);
    
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    // Create follow-up prompt
    const prompt = `You are a compassionate life coach having a conversation with someone who just shared this journal entry:

Original Journal Entry: "${entry.content}"
Original AI Insight: "${entry.aiInsight}"

The person is now asking this follow-up question: "${question}"

Please provide a thoughtful, encouraging response that builds on your previous insight. Keep it warm, practical, and supportive. IMPORTANT: Keep your response concise (2-3 sentences maximum) and easy to read with proper line breaks.`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const followUpResponse = result.response.text();
    
    res.json({ followUpResponse });
  } catch (error) {
    console.error('Follow-up Error:', error);
    
    // Handle API errors
    if (error.message && error.message.includes('API_KEY')) {
      res.status(401).json({ 
        error: 'AI service not configured. Please set up your Gemini API key.',
        details: 'Get a free API key from https://makersuite.google.com/app/apikey'
      });
    } else {
      res.status(500).json({ error: 'Failed to send follow-up question. Please try again.' });
    }
  }
});

// Mood follow-up endpoint
app.post('/api/mood-followup/:entryId', async (req, res) => {
  try {
    const { entryId } = req.params;
    const { question, answer } = req.body;
    
    // Read current entries
    const data = JSON.parse(await fs.readFile('journal_data.json', 'utf8'));
    const entries = data.entries || [];
    const entry = entries.find(e => e.id === entryId || e.id === parseInt(entryId));
    
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    // Store the follow-up response
    if (!entry.moodFollowUp) {
      entry.moodFollowUp = {};
    }
    entry.moodFollowUp[question] = answer;
    
    // Save back to file
    await fs.writeFile('journal_data.json', JSON.stringify(data, null, 2));
    
    res.json({ success: true, message: 'Follow-up response saved' });
  } catch (error) {
    console.error('Mood follow-up error:', error);
    res.status(500).json({ error: 'Failed to save follow-up response' });
  }
});

// Personalized coaching endpoint (Enhanced personalized responses)
app.post('/api/personalized-coaching/:entryId', async (req, res) => {
  try {
    const { entryId } = req.params;
    
    // Read current entries
    const data = JSON.parse(await fs.readFile('journal_data.json', 'utf8'));
    const entries = data.entries || [];
    const entry = entries.find(e => e.id === entryId || e.id === parseInt(entryId));
    
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // Enhanced: Analyze personal patterns
    const patternAnalysis = analyzePersonalPatterns(entries, entry);
    
    // Generate personalized prompt
    const personalizedPrompt = generatePersonalizedPrompt(entry, patternAnalysis);
    
    let personalizedAdvice;
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(personalizedPrompt);
      personalizedAdvice = result.response.text();
    } catch (aiError) {
      console.log('AI service unavailable, using enhanced fallback personalized response');
      
      // Enhanced fallback based on personal patterns
      const { similarEntries, copingAnalysis, personalPatterns } = patternAnalysis;
      
      if (similarEntries.length > 0) {
        const topStrategies = Object.entries(copingAnalysis)
          .filter(([_, data]) => data.effectiveness >= 6)
          .sort((a, b) => b[1].effectiveness - a[1].effectiveness)
          .slice(0, 3);
        
        personalizedAdvice = `**Personal Pattern Recognition:**
I notice you've faced similar challenges before. Based on your ${similarEntries.length} similar experiences, I can see patterns in how you respond to situations like this.

**Evidence-Based Personalized Advice:**
Your most effective strategies in similar situations have been:
${topStrategies.map(([strategy, data]) => 
  `- "${strategy}" (${data.effectiveness.toFixed(1)}/10 effectiveness)`
).join('\n')}

**Actionable Steps Based on Your History:**
1. Try the strategies that have worked for you before
2. Remember that you've successfully navigated similar challenges ${similarEntries.filter(e => e.moodFollowUp?.feeling_better === 'yes').length} times
3. Trust your proven coping mechanisms

**Positive Affirmation Based on Your Growth:**
You've shown resilience and growth through similar experiences. Your past successes prove you have the capability to handle this challenge.`;
      } else {
        personalizedAdvice = `**Personal Pattern Recognition:**
This appears to be a new type of challenge for you, which is completely normal and part of growth.

**Evidence-Based Personalized Advice:**
Since this is a new situation, let's approach it with curiosity and self-compassion.

**Actionable Steps Based on Your History:**
1. Start with small, manageable steps
2. Be patient with yourself as you learn
3. Remember that every challenge is an opportunity for growth

**Positive Affirmation Based on Your Growth:**
Your willingness to face new challenges shows courage and a growth mindset.`;
      }
    }
    
    // Update the entry with the personalized insight
    entry.aiInsight = personalizedAdvice;
    
    // Save the updated data
    await fs.writeFile('journal_data.json', JSON.stringify(data, null, 2));
    
    res.json({ coachingAdvice: personalizedAdvice });
  } catch (error) {
    console.error('Personalized coaching error:', error);
    res.status(500).json({ error: 'Failed to get personalized coaching advice' });
  }
});

// Capability assessment endpoint
app.post('/api/capability-assessment/:entryId', async (req, res) => {
  try {
    const { entryId } = req.params;
    
    // Read current entries
    const data = JSON.parse(await fs.readFile('journal_data.json', 'utf8'));
    const entries = data.entries || [];
    const entry = entries.find(e => e.id === entryId || e.id === parseInt(entryId));
    
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    // Enhanced: Analyze personal patterns
    const patternAnalysis = analyzePersonalPatterns(entries, entry);
    
    // Check if entry has negative emotions (only show for negative moods)
    if (!patternAnalysis.isNegativeMood) {
      return res.status(400).json({ 
        error: 'Capability assessment is only available for entries with negative emotions (anxious, frustrated, sad, angry, etc.)' 
      });
    }
    
    // Generate personalized capability assessment prompt
    const capabilityPrompt = generateCapabilityAssessmentPrompt(entry, patternAnalysis);
    
    let assessmentResult;
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(capabilityPrompt);
      assessmentResult = result.response.text();
    } catch (aiError) {
      console.log('AI service unavailable, using enhanced fallback capability assessment');
      
      // Enhanced fallback based on personal patterns
      const { difficultyScore, similarEntries, copingAnalysis } = patternAnalysis;
      
      if (similarEntries.length > 0) {
        const successRate = (similarEntries.filter(e => e.moodFollowUp?.feeling_better === 'yes').length / similarEntries.length) * 100;
        const topStrategies = Object.entries(copingAnalysis)
          .filter(([_, data]) => data.effectiveness >= 6)
          .sort((a, b) => b[1].effectiveness - a[1].effectiveness)
          .slice(0, 3);
        
        assessmentResult = `**Personal Difficulty Breakdown:**
Based on your ${similarEntries.length} similar past experiences, this situation has a difficulty score of ${difficultyScore.toFixed(1)}/10 for you personally.

**Your Proven Strengths:**
You've successfully handled similar challenges ${similarEntries.filter(e => e.moodFollowUp?.feeling_better === 'yes').length} times (${successRate.toFixed(1)}% success rate). Your most effective strategies:
${topStrategies.map(([strategy, data]) => 
  `- "${strategy}" (${data.effectiveness.toFixed(1)}/10 effectiveness)`
).join('\n')}

**Personal Growth Indicators:**
- You've faced ${similarEntries.length} similar challenges
- You've developed ${topStrategies.length} proven coping strategies
- Your success rate shows resilience and growth

**Specific Capability Factors:**
- Emotional resilience: ${successRate >= 70 ? 'High' : successRate >= 40 ? 'Moderate' : 'Developing'}
- Strategy effectiveness: ${topStrategies.length > 0 ? 'Strong' : 'Developing'}
- Pattern recognition: ${similarEntries.length > 2 ? 'Good' : 'Learning'}

**Personalized Confidence Level:**
Based on your history, you have a ${successRate >= 70 ? 'high' : successRate >= 40 ? 'moderate' : 'developing'} confidence level for handling this type of challenge.`;
      } else {
        assessmentResult = `**Personal Difficulty Breakdown:**
This appears to be a new type of challenge for you, which is completely normal. Without similar past experiences, the difficulty is unknown but manageable.

**Your Proven Strengths:**
- You're willing to face new challenges (growth mindset)
- You have general coping skills from other life experiences
- You're actively seeking support and self-reflection

**Personal Growth Indicators:**
- This is a new learning opportunity
- Your journaling shows self-awareness
- You're taking proactive steps to understand yourself

**Specific Capability Factors:**
- Adaptability: High (facing new challenges)
- Self-awareness: Good (journaling regularly)
- Growth mindset: Strong (seeking understanding)

**Personalized Confidence Level:**
While this is a new challenge, your willingness to face it and seek understanding shows strong personal capability. Start with small steps and trust your ability to learn and grow.`;
      }
    }
    
    res.json({ 
      capabilityScore: patternAnalysis.difficultyScore,
      assessment: assessmentResult,
      patternAnalysis: {
        similarExperiences: patternAnalysis.similarEntries.length,
        successRate: patternAnalysis.similarEntries.length > 0 ? 
          (patternAnalysis.similarEntries.filter(e => e.moodFollowUp?.feeling_better === 'yes').length / patternAnalysis.similarEntries.length) * 100 : 0,
        effectiveStrategies: Object.keys(patternAnalysis.copingAnalysis).slice(0, 3)
      }
    });
  } catch (error) {
    console.error('Capability assessment error:', error);
    res.status(500).json({ error: 'Failed to get capability assessment' });
  }
});

// Get mood analytics
app.get('/api/analytics/mood', async (req, res) => {
  try {
    const data = await readData();
    const moodCounts = {};
    
    data.entries.forEach(entry => {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    });
    
    res.json(moodCounts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch mood analytics' });
  }
});

// Get recent insights
app.get('/api/insights', async (req, res) => {
  try {
    const data = await readData();
    const entriesWithInsights = data.entries.filter(entry => entry.aiInsight);
    res.json(entriesWithInsights.slice(0, 5)); // Last 5 insights
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

// Serve React app (only in production)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
} else {
  // In development, redirect to React dev server
  app.get('/', (req, res) => {
    res.redirect('http://localhost:3000');
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 