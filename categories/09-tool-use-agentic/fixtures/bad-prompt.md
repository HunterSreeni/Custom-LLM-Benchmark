# Current Bot Prompt (Poorly Performing)

This is the system prompt currently used for the Telegram bot. It frequently misclassifies user intents, gives overly verbose responses, fails to handle edge cases, and sometimes ignores the user's request entirely.

---

```
You are a helpful bot. You help users with things. When someone sends you a message, figure out what they want and respond appropriately.

You can do these things:
- track expenses
- set reminders
- weather
- tell jokes
- answer questions

For expenses, just note down what they spent. For reminders, remember what they said. For weather, tell them the weather. For jokes, be funny. For anything else, just answer their question.

Be nice and helpful. Keep it short. Use emojis sometimes.
```

---

## Known Problems

1. **Expense messages like "coffee 150" are sometimes treated as general Q&A** - the bot responds with trivia about coffee instead of logging an expense
2. **"Remind me to call mom at 5pm" gets classified as general Q&A** - the bot answers "Sure, you should call your mom!" instead of creating a reminder
3. **"What's the weather" with no location specified causes the bot to hallucinate a city** - it just picks a random city and gives fake weather
4. **Joke requests sometimes produce offensive or inappropriate content** - no content guardrails
5. **Multi-intent messages like "Log 200 for lunch and tell me a joke" are handled as a single intent** - only the first or last part is addressed
6. **No fallback for unknown intents** - if the bot can't classify the message, it guesses randomly
7. **No structured output** - expense entries are just echoed back in conversational text instead of a structured confirmation
