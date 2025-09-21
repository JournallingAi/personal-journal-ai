const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const { initDatabase, db } = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://personal-journal-ai-frontend.vercel.app', 'https://personal-journal-ai.vercel.app'] 
    : 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());
app.use(session({
  secret: JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not Set'
  });
});

// Test endpoint for debugging
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not Set',
    nodeEnv: process.env.NODE_ENV || 'development'
  });
});

// Serve static files only in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
}

// Initialize Google Gemini
const GEMINI_API_KEY = 'AIzaSyD6KaISP10hTrRPAVCRHMlvDlWDnepwlDQ';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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

// Store OTPs in database for production (with in-memory fallback)
const { pool } = require('./database');
const otpStore = new Map(); // Fallback for when database is not available

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

// Enhanced Pattern Analysis Functions - REBUILT FOR AUTHENTICITY
const analyzePersonalPatterns = (allEntries, currentEntry) => {
  const negativeMoods = ['😰 Anxious', '😢 Crying', '😤 Frustrated', '😡 Angry', 'Sad'];
  const isNegativeMood = negativeMoods.some(mood => currentEntry.mood.includes(mood));
  
  // Find similar past entries based on REAL SITUATIONS, not just mood labels
  const similarEntries = findSimilarSituations(allEntries, currentEntry);
  
  // Analyze coping strategies effectiveness from ACTUAL journal content
  const copingAnalysis = analyzeCopingStrategiesFromContent(similarEntries);
  
  // Calculate personal difficulty score based on REAL success patterns
  const difficultyScore = calculatePersonalDifficultyFromHistory(currentEntry, similarEntries);
  
  // Extract REAL personal patterns from journal content
  const personalPatterns = extractRealPersonalPatterns(similarEntries, currentEntry);
  
  return {
    similarEntries,
    copingAnalysis,
    difficultyScore,
    isNegativeMood,
    personalPatterns
  };
};

// Find similar situations by analyzing ACTUAL journal content and context
const findSimilarSituations = (allEntries, currentEntry) => {
  const currentContext = analyzeEntryContext(currentEntry);
  
  return allEntries.filter(entry => {
    if (!entry.moodFollowUp || entry.id === currentEntry.id) return false;
    
    const entryContext = analyzeEntryContext(entry);
    
    // Calculate similarity score based on multiple factors
    let similarityScore = 0;
    
    // 1. Situation similarity (work, relationships, health, etc.)
    if (currentContext.situation === entryContext.situation) {
      similarityScore += 3;
    }
    
    // 2. Emotional intensity similarity
    const intensityDiff = Math.abs(currentContext.emotionalIntensity - entryContext.emotionalIntensity);
    if (intensityDiff <= 1) similarityScore += 2;
    else if (intensityDiff <= 2) similarityScore += 1;
    
    // 3. Content similarity (actual words and phrases)
    const contentSimilarity = calculateContentSimilarity(currentEntry.content, entry.content);
    similarityScore += contentSimilarity;
    
    // 4. Tag similarity
    if (currentEntry.tags && entry.tags) {
      const commonTags = currentEntry.tags.filter(tag => entry.tags.includes(tag));
      similarityScore += commonTags.length * 0.5;
    }
    
    // Only return entries with meaningful similarity
    return similarityScore >= 2.5;
  });
};

