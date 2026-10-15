import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

function Analysis() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const frameCaptureRef = useRef(null);
  const capturedFramesRef = useRef([]);

  const [audioLevels, setAudioLevels] = useState(Array(12).fill(8));

  const [sessionStarted, setSessionStarted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [error, setError] = useState("");

  const startAudioAnalyser = (stream) => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();

    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    const source = audioContext.createMediaStreamSource(stream);

    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateWaveform = () => {
      analyser.getByteFrequencyData(dataArray);

      const bars = 12;
      const step = Math.floor(dataArray.length / bars);

      const newLevels = [];

      for (let i = 0; i < bars; i++) {
        let total = 0;

        for (let j = 0; j < step; j++) {
          total += dataArray[i * step + j];
        }

        const average = total / step;

        // Convert microphone intensity into UI bar height.
        const height = Math.max(6, Math.min(48, (average / 255) * 60));

        newLevels.push(height);
      }

      setAudioLevels(newLevels);

      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    };

    updateWaveform();
  };
  const startAudioRecording = (stream) => {
    const audioStream = new MediaStream(stream.getAudioTracks());

    const recorder = new MediaRecorder(audioStream, {
      mimeType: "audio/webm",
    });

    audioChunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });

      console.log("Audio recording created:", audioBlob);

      console.log("Audio size:", `${(audioBlob.size / 1024).toFixed(2)} KB`);
    };

    recorder.start();

    mediaRecorderRef.current = recorder;
  };
  const startFrameCapture = () => {
    capturedFramesRef.current = [];

    frameCaptureRef.current = setInterval(() => {
      if (!videoRef.current) {
        return;
      }

      if (
        videoRef.current.videoWidth === 0 ||
        videoRef.current.videoHeight === 0
      ) {
        return;
      }

      const canvas = document.createElement("canvas");

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      const context = canvas.getContext("2d");

      if (!context) {
        return;
      }

      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return;
          }

          capturedFramesRef.current.push(blob);

          // Keep only the latest 30 frames
          if (capturedFramesRef.current.length > 30) {
            capturedFramesRef.current.shift();
          }

          console.log("Captured frames:", capturedFramesRef.current.length);
        },
        "image/jpeg",
        0.75,
      );
    }, 2000);
  };
  // =========================
  // START SESSION
  // =========================
  const startSession = async () => {
    setError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();

      setCameraEnabled(videoTracks.length > 0);
      setMicrophoneEnabled(audioTracks.length > 0);
      setSessionStarted(true);

      if (audioTracks.length > 0) {
        startAudioAnalyser(stream);
        startAudioRecording(stream);
      }
    } catch (err) {
      console.error("Media permission error:", err);

      setError(
        "Camera and microphone access is required to start the analysis session.",
      );
    }
  };

  // =========================
  // ATTACH CAMERA STREAM
  // =========================
  useEffect(() => {
    if (
      sessionStarted &&
      cameraEnabled &&
      videoRef.current &&
      streamRef.current
    ) {
      videoRef.current.srcObject = streamRef.current;

      videoRef.current
        .play()
        .then(() => {
          startFrameCapture();
        })
        .catch((err) => {
          console.error("Video playback error:", err);
        });
    }

    return () => {
      if (frameCaptureRef.current) {
        clearInterval(frameCaptureRef.current);
        frameCaptureRef.current = null;
      }
    };
  }, [sessionStarted, cameraEnabled]);

  // =========================
  // STOP SESSION
  // =========================
  const stopSession = () => {
    if (frameCaptureRef.current) {
      clearInterval(frameCaptureRef.current);
      frameCaptureRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    mediaRecorderRef.current = null;
    analyserRef.current = null;

    setAudioLevels(Array(12).fill(8));
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setSessionStarted(false);
    setCameraEnabled(false);
    setMicrophoneEnabled(false);
  };

  // =========================
  // CLEANUP
  // =========================
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#111414] text-white">
      <Navbar />

      <main className="mx-auto w-full max-w-[1000px] px-6 py-10">
        {/* =========================
            ANALYSIS PANELS
        ========================= */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* =========================
              FACE ANALYSIS
          ========================= */}
          <div className="rounded-lg border border-[#293535] bg-[#191e1e] p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-[#58d9d0]">
                ◉ Face Analysis
              </h2>

              <span className="text-[8px] text-[#657675]">
                {cameraEnabled ? "ACTIVE" : "READY"}
              </span>
            </div>

            {/* Camera */}
            <div className="relative mt-3 h-[210px] overflow-hidden rounded-md border border-[#29403f] bg-[#101414]">
              {sessionStarted && cameraEnabled ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto flex h-24 w-20 items-center justify-center rounded-[50%] border border-[#3b7774] bg-[#182020]">
                      <span className="text-3xl opacity-30">◉</span>
                    </div>

                    <p className="mt-3 text-[8px] text-[#657675]">
                      {sessionStarted ? "Camera unavailable" : "Camera ready"}
                    </p>
                  </div>
                </div>
              )}

              {/* Camera Status */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-[#101414]/80 px-2 py-1">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    cameraEnabled
                      ? "animate-pulse bg-[#58d9d0]"
                      : "bg-[#657675]"
                  }`}
                />

                <span className="text-[8px] tracking-wide text-[#899595]">
                  {cameraEnabled ? "CAMERA ACTIVE" : "WAITING"}
                </span>
              </div>
            </div>
          </div>

          {/* =========================
              VOICE ANALYSIS
          ========================= */}
          <div className="rounded-lg border border-[#293535] bg-[#191e1e] p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-[#58d9d0]">
                ♪ Voice Analysis
              </h2>

              <span className="text-[8px] text-[#657675]">
                {microphoneEnabled ? "ACTIVE" : "READY"}
              </span>
            </div>

            {/* Voice Area */}
            <div className="mt-3 flex h-[210px] flex-col items-center justify-center rounded-md border border-[#29403f] bg-[#101414]">
              <p className="text-[9px] italic text-[#657675]">
                {microphoneEnabled
                  ? "Listening for voice input..."
                  : "Microphone ready for session"}
              </p>

              {/* Waveform */}
              <div className="mt-8 flex h-12 items-center gap-1">
                {audioLevels.map((height, index) => (
                  <span
                    key={index}
                    className={`w-1 rounded-full transition-[height] duration-75 ${
                      microphoneEnabled ? "bg-[#58d9d0]" : "bg-[#315451]"
                    }`}
                    style={{
                      height: `${microphoneEnabled ? height : 8}px`,
                    }}
                  />
                ))}
              </div>

              <div className="mt-6 flex w-full items-center justify-between px-4">
                <span className="text-[8px] text-[#657675]">
                  {microphoneEnabled ? "LISTENING..." : "WAITING"}
                </span>

                <span className="rounded-full bg-[#242032] px-2 py-1 text-[7px] text-[#a69db8]">
                  READY
                </span>

                <span className="rounded-full bg-[#203635] px-2 py-1 text-[7px] text-[#58d9d0]">
                  INPUT
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            METRICS
        ========================= */}
        <section className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1.5fr_1fr_1fr]">
          {/* Attention */}
          <div className="rounded-md border border-[#293535] bg-[#191e1e] px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-[#899595]">ATTENTION LEVEL</span>

              <span className="text-sm font-semibold text-[#58d9d0]">--</span>
            </div>

            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#25302f]">
              <div className="h-full w-0 rounded-full bg-[#58d9d0]" />
            </div>
          </div>

          {/* Heart Rate */}
          <div className="rounded-md border border-[#293535] bg-[#191e1e] px-5 py-4">
            <span className="text-[8px] text-[#657675]">HEART RATE</span>

            <div className="mt-2 flex items-end gap-2">
              <span className="text-xl text-[#dce4e2]">--</span>

              <span className="mb-1 text-[8px] text-[#657675]">BPM</span>
            </div>
          </div>

          {/* Cognitive Load */}
          <div className="rounded-md border border-[#293535] bg-[#191e1e] px-5 py-4">
            <span className="text-[8px] text-[#657675]">COGNITIVE LOAD</span>

            <div className="mt-2 text-xl text-[#dce4e2]">--</div>
          </div>
        </section>

        {/* =========================
            ERROR
        ========================= */}
        {error && (
          <div className="mx-auto mt-5 max-w-xl rounded-md border border-red-900/50 bg-red-950/20 px-4 py-3 text-center text-[9px] text-red-300">
            {error}
          </div>
        )}

        {/* =========================
            SESSION CONTROLS
        ========================= */}
        <section className="flex flex-col items-center py-10">
          {!sessionStarted ? (
            <button
              onClick={startSession}
              className="rounded-full border border-[#58d9d0] bg-[#58d9d0] px-8 py-3 text-xs font-semibold text-[#102020] transition-transform hover:-translate-y-0.5"
            >
              Begin Session
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={stopSession}
                className="rounded-full border border-[#29403f] bg-transparent px-7 py-3 text-xs font-semibold text-[#9ca9a8] transition-all hover:border-red-400 hover:text-red-300"
              >
                End Session
              </button>

              <Link
                to="/results"
                className="rounded-full border border-[#58d9d0] bg-[#58d9d0] px-7 py-3 text-xs font-semibold text-[#102020] transition-transform hover:-translate-y-0.5"
              >
                View Results
              </Link>
            </div>
          )}

          <p className="mt-3 text-[8px] text-[#657675]">
            {sessionStarted
              ? "Your camera and microphone are currently active."
              : "Analysis starts after you grant camera and microphone access."}
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Analysis;
