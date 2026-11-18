export const SttTry = () => {
  const trialKey = "dd-00000000000000000000000065c9cbfe"
  const [apiKey, setApiKey] = useState(trialKey)
  const [lang, setLang] = useState("en")
  const [status, setStatus] = useState("Press Record and speak, or choose a file.")
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const [recording, setRecording] = useState(false)
  const [fileName, setFileName] = useState("")
  const [level, setLevel] = useState(0)
  const fileRef = useRef(null)
  const micRef = useRef(null)

  const toPcm16 = (samples) => {
    const pcm = new Int16Array(samples.length)
    for (let i = 0; i < samples.length; i++) {
      const sample = Math.max(-1, Math.min(1, samples[i]))
      pcm[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
    }
    return new Uint8Array(pcm.buffer)
  }

  const openSession = async () => {
    const url =
      "wss://wsgw.deepdub.ai/transcribe-websocket?x-api-key=" +
      encodeURIComponent(apiKey.trim())
    const ws = new WebSocket(url)
    const finals = []
    let settled = false

    const opened = new Promise((resolve, reject) => {
      ws.onopen = resolve
      ws.onerror = () => reject(new Error("Could not open the socket."))
    })

    const finished = new Promise((resolve, reject) => {
      ws.onmessage = (event) => {
        let data
        try {
          data = JSON.parse(event.data)
        } catch (err) {
          return
        }
        if (data.error_code) {
          if (!settled) {
            settled = true
            reject(new Error(data.error_message || "Request failed (" + data.error_code + ")"))
          }
          return
        }
        const tokens = (data.tokens || []).filter((token) => token.text && token.text !== "<end>")
        for (const token of tokens) {
          if (token.is_final) finals.push(token.text)
        }
        const provisional = tokens
          .filter((token) => !token.is_final)
          .map((token) => token.text)
          .join("")
        setText(finals.join("") + provisional)
        if (data.finished && !settled) {
          settled = true
          resolve(finals.join("").trim())
        }
      }
      ws.onclose = (event) => {
        if (settled) return
        settled = true
        if (event.code === 1000) resolve(finals.join("").trim())
        else reject(new Error("Socket closed (" + event.code + ")."))
      }
    })
    finished.catch(() => {})

    await opened
    const start = {
      model: "stt-egf",
      audio_format: "pcm_s16le",
      sample_rate: 16000,
      num_channels: 1,
    }
    if (lang === "he" || lang === "en") start.language_hints = [lang]
    ws.send(JSON.stringify(start))

    return {
      send: (bytes) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(bytes)
      },
      end: () => {
        if (ws.readyState === WebSocket.OPEN) ws.send("")
      },
      close: () => {
        try {
          ws.close()
        } catch (err) {}
      },
      finished,
    }
  }

  const onFile = async (file) => {
    if (!file || busy) return
    setFileName(file.name)
    setText("")
    setBusy(true)
    setStatus("Reading " + file.name + "…")
    let session
    try {
      const decoded = await new AudioContext().decodeAudioData(await file.arrayBuffer())
      const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000)
      const source = offline.createBufferSource()
      source.buffer = decoded
      source.connect(offline.destination)
      source.start()
      const bytes = toPcm16((await offline.startRendering()).getChannelData(0))
      if (!bytes.length) throw new Error("That file has no audio.")
      session = await openSession()
      for (let i = 0; i < bytes.length; i += 3200) {
        session.send(bytes.slice(i, i + 3200))
        setStatus("Sending audio… " + Math.min(100, Math.round(((i + 3200) / bytes.length) * 100)) + "%")
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      session.end()
      setStatus("Waiting for the last words…")
      setText(await session.finished)
      setStatus("Done.")
    } catch (err) {
      setStatus(err.message || "Transcription failed.")
    } finally {
      if (session) session.close()
      setBusy(false)
    }
  }

  const stopRecording = async () => {
    const mic = micRef.current
    if (!mic) return
    micRef.current = null
    mic.processor.disconnect()
    mic.source.disconnect()
    mic.stream.getTracks().forEach((track) => track.stop())
    mic.audioContext.close()
    if (mic.pending.length) mic.session.send(toPcm16(new Float32Array(mic.pending)))
    mic.session.end()
    setRecording(false)
    setLevel(0)
    setStatus("Waiting for the last words…")
    try {
      setText(await mic.session.finished)
      setStatus("Done.")
    } catch (err) {
      setStatus(err.message || "Transcription failed.")
    } finally {
      mic.session.close()
      setBusy(false)
    }
  }

  const startRecording = async () => {
    if (busy) return
    setText("")
    setFileName("")
    setLevel(0)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus("This browser does not allow microphone access on this page. Try Chrome, Edge, Firefox, or Safari.")
      return
    }
    const audioContext = new AudioContext()
    audioContext.resume()
    setBusy(true)
    setStatus("Asking for the microphone… allow it in the browser prompt.")
    let stream
    let session
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      })
      setStatus("Connecting…")
      session = await openSession()
      await audioContext.resume()
      if (audioContext.state !== "running") {
        throw new Error("The browser kept audio paused. Click Record again.")
      }
      const source = audioContext.createMediaStreamSource(stream)
      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      const silent = audioContext.createGain()
      silent.gain.value = 0
      const ratio = audioContext.sampleRate / 16000
      const mic = { stream, session, audioContext, source, processor, pending: [], position: 0, peak: 0 }
      processor.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0)
        let sum = 0
        for (let i = 0; i < input.length; i++) sum += input[i] * input[i]
        const rms = Math.sqrt(sum / input.length)
        mic.peak = Math.max(mic.peak, rms)
        setLevel(Math.min(1, rms * 8))
        while (mic.position < input.length) {
          const index = Math.floor(mic.position)
          const next = Math.min(index + 1, input.length - 1)
          const fraction = mic.position - index
          mic.pending.push(input[index] * (1 - fraction) + input[next] * fraction)
          mic.position += ratio
        }
        mic.position -= input.length
        while (mic.pending.length >= 1600) {
          session.send(toPcm16(new Float32Array(mic.pending.splice(0, 1600))))
        }
      }
      source.connect(processor)
      processor.connect(silent)
      silent.connect(audioContext.destination)
      micRef.current = mic
      setRecording(true)
      setStatus("Listening… speak, then press Stop.")
      setTimeout(() => {
        if (micRef.current === mic && mic.peak < 0.002) {
          setStatus("No sound from the microphone. Check that the right input is selected and not muted.")
        }
      }, 3000)
      session.finished.catch((err) => {
        if (micRef.current === mic) {
          stopRecording()
          setStatus(err.message || "Transcription failed.")
        }
      })
    } catch (err) {
      if (stream) stream.getTracks().forEach((track) => track.stop())
      if (session) session.close()
      audioContext.close()
      const name = err && err.name
      setStatus(
        name === "NotAllowedError" || name === "SecurityError"
          ? "Microphone access was blocked. Allow it from the icon in the address bar, then press Record again."
          : name === "NotFoundError"
            ? "No microphone was found."
            : name === "NotReadableError"
              ? "The microphone is in use by another app."
              : (err && err.message) || "Recording failed."
      )
      setBusy(false)
    }
  }

  return (
    <div className="not-prose my-6 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-zinc-950 dark:text-white">Try it</div>
        <div className="text-xs text-zinc-500">Free trial key, your voice</div>
      </div>
      <label className="mb-3 block text-xs text-zinc-500">
        API key
        <input
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          spellCheck={false}
          disabled={busy}
          className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
      </label>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select
          value={lang}
          disabled={busy}
          onChange={(event) => setLang(event.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        >
          <option value="en">English</option>
          <option value="he">Hebrew</option>
          <option value="auto">Detect</option>
        </select>
        <button
          type="button"
          disabled={busy && !recording}
          onClick={recording ? stopRecording : startRecording}
          className="rounded-lg bg-[#FF3390] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {recording ? "■ Stop" : "● Record"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current && fileRef.current.click()}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50 dark:border-zinc-600 dark:text-white"
        >
          Choose file
        </button>
        {recording ? (
          <div className="h-2 w-24 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800" title="Microphone level">
            <div className="h-full bg-[#FF3390] transition-all" style={{ width: Math.round(level * 100) + "%" }} />
          </div>
        ) : null}
        <span className="text-xs text-zinc-500">{fileName}</span>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*,.wav,.mp3,.m4a,.webm,.ogg,.flac"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files && event.target.files[0]
            event.target.value = ""
            onFile(file)
          }}
        />
      </div>
      <div className="min-h-16 whitespace-pre-wrap rounded-lg bg-zinc-50 px-3 py-3 text-sm text-zinc-950 dark:bg-zinc-900 dark:text-white">
        {text || "Words show up here while you speak."}
      </div>
      <div className="mt-2 text-xs text-zinc-500">{status}</div>
    </div>
  )
}
