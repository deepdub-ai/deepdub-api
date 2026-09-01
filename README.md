### Overview

This is a documentation for the Deepdub eTTS API (Emotional Text-To-Speech). Before getting started make sure to get an API key at https://deepdub.ai/

Deepdub supports RESTful and WebSocket API which provides functionality to convert text into speech. The client can send a request with the desired parameters and receive audio data in response. Our text also supports phonemes through SSML tags, see phoneme section

In addition to this API documentation, there's also the python library found here: https://github.com/deepdub-ai/deepdub

### Available Models

| Model Nickname | Model ID    | Realtime Support | Realtime Latency (E2E) | Realtime Factor |
| -------------- | ----------- | ---------------- | ---------------------- | --------------- |
| OG             | dd-etts-1.1 | x                | 600ms                  | up to 2x        |
| Violet         | dd-etts-2.5 | v                | 200ms                  | up to 3.5x      |
| Phanotmx       | dd-etts-3.0 | v                | 125ms                  | up to 5x        |

### Connection Setup

To use the rest api and include the `x-api-key` header with your API key for authentication, and dont forget to copy the prompt id which is available in the Deepdub platform:

```python
import requests

#TODO: set api key and voice prompt.
api_key = "your-api-key-here"
voice_prompt_id = "your-prompt-here"

r = requests.post("https://restapi.deepdub.ai/api/v1/tts",
         headers={
                  "Content-Type": "application/json",
                  "x-api-key": api_key
              },
         json={
              "model": "dd-etts-2.5",
              "targetText": "marry christmas! and a happy new year!",
              "locale": "en-US",
              "voicePromptId": voice_prompt_id
           }
     )
open("tts_output.mp3", "wb").write(r.content)
```

- The response for REST API is binary data.

To use the Websocket API, establish a WebSocket connection to the server and include the `x-api-key` header with your API key for authentication.

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
  "voiceReference": "HAAYABgAGAAgACAA...IAAkACQAJAAkACQAIAAgACAAIAAkACQAJAAkACQA=="
}
```

### Request Parameters

- **action** (string, required): Specifies the action to perform. Must be `"text-to-speech"`.
- **locale** (string, required): The locale (case sensitive) for the generated speech, e.g. `"en-US"`.
- **voicePromptId** (string, required): The ID of the voice prompt to use can be fetched from the Deepdub-Go platform.
- **model** (string, required): The model to use for text-to-speech conversion, e.g., `"dd-etts-1.1"`.
- **targetText** (string, required): The text to convert to speech.

#### Optional Parameters

- **targetDuration** (number, optional): The desired duration of the speech in seconds.
- **tempo** (number, optional): The tempo of the speech mutually exclusive with targetDuration. value should be between 0 and 2.0.
- **variance** (number, optional): The variance within a single output of speech. value should be between 0 and 1.0. (system default is 1).
- **promptBoost** (boolean, optional): Overrides the default prompt boost logic. Boosting the prompt affects the behavior of tempo, targetDuration and accentControl.
- **seed** (number, optional): The seed value for the random number generator — send the same seed to keep consistency between generations. Applies to `dd-etts-1.1` only; newer models do not use it, and setting it has no effect on their output.
- **accentControl** (object, optional): An object to control accent settings.
  - **accentBaseLocale** (string, required if `accentControl` is used): The base locale for the accent, e.g., `"en-US"`.
  - **accentLocale** (string, required if `accentControl` is used): The locale for the accent, e.g., `"fr-FR"`.
  - **accentRatio** (number, required if `accentControl` is used): The ratio of the accent to apply, ranging from 0 to 1.0.
- **voiceReference** (string,optional): Base 64 encoded audio data used for voice reference

### Notes

- voiceReference
  - Supported formats: WAV, MP3, OGG, FLAC, AIFF, AAC
  - Channel support: Mono and Stereo
  - Preferred sample rate: 48,000 Hz
  - Audio size limit: Up to 20 MB (~5 seconds in length)

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

### Example Request for Websocket API

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

### Example Response for Websocket API

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

### Example: Basic Usage

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
    voice_prompt_id = "your-prompt-here"

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
            "voicePromptId": voice_prompt_id,
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

### Example: Voice Cloning

```python
import base64
import requests

# This script demonstrates how to use the DeepDub REST API for text-to-speech (TTS) generation
# with a voice reference audio file

