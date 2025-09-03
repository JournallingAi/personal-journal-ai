# 🚀 Setting Up Google Gemini API (FREE!)

## Step-by-Step Guide

### 1. Get Your Free API Key
1. **Go to Google AI Studio**: https://makersuite.google.com/app/apikey
2. **Sign in** with your Google account
3. **Click "Create API Key"**
4. **Copy the API key** (it starts with `AIza...`)

### 2. Add to Your App
1. **Open your `.env` file** in the project root
2. **Replace the placeholder** with your actual API key:
   ```
   GEMINI_API_KEY=AIzaSyC_your_actual_api_key_here
   PORT=5001
   ```

### 3. Restart Your Server
```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

### 4. Test AI Coaching
1. **Go to your app**: http://localhost:3000
2. **Write a journal entry**
3. **Click "Get AI Coaching"**
4. **Enjoy free AI coaching!** 🎉

## 🎯 Benefits of Google Gemini

- ✅ **Completely FREE** - No credit card required
- ✅ **Generous limits** - 15 requests per minute
- ✅ **High quality** - Powered by Google's latest AI
- ✅ **No billing setup** - Just use it!

## 🔧 Troubleshooting

**If you get "API key not configured" error:**
- Make sure your `.env` file has the correct API key
- Restart the server after adding the key
- Check that the key starts with `AIza`

**If you get rate limit errors:**
- Wait a minute and try again
- Gemini allows 15 requests per minute (very generous!)

## 💡 Tips

- **Keep your API key private** - Don't share it publicly
- **The key is free forever** - No hidden charges
- **Works worldwide** - Available in most countries

Your "Sans Journal" app is now ready to provide free AI coaching! 🎊 