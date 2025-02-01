async function handleChatStream(response) {
  const reader = response.body.getReader();
  let partialLine = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Convert the Uint8Array to text
    const chunk = new TextDecoder().decode(value);
    const lines = (partialLine + chunk).split("\n");
    partialLine = lines.pop();

    for (const line of lines) {
      if (line.trim() === "") continue;

      const response = JSON.parse(line);
      if (response.done) {
        // Handle completion
        continue;
      }

      // Update UI with streamed content
      if (response.message?.content) {
        updateChatUI(response.message.content);
      }
    }
  }
}

class ChatHistory {
  constructor() {
    this.messages = [];
  }

  addMessage(role, content) {
    this.messages.push({ role, content });
  }

  getMessages() {
    return this.messages;
  }

  clear() {
    this.messages = [];
  }

  // Save to localStorage every 15 seconds
  startAutoSave() {
    setInterval(() => {
      localStorage.setItem("chatHistory", JSON.stringify(this.messages));
    }, 15000);
  }
}

async function sendChatRequest(message, history) {
  const response = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: selectedModel,
      messages: [...history, { role: "user", content: message }],
      stream: true,
      options: {
        temperature: 0.7,
        num_ctx: 4096,
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  return response;
}
