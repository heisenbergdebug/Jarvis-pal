"""Sandboxed Python code execution."""

import io
import sys
import contextlib
import datetime


def run_python(code, timeout=5):
    """
    Execute Python code and capture stdout/stderr.
    NOTE: This is a basic executor. Do NOT run untrusted code.
    For real sandboxing, use subprocess + restricted env.
    """
    output_buffer = io.StringIO()
    error_buffer = io.StringIO()
    start = datetime.datetime.now()

    try:
        with contextlib.redirect_stdout(output_buffer), \
             contextlib.redirect_stderr(error_buffer):
            # Restricted builtins - no open(), exec(), eval() abuse
            safe_builtins = {
                "print": print, "len": len, "range": range,
                "str": str, "int": int, "float": float, "bool": bool,
                "list": list, "dict": dict, "tuple": tuple, "set": set,
                "sum": sum, "min": min, "max": max, "abs": abs,
                "sorted": sorted, "reversed": reversed,
                "enumerate": enumerate, "zip": zip, "map": map, "filter": filter,
                "isinstance": isinstance, "type": type,
                "True": True, "False": False, "None": None,
            }
            exec(code, {"__builtins__": safe_builtins})
    except Exception as e:
        error_buffer.write(f"{type(e).__name__}: {e}")

    elapsed = (datetime.datetime.now() - start).total_seconds()
    stdout = output_buffer.getvalue()
    stderr = error_buffer.getvalue()

    result = []
    if stdout:
        result.append(f"Output:\n{stdout}")
    if stderr:
        result.append(f"Errors:\n{stderr}")
    if not result:
        result.append("Code executed successfully (no output).")
    result.append(f"\nTook {elapsed:.3f}s")
    return "\n".join(result)
