"""Visual chatbot nodes - easy branching conversations."""

from typing import Dict, List, Any
from datetime import datetime
import re

from core.types import (
    NodeSpec, PortSpec, ParamSpec, PortType, ParamType,
    NodeContext, NodeResult, CachePolicy
)
from core.registry import NodeExecutor, register_node


# Simple conversation state
_conversations: Dict[str, List[Dict]] = {}

# Variables storage per session
_variables: Dict[str, Dict[str, Any]] = {}


def get_session_variables(session_id: str = "default") -> Dict[str, Any]:
    """Get variables for a session."""
    if session_id not in _variables:
        _variables[session_id] = {}
    return _variables[session_id]


def set_variable(session_id: str, key: str, value: Any):
    """Set a variable for a session."""
    if session_id not in _variables:
        _variables[session_id] = {}
    _variables[session_id][key] = value
    print(f"💾 Salvato: {key} = {value}")


def replace_variables(text: str, session_id: str = "default") -> str:
    """Replace {variable_name} with actual values."""
    variables = get_session_variables(session_id)
    
    # Find all {variable_name} patterns
    pattern = r'\{([^}]+)\}'
    
    def replacer(match):
        var_name = match.group(1)
        if var_name in variables:
            return str(variables[var_name])
        return match.group(0)  # Keep original if not found
    
    return re.sub(pattern, replacer, text)


@register_node
class SimpleBotSayNode(NodeExecutor):
    """Bot says something - simple message node."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="chatbot.say",
            label="Bot Says",
            category="chatbot",
            description="Bot dice qualcosa all'utente",
            icon="💬",
            color="#4CAF50",
            inputs=[
                PortSpec(name="trigger", type=PortType.ANY, label="Start", required=False)
            ],
            outputs=[
                PortSpec(name="next", type=PortType.ANY, label="Next")
            ],
            params=[
                ParamSpec(
                    name="message",
                    type=ParamType.STRING,
                    label="Messaggio",
                    default="Ciao! Come posso aiutarti?",
                    description="Cosa dice il bot"
                )
            ],
            cache_policy=CachePolicy.MANUAL
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Bot says message."""
        import asyncio
        from main import broadcast_chat_message
        
        message = context.params.get("message", "")
        
        # Replace variables in message
        message = replace_variables(message)
        
        print(f"🤖 Bot: {message}")
        
        # Broadcast to chat panel with typing effect
        await broadcast_chat_message("bot_message", {
            "message": message,
            "typing": True  # Enable typing effect
        })
        
        # Wait 1 second before next message
        await asyncio.sleep(1.0)
        
        return NodeResult(
            outputs={"next": True},
            metadata={"message": message, "role": "bot"},
            preview={
                "type": "chat_message",
                "role": "bot",
                "message": message
            }
        )


@register_node
class SimpleUserInputNode(NodeExecutor):
    """User responds - captures what user says."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="chatbot.ask",
            label="Ask User",
            category="chatbot",
            description="Chiedi qualcosa all'utente",
            icon="❓",
            color="#2196F3",
            inputs=[
                PortSpec(name="trigger", type=PortType.ANY, label="Start", required=False)
            ],
            outputs=[
                PortSpec(name="response", type=PortType.PARAMS, label="Response")
            ],
            params=[
                ParamSpec(
                    name="question",
                    type=ParamType.STRING,
                    label="Domanda",
                    default="Come ti chiami?",
                    description="Cosa chiedi all'utente"
                ),
                ParamSpec(
                    name="test_response",
                    type=ParamType.STRING,
                    label="Risposta Test",
                    default="Mario",
                    description="Risposta di test per provare il flusso"
                )
            ],
            cache_policy=CachePolicy.MANUAL
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Ask user and get response."""
        import asyncio
        from main import broadcast_chat_message, chat_pending_input
        
        question = context.params.get("question", "")
        test_response = context.params.get("test_response", "")
        session_id = "default"
        
        print(f"❓ Bot chiede: {question}")
        
        # Broadcast question to chat panel
        await broadcast_chat_message("ask_user", {
            "question": question,
            "session_id": session_id
        })
        
        # Wait for user response from WebSocket (with timeout)
        future = asyncio.Future()
        chat_pending_input[session_id] = future
        
        try:
            # Wait max 60 seconds for user response
            user_response = await asyncio.wait_for(future, timeout=60.0)
            print(f"👤 User risponde: {user_response}")
        except asyncio.TimeoutError:
            # Fallback to test response if no user input
            user_response = test_response
            print(f"⏱️ Timeout - usando risposta test: {test_response}")
            if session_id in chat_pending_input:
                del chat_pending_input[session_id]
        
        return NodeResult(
            outputs={"response": user_response},
            metadata={
                "question": question,
                "response": user_response,
                "role": "user"
            },
            preview={
                "type": "chat_message",
                "role": "user",
                "message": user_response,
                "question": question
            }
        )