// Analyze the REAL context of a journal entry
const analyzeEntryContext = (entry) => {
  const content = entry.content.toLowerCase();
  
  // Identify the main situation/context
  let situation = 'general';
  if (content.includes('work') || content.includes('job') || content.includes('career') || content.includes('deadline') || content.includes('boss') || content.includes('colleague')) {
    situation = 'work';
  } else if (content.includes('relationship') || content.includes('friend') || content.includes('family') || content.includes('partner') || content.includes('marriage')) {
    situation = 'relationships';
  } else if (content.includes('health') || content.includes('sick') || content.includes('pain') || content.includes('doctor') || content.includes('hospital')) {
    situation = 'health';
  } else if (content.includes('money') || content.includes('financial') || content.includes('bill') || content.includes('debt') || content.includes('expense')) {
    situation = 'financial';
  } else if (content.includes('study') || content.includes('exam') || content.includes('test') || content.includes('assignment') || content.includes('school') || content.includes('college')) {
    situation = 'education';
  }
  
  // Calculate emotional intensity from actual content
  let emotionalIntensity = 1;
  const intensityWords = {
    'very': 1, 'extremely': 2, 'terribly': 2, 'awfully': 2, 'completely': 1,
    'overwhelmed': 2, 'devastated': 3, 'crushed': 3, 'destroyed': 3,
    'slightly': -1, 'a bit': -1, 'somewhat': 0, 'moderately': 0
  };
  
  Object.entries(intensityWords).forEach(([word, intensity]) => {
    if (content.includes(word)) {
      emotionalIntensity += intensity;
    }
  });
  
  emotionalIntensity = Math.max(1, Math.min(5, emotionalIntensity));
  
  return { situation, emotionalIntensity };
};

// Calculate content similarity based on actual words and phrases
const calculateContentSimilarity = (content1, content2) => {
  const words1 = content1.toLowerCase().split(/\s+/).filter(word => word.length > 3);
  const words2 = content2.toLowerCase().split(/\s+/).filter(word => word.length > 3);
  
  const commonWords = words1.filter(word => words2.includes(word));
  const totalUniqueWords = new Set([...words1, ...words2]).size;
  
  return commonWords.length / totalUniqueWords * 3; // Scale to 0-3
};

// Analyze coping strategies from ACTUAL journal content, not just mood follow-up
const analyzeCopingStrategiesFromContent = (entries) => {
  const strategies = {};
  
  entries.forEach(entry => {
    // Look for coping strategies mentioned in the journal content itself
    const contentStrategies = extractCopingStrategiesFromText(entry.content);
    
    // Also include mood follow-up strategies
    if (entry.moodFollowUp?.what_helped) {
      contentStrategies.push(entry.moodFollowUp.what_helped);
    }
    
    contentStrategies.forEach(strategy => {
      const normalizedStrategy = normalizeStrategy(strategy);
      const success = entry.moodFollowUp?.feeling_better === 'yes';
      
      if (!strategies[normalizedStrategy]) {
        strategies[normalizedStrategy] = { count: 0, successes: 0, examples: [] };
      }
      
      strategies[normalizedStrategy].count++;
      if (success) strategies[normalizedStrategy].successes++;
      strategies[normalizedStrategy].examples.push(entry.content.substring(0, 100) + '...');
    });
  });
  
  // Calculate effectiveness scores
  Object.keys(strategies).forEach(strategy => {
    strategies[strategy].effectiveness = 
      (strategies[strategy].successes / strategies[strategy].count) * 10;
  });
  
  return strategies;
};

// Extract coping strategies mentioned in journal text
const extractCopingStrategiesFromText = (content) => {
  const strategies = [];
  const contentLower = content.toLowerCase();
  
  // Look for specific coping strategies mentioned
  const strategyPatterns = [
    'i tried', 'i did', 'i used', 'i practiced', 'i focused on',
    'i reminded myself', 'i told myself', 'i decided to',
    'i took a', 'i went for a', 'i called', 'i talked to',
    'i wrote', 'i read', 'i listened to', 'i watched',
    'i exercised', 'i meditated', 'i prayed', 'i took deep breaths'
  ];
  
  strategyPatterns.forEach(pattern => {
    if (contentLower.includes(pattern)) {
      // Extract the strategy mentioned after the pattern
      const patternIndex = contentLower.indexOf(pattern);
      const afterPattern = content.substring(patternIndex + pattern.length, patternIndex + pattern.length + 100);
      const strategy = afterPattern.split(/[.!?]/)[0].trim();
      if (strategy.length > 5 && strategy.length < 200) {
        strategies.push(strategy);
      }
    }
  });
  
  return strategies;
};

