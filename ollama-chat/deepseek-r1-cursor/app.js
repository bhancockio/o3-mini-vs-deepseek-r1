// Model Handling
let currentModel = "llama2";
let messages = [];

async function fetchModels() {
  try {
    const response = await fetch("http://localhost:3000/api/tags");
    const data = await response.json();
    const modelSelector = document.getElementById("model-selector");

    modelSelector.innerHTML = data.models
      .map(
        (model) => `
      <option value="${model.name}" ${
          model.name === currentModel ? "selected" : ""
        }>
        ${model.name} (${model.details.parameter_size}, ${
          model.details.quantization_level
        })
      </option>
    `
      )
      .join("");
  } catch (error) {
    console.error("Error fetching models:", error);
  }
}

// Chat Streaming Implementation
let abortController = null;

async function sendMessage(message) {
  messages.push({ role: "user", content: message });
  abortController = new AbortController();

  try {
    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: currentModel,
        messages: messages,
        stream: true,
      }),
      signal: abortController.signal,
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantMessage = { role: "assistant", content: "" };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((line) => line.trim());

      for (const line of lines) {
        const message = JSON.parse(line.replace("data: ", ""));
        if (message.message) {
          assistantMessage.content += message.message.content;
          updateChatUI(assistantMessage.content, true);
        }
        if (message.done) {
          messages.push(assistantMessage);
        }
      }
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Chat error:", error);
    }
  }
}

// UI Updates
function updateChatUI(content, isStreaming) {
  const chatContainer = document.getElementById("chat-container");
  const lastMessage = chatContainer.lastElementChild;

  if (isStreaming && lastMessage?.classList.contains("assistant")) {
    lastMessage.innerHTML = marked.parse(content);
  } else {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message assistant`;
    messageDiv.innerHTML = marked.parse(content);
    chatContainer.appendChild(messageDiv);
  }

  hljs.highlightAll();
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Event Listeners
document.getElementById("send-button").addEventListener("click", async () => {
  const input = document.getElementById("chat-input");
  const message = input.value.trim();

  if (message) {
    input.value = "";
    document
      .getElementById("chat-container")
      .appendChild(createUserMessage(message));
    await sendMessage(message);
  }
});

document.getElementById("stop-button").addEventListener("click", () => {
  if (abortController) {
    abortController.abort();
  }
});

// Initialize
fetchModels();
