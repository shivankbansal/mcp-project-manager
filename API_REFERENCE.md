# API Reference - MCP Project Manager

Complete reference for the MCP Project Manager REST API.

## Base URL

- **Development**: `http://localhost:10000`
- **Production**: `https://mcp-project-manager.onrender.com`

## Authentication

Currently, the API does not require authentication. This may be added in future versions.

---

## Endpoints

### Health Check

Check if the API is running and get system information.

#### `GET /health`

**Response 200 OK:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 12345,
  "mongodb": "connected",
  "availableProviders": {
    "openai": true,
    "gemini": true,
    "groq": true,
    "ollama": false
  }
}
```

**Example:**
```bash
curl http://localhost:10000/health
```

---

## Workflows

### List All Workflows

Retrieve all workflows from the database.

#### `GET /api/workflows`

**Response 200 OK:**
```json
[
  {
    "_id": "65abc123def456789",
    "name": "E-commerce Platform",
    "description": "Full-stack e-commerce application",
    "phases": ["brd", "design", "journey", "testing"],
    "status": "in-progress",
    "formData": {
      "projectName": "E-commerce Platform",
      "projectDescription": "Online shopping platform",
      "targetAudience": "Tech-savvy shoppers aged 25-45",
      "mainFeatures": "Product catalog, shopping cart, checkout",
      "timeline": "6 months",
      "estimatedBudget": "$100,000"
    },
    "steps": [
      {
        "id": "step-brd",
        "phase": "brd",
        "title": "Business Requirements",
        "status": "completed",
        "order": 1,
        "result": {
          "content": "# Business Requirements Document...",
          "generatedBy": "groq",
          "model": "llama-3.3-70b-versatile"
        }
      }
    ],
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
]
```

**Example:**
```bash
curl http://localhost:10000/api/workflows
```

---

### Get Workflow by ID

Retrieve a specific workflow by its ID.

#### `GET /api/workflows/:id`

**Parameters:**
- `id` (path, required) - Workflow ID

**Response 200 OK:**
```json
{
  "_id": "65abc123def456789",
  "name": "E-commerce Platform",
  "description": "Full-stack e-commerce application",
  "phases": ["brd", "design"],
  "status": "draft",
  "formData": { /* ... */ },
  "steps": [ /* ... */ ],
  "createdAt": "2025-01-15T10:00:00.000Z",
  "updatedAt": "2025-01-15T10:00:00.000Z"
}
```

**Response 404 Not Found:**
```json
{
  "error": "Workflow not found"
}
```

**Example:**
```bash
curl http://localhost:10000/api/workflows/65abc123def456789
```

---

### Create Workflow

Create a new workflow with form data and phases.

#### `POST /api/workflows`

**Request Body:**
```json
{
  "name": "Mobile Banking App",
  "description": "Secure mobile banking application",
  "phases": ["brd", "design", "journey", "testing"],
  "formData": {
    "projectName": "Mobile Banking App",
    "projectDescription": "iOS and Android banking app",
    "targetAudience": "Banking customers aged 18-65",
    "mainFeatures": "Account view, transfers, bill pay, deposits",
    "timeline": "8 months",
    "estimatedBudget": "$150,000",

    "designStyle": "Modern",
    "colorScheme": "Blue and White (trust, security)",
    "mainPages": "Login, Dashboard, Transfers, Settings",
    "wireframeNotes": "Clean, minimal, secure",
    "accessibilityRequirements": "WCAG 2.1 AA compliant, screen reader support",

    "userPersonas": "Tech-savvy millennial, Senior banking customer",
    "userFlows": "Login → View Balance → Transfer Funds",
    "painPoints": "Complex navigation, security concerns",
    "successMetrics": "85% task completion rate, <5min average session",

    "testTypes": "Unit, Integration, E2E, Security",
    "criticalPaths": "Login flow, Money transfer, Bill payment",
    "edgeCases": "Network failure, session timeout, concurrent logins",
    "performanceTargets": "<2s page load, <500ms API response",
    "browserSupport": "iOS Safari, Chrome, Android Chrome"
  }
}
```

**Response 201 Created:**
```json
{
  "_id": "65abc456def789012",
  "name": "Mobile Banking App",
  "description": "Secure mobile banking application",
  "phases": ["brd", "design", "journey", "testing"],
  "status": "draft",
  "formData": { /* ... */ },
  "steps": [
    {
      "id": "step-brd",
      "phase": "brd",
      "title": "Business Requirements",
      "status": "pending",
      "order": 1
    },
    {
      "id": "step-design",
      "phase": "design",
      "title": "Design & Wireframes",
      "status": "pending",
      "order": 2
    },
    {
      "id": "step-journey",
      "phase": "journey",
      "title": "User Journey",
      "status": "pending",
      "order": 3
    },
    {
      "id": "step-testing",
      "phase": "testing",
      "title": "Test Cases",
      "status": "pending",
      "order": 4
    }
  ],
  "createdAt": "2025-01-15T11:00:00.000Z",
  "updatedAt": "2025-01-15T11:00:00.000Z"
}
```

**Example:**
```bash
curl -X POST http://localhost:10000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mobile Banking App",
    "description": "Secure mobile banking application",
    "phases": ["brd", "design"],
    "formData": {
      "projectName": "Mobile Banking App",
      "projectDescription": "iOS and Android banking app"
    }
  }'
