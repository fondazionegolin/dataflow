"""Terminal and system interaction nodes."""

import subprocess
import os
import sys
from typing import Dict, List, Any, Optional
import asyncio

from core.types import (
    NodeSpec, PortSpec, ParamSpec, PortType, ParamType,
    NodeContext, NodeResult, CachePolicy
)
from core.registry import NodeExecutor, register_node


@register_node
class ExecuteCommandNode(NodeExecutor):
    """Execute a shell command."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="terminal.execute_command",
            label="Execute Command",
            category="terminal",
            description="Execute a shell command and capture output",
            icon="⚡",
            color="#FF5722",
            inputs=[
                PortSpec(name="command", type=PortType.PARAMS, label="Command", required=False)
            ],
            outputs=[
                PortSpec(name="stdout", type=PortType.PARAMS, label="Output"),
                PortSpec(name="stderr", type=PortType.PARAMS, label="Error Output"),
                PortSpec(name="exit_code", type=PortType.PARAMS, label="Exit Code")
            ],
            params=[
                ParamSpec(
                    name="command",
                    type=ParamType.STRING,
                    label="Command",
                    default="echo 'Hello World'",
                    description="Shell command to execute"
                ),
                ParamSpec(
                    name="shell",
                    type=ParamType.SELECT,
                    label="Shell",
                    options=["bash", "sh", "zsh", "fish"],
                    default="bash",
                    description="Shell to use"
                ),
                ParamSpec(
                    name="timeout",
                    type=ParamType.INTEGER,
                    label="Timeout (seconds)",
                    default=60,
                    description="Command timeout"
                ),
                ParamSpec(
                    name="working_dir",
                    type=ParamType.STRING,
                    label="Working Directory",
                    default=".",
                    description="Working directory for command"
                ),
                ParamSpec(
                    name="capture_output",
                    type=ParamType.BOOLEAN,
                    label="Capture Output",
                    default=True,
                    description="Capture stdout and stderr"
                )
            ],
            cache_policy=CachePolicy.MANUAL
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Execute shell command."""
        try:
            # Get command from input or param
            command = context.inputs.get("command") or context.params.get("command", "")
            shell = context.params.get("shell", "bash")
            timeout = context.params.get("timeout", 60)
            working_dir = context.params.get("working_dir", ".")
            capture_output = context.params.get("capture_output", True)
            
            if not command:
                return NodeResult(error="No command provided")
            
            print(f"[Terminal] ⚡ Executing: {command}")
            
            # Prepare shell command
            shell_path = f"/bin/{shell}"
            if not os.path.exists(shell_path):
                shell_path = shell  # Try to find in PATH
            
            # Execute command
            process = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE if capture_output else None,
                stderr=asyncio.subprocess.PIPE if capture_output else None,
                cwd=working_dir,
                shell=True,
                executable=shell_path
            )
            
            try:
                stdout_data, stderr_data = await asyncio.wait_for(
                    process.communicate(),
                    timeout=timeout
                )
                
                stdout = stdout_data.decode('utf-8') if stdout_data else ""
                stderr = stderr_data.decode('utf-8') if stderr_data else ""
                exit_code = process.returncode
                
            except asyncio.TimeoutError:
                process.kill()
                await process.wait()
                return NodeResult(error=f"Command timed out after {timeout} seconds")
            
            print(f"[Terminal] ✅ Exit code: {exit_code}")
            if stdout:
                print(f"[Terminal] 📤 Output: {stdout[:200]}...")
            if stderr:
                print(f"[Terminal] ⚠️ Error: {stderr[:200]}...")
            
            return NodeResult(
                outputs={
                    "stdout": stdout,
                    "stderr": stderr,
                    "exit_code": exit_code
                },
                metadata={
                    "command": command,
                    "exit_code": exit_code,
                    "stdout_length": len(stdout),
                    "stderr_length": len(stderr)
                },
                preview={
                    "type": "terminal_output",
                    "command": command,
                    "stdout": stdout,
                    "stderr": stderr,
                    "exit_code": exit_code
                }
            )
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return NodeResult(error=f"Failed to execute command: {str(e)}")


