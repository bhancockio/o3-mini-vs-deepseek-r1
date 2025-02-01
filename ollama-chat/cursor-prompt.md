# Build a ChatGPT-style Local Ollama Chat Website using HTML, CSS, and JavaScript

## Core Requirements

### 1. **Model Selector**
- **Dropdown Menu (top-left):**
  - **Live Model Fetch:** Automatically populate the dropdown by making a **real API request** to the proxy endpoint at `http://localhost:3000/api/tags`. This is critical because our proxy forwards requests to the Ollama API (running on port 11434) while injecting the required CORS headers.
  - **Display Details:** For each model, display its name along with available details such as version or size.
  - **Refresh Functionality:** Include a refresh button that calls the model endpoint again to update the model list in real time.
  - **Visual Feedback:** Show a loading indicator during the API call and while switching between models.
  - **User-Friendly Messaging:** If no models are available, display a clear message.

### 2. **Chat Interface**
- **Message Display:**
  - **User Messages:** Display user messages right-aligned with a light background.
  - **Bot Responses:** Display bot responses left-aligned with a dark background.
  - **Markdown & Syntax Highlighting:** Render messages using Markdown and apply syntax highlighting to code snippets.
  - **Streaming Responses:** Stream bot responses word-by-word with a smooth animation. **All API requests should be directed to `http://localhost:3000`**, where the proxy will forward the request to the Ollama API.
  - **Hover Actions:** Implement hover actions on messages for options such as “Copy” or “Regenerate” (which triggers a new API call).

- **Input System:**
  - **Text Input:** Provide a centered, bottom-aligned textarea that expands from 1 to 6 lines as needed.
  - **Sending Options:** Allow sending messages via Enter or Ctrl+Enter (based on a toggle).
  - **Stop Generation:** Display a “Stop” button while the bot is generating a response to allow immediate cancellation.

- **New Chat Button:**
  - **Purpose:** Include a dedicated "New Chat" button that, when clicked, will clear the current chat conversation. This allows the user to start a fresh conversation without any previous message history crowding the chat area.
  - **Behavior:** Clicking the "New Chat" button should reset the state of the chat interface (e.g. clear the message display and reset any conversation-specific state variables) and optionally archive or save the current conversation if needed.

### 3. **Chat History**
- **Sidebar Organization:**
  - **Collapsible Panel:** Include a collapsible left sidebar to organize conversations chronologically.
  - **Conversation List:** Display a list of past conversations with options to search/filter them.
  - **Chat Actions:** Allow renaming, deleting, or archiving of conversations.
  - **New Chat Integration:** The "New Chat" button in the chat interface should allow users to begin a new conversation while keeping the previous conversations saved in this sidebar.

- **Data Persistence:**
  - **LocalStorage & IndexedDB:** Use LocalStorage for recent history and IndexedDB for larger datasets.
  - **Auto-Save:** Automatically save the current conversation every 15 seconds.
  - **Export/Import:** Provide functionality to export chat history as a JSON file and import it back.

## Important Notes

- **Proxy Setup:**  
  The proxy is already built and running on port 3000. Because the Ollama API does not include the required CORS headers, all API calls must be directed to this proxy. The proxy forwards these requests to the Ollama API instance running on port 11434, ensuring cross-origin requests are properly allowed by your browser.

- **API Endpoints:**  
  For example:
  - Fetching models should use: `http://localhost:3000/api/tags`
  - Chat interactions should be conducted through endpoints like `http://localhost:3000/api/chat`

By following these instructions, you'll be using the already built proxy to seamlessly handle CORS issues while communicating with your local Ollama API, and users will be able to create new chats easily using the dedicated "New Chat" button.
