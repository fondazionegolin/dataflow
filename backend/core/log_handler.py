"""Custom logging handler for broadcasting logs via WebSocket."""

import sys
import io
import asyncio
from typing import Callable, Optional

class WebSocketOutputStream:
    """Custom output stream that broadcasts to WebSocket."""
    
    def __init__(self, original_stream, broadcast_func: Callable, level: str = "info"):
        self.original_stream = original_stream
        self.broadcast_func = broadcast_func
        self.level = level
        self.buffer = []
        
    def write(self, text: str):
        """Write text to both original stream and WebSocket."""
        # Write to original stream
        self.original_stream.write(text)
        self.original_stream.flush()
        
        # Skip empty strings
        if not text or text.isspace():
            return
            
        # Buffer the text
        self.buffer.append(text)
        
        # If we have a complete line (ends with newline), broadcast it
        if text.endswith('\n'):
            message = ''.join(self.buffer).strip()
            self.buffer = []
            
            if message:
                # Schedule broadcast in event loop
                try:
                    loop = asyncio.get_running_loop()
                    # Use call_soon_threadsafe for thread safety
                    loop.call_soon_threadsafe(
                        lambda: asyncio.create_task(self.broadcast_func(message, self.level))
                    )
                except RuntimeError:
                    # No running loop, try to get or create one
                    try:
                        loop = asyncio.get_event_loop()
                        if not loop.is_running():
                            # Can't broadcast without running loop
                            pass
                        else:
                            asyncio.create_task(self.broadcast_func(message, self.level))
                    except Exception:
                        pass
    
    def flush(self):
        """Flush the stream."""
        self.original_stream.flush()
        
        # Broadcast any remaining buffered content
        if self.buffer:
            message = ''.join(self.buffer).strip()
            self.buffer = []
            
            if message:
                try:
                    loop = asyncio.get_running_loop()
                    loop.call_soon_threadsafe(
                        lambda: asyncio.create_task(self.broadcast_func(message, self.level))
                    )
                except RuntimeError:
                    try:
                        loop = asyncio.get_event_loop()
                        if loop.is_running():
                            asyncio.create_task(self.broadcast_func(message, self.level))
                    except Exception:
                        pass
    
    def isatty(self):
        """Check if stream is a TTY."""
        return self.original_stream.isatty()


# Global reference to broadcast function
_broadcast_func: Optional[Callable] = None

def set_broadcast_function(func: Callable):
    """Set the global broadcast function."""
    global _broadcast_func
    _broadcast_func = func

def get_broadcast_function() -> Optional[Callable]:
    """Get the global broadcast function."""
    return _broadcast_func

def install_stdout_interceptor(broadcast_func: Callable):
    """Install stdout/stderr interceptor for WebSocket broadcasting."""
    sys.stdout = WebSocketOutputStream(sys.__stdout__, broadcast_func, "info")
    sys.stderr = WebSocketOutputStream(sys.__stderr__, broadcast_func, "error")