```

---

### Update Workflow Status

Update the status of a workflow.

#### `PUT /api/workflows/:id`

**Parameters:**
- `id` (path, required) - Workflow ID

**Request Body:**
```json
{
  "status": "in-progress"
}
```

**Valid Status Values:**
- `draft` - Initial state
- `in-progress` - Work started
- `completed` - All phases complete

**Response 200 OK:**
```json
{
  "_id": "65abc123def456789",
  "status": "in-progress",
  "updatedAt": "2025-01-15T11:30:00.000Z"
}
```

**Example:**
```bash
curl -X PUT http://localhost:10000/api/workflows/65abc123def456789 \
  -H "Content-Type: application/json" \
  -d '{"status": "in-progress"}'
```

---

### Delete Workflow

Delete a workflow from the database.

#### `DELETE /api/workflows/:id`

**Parameters:**
- `id` (path, required) - Workflow ID

**Response 200 OK:**
```json
{
  "message": "Workflow deleted successfully"
}
```

**Response 404 Not Found:**
```json
{
  "error": "Workflow not found"
}
```

**Example:**
```bash
curl -X DELETE http://localhost:10000/api/workflows/65abc123def456789
```

---

### Execute Workflow Step

Execute a specific step in the workflow using AI tools.

#### `POST /api/workflows/:id/execute`

**Parameters:**
- `id` (path, required) - Workflow ID

**Request Body:**
```json
{
  "stepId": "step-brd",
  "provider": "groq"
}
```

**Valid Providers:**
- `groq` - Groq (Llama 3.3 70B, fast and free)
- `ollama` - Ollama (self-hosted, local models)
- `openai` - OpenAI (GPT-4o)
- `gemini` - Google Gemini (gemini-2.0-flash)
- `auto` - Auto-select based on availability (default)

**Response 200 OK:**
```json
{
  "stepId": "step-brd",
  "status": "completed",
  "result": {
    "content": "# Business Requirements Document\n\n## Executive Summary\n\nThis document outlines...",
    "generatedBy": "groq",
    "model": "llama-3.3-70b-versatile",
    "wordCount": 3245,
    "generatedAt": "2025-01-15T11:45:00.000Z"
  }
}
```

**Response 400 Bad Request:**
```json
{
  "error": "Step not found in workflow"
}
```

**Response 500 Internal Server Error:**
```json
{
  "error": "AI provider not available. Set GROQ_API_KEY, OLLAMA_ENABLED, OPENAI_API_KEY, or GOOGLE_API_KEY."
}
```

**Example:**
```bash
curl -X POST http://localhost:10000/api/workflows/65abc123def456789/execute \
  -H "Content-Type: application/json" \
  -d '{
    "stepId": "step-brd",
    "provider": "groq"
  }'