@register_node
class SimpleIfContainsNode(NodeExecutor):
    """Branch based on keywords - simple if/else."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="chatbot.if_contains",
            label="If Contains",
            category="chatbot",
            description="Se la risposta contiene certe parole → vai in un path",
            icon="🔀",
            color="#FF9800",
            inputs=[
                PortSpec(name="text", type=PortType.PARAMS, label="Text")
            ],
            outputs=[
                PortSpec(name="yes", type=PortType.ANY, label="Yes"),
                PortSpec(name="no", type=PortType.ANY, label="No")
            ],
            params=[
                ParamSpec(
                    name="keywords",
                    type=ParamType.STRING,
                    label="Parole Chiave",
                    default="ciao, salve, buongiorno",
                    description="Parole da cercare (separate da virgola)"
                ),
                ParamSpec(
                    name="case_sensitive",
                    type=ParamType.BOOLEAN,
                    label="Case Sensitive",
                    default=False,
                    description="Distingui maiuscole/minuscole"
                )
            ],
            cache_policy=CachePolicy.MANUAL
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Check if text contains keywords."""
        text = str(context.inputs.get("text", ""))
        keywords_str = context.params.get("keywords", "")
        case_sensitive = context.params.get("case_sensitive", False)
        
        # Parse keywords
        keywords = [k.strip() for k in keywords_str.split(",") if k.strip()]
        
        # Check if any keyword is in text
        if not case_sensitive:
            text = text.lower()
            keywords = [k.lower() for k in keywords]
        
        found = any(keyword in text for keyword in keywords)
        
        print(f"🔍 Cerco {keywords} in '{text}' → {'✅ Trovato' if found else '❌ Non trovato'}")
        
        return NodeResult(
            outputs={
                "yes": found,
                "no": not found
            },
            metadata={
                "text": text,
                "keywords": keywords,
                "found": found
            },
            preview={
                "type": "branch",
                "condition": f"Contiene: {keywords_str}",
                "result": "✅ Sì" if found else "❌ No",
                "text": text
            }
        )


