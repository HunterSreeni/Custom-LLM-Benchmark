# MCP Server Tools Specification

You have access to the following MCP (Model Context Protocol) tools. Each tool has a name, description, input schema, and output schema.

---

## Tool 1: `db_query`

**Description:** Execute a read-only SQL query against the application database (PostgreSQL 15).

**Input Schema:**
```json
{
  "sql": "string - A valid SQL SELECT query. INSERT/UPDATE/DELETE are blocked.",
  "params": "array (optional) - Positional parameters for parameterized queries ($1, $2, etc.)"
}
```

**Output Schema:**
```json
{
  "rows": "array of objects - Each object is a row with column names as keys",
  "row_count": "number - Total rows returned",
  "execution_time_ms": "number - Query execution time in milliseconds"
}
```

**Constraints:**
- Maximum 1000 rows returned per query
- 30-second query timeout
- Read-only (no mutations)

---

## Tool 2: `api_call`

**Description:** Make an HTTP request to an external or internal API endpoint.

**Input Schema:**
```json
{
  "method": "string - HTTP method: GET, POST, PUT, DELETE",
  "url": "string - Full URL including protocol (https://...)",
  "headers": "object (optional) - Key-value pairs of HTTP headers",
  "body": "object (optional) - Request body (auto-serialized to JSON)"
}
```

**Output Schema:**
```json
{
  "status_code": "number - HTTP status code",
  "headers": "object - Response headers",
  "body": "string or object - Response body (auto-parsed if JSON)"
}
```

**Constraints:**
- 10-second timeout per request
- Internal URLs (10.x.x.x, 192.168.x.x) are blocked
- Maximum 5MB response body

---

## Tool 3: `file_read`

**Description:** Read the contents of a file from the project workspace.

**Input Schema:**
```json
{
  "path": "string - Relative path from project root (e.g., 'data/config.json')",
  "encoding": "string (optional) - File encoding, default 'utf-8'"
}
```

**Output Schema:**
```json
{
  "content": "string - File contents as text",
  "size_bytes": "number - File size in bytes",
  "last_modified": "string - ISO 8601 timestamp of last modification"
}
```

**Constraints:**
- Sandboxed to project workspace directory
- Maximum 10MB file size
- Cannot read binary files (use base64 encoding for those)

---

## Tool 4: `calculator`

**Description:** Evaluate a mathematical expression with precision arithmetic.

**Input Schema:**
```json
{
  "expression": "string - A mathematical expression (e.g., '(150.50 + 299.99) * 1.08')",
  "precision": "number (optional) - Decimal places for rounding, default 2"
}
```

**Output Schema:**
```json
{
  "result": "number - The computed result",
  "expression_parsed": "string - The expression as parsed (for verification)"
}
```

**Constraints:**
- Supports: +, -, *, /, %, ^, parentheses
- Functions: round(), ceil(), floor(), abs(), min(), max(), sum()
- Maximum expression length: 500 characters

---

## Tool 5: `formatter`

**Description:** Generate formatted output from a template and data object using Handlebars syntax.

**Input Schema:**
```json
{
  "template": "string - Handlebars template with {{variable}} placeholders",
  "data": "object - Key-value data to inject into the template",
  "output_format": "string (optional) - 'markdown' (default), 'html', 'plain'"
}
```

**Output Schema:**
```json
{
  "rendered": "string - The rendered output with all placeholders filled",
  "output_format": "string - The format used"
}
```

**Constraints:**
- Supports Handlebars helpers: #each, #if, #unless, #with
- Maximum template length: 10,000 characters
- Maximum data object depth: 5 levels

---

## Notes

- Tools can be chained: the output of one tool can be used as input to another.
- All tools return errors in a standard format: `{"error": "string", "code": "string"}`.
- Tools are stateless between calls - no session context is retained.
- You should call tools in the most efficient order to minimize total calls.