@register_node
class CommandBuilderNode(NodeExecutor):
    """Build a shell command from components."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="terminal.command_builder",
            label="Command Builder",
            category="terminal",
            description="Build a shell command from components",
            icon="🔧",
            color="#4CAF50",
            inputs=[
                PortSpec(name="args", type=PortType.ANY, label="Arguments", required=False)
            ],
            outputs=[
                PortSpec(name="command", type=PortType.PARAMS, label="Command")
            ],
            params=[
                ParamSpec(
                    name="base_command",
                    type=ParamType.STRING,
                    label="Base Command",
                    default="ls",
                    description="Base command (e.g., 'ls', 'grep', 'find')"
                ),
                ParamSpec(
                    name="flags",
                    type=ParamType.STRING,
                    label="Flags",
                    default="-la",
                    description="Command flags (e.g., '-la', '-r')"
                ),
                ParamSpec(
                    name="arguments",
                    type=ParamType.STRING,
                    label="Arguments",
                    default="",
                    description="Additional arguments"
                ),
                ParamSpec(
                    name="pipe_to",
                    type=ParamType.STRING,
                    label="Pipe To",
                    default="",
                    description="Command to pipe output to (e.g., 'grep pattern')"
                )
            ],
            cache_policy=CachePolicy.MANUAL
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Build command."""
        try:
            base_command = context.params.get("base_command", "")
            flags = context.params.get("flags", "")
            arguments = context.params.get("arguments", "")
            pipe_to = context.params.get("pipe_to", "")
            
            # Get args from input if provided
            input_args = context.inputs.get("args")
            if input_args:
                if isinstance(input_args, list):
                    arguments = " ".join(str(arg) for arg in input_args)
                else:
                    arguments = str(input_args)
            
            # Build command
            parts = [base_command]
            if flags:
                parts.append(flags)
            if arguments:
                parts.append(arguments)
            
            command = " ".join(parts)
            
            if pipe_to:
                command = f"{command} | {pipe_to}"
            
            print(f"[Terminal] 🔧 Built command: {command}")
            
            return NodeResult(
                outputs={
                    "command": command
                },
                metadata={
                    "command": command,
                    "base_command": base_command,
                    "flags": flags,
                    "arguments": arguments
                },
                preview={
                    "type": "command",
                    "command": command
                }
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to build command: {str(e)}")


@register_node
class CommandSelectorNode(NodeExecutor):
    """Select a command from a list of suggestions."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="terminal.command_selector",
            label="Command Selector",
            category="terminal",
            description="Select a command from a list of suggestions",
            icon="📋",
            color="#2196F3",
            inputs=[
                PortSpec(name="commands", type=PortType.ANY, label="Command List")
            ],
            outputs=[
                PortSpec(name="selected_command", type=PortType.PARAMS, label="Selected Command"),
                PortSpec(name="selected_index", type=PortType.PARAMS, label="Selected Index"),
                PortSpec(name="description", type=PortType.PARAMS, label="Description")
            ],
            params=[
                ParamSpec(
                    name="title",
                    type=ParamType.STRING,
                    label="Title",
                    default="Select a command:",
                    description="Title to display"
                ),
                ParamSpec(
                    name="default_index",
                    type=ParamType.INTEGER,
                    label="Default Selection",
                    default=0,
                    description="Default selected index (for testing)"
                ),
                ParamSpec(
                    name="show_description",
                    type=ParamType.BOOLEAN,
                    label="Show Description",
                    default=True,
                    description="Show command descriptions"
                )
            ],
            cache_policy=CachePolicy.MANUAL
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Select command from list."""
        try:
            commands_input = context.inputs.get("commands", [])
            title = context.params.get("title", "Select a command:")
            default_index = context.params.get("default_index", 0)
            show_description = context.params.get("show_description", True)
            
            # Parse commands
            commands = []
            if isinstance(commands_input, list):
                for item in commands_input:
                    if isinstance(item, dict):
                        commands.append(item)
                    else:
                        commands.append({"cmd": str(item), "desc": ""})
            elif isinstance(commands_input, str):
                # Try to parse as JSON
                try:
                    import json
                    parsed = json.loads(commands_input)
                    if isinstance(parsed, list):
                        commands = parsed
                except:
                    # Treat as single command
                    commands = [{"cmd": commands_input, "desc": ""}]
            
            if not commands:
                return NodeResult(error="No commands provided")
            
            # Select command (for testing, use default_index)
            selected_index = min(default_index, len(commands) - 1)
            selected = commands[selected_index]
            
            selected_command = selected.get("cmd", "")
            description = selected.get("desc", "")
            
            print(f"[Terminal] 📋 Selected: {selected_command}")
            
            return NodeResult(
                outputs={
                    "selected_command": selected_command,
                    "selected_index": selected_index,
                    "description": description
                },
                metadata={
                    "title": title,
                    "total_commands": len(commands),
                    "selected_index": selected_index,
                    "selected_command": selected_command
                },
                preview={
                    "type": "command_selector",
                    "title": title,
                    "commands": commands,
                    "selected_index": selected_index
                }
            )
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return NodeResult(error=f"Failed to select command: {str(e)}")


@register_node
class TerminalInputNode(NodeExecutor):
    """Capture input from terminal/user."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="terminal.input",
            label="Terminal Input",
            category="terminal",
            description="Capture input from user",
            icon="⌨️",
            color="#9C27B0",
            inputs=[],
            outputs=[
                PortSpec(name="user_input", type=PortType.PARAMS, label="User Input")
            ],
            params=[
                ParamSpec(
                    name="prompt",
                    type=ParamType.STRING,
                    label="Prompt",
                    default="Enter your request: ",
                    description="Prompt to show user"
                ),
                ParamSpec(
                    name="default_input",
                    type=ParamType.STRING,
                    label="Default Input",
                    default="",
                    description="Default input for testing"
                ),
                ParamSpec(
                    name="multiline",
                    type=ParamType.BOOLEAN,
                    label="Multiline",
                    default=False,
                    description="Allow multiline input"
                )
            ],
            cache_policy=CachePolicy.MANUAL
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Capture user input."""
        try:
            prompt = context.params.get("prompt", "")
            default_input = context.params.get("default_input", "")
            multiline = context.params.get("multiline", False)
            
            # For now, use default input (in production, this would capture real input)
            user_input = default_input
            
            print(f"[Terminal] ⌨️ User input: {user_input}")
            
            return NodeResult(
                outputs={
                    "user_input": user_input
                },
                metadata={
                    "prompt": prompt,
                    "user_input": user_input,
                    "multiline": multiline
                },
                preview={
                    "type": "terminal_input",
                    "prompt": prompt,
                    "user_input": user_input
                }
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to capture input: {str(e)}")


@register_node
class TerminalOutputNode(NodeExecutor):
    """Display output in terminal format."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="terminal.output",
            label="Terminal Output",
            category="terminal",
            description="Display formatted output",
            icon="🖥️",
            color="#607D8B",
            inputs=[
                PortSpec(name="content", type=PortType.ANY, label="Content")
            ],
            outputs=[
                PortSpec(name="displayed", type=PortType.PARAMS, label="Displayed")
            ],
            params=[
                ParamSpec(
                    name="format",
                    type=ParamType.SELECT,
                    label="Format",
                    options=["plain", "json", "table", "code"],
                    default="plain",
                    description="Output format"
                ),
                ParamSpec(
                    name="color",
                    type=ParamType.SELECT,
                    label="Color",
                    options=["default", "green", "red", "yellow", "blue"],
                    default="default",
                    description="Text color"
                ),
                ParamSpec(
                    name="prefix",
                    type=ParamType.STRING,
                    label="Prefix",
                    default="",
                    description="Prefix to add (e.g., '$ ', '> ')"
                )
            ],
            cache_policy=CachePolicy.MANUAL
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Display output."""
        try:
            content = context.inputs.get("content", "")
            format_type = context.params.get("format", "plain")
            color = context.params.get("color", "default")
            prefix = context.params.get("prefix", "")
            
            # Format content
            if format_type == "json":
                import json
                if isinstance(content, (dict, list)):
                    formatted = json.dumps(content, indent=2)
                else:
                    formatted = str(content)
            elif format_type == "table":
                # Simple table formatting
                if isinstance(content, list) and content and isinstance(content[0], dict):
                    headers = list(content[0].keys())
                    formatted = " | ".join(headers) + "\n"
                    formatted += "-" * len(formatted) + "\n"
                    for row in content:
                        formatted += " | ".join(str(row.get(h, "")) for h in headers) + "\n"
                else:
                    formatted = str(content)
            else:
                formatted = str(content)
            
            # Add prefix
            if prefix:
                lines = formatted.split("\n")
                formatted = "\n".join(prefix + line for line in lines)
            
            print(f"[Terminal] 🖥️ Output:\n{formatted}")
            
            return NodeResult(
                outputs={
                    "displayed": formatted
                },
                metadata={
                    "format": format_type,
                    "color": color,
                    "length": len(formatted)
                },
                preview={
                    "type": "terminal_output",
                    "content": formatted,
                    "format": format_type,
                    "color": color
                }
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to display output: {str(e)}")
