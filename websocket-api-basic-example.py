import asyncio
import base64
import io
import json

import websockets
from audiosample import AudioSample


async def text_to_speech():
    # Define the WebSocket server URL and the API key
    websocket_url = "wss://wsapi.deepdub.ai/open"
    api_key = "Your API Key Here"

    # Define custom headers
    headers = {"x-api-key": api_key}

    async with websockets.connect(websocket_url, extra_headers=headers) as websocket:
        print("Connected to the WebSocket server.")        
        # for ratio in range(10):
        # Send a message to the WebSocket server
        message_to_send = {
        "model": "dd-etts-1.1",
        "action": "text-to-speech",
        "targetText": "Hello, this is a test.",
        "locale": "en-US",            
        "voicePromptId": "promptId",
        "accentControl": {
            "accentBaseLocale": "en-US",
            "accentLocale": "fr-FR",
            "accentRatio": 0.25
        },    
        
    }

        print(f"Sent: {message_to_send}")
        await websocket.send(json.dumps(message_to_send))

        generated_audio = AudioSample()

        while True:
            message_received = await websocket.recv()
            message_received = json.loads(message_received)
            print(f"received chunk {message_received['generationId']} - {message_received.get('index', 0) }")

            if message_received.get("data"):
                generated_audio += AudioSample(base64.b64decode(message_received['data']))

            if message_received["isFinished"]:
                break

        generated_audio.write("test.wav")
        print("Final WAV file created successfully.")


# Run the WebSocket client
asyncio.run(text_to_speech())
