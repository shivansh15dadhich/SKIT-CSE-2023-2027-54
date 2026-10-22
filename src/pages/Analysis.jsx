import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import StatusIndicator from "../components/ui/StatusIndicator";
import TextAreaField from "../components/ui/TextAreaField";
import EmotionCard from "../components/visualizations/EmotionCard";
import SentimentIndicator from "../components/visualizations/SentimentIndicator";
import EmotionProbabilityChart from "../components/charts/EmotionProbabilityChart";
import { useSession } from "../context/SessionContext";
import { sampleFacialTimeline } from "../data/sampleData";
import { analyzeText } from "../services/analysisService";

const MIN_WORDS = 3;

function Analysis() {
  const { facialSamples, textEntries, addFacialSample, addTextEntry, resetSession } =
    useSession();
  const sampleIndexRef = useRef(0);

  const [journalText, setJournalText] = useState("");
  const [journalError, setJournalError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const latestAffect = facialSamples[facialSamples.length - 1];
  const latestText = textEntries[textEntries.length - 1];

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

    if (typeof MediaRecorder === "undefined") {
      console.warn("MediaRecorder is not supported in this browser.");
      return;
    }

    // Safari does not support audio/webm, so fall back to the browser default.
    const mimeType = MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : "";

    const recorder = new MediaRecorder(
      audioStream,
      mimeType ? { mimeType } : undefined,
    );

    audioChunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: recorder.mimeType || "audio/webm",
      });

      console.log("Audio recording created:", audioBlob);

      console.log("Audio size:", `${(audioBlob.size / 1024).toFixed(2)} KB`);
    };

    recorder.start();

    mediaRecorderRef.current = recorder;
  };
  const startFrameCapture = () => {
    // Never run two capture loops at once.
    if (frameCaptureRef.current) {
      clearInterval(frameCaptureRef.current);
    }

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

          // TODO: send `blob` to the CV service and store its response.
          // Until then, replay the sample facial affect timeline.
          const sample =
            sampleFacialTimeline[
              sampleIndexRef.current % sampleFacialTimeline.length
            ];
          sampleIndexRef.current += 1;

          addFacialSample({
            ...sample,
            timestamp_utc: new Date().toISOString(),
          });
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

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "Camera access is not available. Open the app over https or localhost in a modern browser.",
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      resetSession();
      sampleIndexRef.current = 0;

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
    // play() resolves asynchronously; ignore it if this effect was cleaned up
    // first (React StrictMode runs effects twice in development).
    let cancelled = false;

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
          if (!cancelled) {
            startFrameCapture();
          }
        })
        .catch((err) => {
          if (!cancelled) {
            console.error("Video playback error:", err);
          }
        });
    }

    return () => {
      cancelled = true;

      if (frameCaptureRef.current) {
        clearInterval(frameCaptureRef.current);
        frameCaptureRef.current = null;
      }
    };
    // Only re-attach the stream when the session or camera state changes.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
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

    if (
      audioContextRef.current &&
      audioContextRef.current.state !== "closed"
    ) {
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
  // TEXT JOURNAL
  // =========================
  const submitJournal = async (event) => {
    event.preventDefault();

    const words = journalText.trim().split(/\s+/).filter(Boolean);

    if (words.length < MIN_WORDS) {
      setJournalError(`Please write at least ${MIN_WORDS} words.`);
      return;
    }

    setJournalError("");
    setAnalyzing(true);

    try {
      const analysis = await analyzeText(journalText);

      addTextEntry({
        date: new Date().toISOString().slice(0, 10),
        text: journalText.trim(),
        analysis,
      });

      setJournalText("");
    } catch (err) {
      console.error("Text analysis error:", err);
      setJournalError("Could not analyse the text. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  // =========================
  // CLEANUP
  // =========================
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (frameCaptureRef.current) {
        clearInterval(frameCaptureRef.current);
      }

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
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
        <Alert variant="info" title="Preview mode" className="mb-4">
          The CV and NLP services are not connected yet. Facial results replay
          sample data and text is analysed in the browser.
        </Alert>

        {/* =========================
            CAPTURE PANELS
        ========================= */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Face capture */}
          <Card
            title="Face Analysis"
            icon="◉"
            status={
              <span className="text-[8px] text-[#657675]">
                {cameraEnabled ? "ACTIVE" : "READY"}
              </span>
            }
          >
            <div className="relative h-[210px] overflow-hidden rounded-md border border-[#29403f] bg-[#101414]">
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

              <StatusIndicator
                status={cameraEnabled ? "active" : "idle"}
                label={cameraEnabled ? "CAMERA ACTIVE" : "WAITING"}
                className="absolute bottom-3 left-3"
              />
            </div>
          </Card>

          {/* Voice capture */}
          <Card
            title="Voice Analysis"
            icon="♪"
            status={
              <span className="text-[8px] text-[#657675]">
                {microphoneEnabled ? "ACTIVE" : "READY"}
              </span>
            }
          >
            <div className="flex h-[210px] flex-col items-center justify-center rounded-md border border-[#29403f] bg-[#101414]">
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

              <StatusIndicator
                status={microphoneEnabled ? "active" : "idle"}
                label={microphoneEnabled ? "MICROPHONE ACTIVE" : "WAITING"}
                className="mt-6"
              />
            </div>
          </Card>
        </section>

        {/* =========================
            LIVE RESULTS
        ========================= */}
        <section className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Facial emotion */}
          <Card
            title="Facial Emotion"
            icon="✣"
            status={
              <StatusIndicator
                status={facialSamples.length ? "warning" : "idle"}
                label={
                  facialSamples.length
                    ? `SAMPLE DATA · ${facialSamples.length} FRAMES`
                    : "NO FRAMES YET"
                }
              />
            }
          >
            <EmotionCard affect={latestAffect} />

            <div className="mt-4">
              <EmotionProbabilityChart scores={latestAffect?.emotion.scores} />
            </div>
          </Card>

          {/* Text sentiment */}
          <Card
            title="Text Sentiment"
            icon="✎"
            status={
              <span className="text-[8px] text-[#657675]">
                {textEntries.length} ENTRIES
              </span>
            }
          >
            <form onSubmit={submitJournal} className="space-y-3">
              <TextAreaField
                label="How have you been feeling today?"
                value={journalText}
                onChange={(value) => {
                  setJournalText(value);
                  if (journalError) setJournalError("");
                }}
                placeholder="Write a few sentences about your day..."
                maxLength={2000}
                error={journalError}
                hint="Your text is used only for this session."
                disabled={analyzing}
              />

              <Button
                type="submit"
                size="sm"
                disabled={analyzing || !journalText.trim()}
              >
                {analyzing ? "Analysing..." : "Analyse Text"}
              </Button>
            </form>

            <div className="mt-4">
              <SentimentIndicator analysis={latestText?.analysis} />
            </div>
          </Card>
        </section>

        {/* =========================
            ERROR
        ========================= */}
        {error && (
          <Alert variant="error" className="mx-auto mt-5 max-w-xl">
            {error}
          </Alert>
        )}

        {/* =========================
            SESSION CONTROLS
        ========================= */}
        <section className="flex flex-col items-center py-10">
          {!sessionStarted ? (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button onClick={startSession}>Begin Session</Button>

              {(facialSamples.length > 0 || textEntries.length > 0) && (
                <Button to="/results" variant="secondary">
                  View Results
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="danger" onClick={stopSession}>
                End Session
              </Button>

              <Button to="/results">View Results</Button>
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