@register_node
class SimpleMultiChoiceNode(NodeExecutor):
    """Multiple choice branching - one output per choice."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="chatbot.multi_choice",
            label="Multi Choice",
            category="chatbot",
            description="Scelta multipla → un output per ogni opzione",
            icon="🎯",
            color="#9C27B0",
            inputs=[
                PortSpec(name="trigger", type=PortType.ANY, label="Start", required=False)
            ],
            outputs=[
                PortSpec(name="choice_1", type=PortType.ANY, label="Choice 1"),
                PortSpec(name="choice_2", type=PortType.ANY, label="Choice 2"),
                PortSpec(name="choice_3", type=PortType.ANY, label="Choice 3"),
                PortSpec(name="choice_4", type=PortType.ANY, label="Choice 4")
            ],
            params=[
                ParamSpec(
                    name="question",
                    type=ParamType.STRING,
                    label="Domanda",
                    default="Cosa vuoi fare?",
                    description="Domanda da fare"
                ),
                ParamSpec(
                    name="option_1",
                    type=ParamType.STRING,
                    label="Opzione 1",
                    default="Informazioni",
                    description="Prima opzione"
                ),
                ParamSpec(
                    name="option_2",
                    type=ParamType.STRING,
                    label="Opzione 2",
                    default="Supporto",
                    description="Seconda opzione"
                ),
                ParamSpec(
                    name="option_3",
                    type=ParamType.STRING,
                    label="Opzione 3",
                    default="Ordine",
                    description="Terza opzione"
                ),
                ParamSpec(
                    name="option_4",
                    type=ParamType.STRING,
                    label="Opzione 4",
                    default="Esci",
                    description="Quarta opzione"
                ),
                ParamSpec(
                    name="test_choice",
                    type=ParamType.SELECT,
                    label="Scelta Test",
                    options=["1", "2", "3", "4"],
                    default="1",
                    description="Quale scelta simulare"
                )
            ],
            cache_policy=CachePolicy.MANUAL
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Show choices and branch."""
        import asyncio
        from main import broadcast_chat_message, chat_pending_input
        
        question = context.params.get("question", "")
        option_1 = context.params.get("option_1", "")
        option_2 = context.params.get("option_2", "")
        option_3 = context.params.get("option_3", "")
        option_4 = context.params.get("option_4", "")
        test_choice = context.params.get("test_choice", "1")
        session_id = "default"
        
        options = [opt for opt in [option_1, option_2, option_3, option_4] if opt]
        
        # Build choice message
        choice_message = f"{question}\n"
        for i, opt in enumerate(options, 1):
            choice_message += f"{i}. {opt}\n"
        
        print(f"❓ {question}")
        for i, opt in enumerate(options, 1):
            print(f"  {i}. {opt}")
        
        # Broadcast choices to chat
        await broadcast_chat_message("bot_message", {"message": choice_message.strip()})
        await broadcast_chat_message("ask_user", {
            "question": "Scegli un numero (1-4)",
            "session_id": session_id
        })
        
        # Wait for user choice
        future = asyncio.Future()
        chat_pending_input[session_id] = future
        
        try:
            user_response = await asyncio.wait_for(future, timeout=60.0)
            # Extract number from response
            choice_num = user_response.strip()
            if choice_num not in ["1", "2", "3", "4"]:
                # Try to extract first digit
                import re
                match = re.search(r'[1-4]', user_response)
                choice_num = match.group(0) if match else test_choice
            print(f"👤 User sceglie: {choice_num}")
        except asyncio.TimeoutError:
            choice_num = test_choice
            print(f"⏱️ Timeout - usando scelta test: {test_choice}")
            if session_id in chat_pending_input:
                del chat_pending_input[session_id]
        
        # Activate only the selected choice
        outputs = {
            "choice_1": choice_num == "1",
            "choice_2": choice_num == "2",
            "choice_3": choice_num == "3",
            "choice_4": choice_num == "4"
        }
        
        return NodeResult(
            outputs=outputs,
            metadata={
                "question": question,
                "options": options,
                "selected": int(choice_num)
            },
            preview={
                "type": "multi_choice",
                "question": question,
                "options": options,
                "selected": int(choice_num)
            }
        )