# API credentials
api_key = ""

# Step 1: Read and encode the reference audio file to base64
# This audio file will be used as a voice reference for the TTS generation
with open("tts_in.m4a", "rb") as audio_file:
    audio_bytes = audio_file.read()
    audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

# Step 2: Make a POST request to the TTS endpoint
# The request includes the voice reference and text to be synthesized
r = requests.post(
    "https://restapi.deepdub.ai/api/v1/tts",
    headers={
        "Content-Type": "application/json",  # Specify JSON content type
        "x-api-key": api_key                 # Authentication via API key
    },
    json={
        "model": "dd-etts-1.1",                  # TTS model to use
        "targetText": "marry christmas! and a happy new year!",  # Text to synthesize
        "locale": "en-US",                       # Language locale
        "voiceReference": audio_b64,             # Base64-encoded reference audio
        "variance": 0.2,                         # Control variation in speech
        "tempo": 1.0,                            # Speech speed (1.0 is normal)
        "temperature": 0.7,                      # Controls randomness in generation
	"promptBoost": true,			 # Enhance speaker similarity.
    },
    timeout=120  # Increase timeout to prevent broken pipe errors during audio streaming
)

# Step 3: Save the generated audio to a file
# The response is streamed in chunks to handle potentially large audio files
with open("tts_out.mp3", "wb") as f:
    for chunk in r.iter_content(chunk_size=8192):
        f.write(chunk)
```

### Example: Audio Description

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

### Phonemes

To get an accurate pronounciation, where there is more than one way to read the same spelling, please use the phonemes SSML:

```python
list_of_supported_phonemes = {
    " ", "ˈ", "ˌ", "ː", "‿", "a", "i", "u", "b", "d", "k", "t", "ˤ", "q", "ʔ",
    "f", "h", "ħ", "s", "θ", "z", "ð", "ɣ", "x", "ʃ", "j", "w", "l", "m", "n",
    "r", "ʕ", "ɛ", "ɔ", "͡", "ɤ", "ʒ", "p", "ʲ", "v", "ə", "e", "o", "β", "ʎ",
    "ŋ", "ɲ", "ɾ", "ɪ", "ʊ", "̯", "c", "ɟ", "̝", "ɦ", "ɱ", "̊", "ɑ", "ɒ", "ɐ",
    "æ", "ø", "œ", "y", "ʰ", "ʁ", "ɕ", "ç", "ʝ", "ʌ", "ɜ", "ɹ", "ʋ", "ʨ", "ʥ",
    "ɰ", "ʧ", "ʣ", "ʤ", "ʦ", "ɯ", "̥", "ʑ", "ʏ", "ʉ", "ʂ", "ɖ", "ɭ", "ɳ", "ʈ",
    "̃", "χ", "ʀ", "ɨ", "̪", "ɡ", "ʐ", "ɫ", "̩", "ɴ", "ˡ", "ʍ", "ɶ", "ɵ", "ɧ",
    "̄", "̀", "́", "̋", "̏", "ɮ", "̆", "ɓ", "ɗ"
}

def validate_phoneme_string(phoneme_str):
    # Check if every character in the input is within the set of supported phonemes
    return all(char in listOfSupportedPhonemes for char in phoneme_str)
```

#### SSML tags

```xml
<phoneme alphabet="ipa" ph="təmeɪˈtoʊ"> tomato </phoneme>
```

#### Using SSML inline

```python
import requests
r = requests.post("https://restapi.deepdub.ai/api/v1/tts",
         headers={
                  "Content-Type": "application/json",
                  "x-api-key": "your-api-key-here"
              },
         json={
              "model": "dd-etts-1.1",
              "targetText": "marry <phoneme alphabet="ipa" ph="ˈkɹɪsməs"> Christmas </phoneme>! and a happy new year!",
              "locale": "en-US",
              "voicePromptId": "your-prompt-here"
           }
     )
open("tts_output.mp3", "wb").write(r.content)
```

#### Requesting different formats

This could be used with REST API or the Websocket API.

```python
import requests
r = requests.post("https://restapi.deepdub.ai/api/v1/tts",
         headers={
                  "Content-Type": "application/json",
                  "x-api-key": "your-api-key-here"
              },
         json={
              "model": "dd-etts-1.1",
              "targetText": "Hi, how can I help you ?",
              "locale": "en-US",
              "format": "mulaw", # this can be one of the following mp3 (default for REST API),
                                 # opus, and mulaw (mulaw also modifies to 8000 sample rate)
              "voicePromptId": "your-prompt-here"
           }
     )
