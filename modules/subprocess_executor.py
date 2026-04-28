"""
Subprocess executor for safe code execution
"""
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Dict, Tuple


class SubprocessExecutor:
    """Safe Python code executor using subprocess"""
    
    FORBIDDEN_IMPORTS = {
        'os', 'sys', 'subprocess', 'shutil', 'socket', 
        '__import__', 'eval', 'exec', 'compile'
    }
    
    @staticmethod
    def validate_code(code: str) -> Tuple[bool, str]:
        """
        Basic validation of code for safety
        
        Args:
            code: Python code to validate
            
        Returns:
            tuple: (is_safe, message)
        """
        # Check for forbidden patterns
        forbidden_patterns = [
            '__import__', 'eval(', 'exec(', 'compile(', 'open(',
            '__file__', '__builtins__', 'input(', 'raw_input(',
        ]
        
        for pattern in forbidden_patterns:
            if pattern in code:
                return False, f"Code contains forbidden operation: {pattern}"
        
        return True, "Code is safe"
    
    @staticmethod
    def execute_code(code: str, timeout: int = 60) -> Dict[str, any]:
        """
        Execute Python code in subprocess
        
        Args:
            code: Python code to execute
            timeout: Timeout in seconds
            
        Returns:
            Dictionary with execution results
        """
        # Validate code
        is_safe, msg = SubprocessExecutor.validate_code(code)
        if not is_safe:
            return {
                'success': False,
                'output': None,
                'error': f"Code validation failed: {msg}",
                'stdout': '',
                'stderr': msg
            }
        
        try:
            # Create temporary file for code
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(code)
                temp_file = f.name
            
            try:
                # Execute code
                result = subprocess.run(
                    [sys.executable, temp_file],
                    capture_output=True,
                    text=True,
                    timeout=timeout
                )
                
                success = result.returncode == 0
                
                return {
                    'success': success,
                    'output': None,
                    'error': result.stderr if result.stderr else None,
                    'stdout': result.stdout,
                    'stderr': result.stderr,
                    'return_code': result.returncode
                }
            
            finally:
                # Clean up temp file
                Path(temp_file).unlink(missing_ok=True)
        
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'output': None,
                'error': f"Code execution timeout (exceeded {timeout}s)",
                'stdout': '',
                'stderr': f"Timeout after {timeout} seconds"
            }
        except Exception as e:
            return {
                'success': False,
                'output': None,
                'error': f"Execution error: {str(e)}",
                'stdout': '',
                'stderr': str(e)
            }
    
    @staticmethod
    def execute_with_context(code: str, context: Dict = None, timeout: int = 60) -> Dict[str, any]:
        """
        Execute code with ability to capture variables in context
        
        Note: Variables must be serialized in the script (e.g., save to file)
        
        Args:
            code: Python code to execute
            context: Additional context (injected as comments for reference)
            timeout: Timeout in seconds
            
        Returns:
            Dictionary with execution results
        """
        # Add context as comments
        if context:
            context_str = "# Context:\n"
            for key, value in context.items():
                context_str += f"# {key} = {str(value)[:100]}\n"
            code = context_str + "\n" + code
        
        return SubprocessExecutor.execute_code(code, timeout)
