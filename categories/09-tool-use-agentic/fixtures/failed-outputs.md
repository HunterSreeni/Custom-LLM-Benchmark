# Failed LLM Outputs - Diagnosis Challenge

Below are 5 real outputs from an LLM that failed to meet requirements. For each, identify what went wrong and suggest how the prompt or system could be improved.

---

## Failure 1: Hallucinated API Endpoint

**Task:** "Call the Stripe API to create a payment intent for $50 USD"

**LLM Output:**
```
I'll create the payment intent using the Stripe API:

POST https://api.stripe.com/v2/payment_intents
Content-Type: application/json
Authorization: Bearer sk_test_xxx

{
  "amount": 50,
  "currency": "usd"
}
```

**What's wrong:**
- The Stripe API endpoint is `/v1/payment_intents`, not `/v2/payment_intents` - the v2 endpoint does not exist
- The amount should be in cents (5000), not dollars (50)
- The Content-Type for Stripe should be `application/x-www-form-urlencoded`, not JSON
- Stripe uses form-encoded bodies, not JSON bodies

---

## Failure 2: Ignored Constraints

**Task:** "Write a Python function to sort a list of integers. Do NOT use any built-in sort functions or libraries. Use bubble sort."

**LLM Output:**
```python
def sort_list(nums):
    return sorted(nums)
```

**What's wrong:**
- Completely ignored the constraint "Do NOT use any built-in sort functions"
- Ignored the explicit instruction to "Use bubble sort"
- The output is a single line that uses the exact thing the user prohibited
- No explanation or acknowledgment of the constraints

---

## Failure 3: Format Mismatch

**Task:** "Return the top 5 customers by revenue as a JSON array. Each object should have fields: id, name, revenue. Nothing else in your response - just the JSON."

**LLM Output:**
```
Sure! Here are the top 5 customers by revenue:

| Rank | Customer ID | Customer Name | Total Revenue |
|------|-------------|---------------|---------------|
| 1    | C-1042      | Acme Corp     | $1,250,000    |
| 2    | C-0891      | TechStart     | $980,500      |
| 3    | C-1205      | GlobalFin     | $875,200      |
| 4    | C-0567      | DataDrive     | $720,000      |
| 5    | C-0334      | CloudNine     | $695,800      |

Let me know if you need anything else!
```

**What's wrong:**
- Returned a markdown table instead of the requested JSON array
- Added conversational text ("Sure!", "Let me know...") when the task said "Nothing else in your response - just the JSON"
- Revenue values have dollar signs and commas (strings) instead of numeric values
- Used "Customer ID" and "Customer Name" instead of the specified field names "id", "name", "revenue"
- Added a "Rank" field that was not requested

---

## Failure 4: Unsafe Code Generation

**Task:** "Write a Node.js function that reads a user-uploaded file path and returns its contents"

**LLM Output:**
```javascript
const fs = require('fs');

function readUserFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content;
}
```

**What's wrong:**
- Path traversal vulnerability: no validation on `filePath` - a user could pass `../../etc/passwd` or any system file
- No check that the path is within the allowed upload directory
- Uses synchronous `readFileSync` which blocks the event loop (bad for a server)
- No error handling - will crash on non-existent files or permission errors
- No file size limit - could cause memory exhaustion on large files
- No file type validation

---

## Failure 5: Confident but Wrong

**Task:** "What HTTP status code should a REST API return when a resource is successfully created?"

**LLM Output:**
```
The correct HTTP status code for a successfully created resource is **200 OK**.

When a POST request successfully creates a new resource, the server should respond with
200 OK along with the created resource in the response body. This is the standard
practice across all REST APIs.
```

**What's wrong:**
- The correct status code is **201 Created**, not 200 OK
- 200 OK indicates a generic successful request, but 201 specifically indicates resource creation
- The response states this with high confidence ("the correct", "standard practice across all REST APIs") despite being wrong
- No mention of the Location header, which should accompany a 201 response to point to the new resource
- A good response would mention that 200 is for general success while 201 is specifically for creation