// Normalize strategy names for better grouping
const normalizeStrategy = (strategy) => {
  const normalized = strategy.toLowerCase().trim();
  
  // Group similar strategies
  if (normalized.includes('exercise') || normalized.includes('workout') || normalized.includes('run') || normalized.includes('walk')) {
    return 'Physical Activity';
  }
  if (normalized.includes('talk') || normalized.includes('call') || normalized.includes('discuss')) {
    return 'Talking to Someone';
  }
  if (normalized.includes('write') || normalized.includes('journal') || normalized.includes('note')) {
    return 'Writing/Journaling';
  }
  if (normalized.includes('breathe') || normalized.includes('meditation') || normalized.includes('mindfulness')) {
    return 'Breathing/Meditation';
  }
  if (normalized.includes('break') || normalized.includes('rest') || normalized.includes('sleep')) {
    return 'Taking Breaks/Rest';
  }
  if (normalized.includes('plan') || normalized.includes('organize') || normalized.includes('list')) {
    return 'Planning/Organizing';
  }
  
  return strategy.charAt(0).toUpperCase() + strategy.slice(1);
};

// Calculate difficulty based on REAL success patterns from journal history
const calculatePersonalDifficultyFromHistory = (currentEntry, similarEntries) => {
  if (similarEntries.length === 0) return 5; // Neutral if no similar experiences
  
  // Calculate success rate from actual mood follow-up responses
  const successRate = similarEntries.filter(entry => 
    entry.moodFollowUp?.feeling_better === 'yes'
  ).length / similarEntries.length;
  
  // Base difficulty: lower success rate = higher difficulty
  let baseDifficulty = (1 - successRate) * 10;
  
  // Adjust based on emotional intensity from current entry
  const currentIntensity = analyzeEntryContext(currentEntry).emotionalIntensity;
  if (currentIntensity >= 4) baseDifficulty *= 1.2;
  else if (currentIntensity <= 2) baseDifficulty *= 0.8;
  
  // Adjust based on situation complexity
  const situation = analyzeEntryContext(currentEntry).situation;
  const situationMultipliers = {
    'work': 1.1,      // Work challenges can be complex
    'relationships': 1.2, // Relationship issues are often complex
    'health': 1.3,    // Health issues are very complex
    'financial': 1.1, // Financial issues can be complex
    'education': 1.0, // Education challenges are moderate
    'general': 1.0    // General issues are baseline
  };
  
  baseDifficulty *= (situationMultipliers[situation] || 1.0);
  
  return Math.min(10, Math.max(1, baseDifficulty));
};

// Extract REAL personal patterns from journal content
const extractRealPersonalPatterns = (entries, currentEntry) => {
  const patterns = {
    commonTriggers: {},
    effectiveStrategies: [],
    recoveryPatterns: {},
    emotionalIntensity: 0,
    growthIndicators: []
  };
  
  // Analyze patterns from similar entries
  entries.forEach(entry => {
    // Extract triggers mentioned in content
    const triggers = extractTriggersFromText(entry.content);
    triggers.forEach(trigger => {
      patterns.commonTriggers[trigger] = (patterns.commonTriggers[trigger] || 0) + 1;
    });
    
    // Track recovery patterns
    if (entry.moodFollowUp?.feeling_better === 'yes') {
      patterns.recoveryPatterns.successful = (patterns.recoveryPatterns.successful || 0) + 1;
    } else {
      patterns.recoveryPatterns.challenging = (patterns.recoveryPatterns.challenging || 0) + 1;
    }
  });
  
  // Identify growth indicators
  if (entries.length > 1) {
    const sortedEntries = entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const firstEntry = sortedEntries[0];
    const lastEntry = sortedEntries[sortedEntries.length - 1];
    
    if (firstEntry.moodFollowUp?.feeling_better === 'no' && lastEntry.moodFollowUp?.feeling_better === 'yes') {
      patterns.growthIndicators.push('Improved coping over time');
    }
  }
  
  return patterns;
};

