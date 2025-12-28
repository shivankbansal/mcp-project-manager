# Contributing to MCP Project Manager

Thank you for your interest in contributing to MCP Project Manager! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive criticism
- Accept feedback gracefully
- Prioritize the community's best interests

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling, insulting, or derogatory remarks
- Public or private harassment
- Publishing others' private information
- Unprofessional conduct

---

## Getting Started

### Prerequisites

- Node.js 20+ and npm 9+
- Git
- Code editor (VS Code recommended)
- MongoDB (optional, for local testing)

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/mcp-project-manager.git
   cd mcp-project-manager
   ```

3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/shivankbansal/mcp-project-manager.git
   ```

### Install Dependencies

```bash
# Backend
npm install

# Frontend
cd frontend
npm install
cd ..
```

### Set Up Environment

```bash
# Copy example env file
cp .env.example .env

# Add at least one AI provider key
# Recommended: GROQ_API_KEY (free at console.groq.com)
```

### Run Development Servers

```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Visit http://localhost:5173 to see the app.

---

## Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/my-new-feature

# Or for bug fixes
git checkout -b fix/issue-123
```

**Branch Naming Convention:**
- `feature/feature-name` - New features
- `fix/issue-number` - Bug fixes
- `docs/update-readme` - Documentation
- `refactor/component-name` - Code refactoring
- `test/add-tests` - Adding tests

### 2. Make Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update documentation if needed

### 3. Test Your Changes

```bash
# Backend tests (when available)
npm test

# Manual testing
npm run dev
# Test all affected workflows in the UI
```

### 4. Commit Your Changes

Write clear, descriptive commit messages:

```bash
git add .
git commit -m "Add user authentication feature"
```

**Commit Message Format:**
```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding/updating tests
- `chore:` Maintenance tasks

**Examples:**
```bash
feat: Add Groq AI provider support

- Integrate Groq SDK
- Add environment variable configuration
- Update AI service to use Groq by default
- Add documentation for Groq setup

Closes #42
```

```bash
fix: Resolve workflow status update bug

The workflow status wasn't updating correctly when
executing steps. This commit fixes the issue by
ensuring the status field is properly saved.

Fixes #56
```

### 5. Push to Your Fork

```bash
git push origin feature/my-new-feature
```

---

## Project Structure

Understanding the codebase:

```
mcp-project-manager/
├── src/                          # Backend source
│   ├── index.ts                  # Entry point (MCP + HTTP server)
│   ├── server.ts                 # Express server setup
│   ├── models/
│   │   └── Workflow.ts           # Mongoose models
│   ├── routes/
│   │   └── workflowRoutes.ts     # API routes
│   ├── services/
│   │   └── aiService.ts          # AI provider logic
│   └── tools/
│       ├── gemini-tools.ts       # Gemini MCP tools
│       ├── chatgpt-tools.ts      # OpenAI MCP tools
│       └── claude-tools.ts       # Claude MCP tools (future)
│
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── App.jsx              # Router + Layout
│   │   ├── main.jsx             # React entry
│   │   ├── App.css              # Tailwind styles
│   │   └── pages/
│   │       ├── Dashboard.jsx     # Main dashboard
│   │       ├── WorkflowBuilder.jsx  # Multi-step form
│   │       └── WorkflowDetails.jsx  # Execution view
│   ├── package.json
│   └── vite.config.js
│
├── docs/                         # Documentation
├── package.json
├── tsconfig.json
└── README.md
```

---

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for backend code
- Use ESLint and Prettier (configs provided)
- Prefer `const` over `let`, avoid `var`
- Use async/await over callbacks
- Handle errors gracefully

**Good Example:**
```typescript
async function getWorkflow(id: string): Promise<Workflow | null> {
  try {
    const workflow = await Workflow.findById(id);
    return workflow;
  } catch (error) {
    console.error('Error fetching workflow:', error);
    throw new Error('Failed to fetch workflow');
  }
}
```

**Bad Example:**
```typescript
function getWorkflow(id, callback) {
  Workflow.findById(id, function(err, workflow) {
    if (err) callback(err);
    callback(null, workflow);
  });
}
```

### React/JSX

- Use functional components and hooks
- Keep components small and focused
- Use meaningful variable names
- Extract reusable logic into custom hooks

**Good Example:**
```jsx
function WorkflowCard({ workflow }) {
  const statusColor = getStatusColor(workflow.status);

  return (
    <div className="card">
      <h3>{workflow.name}</h3>
      <span className={`badge ${statusColor}`}>
        {workflow.status}
      </span>
    </div>
  );
}
```

### CSS (Tailwind)

- Use Tailwind utility classes
- Keep custom CSS minimal
- Use consistent spacing scale
- Maintain responsive design

```jsx
// Good - Tailwind utilities
<div className="p-6 bg-slate-800 rounded-lg shadow-lg">