@register_node
class SimpleEndNode(NodeExecutor):
    """End conversation - final message."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="chatbot.end",
            label="End",
            category="chatbot",
            description="Fine conversazione",
            icon="🏁",
            color="#F44336",
            inputs=[
                PortSpec(name="trigger", type=PortType.ANY, label="Start", required=False)
            ],
            outputs=[],
            params=[
                ParamSpec(
                    name="message",
                    type=ParamType.STRING,
                    label="Messaggio Finale",
                    default="Grazie! Arrivederci! 👋",
                    description="Messaggio di chiusura"
                )
            ],
            cache_policy=CachePolicy.MANUAL
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """End conversation."""
        from main import broadcast_chat_message
        
        message = context.params.get("message", "")
        
        print(f"🏁 Bot: {message}")
        print("=" * 50)
        
        # Broadcast final message and end signal
        await broadcast_chat_message("bot_message", {"message": message})
        await broadcast_chat_message("chat_end", {"message": "Conversazione terminata"})
        
        return NodeResult(
            outputs={},
            metadata={"message": message, "ended": True},
            preview={
                "type": "chat_message",
                "role": "bot",
                "message": message,
                "final": True
            }
        )


@register_node
class SimpleYesNoNode(NodeExecutor):
    """Simple yes/no question with branching."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="chatbot.yes_no",
            label="Yes/No",
            category="chatbot",
            description="Domanda Sì/No → 2 path",
            icon="❓",
            color="#00BCD4",
            inputs=[
                PortSpec(name="trigger", type=PortType.ANY, label="Start", required=False)
            ],
            outputs=[
                PortSpec(name="yes", type=PortType.ANY, label="Yes"),
                PortSpec(name="no", type=PortType.ANY, label="No")
            ],
            params=[
                ParamSpec(
                    name="question",
                    type=ParamType.STRING,
                    label="Domanda",
                    default="Vuoi continuare?",
                    description="Domanda da fare"
                ),
                ParamSpec(
                    name="test_answer",
                    type=ParamType.SELECT,
                    label="Risposta Test",
                    options=["yes", "no"],
                    default="yes",
                    description="Risposta di test"
                )
            ],
            cache_policy=CachePolicy.MANUAL
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Ask yes/no question."""
        import asyncio
        from main import broadcast_chat_message, chat_pending_input
        
        question = context.params.get("question", "")
        test_answer = context.params.get("test_answer", "yes")
        session_id = "default"
        
        print(f"❓ Bot: {question}")
        
        # Broadcast question to chat
        await broadcast_chat_message("bot_message", {"message": question})
        await broadcast_chat_message("ask_user", {
            "question": "Rispondi sì o no",
            "session_id": session_id
        })
        
        # Wait for user response
        future = asyncio.Future()
        chat_pending_input[session_id] = future
        
        try:
            user_response = await asyncio.wait_for(future, timeout=60.0)
            # Check if response contains yes/no keywords
            response_lower = user_response.lower()
            is_yes = any(word in response_lower for word in ["sì", "si", "yes", "y", "ok", "certo", "certamente"])
            print(f"👤 User: {user_response} → {'Sì' if is_yes else 'No'}")
        except asyncio.TimeoutError:
            is_yes = test_answer == "yes"
            print(f"⏱️ Timeout - usando risposta test: {'Sì' if is_yes else 'No'}")
            if session_id in chat_pending_input:
                del chat_pending_input[session_id]
        
        return NodeResult(
            outputs={
                "yes": is_yes,
                "no": not is_yes
            },
            metadata={
                "question": question,
                "answer": "yes" if is_yes else "no"
            },
            preview={
                "type": "yes_no",
                "question": question,
                "answer": "✅ Sì" if is_yes else "❌ No"
            }
        )


@register_node
class SimpleSaveVariableNode(NodeExecutor):
    """Save a value to a variable for later use."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="chatbot.save_variable",
            label="Save Variable",
            category="chatbot",
            description="Salva un valore in una variabile",
            icon="💾",
            color="#673AB7",
            inputs=[
                PortSpec(name="value", type=PortType.ANY, label="Value")
            ],
            outputs=[
                PortSpec(name="next", type=PortType.ANY, label="Next")
            ],
            params=[
                ParamSpec(
                    name="variable_name",
                    type=ParamType.STRING,
                    label="Nome Variabile",
                    default="risposta_utente",
                    description="Nome della variabile (usa _ invece di spazi)"
                ),
                ParamSpec(
                    name="session_id",
                    type=ParamType.STRING,
                    label="Session ID",
                    default="default",
                    description="ID sessione (usa lo stesso per tutto il chatbot)"
                )
            ],
            cache_policy=CachePolicy.MANUAL
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Save value to variable."""
        value = context.inputs.get("value", "")
        variable_name = context.params.get("variable_name", "risposta_utente")
        session_id = context.params.get("session_id", "default")
        
        # Save variable
        set_variable(session_id, variable_name, value)
        
        # Show all variables
        all_vars = get_session_variables(session_id)
        print(f"📋 Variabili salvate: {all_vars}")
        
        return NodeResult(
            outputs={"next": True},
            metadata={
                "variable_name": variable_name,
                "value": value,
                "all_variables": all_vars
            },
            preview={
                "type": "variable",
                "action": "save",
                "name": variable_name,
                "value": str(value),
                "all_vars": all_vars
            }
        )


@register_node
class SimpleShowVariablesNode(NodeExecutor):
    """Show all saved variables (for debugging)."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="chatbot.show_variables",
            label="Show Variables",
            category="chatbot",
            description="Mostra tutte le variabili salvate (debug)",
            icon="📋",
            color="#607D8B",
            inputs=[
                PortSpec(name="trigger", type=PortType.ANY, label="Start", required=False)
            ],
            outputs=[
                PortSpec(name="variables", type=PortType.PARAMS, label="Variables")
            ],
            params=[
                ParamSpec(
                    name="session_id",
                    type=ParamType.STRING,
                    label="Session ID",
                    default="default",
                    description="ID sessione"
                )
            ],
            cache_policy=CachePolicy.MANUAL
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Show all variables."""
        session_id = context.params.get("session_id", "default")
        
        variables = get_session_variables(session_id)
        
        print(f"📋 Variabili in sessione '{session_id}':")
        for key, value in variables.items():
            print(f"  • {key} = {value}")
        
        return NodeResult(
            outputs={"variables": variables},
            metadata={"variables": variables},
            preview={
                "type": "variables_list",
                "variables": variables
            }
        )


# Loop counter storage
_loop_counters: Dict[str, int] = {}


@register_node
class SimpleLoopUntilNode(NodeExecutor):
    """Loop until a condition is met - prevents infinite loops."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="chatbot.loop_until",
            label="Loop Until",
            category="chatbot",
            description="Ripeti finché una condizione è vera (max iterazioni)",
            icon="🔁",
            color="#FF5722",
            inputs=[
                PortSpec(name="value", type=PortType.ANY, label="Value")
            ],
            outputs=[
                PortSpec(name="continue_loop", type=PortType.ANY, label="Continue"),
                PortSpec(name="exit_loop", type=PortType.ANY, label="Exit")
            ],
            params=[
                ParamSpec(
                    name="condition_type",
                    type=ParamType.SELECT,
                    label="Tipo Condizione",
                    options=["contains", "equals", "not_contains", "not_equals"],
                    default="contains",
                    description="Tipo di condizione da verificare"
                ),
                ParamSpec(
                    name="condition_value",
                    type=ParamType.STRING,
                    label="Valore Condizione",
                    default="continua, sì, yes",
                    description="Valore da confrontare (per contains: parole separate da virgola)"
                ),
                ParamSpec(
                    name="max_iterations",
                    type=ParamType.INTEGER,
                    label="Max Iterazioni",
                    default=10,
                    description="Numero massimo di iterazioni (protezione loop infiniti)"
                ),
                ParamSpec(
                    name="loop_id",
                    type=ParamType.STRING,
                    label="Loop ID",
                    default="loop_1",
                    description="ID univoco del loop (per tracciare le iterazioni)"
                )
            ],
            cache_policy=CachePolicy.MANUAL
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Check condition and decide to continue or exit loop."""
        value = str(context.inputs.get("value", ""))
        condition_type = context.params.get("condition_type", "contains")
        condition_value = context.params.get("condition_value", "")
        max_iterations = context.params.get("max_iterations", 10)
        loop_id = context.params.get("loop_id", "loop_1")
        
        # Track loop iterations
        if loop_id not in _loop_counters:
            _loop_counters[loop_id] = 0
        
        _loop_counters[loop_id] += 1
        current_iteration = _loop_counters[loop_id]
        
        print(f"🔁 Loop '{loop_id}' - Iterazione {current_iteration}/{max_iterations}")
        
        # Check max iterations
        if current_iteration >= max_iterations:
            print(f"⚠️ Raggiunto limite iterazioni ({max_iterations}) - Esco dal loop")
            _loop_counters[loop_id] = 0  # Reset counter
            return NodeResult(
                outputs={
                    "continue_loop": False,
                    "exit_loop": True
                },
                metadata={
                    "loop_id": loop_id,
                    "iteration": current_iteration,
                    "max_reached": True,
                    "condition_met": False
                },
                preview={
                    "type": "loop",
                    "status": "max_iterations",
                    "iteration": current_iteration
                }
            )
        
        # Check condition
        condition_met = False
        
        if condition_type == "contains":
            keywords = [k.strip().lower() for k in condition_value.split(",") if k.strip()]
            condition_met = any(keyword in value.lower() for keyword in keywords)
        elif condition_type == "equals":
            condition_met = value.lower() == condition_value.lower()
        elif condition_type == "not_contains":
            keywords = [k.strip().lower() for k in condition_value.split(",") if k.strip()]
            condition_met = not any(keyword in value.lower() for keyword in keywords)
        elif condition_type == "not_equals":
            condition_met = value.lower() != condition_value.lower()
        
        print(f"🔍 Condizione '{condition_type}' con '{condition_value}' su '{value}' → {'✅ Vera' if condition_met else '❌ Falsa'}")
        
        # If condition is true, continue loop; otherwise exit
        if condition_met:
            print(f"🔁 Continuo il loop (iterazione {current_iteration})")
            return NodeResult(
                outputs={
                    "continue_loop": True,
                    "exit_loop": False
                },
                metadata={
                    "loop_id": loop_id,
                    "iteration": current_iteration,
                    "condition_met": True
                },
                preview={
                    "type": "loop",
                    "status": "continue",
                    "iteration": current_iteration
                }
            )
        else:
            print(f"🚪 Esco dal loop (condizione non soddisfatta)")
            _loop_counters[loop_id] = 0  # Reset counter
            return NodeResult(
                outputs={
                    "continue_loop": False,
                    "exit_loop": True
                },
                metadata={
                    "loop_id": loop_id,
                    "iteration": current_iteration,
                    "condition_met": False
                },
                preview={
                    "type": "loop",
                    "status": "exit",
                    "iteration": current_iteration
                }
            )
