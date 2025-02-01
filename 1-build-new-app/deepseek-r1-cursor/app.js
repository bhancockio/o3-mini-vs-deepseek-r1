// Model Selector
let currentModel = "llama2";
const modelSelector = document.getElementById("model-selector");
const refreshBtn = document.getElementById("refresh-models");

async function fetchModels() {
  try {
    modelSelector.innerHTML = "<option>Loading models...</option>";
    const response = await fetch("http://localhost:3000/api/tags");
    const data = await response.json();

    modelSelector.innerHTML = data.models.length
      ? data.models.map(
          (m) =>
            `<option value="${m.name}" ${
              m.name === currentModel ? "selected" : ""
            }>${m.name}</option>`
        )
      : "<option>No models available</option>";
  } catch (error) {
    console.error("Model fetch error:", error);
    modelSelector.innerHTML = "<option>Error loading models</option>";
  }
}

// Chat Interaction
let messages = [];
const chatHistory = document.getElementById("chat-history");
const messageInput = document.getElementById("message-input");

async function sendMessage() {
  const userMessage = messageInput.value.trim();
  if (!userMessage) return;

  // Add user message
  messages.push({ role: "user", content: userMessage });
  renderMessage(userMessage, "user");
  messageInput.value = "";

  // Add assistant message placeholder
  const assistantMessage = { role: "assistant", content: "" };
  messages.push(assistantMessage);
  const messageElement = renderMessage("", "assistant");

  try {
    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: currentModel,
        messages: messages,
        stream: true,
      }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((line) => line.trim());

      for (const line of lines) {
        const message = JSON.parse(line);
        if (message.message?.content) {
          assistantMessage.content += message.message.content;
          messageElement.innerHTML = marked.parse(assistantMessage.content);
        }
      }
    }
  } catch (error) {
    console.error("Chat error:", error);
    assistantMessage.content += "\n\n**Error generating response**";
    messageElement.innerHTML = marked.parse(assistantMessage.content);
  }
}

// New Chat Functionality
document.getElementById("new-chat").addEventListener("click", () => {
  messages = [];
  chatHistory.innerHTML = "";
});

// Initial setup
fetchModels();
refreshBtn.addEventListener("click", fetchModels);
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
