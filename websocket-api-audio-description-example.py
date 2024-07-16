import asyncio
import base64
import io
import json
from pathlib import Path

import websockets
from lxml import etree
from pydub import AudioSegment

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



# 			<p begin="00:00:17.900" end="00:00:21.480">going to be paying the bank for the privilege of using their money. And that</p>
# 			<p begin="00:00:21.660" end="00:00:26.440">amount of money that I pay the bank is called interest. Likewise, if I put money</p>
# 			<p begin="00:00:26.620" end="00:00:31.220">in a savings account or I purchase a certificate of deposit, the bank just</p>
# 			<p begin="00:00:31.300" end="00:00:35.800">doesn't put my money in a little box and leave it there until later. They take</p>
# 			<p begin="00:00:35.800" end="00:00:40.822">my money and lend it to someone else. So they are using my money.</p>
# 			<p begin="00:00:40.822" end="00:00:44.400">The bank has to pay me for the privilege of using my money.</p>
# 			<p begin="00:00:44.400" end="00:00:48.700">Now what makes banks profitable is the rate</p>
# 			<p begin="00:00:48.700" end="00:00:53.330">that they charge people to use the bank's money is higher than the rate that they</p>
# 			<p begin="00:00:53.510" end="00:01:00.720">pay people like me to use my money. The amount of interest that a person pays or</p>
# 			<p begin="00:01:00.800" end="00:01:06.640">earns is dependent on three things. It's dependent on how much money is involved.</p>
# 			<p begin="00:01:06.820" end="00:01:11.300">It's dependent upon the rate of interest being paid or the rate of interest being</p>
# 			<p begin="00:01:11.480" end="00:01:17.898">charged. And it's also dependent upon how much time is involved. If I have</p>
# 			<p begin="00:01:17.898" end="00:01:22.730">a loan and I want to decrease the amount of interest that I'm going to pay, then</p>
# 			<p begin="00:01:22.800" end="00:01:28.040">I'm either going to have to decrease how much money I borrow, I'm going to have</p>
# 			<p begin="00:01:28.220" end="00:01:32.420">to borrow the money over a shorter period of time, or I'm going to have to find a</p>
# 			<p begin="00:01:32.600" end="00:01:37.279">lending institution that charges a lower interest rate. On the other hand, if I</p>
# 			<p begin="00:01:37.279" end="00:01:41.480">want to earn more interest on my investment, I'm going to have to invest</p>
# 			<p begin="00:01:41.480" end="00:01:46.860">more money, leave the money in the account for a longer period of time, or</p>
# 			<p begin="00:01:46.860" end="00:01:49.970">find an institution that will pay me a higher interest rate.</p>

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
    audio_description = AudioSegment.silent(duration=0)
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

            generated_audio = AudioSegment.empty()

            while True:

                message_received = await websocket.recv()
                message_received = json.loads(message_received)
                print(f"received chunk {message_received['generationId']} - {message_received.get('index', 0) }")

                if message_received.get("data"):
                    generated_audio += AudioSegment.from_file(io.BytesIO(base64.b64decode(message_received['data'])), format="wav")

                if message_received["isFinished"]:
                    break

            # Adding the file to the final audio
            if len(audio_description) < end_ms:
                audio_description += AudioSegment.silent(duration=(end_ms - len(audio_description)))

            audio_description = audio_description.overlay(generated_audio, position=begin_ms)

    # Export the final_audio to a WAV file
    audio_description.export("final.wav", format="wav")

    print("Final WAV file created successfully.")


# Run the WebSocket client
asyncio.run(create_audio_description_from_file(xml_content))
