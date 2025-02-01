// Global variables to hold conversation state, history and streaming control.
let currentConversation = []; // Array of { role: "user"/"assistant", content: "..." }
let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];
let currentChatId = Date.now(); // Unique identifier for the current conversation
let autoSaveInterval = null;
let abortController = null;

// DOM elements
const modelSelect = document.getElementById("model-select");
const refreshBtn = document.getElementById("refresh-models");
const loadingIndicator = document.getElementById("loading-indicator");
const newChatBtn = document.getElementById("new-chat");
const sendBtn = document.getElementById("send");
const chatInput = document.getElementById("chat-input");
const messagesContainer = document.getElementById("messages");
const stopBtnContainer = document.getElementById("stop-button-container");
const stopBtn = document.getElementById("stop-generation");

const historyList = document.getElementById("history-list");
const toggleHistoryBtn = document.getElementById("toggle-history");
const exportHistoryBtn = document.getElementById("export-history");
const importHistoryBtn = document.getElementById("import-history");
const importFileInput = document.getElementById("import-file");

// ------------------------------------------------------------------
// Model Selector Functions
// ------------------------------------------------------------------
async function loadModels() {
  loadingIndicator.classList.remove("hidden");
  try {
    const response = await fetch("http://localhost:3000/api/tags");
    const data = await response.json();
    // Clear the select options.
    modelSelect.innerHTML = "";
    if (data.models && data.models.length) {
      data.models.forEach((model) => {
        const option = document.createElement("option");
        // You can display more info (such as size or version) from model.details if available.
        option.value = model.name;
        option.textContent = `${model.name} ${
          model.details ? "(" + model.details.parameter_size + ")" : ""
        }`;
        modelSelect.appendChild(option);
      });
    } else {
      const option = document.createElement("option");
      option.textContent = "No models available";
      modelSelect.appendChild(option);
    }
  } catch (err) {
    console.error("Error loading models:", err);
    modelSelect.innerHTML = `<option>Error loading models</option>`;
  } finally {
    loadingIndicator.classList.add("hidden");
  }
}

// ------------------------------------------------------------------
// Chat Interface and Streaming Functions
// ------------------------------------------------------------------
function appendMessage(role, content, isStreaming = false) {
  const messageEl = document.createElement("div");
  messageEl.classList.add("message", role);
  messageEl.innerHTML = renderMarkdown(content);

  // Add hover actions (Copy and, for bot messages, Regenerate)
  const actionsContainer = document.createElement("div");
  actionsContainer.classList.add("message-actions");

  const copyBtn = document.createElement("button");
  copyBtn.textContent = "Copy";
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(content).then(() => {
      alert("Copied to clipboard!");
    });
  });
  actionsContainer.appendChild(copyBtn);

  if (role === "bot" && !isStreaming) {
    const regenerateBtn = document.createElement("button");
    regenerateBtn.textContent = "Regenerate";
    regenerateBtn.addEventListener("click", () => {
      regenerateResponse();
    });
    actionsContainer.appendChild(regenerateBtn);
  }

  messageEl.appendChild(actionsContainer);
  messagesContainer.appendChild(messageEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  return messageEl;
}

// Helper to update an existing message element (e.g. while streaming)
function updateMessage(messageEl, content) {
  messageEl.innerHTML = renderMarkdown(content);
  // Reattach actions (since we overwrite innerHTML)
  const actionsContainer = document.createElement("div");
  actionsContainer.classList.add("message-actions");

  const copyBtn = document.createElement("button");
  copyBtn.textContent = "Copy";
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(content).then(() => {
      alert("Copied to clipboard!");
    });
  });
  actionsContainer.appendChild(copyBtn);

  // For in-flight bot messages, we do not show regenerate yet.
  messageEl.appendChild(actionsContainer);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Render Markdown text to HTML and apply syntax highlighting
function renderMarkdown(text) {
  const html = marked.parse(text);
  // Delay the highlighting until next tick so that marked has inserted code blocks.
  setTimeout(() => {
    document.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block);
    });
  }, 0);
  return html;
}

// Send user message and stream bot response
async function sendChatMessage() {
  const userMessage = chatInput.value.trim();
  if (!userMessage) return;
  // Append user message to UI and conversation history
  appendMessage("user", userMessage);
  currentConversation.push({ role: "user", content: userMessage });
  chatInput.value = "";
  autoResizeTextArea();

  // Create a placeholder for the bot's streaming response
  const botMessageEl = appendMessage("bot", "");
  // Setup for stopping the stream if needed
  abortController = new AbortController();
  stopBtnContainer.classList.remove("hidden");

  // Prepare payload for the chat API – include our conversation so far.
  const payload = {
    model: modelSelect.value,
    messages: currentConversation,
    stream: true,
  };

  try {
    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: abortController.signal,
    });

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let botResponse = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // Assume each JSON object is newline-delimited.
      let parts = buffer.split("\n");
      buffer = parts.pop();
      for (let part of parts) {
        if (part.trim() === "") continue;
        try {
          const json = JSON.parse(part);
          // Append the streamed word/portion to our bot message.
          if (json.message && json.message.content) {
            botResponse += json.message.content;
            updateMessage(botMessageEl, botResponse);
          }
        } catch (err) {
          // If JSON parsing fails, skip that part.
          console.error("JSON parse error:", err);
        }
      }
    }
    // Final update in case there is any buffered data
    if (buffer.trim()) {
      try {
        const json = JSON.parse(buffer);
        if (json.message && json.message.content) {
          botResponse += json.message.content;
          updateMessage(botMessageEl, botResponse);
        }
      } catch (err) {
        console.error("Final JSON parse error:", err);
      }
    }
    // Add the final bot response to conversation history.
    currentConversation.push({ role: "assistant", content: botResponse });
  } catch (err) {
    console.error("Error during chat stream:", err);
    // Optionally, show an error message in the UI.
    updateMessage(botMessageEl, botResponse + "\n\n**[Response interrupted]**");
  } finally {
    stopBtnContainer.classList.add("hidden");
    // Auto-save current conversation once the response is complete
    saveCurrentChat();
  }
}

