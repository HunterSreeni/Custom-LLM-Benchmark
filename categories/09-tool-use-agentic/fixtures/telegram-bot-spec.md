# Telegram Bot Specification

## Overview

A personal assistant Telegram bot that handles 5 core intents via natural language. The bot receives text messages from a single user and must classify, process, and respond appropriately.

## Intent Types

### 1. Expense Tracking
- **Trigger patterns:** amount + category, e.g., "coffee 150", "spent 300 on groceries", "lunch 250", "200 uber"
- **Required extraction:** amount (number), category (string), optional date (defaults to today)
- **Response format:** Structured confirmation with amount, category, and running daily total
- **Edge cases:** Currency symbols ("$50", "Rs.200"), multiple expenses in one message, no amount given

### 2. Reminders
- **Trigger patterns:** "remind me to...", "reminder:", "don't forget...", "set alarm for..."
- **Required extraction:** task description, time/date (absolute or relative)
- **Response format:** Confirmation with parsed time in 12-hour format and task summary
- **Edge cases:** No time specified (ask for it), past time (assume next day), relative times ("in 2 hours", "tomorrow")

### 3. Weather
- **Trigger patterns:** "weather", "temperature", "is it raining", "forecast for..."
- **Required extraction:** location (city name or "current location")
- **Response format:** Temperature, condition, humidity, wind - keep it 2-3 lines max
- **Edge cases:** No location specified (ask for it - do NOT guess), invalid location (say so clearly)

### 4. Jokes
- **Trigger patterns:** "tell me a joke", "joke", "make me laugh", "something funny"
- **Response format:** Short, clean joke (PG-rated only)
- **Constraints:** No offensive, political, religious, or adult content. Family-friendly only.
- **Edge cases:** Repeated requests should not repeat the same joke consecutively

### 5. General Q&A
- **Trigger patterns:** Any message that doesn't match intents 1-4
- **Response format:** Concise answer, 1-3 sentences max. If uncertain, say "I'm not sure about that."
- **Constraints:** Do not fabricate facts. If it's outside your knowledge, say so.

## Multi-Intent Handling

Messages may contain multiple intents (e.g., "Log 200 for lunch and what's the weather in Delhi?"). The bot must:
1. Split the message into individual intents
2. Process each one separately
3. Return a combined response with clear sections

## Fallback Behavior

If the bot cannot confidently classify a message:
1. Do NOT guess an intent
2. Respond with: "I'm not sure what you need. I can help with: expenses, reminders, weather, jokes, or general questions. Could you rephrase?"
3. Offer the 5 options as a quick-reply keyboard

## Response Guidelines

- Maximum 200 words per response
- Use markdown formatting (bold for amounts, code blocks for data)
- Emojis: use sparingly (1-2 per response max)
- Tone: friendly but efficient, not chatty
- Language: English only (but understand common Hindi-English code-switching like "aaj lunch 200")

## Error Handling

- API failures (weather, etc.): "Sorry, I couldn't fetch that right now. Please try again in a moment."
- Invalid input: Clearly explain what's wrong and what format is expected
- Rate limiting: Maximum 30 messages per minute per user
