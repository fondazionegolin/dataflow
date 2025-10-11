# 🤖 Chatbot & Terminal Nodes Guide

## 📦 Available Nodes

### Chatbot Nodes (Category: `chatbot`)

#### 1. **Bot Message** (`chatbot.message`)
Display a message from the bot.
- **Icon**: 💬
- **Inputs**: trigger (optional)
- **Outputs**: message, next
- **Params**:
  - `message_text`: The message to display
  - `delay_ms`: Typing delay simulation (default: 500ms)
  - `session_id`: Conversation session ID

**Example**: "Hello! How can I help you?"

---

#### 2. **User Input** (`chatbot.user_input`)
Capture input from the user.
- **Icon**: ✍️
- **Inputs**: trigger (optional)
- **Outputs**: user_response, next
- **Params**:
  - `prompt`: Prompt to show user
  - `input_type`: text | choice | number
  - `choices`: Comma-separated options (for choice type)
  - `default_response`: Default for testing
  - `session_id`: Session ID

**Example**: Prompt: "What's your name?"

---

#### 3. **Intent Classifier** (`chatbot.intent_classifier`)
Classify user intent using keywords or AI.
- **Icon**: 🎯
- **Inputs**: user_message
- **Outputs**: intent, confidence, next
- **Params**:
  - `intents`: JSON mapping intents to keywords
  - `use_ai`: Use OpenAI for classification
  - `confidence_threshold`: Minimum confidence (0-1)
  - `default_intent`: Fallback intent

**Example Intents**:
```json
{
  "greeting": ["hello", "hi", "hey"],
  "help": ["help", "support", "assist"],
  "goodbye": ["bye", "goodbye", "exit"]
}
```

---

#### 4. **Context Manager** (`chatbot.context`)
Manage conversation variables.
- **Icon**: 📝
- **Inputs**: value (optional)
- **Outputs**: result, context
- **Params**:
  - `operation`: set | get | clear | list
  - `key`: Variable key
  - `default_value`: Default if not found
  - `session_id`: Session ID

**Example**: Store user name: `key="user_name"`, `operation="set"`

---

#### 5. **Router** (`chatbot.router`)
Route conversation based on conditions.
- **Icon**: 🔀
- **Inputs**: value
- **Outputs**: route_greeting, route_help, route_goodbye, route_default
- **Params**:
  - `routing_key`: Key to route on (e.g., "intent")
  - `routes`: JSON mapping values to outputs

**Example Routes**:
```json
{
  "greeting": "route_greeting",
  "help": "route_help",
  "goodbye": "route_goodbye"
}
```

---

#### 6. **Conversation History** (`chatbot.history`)
Retrieve conversation history.
- **Icon**: 📜
- **Outputs**: history (table), summary
- **Params**:
  - `session_id`: Session ID
  - `max_messages`: Max messages to return

---

#### 7. **Choice Buttons** (`chatbot.choice_buttons`)
Display selectable buttons.
- **Icon**: 🔘
- **Inputs**: trigger (optional)
- **Outputs**: selected, index
- **Params**:
  - `prompt`: Prompt text
  - `choices`: Comma-separated choices
  - `default_choice`: Default index for testing

**Example**: "Option 1, Option 2, Option 3"

---

### Terminal Nodes (Category: `terminal`)

#### 1. **Execute Command** (`terminal.execute_command`)
Execute a shell command.
- **Icon**: ⚡
- **Inputs**: command (optional)
- **Outputs**: stdout, stderr, exit_code
- **Params**:
  - `command`: Shell command
  - `shell`: bash | sh | zsh | fish
  - `timeout`: Timeout in seconds
  - `working_dir`: Working directory
  - `capture_output`: Capture output

**Example**: `command="ls -la"`

---

#### 2. **Command Builder** (`terminal.command_builder`)
Build a command from components.
- **Icon**: 🔧
- **Inputs**: args (optional)
- **Outputs**: command
- **Params**:
  - `base_command`: Base command (e.g., "ls")
  - `flags`: Flags (e.g., "-la")
  - `arguments`: Additional arguments
  - `pipe_to`: Command to pipe to

**Example**: `base_command="find"`, `flags="."`, `arguments="-name '*.txt'"`

---

#### 3. **Command Selector** (`terminal.command_selector`)
Select from a list of commands.
- **Icon**: 📋
- **Inputs**: commands (list)
- **Outputs**: selected_command, selected_index, description
- **Params**:
  - `title`: Title to display
  - `default_index`: Default selection
  - `show_description`: Show descriptions

**Example Input**:
```json
[
  {"cmd": "ls -la", "desc": "List all files"},
  {"cmd": "pwd", "desc": "Print working directory"}
]
```

---

#### 4. **Terminal Input** (`terminal.input`)
Capture user input.
- **Icon**: ⌨️
- **Outputs**: user_input
- **Params**:
  - `prompt`: Prompt text
  - `default_input`: Default for testing
  - `multiline`: Allow multiline

---

#### 5. **Terminal Output** (`terminal.output`)
Display formatted output.
- **Icon**: 🖥️
- **Inputs**: content
- **Outputs**: displayed
- **Params**:
  - `format`: plain | json | table | code
  - `color`: default | green | red | yellow | blue
  - `prefix`: Prefix (e.g., "$ ")

---

## 🎯 Example Workflows

