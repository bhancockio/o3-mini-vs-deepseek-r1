# Ollama Proxy

This FastAPI proxy application forwards traffic from port **3000** to your local Ollama API running on port **11434**. It adds the required CORS headers so that your client (for example, served from [http://localhost:3000](http://localhost:3000)) can communicate with the API without running into cross-origin issues.

## Why Is This Needed?

The Ollama API does not include the necessary CORS headers. This prevents direct cross-origin calls from your client-side code if it's served from a different origin. The proxy solves this by:
- **Injecting the proper CORS headers:** Allowing your browser to perform cross-origin requests.
- **Forwarding requests transparently:** No need to modify your existing Ollama API.

## Setup Instructions

Follow these steps to set up and run your FastAPI proxy application:

1. **Create a Conda Environment with Python 3.12**

   Open your terminal and run:
   ```bash
   conda create -n ollama-proxy python=3.12 -y
   ```

2. **Activate the Environment**

   Once the environment is created, activate it with:
   ```bash
   conda activate ollama-proxy
   ```

3. **Install Required Packages**

   With the environment activated, install the necessary packages by running:
   ```bash
   pip install fastapi uvicorn httpx async-timeout
   ```

4. **Run the Proxy Server**

   You can start the proxy server using the built-in command in `main.py`:
   ```bash
   python main.py
   ```
   This will start the server on port **3000** and forward all API calls to the Ollama API running on port **11434** with the proper CORS headers.

Your client application can now safely access the API via `http://localhost:3000` without encountering CORS issues.