open("tts_output.mp3", "wb").write(r.content)
```

#### Requesting different sample rates

Sample rate can be one of 48000 (default), 44100, 32000, 24000, 22050, 16000, 8000

- Sample rate only applies when changing format to mp3, opus, and mulaw.

```python
import requests
r = requests.post("https://restapi.deepdub.ai/api/v1/tts",
         headers={
                  "Content-Type": "application/json",
                  "x-api-key": "your-api-key-here"
              },
         json={
              "model": "dd-etts-1.1",
              "targetText": "Hi, how can I help you ?",
              "locale": "en-US",
              "sampleRate": 16000,
              "voicePromptId": "your-prompt-here"
           }
     )
open("tts_output.mp3", "wb").write(r.content)
```

### Add Voice to My Voices library

**Request JSON Structure:**

```json
{
  "age": "30",
  "data": "HAAYABgAGAAgACAA...IAAkACQAJAAkACQAIAAgACAAIAAkACQAJAAkACQA==",
  "filename": "myvoice.wav",
  "gender": "MALE",
  "locale": "en-US",
  "speaking_style": "Reading",
  "text": "My voice clone"
}
```

**Response JSON Structure:**

```json
{
  "voice_prompt_id": "The actual voice Prompt ID to be referenced in TTS Generation requests",
...
}
```

### Example: Add Voice

```python
import base64
import requests

# Constants
URL = "https://restapi.deepdub.ai/api/v1/voice"
HEADERS = {
    "Content-Type": "application/json",
    "x-api-key": ""
}

def upload_voice_prompt(audio_file_path: str):
    """Uploads a voice prompt to the server."""
    with open(audio_file_path, "rb") as audio_file:
        encoded_audio = base64.b64encode(audio_file.read()).decode("utf-8")

    payload = {
        "fileName": "myVoice",
        "data": encoded_audio,
        "age": 30,
        "gender": "MALE",
        "locale": "en-US",
        "name": "Little Mike"
        "speakingStyle": "neutral",
        "text": "This is a test voice prompt"
    }

    response = requests.post(URL, headers=HEADERS, json=payload)
    response.raise_for_status()
    print("Voice prompt uploaded successfully")

if __name__ == "__main__":
    upload_voice_prompt("myVoice.wav")
```


### Example: Delete voice
```
response = requests.delete(URL + "/prompt_id", headers=HEADERS, json=payload)
```
### Example: List voices
```
response = requests.get(URL, headers=HEADERS, json=payload)
```
### Example: Get voice
```
response = requests.get(URL + "/prompt_id", headers=HEADERS, json=payload)
```




### Supported Locales



The following locales are supported (these are the values you can use for `locale`, `accentControl.accentBaseLocale` and `accentControl.accentLocale`):

```
ar-EG, ar-LB, ar-QA, ar-SA, cs-CZ, da-DK, de-DE, en-AU, en-CA, en-GB, en-IE, 
en-US, es-AR, es-CL, es-ES, es-MX, es-PE, es-XL, fr-CA, fr-FR, he-IL, hi-IN, 
hu-HU, it-IT, ja-JP, ko-KR, no-NO, pl-PL, pt-BR, pt-PT, ro-RO, ru-RU, sv-SE, 
ta-IN, th-TH, tr-TR
```



### Testing TTLA and TTFA for realtime applications
```bash
pip install deepdub
export DEEPDUB_API_KEY="your-api-key-here"
```
Create test.py with the following code:
```python
import time
import deepdub
import asyncio

dd = deepdub.DeepdubClient()

async def main():
    t1 = time.time()
    async with dd.async_connect() as conn:
        print(f"Initial connect time: {time.time() -t1}")
        t1 = time.time()
        ttfa = False
        async for chunk in conn.async_tts(text="Hello, World!", voicePromptId="408e3a63-d449-4e65-a098-ee18c542ec8e_reading-neutral", realtime=True):
            if not ttfa:
                print(f"TTFA: {time.time() - t1}")
                ttfa = True
        print(f"TTLA: {time.time() - t1}")

if __name__ == "__main__":
    asyncio.run(main())
```
