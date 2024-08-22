### Overview
Deepdub WebSocket API provides functionality to convert text into speech. The client can send a request with the desired parameters and receive audio data in response.

### Connection Setup

To use this API, establish a WebSocket connection to the server and include the `x-api-key` header with your API key for authentication.

Ensure to include your API key in the WebSocket handshake as follows:

```python
import websocket
async with websockets.connect("wss://wsapi.deepdub.ai/open", extra_headers={"x-api-key": api_key}) as websocket:
    pass
```

### Request

**Action:** `text-to-speech`

**Request JSON Structure:**
```json
{
    "action": "text-to-speech",
    "locale": "en-US",
    "voicePromptId": "promptId",
    "model": "dd-etts-1.1",
    "targetText": "hello",
    
    // Not required:
    "targetDuration": 4.7,
    "promptBoost": false,
    "seed": 0,
    "variance": 0.5,
    "accentControl": {
        "accentBaseLocale": "en-US",
        "accentLocale": "fr-FR",
        "accentRatio": 0.75
    },    
}
```

### Request Parameters

- **action** (string, required): Specifies the action to perform. Must be `"text-to-speech"`.
- **locale** (string, required): The locale(case sensitive) for the generated speech, e.g. `"en-US"`.
- **voicePromptId** (string, required): The ID of the voice prompt to use can be fetched from the Deepdub-Go platform.
- **model** (string, required): The model to use for text-to-speech conversion, e.g., `"dd-etts-1.1"`.
- **targetText** (string, required): The text to convert to speech.

#### Optional Parameters
- **targetDuration** (number, optional): The desired duration of the speech in seconds.
- **tempo** (number, optional):  The tempo of the speech mutually exclusive with targetDuration. value should be between 0 and 2.0.
- **variance** (number, optional):  The variance within a single output of speech. value should be between 0 and 1.0. (system default is 1).
- **promptBoost** (boolean, optional): Overrides the default prompt boost logic. Boosting the prompt affects the behavior of tempo, targetDuration and accentControl.
- **seed** (number, optional): The seed value for the random number generator send same seed to keep consistency between generations.
- **accentControl** (object, optional): An object to control accent settings.
  - **accentBaseLocale** (string, required if `accentControl` is used): The base locale for the accent, e.g., `"en-US"`.
  - **accentLocale** (string, required if `accentControl` is used): The locale for the accent, e.g., `"fr-FR"`.
  - **accentRatio** (number, required if `accentControl` is used): The ratio of the accent to apply, ranging from 0 to 1.0.
  

### Response

**Response JSON Structure:**
```json
{
    "index": 0,
    "isFinished": false,
    "generationId": "4da9902b-9141-4fb7-9efb-d616ce266ed9",
    "data": "HAAYABgAGAAgACAA...IAAkACQAJAAkACQAIAAgACAAIAAkACQAJAAkACQA=="
}
```

### Response Parameters

- **index** (integer): The index of the current response in the sequence of responses.
- **isFinished** (boolean): Indicates whether the generation of the audio is complete.
- **generationId** (string): A unique identifier for the generated speech.
- **data** (string): The base64-encoded audio data.

### Example Request
```json
{
    "action": "text-to-speech",
    "locale": "en-US",
    "voicePromptId": "promptId",
    "model": "dd-etts-1.1",
    "targetText": "hello",
    "targetDuration": 4.7,
    "accentControl": {
        "accentBaseLocale": "en-US",
        "accentLocale": "fr-FR",
        "accentRatio": 0.75
    },
    "cleanAudio": true
}
```

### Example Response
```json
{
    "index": 0,
    "isFinished": false,
    "generationId": "4da9902b-9141-4fb7-9efb-d616ce266ed9",
    "data": "HAAYABgAGAAgACAA...IAAkACQAJAAkACQAIAAgACAAIAAkACQAJAAkACQA=="
}
```

### Notes
- Ensure that the WebSocket connection is properly maintained for receiving the response.
- The `data` field in the response contains base64-encoded audio data that can be decoded and played back.

This documentation provides a comprehensive guide to using the WebSocket API for text-to-speech functionality, including how to set up the connection with the necessary API key.


### Example - Basic Usage

```python
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

        # Send a message to the WebSocket server
        message_to_send = {
            "model": "dd-etts-1.1",
            "action": "text-to-speech",
            "targetText": "Hello, this is a test.",
            "locale": "en-US",
            "voicePromptId": "promptId",
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

```

### Example - Audio Description

```python
import asyncio
import base64
import io
import json
from pathlib import Path

import websockets
from lxml import etree
from audiosample import AudioSample

# Read the XML file and parse it
xml_content = """
<tt xml:lang="en" xmlns="http://www.w3.org/ns/ttml"
	xmlns:tts="http://www.w3.org/ns/ttml#styling"
	xmlns:ttm="http://www.w3.org/ns/ttml#metadata">
	<head>
		<styling>
			<style xml:id="defaultCaption" tts:fontSize="10" tts:fontFamily="SansSerif"
			tts:fontWeight="normal" tts:fontStyle="normal"
			tts:textDecoration="none" tts:color="white"
			tts:backgroundColor="black" />
		</styling>

	</head>
	<body>
		<div style="defaultCaption" xml:lang="en">
			<p begin="00:00:03.400" end="00:00:06.177">In this lesson, we're going to be talking about finance. And</p>
                    <p begin="00:00:06.177" end="00:00:10.009">one of the most important aspects of finance is interest.</p>
                    <p begin="00:00:10.009" end="00:00:13.655">When I go to a bank or some other lending institution</p>
                    <p begin="00:00:13.655" end="00:00:17.720">to borrow money, the bank is happy to give me that money. But then I'm</p>
		</div>
	</body>
</tt>
"""

def generate_segments_from_text(xml_content):
    xml_root = etree.fromstring(xml_content)

    # Process each <p> tag to generate audio
    for p_tag in xml_root.findall(".//{http://www.w3.org/ns/ttml}p"):
        text = p_tag.text
        begin_time = p_tag.attrib["begin"]
        end_time = p_tag.attrib["end"]

        # Convert time to milliseconds
        begin_ms = int(float(begin_time.split(":")[2]) * 1000)
        end_ms = int(float(end_time.split(":")[2]) * 1000)

        # Generate audio for the text using the API
        yield {"text": text,  "begin_ms": begin_ms, "end_ms": end_ms}

async def create_audio_description_from_file(xml_content):    
    # Define the WebSocket server URL and the API key
    websocket_url = "wss://wsapi.deepdub.ai/open"
    api_key = "Your API Key Here"

    # Define custom headers
    headers = {"x-api-key": api_key}

    # Connect to the WebSocket server with custom headers
    audio_description = AudioSample()
    async with websockets.connect(websocket_url, extra_headers=headers) as websocket:
        print("Connected to the WebSocket server.")

        # Send a message to the WebSocket server
        for message in generate_segments_from_text(xml_content):
            begin_ms = message["begin_ms"]
            end_ms = message["end_ms"]
            message_to_send = {
                "model": "dd-etts-1.1",
                "action": "text-to-speech",
                "targetText": message["text"],
                "targetDuration": (end_ms - begin_ms) / 1000,
                "locale": "en-US",
                "voicePromptId": "promptId",
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

            # Adding the file to the final audio
            audio_description = audio_description.mix(begin_ms / 1000, generated_audio)

    # Export the final_audio to a WAV file
    audio_description.write("final.wav")

    print("Final WAV file created successfully.")


# Run the WebSocket client
asyncio.run(create_audio_description_from_file(xml_content))
```