// Avoid - Inline styles
<div style={{padding: '24px', background: '#1e293b'}}>
```

---

## Testing

### Manual Testing Checklist

Before submitting a PR, test these workflows:

- [ ] Create workflow from each template
- [ ] Fill all form fields
- [ ] Navigate between phases
- [ ] Submit workflow
- [ ] View workflow details
- [ ] Execute each step (BRD, Design, Journey, Testing)
- [ ] Update workflow status
- [ ] Delete workflow
- [ ] Check responsive design (mobile/tablet/desktop)

### Automated Tests (Future)

We're working on adding automated tests. Contributions welcome!

```bash
# Run tests (when available)
npm test

# Run tests in watch mode
npm test -- --watch

# Check coverage
npm test -- --coverage
```

---

## Submitting Changes

### Create a Pull Request

1. **Push your branch** to your fork
   ```bash
   git push origin feature/my-feature
   ```

2. **Open a Pull Request** on GitHub
   - Go to the original repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template

### PR Template

```markdown
## Description
[Describe what this PR does]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- [List specific changes]
- [Include any relevant details]

## Testing
- [ ] Tested locally
- [ ] All workflows function correctly
- [ ] No console errors
- [ ] Responsive design verified

## Screenshots (if applicable)
[Add screenshots of UI changes]

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings or errors
```

### PR Review Process

1. Maintainers will review your PR
2. Address any feedback or requested changes
3. Update your branch if needed:
   ```bash
   git add .
   git commit -m "Address PR feedback"
   git push origin feature/my-feature
   ```
4. Once approved, your PR will be merged!

---

## Reporting Bugs

### Before Reporting

- Check if the issue already exists
- Try to reproduce the bug consistently
- Gather relevant information

### Bug Report Template

Create an issue with this information:

```markdown
**Describe the Bug**
Clear description of what went wrong.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen instead.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., macOS 14.1]
- Browser: [e.g., Chrome 120]
- Node.js: [e.g., 20.10.0]
- Version: [e.g., 2.0.0]

**Additional Context**
Any other relevant information.
```

---

## Suggesting Features

We welcome feature suggestions! Create an issue with:

```markdown
**Feature Description**
Clear description of the proposed feature.

**Use Case**
Why would this feature be useful?

**Proposed Solution**
How would you like this implemented?

**Alternatives Considered**
Other approaches you've thought about.

**Additional Context**
Mockups, examples, or references.
```

---

## Development Tips

### VS Code Setup

Recommended extensions:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets
- GitLens

### Debugging

**Backend:**
```bash
# Add console.log statements
console.log('[DEBUG]', variable);

# Use Node.js debugger
node --inspect dist/index.js
```

**Frontend:**
```jsx
// React DevTools (browser extension)
// Console logging
console.log('[Component]', props);

// Debugging network requests
// Check Network tab in DevTools
```

### Hot Reloading

- Backend: `npm run dev` (auto-restarts on changes)
- Frontend: Vite HMR (instant updates)

---

## Areas for Contribution

Looking for where to start? Here are some ideas:

### High Priority
- [ ] Add automated tests (Jest, Vitest)
- [ ] Implement user authentication
- [ ] Add workflow search/filter
- [ ] Export workflows to PDF/JSON
- [ ] Add more AI provider options

### Medium Priority
- [ ] Improve error handling
- [ ] Add loading states
- [ ] Implement caching
- [ ] Add workflow templates library
- [ ] Mobile app (React Native)

### Documentation
- [ ] Add API examples in more languages
- [ ] Create video tutorials
- [ ] Improve setup guides
- [ ] Add architecture diagrams

### Good First Issues
- Look for issues labeled `good first issue`
- Documentation improvements
- UI/UX enhancements
- Bug fixes

---

## Community

### Get Help

- **GitHub Issues**: For bugs and features
- **Discussions**: For questions and ideas
- **Email**: [Your contact email]

### Stay Updated

- Watch the repository for notifications
- Check the CHANGELOG for updates
- Follow releases

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in the project

---

## Questions?

If you have questions about contributing, feel free to:
- Open a discussion on GitHub
- Create an issue with the `question` label
- Reach out to maintainers

---

**Thank you for contributing to MCP Project Manager!** Your contributions help make this project better for everyone.

**Last Updated**: January 2025
