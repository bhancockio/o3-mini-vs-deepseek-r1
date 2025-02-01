# Ollama Chat Interface and Proxy Setup

**Important:** Before running any client code samples (such as the Chat interface or Model Selector), you **must** start the Ollama proxy. The Ollama API does not include the required CORS headers, so the proxy is necessary to forward all API calls (from port **3000**) to the local Ollama API (running on port **11434**) while injecting the appropriate CORS headers.

## Setup Overview

### 1. Start the Ollama Proxy

- **Navigate to the Proxy Folder:**
  Change into the `ollama-proxy` directory:
  ```bash
  cd ollama-chat/ollama-proxy
  ```

- **Create a Conda Environment with Python 3.12:**
  ```bash
  conda create -n ollama-proxy python=3.12 -y
  conda activate ollama-proxy
  ```

- **Install Required Packages:**
  ```bash
  pip install fastapi uvicorn httpx async-timeout
  ```

- **Run the Proxy Server:**
  Start the FastAPI proxy by running:
  ```bash
  python main.py
  ```
  This will launch the server on port **3000**, which forwards all requests to the Ollama API running on port **11434** with the proper CORS headers.

### 2. Run the Chat Client

- With the proxy server running in the background, you can now run your client-side code (e.g., the Chat interface described in [cursor-prompt.md](./cursor-prompt.md)).
- **Note:** Ensure that all API requests in your client are directed to `http://localhost:3000` so that they are properly forwarded by the proxy.

## Project Structure

- **ollama-proxy/**
  - Contains the FastAPI proxy application (`main.py`) and its setup instructions.
- **cursor-prompt.md**
  - Contains the instructions and code samples for building the ChatGPT-style Local Ollama Chat Interface.

## Why This Setup?

The Ollama API does not include CORS headers, meaning any direct API calls from client-side code (which might be served from a different port, such as 3000) will fail due to cross-origin restrictions. By running the proxy first, you ensure that:
- **CORS Headers are Applied:** Your browser is allowed to make cross-origin API calls.
- **All API Traffic is Routed Properly:** The proxy forwards requests to the Ollama API on port 11434 seamlessly.

Happy coding!
