This is the Lakeland Hub App. We use React. Always use modern functional components and make sure the styling matches the blue and slate colors used in HubShell.js.
# Tech Stack
* We are using React (JavaScript).
* We use modern Functional Components with Hooks (like useState and useEffect). Do NOT use old Class Components.
* We are using Tailwind CSS for styling in some files, and inline styles in others. 
* Our database is Azure Cosmos DB.
# App Context
* This is the "Lakeland Hub App", built for Lakeland Regional School.
* We operate within a Level IV residential treatment center. 
* The app tracks student data, grades, KTEA-III assessment scores, and generates Discharge Narratives.
* Security and Privacy: This app handles highly sensitive student data. Always keep HIPAA and FERPA compliance in mind. We use an Audit Log for tracking user actions.
# Coding Rules for the AI
* Write concise, highly efficient, and maintainable React code. Skip beginner-level explanations and avoid excessive inline comments.
* Prioritize industry best practices, performance, and clean architecture over simplified examples. 
* CRITICAL: Always check if a component needs to receive the `activeStudent` property (prop) so our global search bar keeps working across all pages.
# Architecture & Data Flow
* State Management: Use the existing `useStudent` hook from `StudentContext` for global student data (activeStudent, selectStudent, clearStudent). Do NOT rely on heavy prop-drilling.
* Database Calls: All Azure Cosmos DB interactions MUST be routed through the existing `cosmosService.js` singleton. Do not write raw fetch calls or initialize new Cosmos clients inside UI components.
* Component Structure: Keep business logic separated from the UI. Extract complex logic into custom hooks when appropriate.
# Styling Conventions
* Primary Styling: We are transitioning to Tailwind CSS for all new components. Use Tailwind utility classes instead of inline style objects (`style={{...}}`) whenever possible.
* Responsive Design: Ensure all new UI elements are responsive by default using Tailwind's `sm:`, `md:`, and `lg:` prefixes.
* Icons: We use `lucide-react` for iconography. Do not import other icon libraries unless explicitly asked.
# Naming Conventions & Quality
* Variables & Functions: Use strict `camelCase`. Function names must be action-oriented (e.g., `handleSave`, `fetchStudentData`).
* Components & Files: Use `PascalCase` for all React component names and their corresponding filenames (e.g., `GradeReporter.js`).
* Types/Interfaces: Even though we are in standard JavaScript, document expected prop structures using JSDoc comments above the component.
# Error Handling & Security
* Always wrap async/await database calls (like those to `cosmosService`) in `try/catch` blocks.
* Never expose raw database errors to the UI. Log the exact error to the console, but display a user-friendly, sanitized error message in the UI.
* Remember the HIPAA/FERPA context: Never console.log sensitive student information (like full names + medical data) in production-ready code.
# UX/UI Guidelines: Designing for Low Digital Literacy
* **Simplicity & Chunking:** Avoid choice overload. Break complex processes (like long forms or assessments) into smaller, digestible steps rather than overwhelming the user with a massive wall of inputs. Keep navigation shallow and avoid deep, hidden menus.
* **Plain Language (No Jargon):** Use simple, direct, and conversational language. Avoid tech-heavy terms; for example, use "Save Grades" instead of "Sync to Database" or "Authenticate". 
* **Explicit Visual Cues:** Never rely on icons alone. Always pair icons with clear, descriptive text labels so the action is unmistakable to someone who might not recognize standard web symbols.
* **Error Prevention & Forgiveness:** Low-tech users often fear "breaking" the system. Design clear "Back" or "Undo" options, and never make an action irreversible without a clear confirmation prompt. Use friendly, specific error messages that explain exactly how to fix the issue (e.g., "Oops, you forgot the student's grade") rather than generic error codes.
* **High Accessibility:** Ensure high color contrast between text and backgrounds. Use a minimum font size of 16px for readability, and ensure all buttons are large and easy to click or tap.
# Strict Tech Stack & Banned Practices
* React Patterns: STRICTLY use Functional Components and React Hooks. Do NOT use Class Components or legacy lifecycle methods (like componentDidMount).
* State Management: Do not introduce Redux or MobX. Rely entirely on React Context (`StudentContext.js`) and local state.
* Styling: NEVER use inline styles (e.g., `style={{ color: 'red' }}`). STRICTLY use Tailwind CSS utility classes for all new components.
* Banned Libraries: Do not suggest or import `moment.js` (use native Date or `date-fns`), `lodash` (use native JS array methods), or `axios` (use native `fetch` unless specifically working inside `cosmosService.js`).
# Strict Tech Stack & Banned Practices
* React Patterns: STRICTLY use Functional Components and React Hooks. Do NOT use Class Components or legacy lifecycle methods (like componentDidMount).
* State Management: Do not introduce Redux or MobX. Rely entirely on React Context (`StudentContext.js`) and local state.
* Styling: NEVER use inline styles (e.g., `style={{ color: 'red' }}`). STRICTLY use Tailwind CSS utility classes for all new components.
* Banned Libraries: Do not suggest or import `moment.js` (use native Date or `date-fns`), `lodash` (use native JS array methods), or `axios` (use native `fetch` unless specifically working inside `cosmosService.js`).
# AI Workflow & Reasoning Protocol
* 1. ALWAYS read the project context and existing files before suggesting new code.
* 2. MECE Task Breakdown: Before generating code for a complex feature, present a MECE (Mutually Exclusive, Collectively Exhaustive) step-by-step plan in the chat.
* 3. Wait for my confirmation on your MECE plan before writing the actual React code.
* 4. When writing code, output complete files. Do not use placeholders like `// ... rest of code here` unless specifically asked to summarize.
# Security & Data Privacy (HIPAA/FERPA Strict)
* Input Validation: ALWAYS validate and sanitize user inputs on all forms before sending data to `cosmosService.js`. Never trust raw user input.
* Logging: NEVER `console.log` or expose sensitive student PII (Personally Identifiable Information), medical data, or KTEA scores in the browser console.
* Error Handling: Fail securely. If a database call fails, do not show the raw Azure error to the user. Show a generic "System Error" and log the actual error silently.