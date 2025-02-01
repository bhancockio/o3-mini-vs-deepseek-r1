import httpx
import uvicorn
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# For development, allow all origins (including "null").
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base URL for your Ollama API server running on port 11434
OLLAMA_BASE_URL = "http://localhost:11434"


@app.api_route(
    "/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
)
async def generic_proxy(full_path: str, request: Request):
    """
    Catch-all proxy route.
    Forward every request to the Ollama API (non-streaming),
    preserving path, query parameters, HTTP method, headers, and body.
    """
    # Construct the target URL, including query parameters (if any)
    query = request.url.query
    target_url = f"{OLLAMA_BASE_URL}/{full_path}"
    if query:
        target_url = f"{target_url}?{query}"

    # Prepare headers - remove the "origin" header because the target API does not allow it.
    headers = dict(request.headers)
    headers.pop("origin", None)

    method = request.method
    body = await request.body()

    # Set timeout to 2 minutes (120 seconds)
    timeout = httpx.Timeout(120.0)

    # Make a normal (non-streaming) HTTP request.
    async with httpx.AsyncClient(timeout=timeout) as client:
        proxied_response = await client.request(
            method, target_url, headers=headers, data=body
        )

    return Response(
        content=proxied_response.content,
        status_code=proxied_response.status_code,
        headers=dict(proxied_response.headers),
    )


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3000, reload=True)