// Regenerate the last bot message (removes the previous bot response and re-queries using the last user message)
function regenerateResponse() {
  // Remove the last assistant message from conversation history if it exists
  if (
    currentConversation.length &&
    currentConversation[currentConversation.length - 1].role === "assistant"
  ) {
    currentConversation.pop();
  }
  // Remove the last bot message from UI
  const botMessages = document.querySelectorAll(".message.bot");
  if (botMessages.length > 0) {
    botMessages[botMessages.length - 1].remove();
  }
  // Re-send the last user message (the conversation continues as if the bot response is missing)
  sendChatMessage();
}

// Stop the current streaming generation
function stopGeneration() {
  if (abortController) {
    abortController.abort();
    stopBtnContainer.classList.add("hidden");
  }
}

// ------------------------------------------------------------------
// Chat History functions
// ------------------------------------------------------------------

// Save the current conversation to the chat history and localStorage
function saveCurrentChat() {
  if (currentConversation.length === 0) return;
  // Find an existing conversation with currentChatId or create a new one.
  const existingChatIndex = chatHistory.findIndex(
    (chat) => chat.id === currentChatId
  );
  const chatData = {
    id: currentChatId,
    messages: currentConversation.slice(),
    timestamp: Date.now(),
  };
  if (existingChatIndex >= 0) {
    chatHistory[existingChatIndex] = chatData;
  } else {
    chatHistory.unshift(chatData);
  }
  localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  renderChatHistory();
}

// Render the chat history list in the sidebar
function renderChatHistory() {
  historyList.innerHTML = "";
  chatHistory.forEach((chat) => {
    const li = document.createElement("li");
    // Display a title using the timestamp or the first user message
    const title =
      chat.messages.length && chat.messages[0].content
        ? chat.messages[0].content.substring(0, 20) + "..."
        : "Chat " + new Date(chat.timestamp).toLocaleTimeString();
    li.textContent = title;
    // On click, load the conversation.
    li.addEventListener("click", () => loadChat(chat.id));
    // Add a delete button for each conversation.
    const delBtn = document.createElement("button");
    delBtn.textContent = "×";
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteChat(chat.id);
    });
    li.appendChild(delBtn);
    historyList.appendChild(li);
  });
}

function loadChat(chatId) {
  const chat = chatHistory.find((chat) => chat.id === chatId);
  if (!chat) return;
  // Load messages into UI.
  messagesContainer.innerHTML = "";
  currentConversation = chat.messages.slice();
  currentChatId = chat.id;
  currentConversation.forEach((msg) => appendMessage(msg.role, msg.content));
}

function deleteChat(chatId) {
  chatHistory = chatHistory.filter((chat) => chat.id !== chatId);
  localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  renderChatHistory();
}

// Start a new chat — archive the current one.
function newChat() {
  saveCurrentChat();
  currentConversation = [];
  currentChatId = Date.now();
  messagesContainer.innerHTML = "";
}

// Export chat history as a JSON file.
function exportHistory() {
  const dataStr = JSON.stringify(chatHistory, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "chatHistory.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Import chat history from a JSON file.
function importHistory(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        chatHistory = imported;
        localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
        renderChatHistory();
      } else {
        alert("Invalid chat history file.");
      }
    } catch (err) {
      console.error("Error importing chat history:", err);
      alert("Error importing chat history.");
    }
  };
  reader.readAsText(file);
}

// ------------------------------------------------------------------
// Textarea auto-resize
// ------------------------------------------------------------------
function autoResizeTextArea() {
  chatInput.style.height = "auto";
  chatInput.style.height = chatInput.scrollHeight + "px";
}

// ------------------------------------------------------------------
// Event Listeners
// ------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  loadModels();
  renderChatHistory();
  autoResizeTextArea();

  refreshBtn.addEventListener("click", loadModels);
  newChatBtn.addEventListener("click", newChat);
  sendBtn.addEventListener("click", sendChatMessage);

  chatInput.addEventListener("input", autoResizeTextArea);
  // Allow sending message with Enter; use Ctrl+Enter if you wish to force newlines.
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.ctrlKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });
  stopBtn.addEventListener("click", stopGeneration);
  toggleHistoryBtn.addEventListener("click", () => {
    const historyEl = document.getElementById("chat-history");
    if (
      historyEl.style.display === "none" ||
      historyEl.classList.contains("hidden")
    ) {
      historyEl.style.display = "block";
      toggleHistoryBtn.textContent = "Hide";
    } else {
      historyEl.style.display = "none";
      toggleHistoryBtn.textContent = "Show";
    }
  });
  exportHistoryBtn.addEventListener("click", exportHistory);
  importHistoryBtn.addEventListener("click", () => {
    importFileInput.click();
  });
  importFileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      importHistory(e.target.files[0]);
    }
  });

  // Auto-save conversation every 15 seconds
  autoSaveInterval = setInterval(saveCurrentChat, 15000);
});