### Workflow 1: AI Terminal Assistant

```
Terminal Input
  ↓ (user_input)
String Format → "Suggest Linux commands for: {user_input}"
  ↓ (formatted_prompt)
OpenAI Chat → System: "You are a Linux expert. Return JSON array..."
  ↓ (response)
Parse JSON → Extract commands array
  ↓ (commands)
Command Selector → User selects command
  ↓ (selected_command)
Execute Command → Run the command
  ↓ (stdout)
Terminal Output → Display result
```

**OpenAI System Prompt**:
```
You are a Linux command expert. Given a user request, suggest 3-5 relevant Linux commands.
Return a JSON array with this format:
[
  {"cmd": "command here", "desc": "what it does"},
  ...
]
```

---

### Workflow 2: Customer Support Chatbot

```
Bot Message → "Hello! How can I help you?"
  ↓
User Input → Capture user message
  ↓ (user_response)
Intent Classifier → Classify intent
  ↓ (intent)
Router → Route based on intent
  ├─→ route_greeting → Bot Message → "Nice to meet you!"
  ├─→ route_help → Bot Message → "What do you need help with?"
  └─→ route_default → OpenAI Chat → AI fallback response
```

---

### Workflow 3: Pizza Order Bot

```
Bot Message → "Welcome! Want to order a pizza?"
  ↓
Choice Buttons → ["Yes", "No"]
  ↓ (selected)
If selected == "Yes":
  ↓
  Bot Message → "What type of pizza?"
  ↓
  Choice Buttons → ["Margherita", "Pepperoni", "Custom"]
  ↓ (pizza_type)
  Context Manager → Set "pizza_type"
  ↓
  Bot Message → "What size?"
  ↓
  Choice Buttons → ["Small", "Medium", "Large"]
  ↓ (size)
  Context Manager → Set "size"
  ↓
  Bot Message → "Order summary: {pizza_type} pizza, {size}"
  ↓
  Choice Buttons → ["Confirm", "Cancel"]
  ↓
  If "Confirm":
    Bot Message → "Order placed! 🍕"
```

---

### Workflow 4: Interactive File Search

```
Terminal Input → "Enter search pattern:"
  ↓ (pattern)
Command Builder
  - base_command: "find"
  - flags: "."
  - arguments: "-name '*{pattern}*'"
  ↓ (command)
Execute Command
  ↓ (stdout)
Terminal Output → Display results
```

---

## 💡 Tips & Best Practices

### 1. **Session Management**
Always use the same `session_id` across nodes in a conversation to maintain context.

### 2. **Context Variables**
Use Context Manager to store user data:
- User name
- Preferences
- Previous selections
- Conversation state

### 3. **Intent Classification**
- Start with keyword-based classification (fast, free)
- Enable AI classification for complex queries
- Set appropriate confidence thresholds

### 4. **Error Handling**
Always provide a default route in Router nodes for unmatched intents.

### 5. **Testing**
Use `default_response` and `default_choice` parameters to test workflows without manual input.

### 6. **Command Safety**
Be careful with Execute Command node:
- Set appropriate timeouts
- Validate user input before executing
- Use working_dir to limit scope
- Consider security implications

---

## 🚀 Advanced Patterns

### Pattern 1: Conversation Loop
```
Start → Bot Message → User Input → Intent Classifier → Router
                                                          ↓
                                                    [Loop back to Bot Message]
```

### Pattern 2: Context-Aware Responses
```
User Input → Context Manager (get "user_name")
  ↓
Bot Message → "Hello {user_name}! How can I help?"
```

### Pattern 3: Multi-Step Form
```
Step 1: Collect Name → Store in Context
Step 2: Collect Email → Store in Context
Step 3: Collect Issue → Store in Context
Step 4: Summary → Display all collected data
Step 5: Confirmation → Submit or Edit
```

### Pattern 4: AI + Command Execution
```
User Request → OpenAI → Parse Commands → Command Selector → Execute → Display Result
```

---

## 🎨 UI Considerations

### Chat Preview
Nodes with `type: "chat_message"` in preview will display as chat bubbles:
- Bot messages: Left-aligned, blue
- User messages: Right-aligned, gray

### Terminal Preview
Nodes with `type: "terminal_output"` will display in monospace font with terminal styling.

### Command Selector Preview
Interactive list with:
- Arrow navigation
- Descriptions on hover
- Selection highlight

---

## 📝 Future Enhancements

- [ ] Real-time user input (WebSocket-based)
- [ ] Terminal emulator (xterm.js embedded)
- [ ] Voice input/output
- [ ] Multi-language support
- [ ] Sentiment analysis
- [ ] Conversation analytics dashboard
- [ ] Export conversation as script
- [ ] Workflow templates library

---

## 🐛 Troubleshooting

### Issue: Intent not detected
- Check keyword spelling in intent definitions
- Enable AI classification
- Lower confidence threshold

### Issue: Context variables not persisting
- Ensure same `session_id` across all nodes
- Check operation is "set" not "get"

### Issue: Command execution fails
- Check command syntax
- Verify working directory exists
- Check timeout is sufficient
- Verify shell is available

---

## 📚 Resources

- OpenAI API: https://platform.openai.com/docs
- Linux Commands: https://ss64.com/bash/
- JSON Format: https://www.json.org/

---

**Happy Building! 🚀**
