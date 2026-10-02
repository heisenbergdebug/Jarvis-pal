"""Voice input/output using speech_recognition + pyttsx3."""

import threading


def speak(text):
    """Speak text in a background thread (non-blocking)."""
    def _speak():
        try:
            import pyttsx3
            engine = pyttsx3.init()
            engine.setProperty("rate", 175)
            engine.say(text)
            engine.runAndWait()
            engine.stop()
        except Exception as e:
            print(f"[Voice error: {e}]")
    threading.Thread(target=_speak, daemon=True).start()


def listen(timeout=5, phrase_time_limit=10):
    """Listen via microphone and return recognized text."""
    try:
        import speech_recognition as sr
        recognizer = sr.Recognizer()
        with sr.Microphone() as source:
            print("🎙️ Listening...")
            recognizer.adjust_for_ambient_noise(source, duration=0.5)
            audio = recognizer.listen(source, timeout=timeout, phrase_time_limit=phrase_time_limit)
        text = recognizer.recognize_google(audio)
        print(f"📝 Heard: {text}")
        return text
    except Exception as e:
        return f"[Voice error: {e}]"
