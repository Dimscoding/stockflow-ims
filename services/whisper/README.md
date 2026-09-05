# Whisper service adapter

StockFlow uses the browser speech-recognition API in the public demo so it can run without exposing credentials. For a private deployment, this folder is the integration boundary for a separate transcription service based on `openai/whisper`.

The web app expects a private HTTPS endpoint that accepts an audio file and returns `{ "text": "..." }`. Keep the Whisper model outside the Vercel function runtime because the model and FFmpeg workload are too large for a lightweight frontend function.

Source: https://github.com/openai/whisper (MIT).
