"""
JARVIS CLI - Terminal interface
Run: python cli.py
Commands:
  /search <query>   - web search before answering
  /code <python>    - execute Python
  /file   - reference an uploaded file
  /voice            - speak next message via microphone
  /profile          - show learned facts
  /clear            - clear history
  /quit             - exit
"""

import os
import sys
import datetime
from pathlib import Path
from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
from rich.markdown import Markdown

from jarvis_brain import JarvisBrain
from tools import web_search, code_executor, file_handler, voice

load_dotenv()
console = Console()


def main():
    console.print(Panel.fit(
        "[bold cyan]J.A.R.V.I.S[/bold cyan]\n"
        "[dim]Just A Rather Very Intelligent System[/dim]",
        border_style="cyan"
    ))

    if not os.getenv("GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY") == "your_new_api_key_here":
        console.print("[red]GEMINI_API_KEY missing. Edit your .env file first.[/red]")
        return

    username = Prompt.ask("[cyan]Username[/cyan]", default=os.getenv("ADMIN_USERNAME", "Sugumar R"))
    brain = JarvisBrain(username=username)

    try:
        brain.initialize_model()
    except Exception as e:
        console.print(f"[red]Failed to start: {e}[/red]")
        return

    console.print(f"[green]Welcome, {username}.[/green]\n")
    console.print("[dim]Commands: /search /code /file /voice /profile /clear /quit[/dim]\n")

    while True:
        try:
            user_input = Prompt.ask(f"[bold cyan]{username}[/bold cyan]")
        except (KeyboardInterrupt, EOFError):
            console.print("\n[cyan]Goodbye.[/cyan]")
            break

        text = user_input.strip()
        if not text:
            continue

        # ---- Commands ----
        if text in ("/quit", "/exit"):
            console.print("[cyan]Goodbye.[/cyan]")
            break

        if text == "/clear":
            brain.clear_history()
            console.print("[yellow]History cleared.[/yellow]")
            continue

        if text == "/profile":
            profile = brain.get_profile()
            facts = profile.get("facts", [])
            console.print(Panel(
                "\n".join(f"- {f}" for f in facts) or "(no facts learned yet)",
                title="Memory", border_style="cyan"
            ))
            continue

        if text == "/voice":
            text = voice.listen()
            console.print(f"[dim]Heard: {text}[/dim]")
            if text.startswith("["):
                continue

        if text.startswith("/search "):
            query = text[8:]
            with console.status("[cyan]Searching...[/cyan]"):
                results = web_search.search_web(query)
            text = f"User asked: {query}\n\nWeb search results:\n{results}\n\nAnswer using these."

        elif text.startswith("/code "):
            code = text[6:]
            output = code_executor.run_python(code)
            text = f"Code output:\n{output}\n\nExplain the result."

        elif text.startswith("/file "):
            fname = text[6:].strip().split()[0]
            uploads = Path(__file__).resolve().parent / "uploads"
            target = next((f for f in uploads.iterdir() if f.name.endswith(fname)), None)
            if target:
                content = file_handler.extract_text(str(target))
                text = f"File '{fname}' content:\n\n{content}\n\nAnswer based on this."
            else:
                console.print(f"[red]File not found: {fname}[/red]")
                continue

        # ---- Chat ----
        try:
            with console.status("[cyan]JARVIS is thinking...[/cyan]"):
                reply = brain.chat(text)
            console.print()
            console.print(Panel(Markdown(reply), title="[cyan]JARVIS[/cyan]",
                                border_style="cyan"))
            voice.speak(reply)
        except Exception as e:
            console.print(f"[red]Error: {e}[/red]")


if __name__ == "__main__":
    main()
