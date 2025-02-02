Please implement the entire following solution:

# Streamlit-based Chat UI for CrewAI: Developer Prompt

## Goal

We want to build a new feature in the CrewAI repository that adds a modern, graphical chat interface. When a user runs the command `crewai chat --ui`, the application should launch a ChatGPT-like interface built with Streamlit rather than using the existing CLI chat loop.

## Key Requirements

- **UI Framework and Layout**  
  - **Framework:** Use Streamlit to build the web interface.
  - **Design:** The UI should mimic ChatGPT with a central chat display area and an input area at the bottom.
    - Display user messages on the right (with a background color such as light green or similar) and assistant responses on the left (with a neutral background).
    - The layout should be clean and modern.
  - **Session:** The interface only needs to support a single, in-memory chat session (no persistent conversation history).

- **Core Chat Functionality Integration**  
  - **Reuse Existing Logic:** Leverage the existing core chat functions from `crew_chat.py` (and related modules like `crew.py` and `crew_agent_executor.py`), such as:
    - `initialize_chat_llm`
    - `generate_crew_chat_inputs`
    - `build_system_message`
  - These functions should be reused to set up the language model backend and construct the necessary messages.

- **Asynchronous Operations**  
  - The interface must make asynchronous calls to the LLM so that the UI remains responsive.
    - Use `asyncio` and (if needed) `run_in_executor` or `asyncio.to_thread` to wrap synchronous LLM calls.
    - Show a spinner (using Streamlit's facilities like `st.spinner`) while waiting for the LLM response.

- **State Management and Messaging**  
  - Use Streamlit's session state (`st.session_state`) to store:
    - The conversation thread as a list of message objects (each with a role, either user or assistant, and content).
    - The initialized chat LLM instance (to avoid re-initializing it for every message).
  - On pressing the "Send" button:
    - Append the user's message to the conversation.
    - Call the LLM asynchronously to get the assistant's response.
    - Update the conversation with the assistant's reply and re-render the chat window.

- **Error Handling**  
  - Wrap all LLM calls and asynchronous operations with proper error handling.
  - Use Streamlit's `st.error()` to display any errors that occur, ensuring the UI provides clear feedback when something goes wrong.

- **CLI Integration**  
  - Modify the existing CLI command in `src/crewai/cli/cli.py` for the `chat` command:
    - Add a `--ui` flag.
    - When the flag is provided, launch the new Streamlit-based UI instead of the CLI chat loop.
    - One common approach is to invoke the Streamlit app via a subprocess call, for example, running:  
      `streamlit run src/crewai/cli/crew_chat_ui.py`.

## Additional Workflow Context

- **New Crew Projects:**  
  Developers will create new crews using the `crewai create crew` command. This command scaffolds a new crew project with all necessary configuration details such as the crew's tasks, agents, and required input fields.
  
- **Using the Chat UI in a Crew Project:**  
  Once a new crew project is created, users will interact with it via the chat interface by issuing the `crewai chat --ui` command. The chat UI must correctly initialize using the configuration (and chat logic) defined in the newly created crew project.

- **Consistent Behavior Across Interfaces:**  
  The Streamlit UI should fully reuse all the chat logic from the CLI version (located in `crew_chat.py`) to ensure behavior and configuration remain consistent. Whether using the CLI or the UI, the assistant's responses should be generated with the same parameters and context derived from the crew project.

## Design Considerations for Future Improvements

- **Styling Enhancements:**  
  Initial styling should focus on delivering a clean, ChatGPT-like layout. Future iterations may include refined CSS or additional customization using Streamlit components.

- **Extended Functionality:**  
  Although the current scope supports an in-memory chat session, further updates may incorporate persistent conversation history or multi-session support.

- **Documentation & Testing:**  
  - Update the project README and developer documentation to include instructions for using the new UI feature.
  - Verify that running `crewai chat --ui` launches the Streamlit interface with proper error handling, asynchronous LLM calls, and correct integration with the new crew project's configuration.

---

This updated prompt now emphasizes that developers create new crews using the `crewai create crew` command and then interact with those crews via the chat UI launched by `crewai chat --ui`. The AI agent must understand that the configuration and functionality defined during crew creation need to be honored when initializing the chat session in a new crew project.

Resources:
- @crew.py 
- @crew_agent_executor.py 
- @crew_chat.py 