// Extract triggers from journal text
const extractTriggersFromText = (content) => {
  const triggers = [];
  const contentLower = content.toLowerCase();
  
  const triggerPatterns = [
    'because', 'due to', 'since', 'when', 'after', 'before',
    'triggered by', 'caused by', 'result of', 'due to the fact that'
  ];
  
  triggerPatterns.forEach(pattern => {
    if (contentLower.includes(pattern)) {
      const patternIndex = contentLower.indexOf(pattern);
      const afterPattern = content.substring(patternIndex + pattern.length, patternIndex + pattern.length + 100);
      const trigger = afterPattern.split(/[.!?]/)[0].trim();
      if (trigger.length > 5 && trigger.length < 200) {
        triggers.push(trigger);
      }
    }
  });
  
  return triggers;
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

// REAL Content Analysis Functions - These actually READ your journal content
const analyzeJournalContent = (entry, allEntries) => {
  const content = entry.content.toLowerCase();
  
  // Analyze the actual content, not just tags
  let situation = 'general';
  let severity = 'moderate';
  let emotionalIntensity = 3;
  
  // REAL situation analysis based on content
  if (content.includes('job') || content.includes('work') || content.includes('career') || 
      content.includes('boss') || content.includes('colleague') || content.includes('deadline') ||
      content.includes('layoff') || content.includes('fired') || content.includes('unemployment')) {
    situation = 'work/career';
    severity = 'high';
    emotionalIntensity = 4;
  } else if (content.includes('relationship') || content.includes('marriage') || 
             content.includes('divorce') || content.includes('breakup') || 
             content.includes('family') || content.includes('friend')) {
    situation = 'relationships';
    severity = 'high';
    emotionalIntensity = 4;
  } else if (content.includes('health') || content.includes('sick') || 
             content.includes('pain') || content.includes('doctor') || 
             content.includes('hospital') || content.includes('diagnosis')) {
    situation = 'health';
    severity = 'high';
    emotionalIntensity = 4;
  } else if (content.includes('money') || content.includes('financial') || 
             content.includes('bill') || content.includes('debt') || 
             content.includes('expense') || content.includes('bankruptcy')) {
    situation = 'financial';
    severity = 'high';
    emotionalIntensity = 4;
  }
  
  // Analyze emotional content
  if (content.includes('anxious') || content.includes('worried') || content.includes('scared')) {
    emotionalIntensity = Math.max(emotionalIntensity, 4);
  }
  if (content.includes('depressed') || content.includes('hopeless') || content.includes('suicide')) {
    emotionalIntensity = 5;
    severity = 'critical';
  }
  
  // Create context summary based on REAL content
  const contextSummary = `This person is dealing with a ${severity} ${situation} situation. 
The emotional intensity level is ${emotionalIntensity}/5. 
Key concerns mentioned: ${extractKeyConcerns(content)}`;
  
  return {
    situation,
    severity,
    emotionalIntensity,
    contextSummary,
    keyConcerns: extractKeyConcerns(content)
  };
};

const extractKeyConcerns = (content) => {
  const concerns = [];
  const contentLower = content.toLowerCase();
  
  if (contentLower.includes('job') || contentLower.includes('work') || contentLower.includes('career')) {
    concerns.push('Career/Job security');
  }
  if (contentLower.includes('money') || contentLower.includes('financial') || contentLower.includes('bill')) {
    concerns.push('Financial stability');
  }
  if (contentLower.includes('relationship') || contentLower.includes('marriage') || contentLower.includes('family')) {
    concerns.push('Relationships');
  }
  if (contentLower.includes('health') || contentLower.includes('sick') || contentLower.includes('pain')) {
    concerns.push('Health concerns');
  }
  if (contentLower.includes('anxious') || contentLower.includes('worried') || contentLower.includes('scared')) {
    concerns.push('Anxiety/Fear');
  }
  if (contentLower.includes('depressed') || contentLower.includes('hopeless') || contentLower.includes('sad')) {
    concerns.push('Depression/Low mood');
  }
  
  return concerns.length > 0 ? concerns.join(', ') : 'General life challenges';
};

const findRealSimilarSituations = (currentEntry, allEntries) => {
  const currentAnalysis = analyzeJournalContent(currentEntry, allEntries);
  const similarEntries = [];
  
  allEntries.forEach(entry => {
    if (entry.id === currentEntry.id) return; // Skip current entry
    
    const entryAnalysis = analyzeJournalContent(entry, allEntries);
    
    // Calculate REAL similarity based on content, not just tags
    let similarityScore = 0;
    
    // Situation similarity (highest weight)
    if (currentAnalysis.situation === entryAnalysis.situation) {
      similarityScore += 5;
    }
    
    // Emotional intensity similarity
    const intensityDiff = Math.abs(currentAnalysis.emotionalIntensity - entryAnalysis.emotionalIntensity);
    if (intensityDiff <= 1) similarityScore += 3;
    else if (intensityDiff <= 2) similarityScore += 1;
    
    // Content similarity (actual words)
    const contentSimilarity = calculateContentSimilarity(currentEntry.content, entry.content);
    similarityScore += contentSimilarity * 2;
    
    // Only include meaningfully similar entries
    if (similarityScore >= 4) {
      similarEntries.push({
        entry,
        analysis: entryAnalysis,
        similarityScore
      });
    }
  });
  
  // Sort by similarity and limit results
  similarEntries.sort((a, b) => b.similarityScore - a.similarityScore);
  const topSimilar = similarEntries.slice(0, 5);
  
  const summary = topSimilar.length > 0 
    ? `Found ${topSimilar.length} similar situations in your journal history. 
Most similar: ${topSimilar[0].analysis.situation} situation with ${topSimilar[0].analysis.emotionalIntensity}/5 emotional intensity.`
    : 'This appears to be a new type of challenge for you.';
  
  return {
    similarEntries: topSimilar,
    summary,
    count: topSimilar.length
  };
};



const generateContentBasedResponse = (entry, contentAnalysis) => {
  const { situation, severity, emotionalIntensity, keyConcerns } = contentAnalysis;
  
  return `**Understanding:**
I can see you're dealing with a ${severity} ${situation} situation. This is a real, significant challenge that deserves serious attention.

**Professional Perspective:**
Based on what you've shared, this isn't a minor issue that can be solved with simple advice. ${situation} challenges require thoughtful, strategic approaches.

**Practical Steps:**
1. Take time to process your emotions - this is a legitimate stressor
2. Consider seeking professional support if this continues to impact your daily life
3. Focus on one small step at a time rather than trying to solve everything at once

**Supportive Message:**
Your feelings are valid, and it's okay to need support during difficult times. You're taking the right step by journaling about this.`;
};

const generatePersonalizedContentResponse = (entry, contentAnalysis, similarSituations) => {
  const { situation, severity, emotionalIntensity } = contentAnalysis;
  
  if (similarSituations.count > 0) {
    return `**Personal Recognition:**
I can see this is a ${severity} ${situation} challenge. Based on your journal history, you've faced similar situations before.

**Historical Context:**
You've navigated ${similarSituations.count} similar challenges in the past. This shows you have experience with this type of situation.

**Tailored Advice:**
Since this isn't your first time dealing with ${situation} challenges, draw on what you've learned from previous experiences. What strategies worked for you before?

**Encouragement:**
Your past experiences prove you have the capability to handle this. You're not starting from zero - you have a foundation of resilience.`;
  } else {
    return `**Personal Recognition:**
This appears to be a new type of challenge for you. It's completely normal to feel uncertain when facing unfamiliar situations.

**Historical Context:**
While this specific situation is new, you've shown resilience in other areas of your life through your journaling.

**Tailored Advice:**
Approach this as a learning experience. Start small, be patient with yourself, and don't hesitate to seek support.

**Encouragement:**
Facing new challenges shows courage and growth. You're building new capabilities with each step you take.`;
  }
};

const generateContentBasedCapabilityAssessment = (entry, contentAnalysis, similarSituations, capabilityScore) => {
  const { situation, severity, emotionalIntensity, keyConcerns } = contentAnalysis;
  
  let assessment = `**Situation Assessment:**
You're dealing with a ${severity} ${situation} challenge. This is a legitimate, significant life situation that requires serious attention.

**Capability Analysis:**
Your capability score is ${capabilityScore}/10. This assessment is based on your actual journal content and history, not generic assumptions.

**Evidence-Based Insights:**
`;

  if (similarSituations.count > 0) {
    assessment += `Based on your journal history, you've faced ${similarSituations.count} similar challenges before. This shows you have experience with this type of situation.

Your past experiences demonstrate that you have the capability to navigate difficult circumstances.`;
  } else {
    assessment += `This appears to be a new type of challenge for you. While this specific situation is unfamiliar, your journaling shows you have general coping skills and self-awareness.`;
  }

  assessment += `

**Professional Recommendations:**
1. Acknowledge the real gravity of your situation - this isn't a minor issue
2. Draw on your past experiences if you have similar challenges in your history
3. Consider seeking professional support if this continues to impact your daily life
4. Focus on one small step at a time rather than trying to solve everything at once

**Realistic Assessment:**
Your capability score of ${capabilityScore}/10 reflects that while this is a challenging situation, you have tools and resources to work through it. The key is to approach it systematically and not underestimate the difficulty.`;

  return assessment;
};

const calculateRealCapabilityScore = (entry, contentAnalysis, similarSituations) => {
  let score = 5; // Start with neutral score
  
  const { severity, emotionalIntensity, situation } = contentAnalysis;
  
  // Adjust based on situation severity
  if (severity === 'critical') score -= 2;
  else if (severity === 'high') score -= 1;
  else if (severity === 'low') score += 1;
  
  // Adjust based on emotional intensity
  if (emotionalIntensity >= 4) score -= 1;
  else if (emotionalIntensity <= 2) score += 1;
  
  // Adjust based on similar past experiences
  if (similarSituations.count > 0) {
    score += Math.min(similarSituations.count * 0.5, 2); // Max +2 for experience
  }
  
  // Ensure score stays within 1-10 range
  return Math.max(1, Math.min(10, score));
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
    
    // Use in-memory storage for now (simple and reliable)
    otpStore.set(normalized, { otp, timestamp: Date.now() });

    // For demo purposes, return the OTP in the response
    // In production, integrate with SMS service like Twilio
    console.log(`OTP for ${normalized}: ${otp}`);
    
    res.json({ 
      success: true, 
      message: 'OTP sent successfully',
      // For demo purposes only - remove in production
      demoOTP: otp,
      demoMessage: 'For demo purposes, use this OTP: ' + otp
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
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

    // Delete OTP after successful verification
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

// AI coaching endpoint (REBUILT to analyze REAL journal content)
app.post('/api/coaching/:entryId', async (req, res) => {
  try {
    const { entryId } = req.params;
    const data = JSON.parse(await fs.readFile('journal_data.json', 'utf8'));
    const entries = data.entries || [];
    const entry = entries.find(e => e.id === entryId || e.id === parseInt(entryId));
    
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // ACTUALLY ANALYZE the journal content
    const contentAnalysis = analyzeJournalContent(entry, entries);
    
    let coachingAdvice;
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `You are a compassionate, professional life coach. The person has shared this journal entry:

"${entry.content}"
Mood: ${entry.mood}
Tags: ${entry.tags?.join(', ') || 'None'}

IMPORTANT CONTEXT FROM THEIR JOURNAL HISTORY:
${contentAnalysis.contextSummary}

Please provide thoughtful, professional advice that acknowledges the seriousness of their situation. This is NOT a casual conversation - this person is dealing with real life challenges.

Structure your response with:
**Understanding** - Acknowledge the gravity of their situation
**Professional Perspective** - Provide mature, adult-level insight
**Practical Steps** - Give 2-3 specific, actionable steps
**Supportive Message** - End with genuine encouragement

Keep it professional, mature, and genuinely helpful. Avoid generic advice.`;

      const result = await model.generateContent(prompt);
      coachingAdvice = result.response.text();
    } catch (aiError) {
      console.log('AI service unavailable, using content-based fallback');
      coachingAdvice = generateContentBasedResponse(entry, contentAnalysis);
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

// Personalized coaching endpoint (REBUILT to analyze REAL journal content)
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

    // ACTUALLY ANALYZE the journal content and find REAL similar situations
    const contentAnalysis = analyzeJournalContent(entry, entries);
    const similarSituations = findRealSimilarSituations(entry, entries);
    
    let personalizedAdvice;
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `You are a compassionate, professional life coach. The person has shared this journal entry:

"${entry.content}"
Mood: ${entry.mood}
Tags: ${entry.tags?.join(', ') || 'None'}

REAL ANALYSIS OF THEIR SITUATION:
${contentAnalysis.contextSummary}

SIMILAR SITUATIONS FROM THEIR HISTORY:
${similarSituations.summary}

Based on their ACTUAL journal content and history, provide personalized advice that:
1. Acknowledges the specific nature of their current challenge
2. References their real past experiences if relevant
3. Gives practical, adult-level guidance
4. Shows you've actually read and understood their situation

Structure with:
**Personal Recognition** - Show you understand their specific situation
**Historical Context** - Reference their real past experiences if relevant
**Tailored Advice** - Give advice specific to their situation
**Encouragement** - Support based on their real patterns`;

      const result = await model.generateContent(prompt);
      personalizedAdvice = result.response.text();
    } catch (aiError) {
      console.log('AI service unavailable, using content-based personalized response');
      personalizedAdvice = generatePersonalizedContentResponse(entry, contentAnalysis, similarSituations);
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
    
    // ACTUALLY ANALYZE the journal content and find REAL similar situations
    const contentAnalysis = analyzeJournalContent(entry, entries);
    const similarSituations = findRealSimilarSituations(entry, entries);
    
    // Calculate capability based on REAL content analysis, not superficial patterns
    const capabilityScore = calculateRealCapabilityScore(entry, contentAnalysis, similarSituations);
    
    let assessmentResult;
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `You are a professional life coach assessing someone's capability to handle a challenging situation.

JOURNAL ENTRY: "${entry.content}"
MOOD: ${entry.mood}
TAGS: ${entry.tags?.join(', ') || 'None'}

REAL SITUATION ANALYSIS:
${contentAnalysis.contextSummary}

SIMILAR SITUATIONS FROM THEIR HISTORY:
${similarSituations.summary}

CAPABILITY SCORE: ${capabilityScore}/10

Based on their ACTUAL journal content and history, provide a professional capability assessment that:
1. Acknowledges the real gravity of their situation
2. References their actual past experiences if relevant
3. Gives an honest, realistic assessment of their capability
4. Provides specific, actionable guidance

Structure with:
**Situation Assessment** - Professional evaluation of the challenge
**Capability Analysis** - Honest assessment based on their real history
**Evidence-Based Insights** - What their journal actually shows about their capabilities
**Professional Recommendations** - Specific, actionable advice

Keep it professional, honest, and genuinely helpful. This person is dealing with real life challenges.`;

      const result = await model.generateContent(prompt);
      assessmentResult = result.response.text();
    } catch (aiError) {
      console.log('AI service unavailable, using content-based capability assessment');
      assessmentResult = generateContentBasedCapabilityAssessment(entry, contentAnalysis, similarSituations, capabilityScore);
    }
    
    res.json({ 
      capabilityScore: Math.round(capabilityScore * 10) / 10,
      assessment: assessmentResult,
      contentAnalysis: {
        situation: contentAnalysis.situation,
        severity: contentAnalysis.severity,
        emotionalIntensity: contentAnalysis.emotionalIntensity,
        keyConcerns: contentAnalysis.keyConcerns
      },
      similarSituations: {
        count: similarSituations.count,
        summary: similarSituations.summary
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

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database tables
    await initDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`CORS origins: ${process.env.NODE_ENV === 'production' ? 'production origins' : 'localhost:3000'}`);
      console.log('Database initialized successfully');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
}); 