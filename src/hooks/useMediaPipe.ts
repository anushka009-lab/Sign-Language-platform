/**
 * useMediaPipe — Real-time hand landmark & motion tracking hook
 * Runs MediaPipe Hands on local video feed, extracts 21 keypoints per hand,
 * and tracks spatial velocity vectors across consecutive frames.
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { MotionTracker } from '../ml/signClassifier';

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandDetectionResult {
  landmarks: HandLandmark[][]; // array of hands, each hand = 21 landmarks
  handedness: string[]; // 'Left' | 'Right' per hand
  motionTrackers?: MotionTracker[];
}

const MEDIAPIPE_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/';

export function useMediaPipe(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  enabled: boolean,
) {
  const [lastResult, setLastResult] = useState<HandDetectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fps, setFps] = useState<number>(0);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const handsRef = useRef<any>(null);
  const animFrameRef = useRef<number>(0);
  const motionTrackersRef = useRef<MotionTracker[]>([new MotionTracker(), new MotionTracker()]);

  // Performance tracking refs
  const frameCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(performance.now());

  const drawLandmarks = useCallback(
    (results: any) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth || canvas.clientWidth;
      canvas.height = video.videoHeight || canvas.clientHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarksList: HandLandmark[][] = [];

        results.multiHandLandmarks.forEach((landmarks: any[], handIdx: number) => {
          // Connections skeleton
          const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [0, 9], [9, 10], [10, 11], [11, 12],
            [0, 13], [13, 14], [14, 15], [15, 16],
            [0, 17], [17, 18], [18, 19], [19, 20],
            [5, 9], [9, 13], [13, 17],
          ];

          const colorScheme =
            handIdx === 0
              ? { line: 'rgba(6, 182, 212, 0.8)', point: 'rgba(56, 189, 248, 0.95)', glow: 'rgba(6, 182, 212, 0.5)' }
              : { line: 'rgba(59, 130, 246, 0.8)', point: 'rgba(147, 197, 253, 0.95)', glow: 'rgba(59, 130, 246, 0.5)' };

          // Draw subtle, non-intrusive cyan/blue skeleton lines
          ctx.strokeStyle = colorScheme.line;
          ctx.lineWidth = 2.2;
          ctx.shadowColor = colorScheme.glow;
          ctx.shadowBlur = 6;

          for (const [i, j] of connections) {
            const a = landmarks[i];
            const b = landmarks[j];
            ctx.beginPath();
            ctx.moveTo(a.x * canvas.width, a.y * canvas.height);
            ctx.lineTo(b.x * canvas.width, b.y * canvas.height);
            ctx.stroke();
          }

          // Draw keypoint joint nodes
          ctx.shadowBlur = 4;
          for (let k = 0; k < landmarks.length; k++) {
            const lm = landmarks[k];
            ctx.beginPath();
            ctx.arc(lm.x * canvas.width, lm.y * canvas.height, k === 0 || k % 4 === 0 ? 4.5 : 3, 0, 2 * Math.PI);
            ctx.fillStyle = colorScheme.point;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }

          // Format hand landmarks
          const handPoints: HandLandmark[] = landmarks.map((lm: any) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z,
          }));
          landmarksList.push(handPoints);

          // Update motion tracker for hand
          if (motionTrackersRef.current[handIdx]) {
            motionTrackersRef.current[handIdx].push(handPoints[0]); // track wrist point
          }
        });

        // Set state with landmarks and motion trackers
        setLastResult({
          landmarks: landmarksList,
          handedness: results.multiHandedness?.map((h: any) => h.label) || ['Right', 'Left'],
          motionTrackers: motionTrackersRef.current,
        });
      } else {
        setLastResult(null);
      }
    },
    [canvasRef, videoRef],
  );

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const initMediaPipe = async () => {
      setIsLoading(true);

      try {
        const { Hands } = await import('@mediapipe/hands');

        if (cancelled) return;

        const hands = new Hands({
          locateFile: (file: string) => `${MEDIAPIPE_CDN}${file}`,
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.5,
        });

        hands.onResults((results: any) => {
          if (!cancelled) {
            drawLandmarks(results);
          }
        });

        await hands.initialize();
        handsRef.current = hands;
        setIsLoading(false);

        const detect = async () => {
          if (cancelled) return;
          const video = videoRef.current;
          if (video && video.readyState >= 2 && handsRef.current) {
            const startT = performance.now();
            try {
              await handsRef.current.send({ image: video });
              const elapsed = performance.now() - startT;
              setLatencyMs(Math.round(elapsed));

              // FPS Calculation
              frameCountRef.current++;
              const now = performance.now();
              if (now - lastFpsTimeRef.current >= 1000) {
                setFps(Math.round((frameCountRef.current * 1000) / (now - lastFpsTimeRef.current)));
                frameCountRef.current = 0;
                lastFpsTimeRef.current = now;
              }
            } catch (e) {
              // continue frame detection silently
            }
          }
          animFrameRef.current = requestAnimationFrame(detect);
        };
        detect();
      } catch (err) {
        console.error('MediaPipe initialization error:', err);
        setIsLoading(false);
      }
    };

    initMediaPipe();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animFrameRef.current);
      if (handsRef.current) {
        handsRef.current.close();
        handsRef.current = null;
      }
    };
  }, [enabled, drawLandmarks, videoRef]);

  return { lastResult, isLoading, fps, latencyMs };
}