```

---

## MCP Tools

### List Available Tools

Get a list of all available MCP tools.

#### `GET /api/tools`

**Response 200 OK:**
```json
[
  {
    "name": "generate_requirements",
    "description": "Generate comprehensive business requirements using AI",
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectDescription": {
          "type": "string",
          "description": "Description of the project"
        },
        "context": {
          "type": "string",
          "description": "Additional context"
        }
      },
      "required": ["projectDescription"]
    }
  },
  {
    "name": "generate_design",
    "description": "Generate UI/UX design specifications",
    "inputSchema": { /* ... */ }
  },
  {
    "name": "generate_journey",
    "description": "Generate user journey documentation",
    "inputSchema": { /* ... */ }
  },
  {
    "name": "generate_tests",
    "description": "Generate comprehensive test cases",
    "inputSchema": { /* ... */ }
  }
]
```

**Example:**
```bash
curl http://localhost:10000/api/tools
```

---

### Execute MCP Tool

Execute a specific MCP tool with arguments.

#### `POST /api/tools/execute`

**Request Body:**
```json
{
  "toolName": "generate_requirements",
  "args": {
    "projectDescription": "E-commerce platform for selling handmade crafts",
    "context": "Target market: artisan sellers and craft enthusiasts"
  }
}
```

**Response 200 OK:**
```json
{
  "result": "# Business Requirements Document\n\n## Project: E-commerce Platform\n\n...",
  "provider": "groq",
  "model": "llama-3.3-70b-versatile",
  "executionTime": 2345
}
```

**Response 400 Bad Request:**
```json
{
  "error": "Unknown tool: invalid_tool_name"
}
```

**Example:**
```bash
curl -X POST http://localhost:10000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{
    "toolName": "generate_requirements",
    "args": {
      "projectDescription": "Mobile fitness tracking app"
    }
  }'
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Invalid request body"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "details": "Error message here"
}
```

---

## Data Models

### Workflow Schema

```typescript
interface Workflow {
  _id: string;
  name: string;
  description: string;
  phases: ('brd' | 'design' | 'journey' | 'testing')[];
  status: 'draft' | 'in-progress' | 'completed';
  formData: {
    // BRD Phase
    projectName?: string;
    projectDescription?: string;
    targetAudience?: string;
    mainFeatures?: string;
    timeline?: string;
    estimatedBudget?: string;

    // Design Phase
    designStyle?: string;
    colorScheme?: string;
    mainPages?: string;
    wireframeNotes?: string;
    accessibilityRequirements?: string;

    // Journey Phase
    userPersonas?: string;
    userFlows?: string;
    painPoints?: string;
    successMetrics?: string;

    // Testing Phase
    testTypes?: string;
    criticalPaths?: string;
    edgeCases?: string;
    performanceTargets?: string;
    browserSupport?: string;
  };
  steps: Step[];
  createdAt: Date;
  updatedAt: Date;
}

interface Step {
  id: string;
  phase: 'brd' | 'design' | 'journey' | 'testing';
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  order: number;
  result?: {
    content: string;
    generatedBy: string;
    model: string;
    wordCount?: number;
    generatedAt?: Date;
  };
}
```

---

## Rate Limits

Currently, there are no rate limits. This may change in future versions.

---

## CORS

The API supports CORS and accepts requests from all origins in development. In production, configure allowed origins as needed.

---

## Examples

### Complete Workflow Creation Flow

```bash
# 1. Create a workflow
WORKFLOW_ID=$(curl -s -X POST http://localhost:10000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SaaS Dashboard",
    "description": "Analytics dashboard for SaaS products",
    "phases": ["brd", "design"],
    "formData": {
      "projectName": "SaaS Dashboard",
      "projectDescription": "Real-time analytics and metrics"
    }
  }' | jq -r '._id')

# 2. Execute BRD step
curl -X POST http://localhost:10000/api/workflows/$WORKFLOW_ID/execute \
  -H "Content-Type: application/json" \
  -d '{
    "stepId": "step-brd",
    "provider": "groq"
  }'

# 3. Update workflow status
curl -X PUT http://localhost:10000/api/workflows/$WORKFLOW_ID \
  -H "Content-Type: application/json" \
  -d '{"status": "in-progress"}'

# 4. Get workflow details
curl http://localhost:10000/api/workflows/$WORKFLOW_ID
```

---

## Changelog

### v2.0.0 (Current)
- Added Groq and Ollama AI provider support
- Enhanced error handling
- Improved step execution with provider selection

### v1.0.0
- Initial release
- OpenAI and Gemini support
- CRUD operations for workflows
- MCP tool execution

---

**API Version**: 2.0.0
**Last Updated**: January 2025
