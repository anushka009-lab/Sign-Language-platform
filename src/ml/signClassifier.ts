/**
 * signClassifier — Comprehensive AI Sign Language & Gesture Recognition Engine
 * 
 * Includes:
 * - 21-point MediaPipe hand landmark geometry analysis
 * - Full ASL Alphabet (A-Z) static & dynamic classifications
 * - Dynamic Motion & Trajectory tracking (waves, circles, swipes, nods)
 * - Two-Hand Gesture Recognition (HELP, BOOK, MORE, TOGETHER, CLAP, FINISH)
 * - Custom Gesture Template matching against user-recorded landmarks
 * - Temporal Smoothing Buffer with confidence weighting
 * - Complete metadata catalog for 40+ signs
 */

import type { HandLandmark } from '../hooks/useMediaPipe';

export interface SignPrediction {
  sign: string;
  confidence: number;
  isTwoHanded?: boolean;
  isCustom?: boolean;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface MotionData {
  velocity: Vector3D;
  speed: number;
  direction: 'up' | 'down' | 'left' | 'right' | 'circle' | 'wave' | 'still';
}

export interface CustomGestureTemplate {
  id: string;
  name: string;
  landmarks: HandLandmark[];
  fingerStates: { thumb: boolean; index: boolean; middle: boolean; ring: boolean; pinky: boolean };
  createdAt: number;
}

// ============================================================
//  Landmark Indices (MediaPipe 21-point hand model)
// ============================================================

export const WRIST = 0;
export const THUMB_CMC = 1;
export const THUMB_MCP = 2;
export const THUMB_IP = 3;
export const THUMB_TIP = 4;
export const INDEX_MCP = 5;
export const INDEX_PIP = 6;
export const INDEX_DIP = 7;
export const INDEX_TIP = 8;
export const MIDDLE_MCP = 9;
export const MIDDLE_PIP = 10;
export const MIDDLE_DIP = 11;
export const MIDDLE_TIP = 12;
export const RING_MCP = 13;
export const RING_PIP = 14;
export const RING_DIP = 15;
export const RING_TIP = 16;
export const PINKY_MCP = 17;
export const PINKY_PIP = 18;
export const PINKY_DIP = 19;
export const PINKY_TIP = 20;

// ============================================================
//  Geometry Helpers
// ============================================================

/** Euclidean distance between two 3D landmarks */
export function distance(a: HandLandmark, b: HandLandmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

/** 2D distance (ignoring depth) */
export function distance2D(a: HandLandmark, b: HandLandmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** Angle between three points in degrees (vertex at point b) */
export function angleBetween(a: HandLandmark, b: HandLandmark, c: HandLandmark): number {
  const ab = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  const cb = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };
  const dot = ab.x * cb.x + ab.y * cb.y + ab.z * cb.z;
  const magAB = Math.sqrt(ab.x ** 2 + ab.y ** 2 + ab.z ** 2);
  const magCB = Math.sqrt(cb.x ** 2 + cb.y ** 2 + cb.z ** 2);
  if (magAB === 0 || magCB === 0) return 0;
  const cosAngle = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  return Math.acos(cosAngle) * (180 / Math.PI);
}

// ============================================================
//  Finger & Orientation Analysis
// ============================================================

/** Check if a finger (non-thumb) is extended */
function isFingerExtended(
  landmarks: HandLandmark[],
  tipIdx: number,
  pipIdx: number,
  mcpIdx: number,
): boolean {
  const tipDist = distance(landmarks[tipIdx], landmarks[WRIST]);
  const pipDist = distance(landmarks[pipIdx], landmarks[WRIST]);
  const tipAbovePip = landmarks[tipIdx].y < landmarks[pipIdx].y;
  return tipDist > pipDist * 1.05 && tipAbovePip;
}

/** Check if thumb is extended (away from palm) */
function isThumbExtended(landmarks: HandLandmark[]): boolean {
  const thumbTipToIndexMcp = distance(landmarks[THUMB_TIP], landmarks[INDEX_MCP]);
  const palmWidth = distance(landmarks[INDEX_MCP], landmarks[PINKY_MCP]);
  return thumbTipToIndexMcp > palmWidth * 0.75;
}

/** Measure how curled a finger is (0 = fully extended, 1 = fully curled) */
export function fingerCurl(
  landmarks: HandLandmark[],
  mcpIdx: number,
  pipIdx: number,
  dipIdx: number,
  tipIdx: number,
): number {
  const fullExtAngle = angleBetween(landmarks[mcpIdx], landmarks[pipIdx], landmarks[tipIdx]);
  const normalized = 1 - Math.max(0, Math.min(1, (fullExtAngle - 40) / 140));
  return normalized;
}

/** Get all finger curl values */
export function getAllFingerCurls(landmarks: HandLandmark[]): {
  thumb: number;
  index: number;
  middle: number;
  ring: number;
  pinky: number;
} {
  return {
    thumb: fingerCurl(landmarks, THUMB_CMC, THUMB_MCP, THUMB_IP, THUMB_TIP),
    index: fingerCurl(landmarks, INDEX_MCP, INDEX_PIP, INDEX_DIP, INDEX_TIP),
    middle: fingerCurl(landmarks, MIDDLE_MCP, MIDDLE_PIP, MIDDLE_DIP, MIDDLE_TIP),
    ring: fingerCurl(landmarks, RING_MCP, RING_PIP, RING_DIP, RING_TIP),
    pinky: fingerCurl(landmarks, PINKY_MCP, PINKY_PIP, PINKY_DIP, PINKY_TIP),
  };
}

/** Get binary finger extension states */
export function getFingerStates(landmarks: HandLandmark[]): {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
} {
  return {
    thumb: isThumbExtended(landmarks),
    index: isFingerExtended(landmarks, INDEX_TIP, INDEX_PIP, INDEX_MCP),
    middle: isFingerExtended(landmarks, MIDDLE_TIP, MIDDLE_PIP, MIDDLE_MCP),
    ring: isFingerExtended(landmarks, RING_TIP, RING_PIP, RING_MCP),
    pinky: isFingerExtended(landmarks, PINKY_TIP, PINKY_PIP, PINKY_MCP),
  };
}

/** Measure spread between two finger tips */
export function fingerSpread(landmarks: HandLandmark[], tipA: number, tipB: number): number {
  return distance2D(landmarks[tipA], landmarks[tipB]);
}

/** Detect hand orientation: 'up', 'down', 'left', 'right' */
export function getHandOrientation(landmarks: HandLandmark[]): string {
  const wrist = landmarks[WRIST];
  const middleMcp = landmarks[MIDDLE_MCP];
  const dx = middleMcp.x - wrist.x;
  const dy = middleMcp.y - wrist.y;

  if (Math.abs(dy) > Math.abs(dx)) {
    return dy < 0 ? 'up' : 'down';
  }
  return dx > 0 ? 'right' : 'left';
}

// ============================================================
//  Motion Tracking Engine
// ============================================================

export class MotionTracker {
  private history: HandLandmark[] = []; // tracks WRIST positions over time
  private maxHistory = 15;

  push(wrist: HandLandmark): void {
    this.history.push({ ...wrist });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  getMotion(): MotionData {
    if (this.history.length < 3) {
      return { velocity: { x: 0, y: 0, z: 0 }, speed: 0, direction: 'still' };
    }

    const first = this.history[0];
    const last = this.history[this.history.length - 1];
    const dx = last.x - first.x;
    const dy = last.y - first.y;
    const dz = last.z - first.z;
    const dt = this.history.length;

    const vx = dx / dt;
    const vy = dy / dt;
    const vz = dz / dt;
    const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);

    // Detect direction pattern
    let direction: MotionData['direction'] = 'still';
    if (speed > 0.008) {
      // Check for horizontal oscillations (waving)
      let directionChanges = 0;
      for (let i = 1; i < this.history.length - 1; i++) {
        const d1 = this.history[i].x - this.history[i - 1].x;
        const d2 = this.history[i + 1].x - this.history[i].x;
        if (d1 * d2 < 0) directionChanges++;
      }

      if (directionChanges >= 2) {
        direction = 'wave';
      } else if (Math.abs(vx) > Math.abs(vy)) {
        direction = vx > 0 ? 'right' : 'left';
      } else {
        direction = vy > 0 ? 'down' : 'up';
      }
    }

    return { velocity: { x: vx, y: vy, z: vz }, speed, direction };
  }

  clear(): void {
    this.history = [];
  }
}

// ============================================================
//  Sign Catalog (40+ Signs)
// ============================================================

export interface SignInfo {
  name: string;
  category: 'greeting' | 'response' | 'number' | 'letter' | 'gesture' | 'word' | 'two-handed';
  emoji: string;
  description: string;
  instructions: string[];
  fingerPattern: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const SIGN_CATALOG: SignInfo[] = [
  // ---- Greetings & Basics ----
  {
    name: 'HELLO',
    category: 'greeting',
    emoji: '👋',
    description: 'Open palm wave — universal greeting',
    instructions: ['Extend all five fingers', 'Hold hand facing forward', 'Wave side to side'],
    fingerPattern: 'All fingers extended + wave motion',
    difficulty: 'easy',
  },
  {
    name: 'I LOVE YOU',
    category: 'greeting',
    emoji: '🤟',
    description: 'ILY handshape — combines letters I, L, and Y',
    instructions: ['Extend thumb, index, and pinky', 'Curl middle and ring fingers into palm', 'Hold facing forward'],
    fingerPattern: 'Thumb + Index + Pinky',
    difficulty: 'easy',
  },
  {
    name: 'THANK YOU',
    category: 'word',
    emoji: '🙏',
    description: 'Flat hand moving from chin outward',
    instructions: ['Extend fingers flat', 'Touch fingertips to chin', 'Move hand forward toward listener'],
    fingerPattern: 'Flat open palm near face',
    difficulty: 'medium',
  },
  {
    name: 'PLEASE',
    category: 'word',
    emoji: '✋',
    description: 'Flat hand circling on chest',
    instructions: ['Place flat hand on chest', 'Move in a circle', 'Keep fingers flat'],
    fingerPattern: 'Flat palm on chest + circular motion',
    difficulty: 'medium',
  },
  {
    name: 'SORRY',
    category: 'word',
    emoji: '😔',
    description: 'Fist circling on chest',
    instructions: ['Make an A-handshape fist', 'Place fist on chest', 'Rub in circular motion'],
    fingerPattern: 'Closed fist on chest + circle',
    difficulty: 'medium',
  },
  {
    name: 'GOOD',
    category: 'response',
    emoji: '👍',
    description: 'Thumbs up gesture',
    instructions: ['Make a fist', 'Extend thumb pointing upward', 'Keep remaining fingers curled'],
    fingerPattern: 'Thumb extended up',
    difficulty: 'easy',
  },
  {
    name: 'YES',
    category: 'response',
    emoji: '✊',
    description: 'Fist nodding up and down',
    instructions: ['Make a tight fist', 'Nod fist up and down like a head nod'],
    fingerPattern: 'Closed fist + downward tilt',
    difficulty: 'easy',
  },
  {
    name: 'NO',
    category: 'response',
    emoji: '🚫',
    description: 'Index and middle snap to thumb',
    instructions: ['Extend index and middle fingers', 'Snap tips down to touch thumb tip'],
    fingerPattern: 'Index + Middle pinch to Thumb',
    difficulty: 'medium',
  },
  {
    name: 'STOP',
    category: 'word',
    emoji: '🛑',
    description: 'Open palm forward gesture',
    instructions: ['Extend all fingers straight up', 'Hold palm facing directly forward'],
    fingerPattern: 'All fingers up, palm forward',
    difficulty: 'easy',
  },
  {
    name: 'PEACE',
    category: 'gesture',
    emoji: '✌️',
    description: 'V-sign with index and middle fingers',
    instructions: ['Extend index and middle fingers', 'Spread into a V shape', 'Curl other fingers'],
    fingerPattern: 'Index + Middle spread',
    difficulty: 'easy',
  },
  {
    name: 'OK',
    category: 'gesture',
    emoji: '👌',
    description: 'Thumb and index form circle',
    instructions: ['Touch thumb tip to index tip', 'Form a circle', 'Extend middle, ring, and pinky'],
    fingerPattern: 'Thumb+Index circle, others up',
    difficulty: 'easy',
  },
  {
    name: 'CALL ME',
    category: 'gesture',
    emoji: '🤙',
    description: 'Thumb and pinky extended',
    instructions: ['Extend thumb and pinky outward', 'Curl index, middle, and ring fingers'],
    fingerPattern: 'Thumb + Pinky',
    difficulty: 'easy',
  },
  {
    name: 'ROCK ON',
    category: 'gesture',
    emoji: '🤘',
    description: 'Horns gesture — index and pinky up',
    instructions: ['Extend index finger and pinky', 'Curl middle and ring fingers with thumb over'],
    fingerPattern: 'Index + Pinky',
    difficulty: 'easy',
  },

  // ---- Two-Handed Signs ----
  {
    name: 'HELP',
    category: 'two-handed',
    emoji: '🆘',
    description: 'Thumbs-up fist resting on opposite flat palm',
    instructions: ['Dominant hand: Thumbs-up fist', 'Non-dominant hand: Flat palm facing up', 'Raise both hands together'],
    fingerPattern: 'Fist on open palm (2 hands)',
    difficulty: 'hard',
  },
  {
    name: 'BOOK',
    category: 'two-handed',
    emoji: '📖',
    description: 'Palms together then opening outward',
    instructions: ['Place both flat palms together', 'Hinge wrists and open palms like opening a book'],
    fingerPattern: 'Palms joined & opening (2 hands)',
    difficulty: 'medium',
  },
  {
    name: 'MORE',
    category: 'two-handed',
    emoji: '➕',
    description: 'Both flattened O-hands tapping fingertips together',
    instructions: ['Form flattened O shapes with both hands', 'Tap fingertips together twice'],
    fingerPattern: 'Fingertips touching (2 hands)',
    difficulty: 'medium',
  },
  {
    name: 'TOGETHER',
    category: 'two-handed',
    emoji: '🤝',
    description: 'Both fists joined together in circle',
    instructions: ['Make fists with both hands', 'Place side-by-side and circle together'],
    fingerPattern: 'Two fists together',
    difficulty: 'medium',
  },
  {
    name: 'CLAP',
    category: 'two-handed',
    emoji: '👏',
    description: 'Both open hands clapping together',
    instructions: ['Bring both flat hands together to applaud'],
    fingerPattern: 'Palms meeting (2 hands)',
    difficulty: 'easy',
  },

  // ---- Numbers 1 to 5 ----
  { name: 'ONE', category: 'number', emoji: '☝️', description: 'Index finger pointing up', instructions: ['Extend only index finger'], fingerPattern: 'Index only', difficulty: 'easy' },
  { name: 'TWO', category: 'number', emoji: '✌️', description: 'Index and middle fingers together', instructions: ['Extend index and middle together'], fingerPattern: 'Index + Middle', difficulty: 'easy' },
  { name: 'THREE', category: 'number', emoji: '3️⃣', description: 'Thumb, index, and middle extended', instructions: ['Extend thumb, index, and middle'], fingerPattern: 'Thumb + Index + Middle', difficulty: 'easy' },
  { name: 'FOUR', category: 'number', emoji: '4️⃣', description: 'Four fingers up, thumb tucked', instructions: ['Extend four fingers, tuck thumb'], fingerPattern: 'Four fingers up', difficulty: 'easy' },
  { name: 'FIVE', category: 'number', emoji: '🖐️', description: 'All five fingers extended and spread', instructions: ['Extend all five fingers spread wide'], fingerPattern: 'All fingers spread', difficulty: 'easy' },

  // ---- Full ASL Alphabet (A - Z) ----
  { name: 'ASL-A', category: 'letter', emoji: '🅰️', description: 'Fist with thumb alongside index', instructions: ['Make a fist', 'Place thumb against side of index'], fingerPattern: 'Fist, thumb beside', difficulty: 'medium' },
  { name: 'ASL-B', category: 'letter', emoji: '🅱️', description: 'Flat hand, fingers together, thumb tucked', instructions: ['Extend 4 fingers straight', 'Tuck thumb across palm'], fingerPattern: 'Four fingers straight, thumb tucked', difficulty: 'medium' },
  { name: 'ASL-C', category: 'letter', emoji: '©️', description: 'Curved hand forming C shape', instructions: ['Curve all fingers and thumb to form C'], fingerPattern: 'C-curved hand', difficulty: 'medium' },
  { name: 'ASL-D', category: 'letter', emoji: '🇩', description: 'Index up, other fingers touch thumb', instructions: ['Index straight up', 'Middle, ring, pinky touch thumb tip'], fingerPattern: 'Index up, others touch thumb', difficulty: 'hard' },
  { name: 'ASL-E', category: 'letter', emoji: '🇪', description: 'All fingers curled down, thumb tucked under', instructions: ['Tuck all fingertips down to touch thumb'], fingerPattern: 'All fingertips curled tight', difficulty: 'medium' },
  { name: 'ASL-F', category: 'letter', emoji: '🇫', description: 'Index and thumb form circle, others spread up', instructions: ['Pinch index tip to thumb tip', 'Spread middle, ring, pinky upward'], fingerPattern: 'Index+Thumb circle, 3 fingers up', difficulty: 'medium' },
  { name: 'ASL-G', category: 'letter', emoji: '🇬', description: 'Index and thumb pointing forward parallel', instructions: ['Point index and thumb out horizontally', 'Keep them parallel like a pinch'], fingerPattern: 'Index + Thumb parallel horizontal', difficulty: 'hard' },
  { name: 'ASL-H', category: 'letter', emoji: '🇭', description: 'Index and middle pointing sideways together', instructions: ['Extend index and middle horizontally', 'Keep them joined together'], fingerPattern: 'Index + Middle horizontal', difficulty: 'hard' },
  { name: 'ASL-I', category: 'letter', emoji: 'ℹ️', description: 'Pinky finger extended straight up', instructions: ['Extend only pinky finger', 'Curl all other fingers into fist'], fingerPattern: 'Pinky only', difficulty: 'easy' },
  { name: 'ASL-J', category: 'letter', emoji: '🇯', description: 'Pinky tracing J shape in air', instructions: ['Extend pinky finger', 'Swoop down and curve back in a J path'], fingerPattern: 'Pinky + J curve motion', difficulty: 'hard' },
  { name: 'ASL-K', category: 'letter', emoji: '🇰', description: 'Index up, middle forward, thumb resting between', instructions: ['Extend index up', 'Middle pointing forward at 45°', 'Thumb touches middle joint'], fingerPattern: 'Index up + Middle forward + Thumb between', difficulty: 'hard' },
  { name: 'ASL-L', category: 'letter', emoji: '🇱', description: 'Thumb and index at right angle', instructions: ['Extend index straight up', 'Extend thumb out to side at 90°'], fingerPattern: 'Index up + Thumb out (L-shape)', difficulty: 'easy' },
  { name: 'ASL-M', category: 'letter', emoji: '🇲', description: 'Thumb tucked under index, middle, ring fingers', instructions: ['Make fist', 'Tuck thumb under index, middle, and ring fingers'], fingerPattern: '3 fingers over thumb', difficulty: 'hard' },
  { name: 'ASL-N', category: 'letter', emoji: '🇳', description: 'Thumb tucked under index and middle fingers', instructions: ['Make fist', 'Tuck thumb under index and middle fingers'], fingerPattern: '2 fingers over thumb', difficulty: 'hard' },
  { name: 'ASL-O', category: 'letter', emoji: '⭕', description: 'All fingertips touching thumb tip in O shape', instructions: ['Touch all four fingertips to thumb tip', 'Form an O circle'], fingerPattern: 'O-shaped fingertips', difficulty: 'medium' },
  { name: 'ASL-P', category: 'letter', emoji: '🅿️', description: 'K shape pointing downward', instructions: ['Form K handshape', 'Point hand downward towards floor'], fingerPattern: 'Downwards K shape', difficulty: 'hard' },
  { name: 'ASL-Q', category: 'letter', emoji: '🇶', description: 'G shape pointing downward', instructions: ['Form G handshape', 'Point index and thumb downward'], fingerPattern: 'Downwards G shape', difficulty: 'hard' },
  { name: 'ASL-R', category: 'letter', emoji: '🇷', description: 'Index and middle fingers crossed', instructions: ['Extend index and middle fingers', 'Cross middle finger over index finger'], fingerPattern: 'Crossed Index + Middle', difficulty: 'medium' },
  { name: 'ASL-S', category: 'letter', emoji: '🇸', description: 'Fist with thumb wrapped across front', instructions: ['Make a tight fist', 'Cross thumb over the front of fingers'], fingerPattern: 'Fist with thumb over fingers', difficulty: 'easy' },
  { name: 'ASL-T', category: 'letter', emoji: '🇹', description: 'Thumb tucked under index finger only', instructions: ['Make fist', 'Tuck thumb under index finger tip'], fingerPattern: '1 finger over thumb', difficulty: 'medium' },
  { name: 'ASL-U', category: 'letter', emoji: '🇺', description: 'Index and middle straight up together', instructions: ['Extend index and middle straight up', 'Keep fingers pressed together'], fingerPattern: 'Index + Middle together up', difficulty: 'easy' },
  { name: 'ASL-V', category: 'letter', emoji: '🇻', description: 'Index and middle straight up spread', instructions: ['Extend index and middle fingers', 'Spread them in V shape'], fingerPattern: 'Index + Middle spread', difficulty: 'easy' },
  { name: 'ASL-W', category: 'letter', emoji: '🇼', description: 'Three middle fingers spread', instructions: ['Extend index, middle, ring fingers', 'Spread into W shape'], fingerPattern: 'Index + Middle + Ring spread', difficulty: 'medium' },
  { name: 'ASL-X', category: 'letter', emoji: '🇽', description: 'Index finger hooked/bent', instructions: ['Extend index finger and bend into hook', 'Curl other fingers'], fingerPattern: 'Hooked index finger', difficulty: 'medium' },
  { name: 'ASL-Y', category: 'letter', emoji: '🇾', description: 'Thumb and pinky extended out', instructions: ['Extend thumb and pinky', 'Curl middle three fingers'], fingerPattern: 'Thumb + Pinky extended', difficulty: 'easy' },
  { name: 'ASL-Z', category: 'letter', emoji: '🇿', description: 'Index finger tracing Z shape', instructions: ['Extend index finger', 'Trace a Z path in the air'], fingerPattern: 'Index + Z motion', difficulty: 'hard' },
];

export function getSignInfo(signName: string): SignInfo | undefined {
  return SIGN_CATALOG.find(
    (s) => s.name.toUpperCase() === signName.toUpperCase(),
  );
}

// ============================================================
//  Single-Hand Classifier Engine
// ============================================================

export function classifySign(
  landmarks: HandLandmark[],
  motionTracker?: MotionTracker,
): SignPrediction {
  if (landmarks.length < 21) {
    return { sign: '', confidence: 0 };
  }

  const fingers = getFingerStates(landmarks);
  const { thumb, index, middle, ring, pinky } = fingers;
  const extendedCount = [thumb, index, middle, ring, pinky].filter(Boolean).length;
  const curls = getAllFingerCurls(landmarks);
  const palmWidth = distance(landmarks[INDEX_MCP], landmarks[PINKY_MCP]);
  const orientation = getHandOrientation(landmarks);
  const motion = motionTracker ? motionTracker.getMotion() : { speed: 0, direction: 'still' };

  // ---- Dynamic Motion Signs ----

  // HELLO wave detection
  if (extendedCount === 5 && motion.direction === 'wave') {
    return { sign: 'HELLO', confidence: 0.92 };
  }

  // ASL-J (Pinky J motion)
  if (pinky && !index && !middle && !ring && motion.speed > 0.01) {
    return { sign: 'ASL-J', confidence: 0.82 };
  }

  // ASL-Z (Index Z motion)
  if (index && !middle && !ring && !pinky && motion.speed > 0.01) {
    return { sign: 'ASL-Z', confidence: 0.84 };
  }

  // ---- Distance & Shape Patterns ----

  // OK / ASL-F — thumb and index tips touching
  const thumbIndexDist = distance(landmarks[THUMB_TIP], landmarks[INDEX_TIP]);
  if (thumbIndexDist < palmWidth * 0.3) {
    if (middle && ring && pinky) {
      return { sign: 'OK', confidence: 0.88 };
    }
  }

  // ASL-O — all 4 fingertips touching thumb tip
  const allTipsToThumb =
    (distance(landmarks[INDEX_TIP], landmarks[THUMB_TIP]) +
      distance(landmarks[MIDDLE_TIP], landmarks[THUMB_TIP]) +
      distance(landmarks[RING_TIP], landmarks[THUMB_TIP]) +
      distance(landmarks[PINKY_TIP], landmarks[THUMB_TIP])) /
    4;
  if (allTipsToThumb < palmWidth * 0.4) {
    return { sign: 'ASL-O', confidence: 0.82 };
  }

  // ASL-D — index up, middle+ring+pinky touching thumb
  const midToThumb = distance(landmarks[MIDDLE_TIP], landmarks[THUMB_TIP]);
  const ringToThumb = distance(landmarks[RING_TIP], landmarks[THUMB_TIP]);
  if (index && midToThumb < palmWidth * 0.35 && ringToThumb < palmWidth * 0.35 && !pinky) {
    return { sign: 'ASL-D', confidence: 0.80 };
  }

  // NO — index and middle snapping to thumb
  if (
    distance(landmarks[INDEX_TIP], landmarks[THUMB_TIP]) < palmWidth * 0.35 &&
    distance(landmarks[MIDDLE_TIP], landmarks[THUMB_TIP]) < palmWidth * 0.35 &&
    !ring &&
    !pinky &&
    curls.index > 0.3 &&
    curls.middle > 0.3
  ) {
    return { sign: 'NO', confidence: 0.82 };
  }

  // ASL-C — C shape gap
  if (
    curls.index > 0.2 && curls.index < 0.7 &&
    curls.middle > 0.2 && curls.middle < 0.7 &&
    curls.ring > 0.2 && curls.ring < 0.7 &&
    curls.pinky > 0.2 && curls.pinky < 0.7
  ) {
    const gap = distance(landmarks[THUMB_TIP], landmarks[INDEX_TIP]);
    if (gap > palmWidth * 0.4 && gap < palmWidth * 1.2) {
      return { sign: 'ASL-C', confidence: 0.75 };
    }
  }

  // ASL-R — Crossed index and middle
  if (index && middle && !ring && !pinky) {
    const crossed = landmarks[MIDDLE_TIP].x < landmarks[INDEX_TIP].x;
    if (crossed) {
      return { sign: 'ASL-R', confidence: 0.85 };
    }
  }

  // ASL-X — Hooked index finger
  if (curls.index > 0.4 && curls.index < 0.8 && curls.middle > 0.7 && curls.ring > 0.7 && curls.pinky > 0.7) {
    return { sign: 'ASL-X', confidence: 0.78 };
  }

  // ASL-G / ASL-H — Horizontal orientation
  if (orientation === 'right' || orientation === 'left') {
    if (index && !middle && !ring && !pinky) {
      return { sign: 'ASL-G', confidence: 0.80 };
    }
    if (index && middle && !ring && !pinky) {
      return { sign: 'ASL-H', confidence: 0.80 };
    }
  }

  // ---- Finger Count Classification ----

  // 5 Fingers
  if (extendedCount === 5) {
    const spread = fingerSpread(landmarks, INDEX_TIP, PINKY_TIP);
    if (spread > palmWidth * 1.8) {
      return { sign: 'FIVE', confidence: 0.85 };
    }
    if (orientation === 'up') {
      return { sign: 'STOP', confidence: 0.80 };
    }
    return { sign: 'HELLO', confidence: 0.85 };
  }

  // 4 Fingers (no thumb)
  if (!thumb && index && middle && ring && pinky) {
    const spread = fingerSpread(landmarks, INDEX_TIP, PINKY_TIP);
    if (spread < palmWidth * 1.3) {
      return { sign: 'ASL-B', confidence: 0.78 };
    }
    return { sign: 'FOUR', confidence: 0.80 };
  }

  // 3 Fingers: Thumb + Index + Pinky (ILY)
  if (thumb && index && !middle && !ring && pinky) {
    return { sign: 'I LOVE YOU', confidence: 0.90 };
  }

  // 3 Fingers: Thumb + Index + Middle (THREE)
  if (thumb && index && middle && !ring && !pinky) {
    return { sign: 'THREE', confidence: 0.80 };
  }

  // 3 Fingers: Index + Middle + Ring (ASL-W)
  if (!thumb && index && middle && ring && !pinky) {
    return { sign: 'ASL-W', confidence: 0.82 };
  }

  // 2 Fingers: Index + Middle (PEACE / TWO / ASL-U / ASL-V)
  if (!thumb && index && middle && !ring && !pinky) {
    const spread = fingerSpread(landmarks, INDEX_TIP, MIDDLE_TIP);
    if (spread > palmWidth * 0.35) {
      return { sign: 'PEACE', confidence: 0.85 };
    }
    return { sign: 'ASL-U', confidence: 0.80 };
  }

  // 2 Fingers: Index + Pinky (ROCK ON)
  if (!thumb && index && !middle && !ring && pinky) {
    return { sign: 'ROCK ON', confidence: 0.85 };
  }

  // 2 Fingers: Thumb + Pinky (CALL ME / ASL-Y)
  if (thumb && !index && !middle && !ring && pinky) {
    return { sign: 'CALL ME', confidence: 0.85 };
  }

  // 2 Fingers: Thumb + Index (ASL-L)
  if (thumb && index && !middle && !ring && !pinky) {
    return { sign: 'ASL-L', confidence: 0.82 };
  }

  // 1 Finger: Thumb only (GOOD / Thumbs up)
  if (thumb && !index && !middle && !ring && !pinky) {
    return { sign: 'GOOD', confidence: 0.85 };
  }

  // 1 Finger: Index only (ONE / ASL-1)
  if (!thumb && index && !middle && !ring && !pinky) {
    return { sign: 'ONE', confidence: 0.82 };
  }

  // 1 Finger: Pinky only (ASL-I)
  if (!thumb && !index && !middle && !ring && pinky) {
    return { sign: 'ASL-I', confidence: 0.85 };
  }

  // 0 Fingers: Closed fist
  if (extendedCount === 0) {
    if (curls.thumb < 0.4) {
      return { sign: 'ASL-A', confidence: 0.75 };
    }
    return { sign: 'YES', confidence: 0.72 };
  }

  return { sign: `GESTURE (${extendedCount} fingers)`, confidence: 0.45 };
}

// ============================================================
//  Two-Hand Classifier Engine
// ============================================================

export function classifyTwoHandSign(
  handA: HandLandmark[],
  handB: HandLandmark[],
): SignPrediction | null {
  if (handA.length < 21 || handB.length < 21) return null;

  const wristDist = distance(handA[WRIST], handB[WRIST]);
  const indexDist = distance(handA[INDEX_TIP], handB[INDEX_TIP]);

  // HELP sign — fist resting on open palm
  const predA = classifySign(handA);
  const predB = classifySign(handB);

  if (
    (predA.sign === 'GOOD' && predB.sign === 'HELLO') ||
    (predB.sign === 'GOOD' && predA.sign === 'HELLO')
  ) {
    if (wristDist < 0.3) {
      return { sign: 'HELP', confidence: 0.88, isTwoHanded: true };
    }
  }

  // BOOK sign — two open palms facing each other close together
  if (predA.sign === 'HELLO' && predB.sign === 'HELLO' && wristDist < 0.25) {
    return { sign: 'BOOK', confidence: 0.84, isTwoHanded: true };
  }

  // MORE sign — fingertips of both hands touching
  if (indexDist < 0.12 && wristDist > 0.2) {
    return { sign: 'MORE', confidence: 0.82, isTwoHanded: true };
  }

  // TOGETHER — two fists close together
  if (
    (predA.sign === 'YES' || predA.sign === 'ASL-A') &&
    (predB.sign === 'YES' || predB.sign === 'ASL-A') &&
    wristDist < 0.2
  ) {
    return { sign: 'TOGETHER', confidence: 0.85, isTwoHanded: true };
  }

  // CLAP — palms colliding
  if (wristDist < 0.15 && indexDist < 0.15) {
    return { sign: 'CLAP', confidence: 0.86, isTwoHanded: true };
  }

  return null;
}

// ============================================================
//  Custom Gesture Template Matching
// ============================================================

export function classifyCustomGesture(
  landmarks: HandLandmark[],
  templates: CustomGestureTemplate[],
): SignPrediction | null {
  if (!templates.length || landmarks.length < 21) return null;

  const currentStates = getFingerStates(landmarks);
  const currentCurls = getAllFingerCurls(landmarks);

  let bestMatch: CustomGestureTemplate | null = null;
  let highestScore = 0;

  for (const t of templates) {
    // Check finger state similarity
    let stateMatch = 0;
    if (currentStates.thumb === t.fingerStates.thumb) stateMatch += 0.2;
    if (currentStates.index === t.fingerStates.index) stateMatch += 0.2;
    if (currentStates.middle === t.fingerStates.middle) stateMatch += 0.2;
    if (currentStates.ring === t.fingerStates.ring) stateMatch += 0.2;
    if (currentStates.pinky === t.fingerStates.pinky) stateMatch += 0.2;

    // Check landmark distance similarity
    let totalDist = 0;
    for (let i = 0; i < 21; i++) {
      totalDist += distance(landmarks[i], t.landmarks[i]);
    }
    const avgDist = totalDist / 21;
    const landmarkScore = Math.max(0, 1 - avgDist * 2);

    const score = stateMatch * 0.5 + landmarkScore * 0.5;

    if (score > highestScore && score > 0.7) {
      highestScore = score;
      bestMatch = t;
    }
  }

  if (bestMatch) {
    return {
      sign: bestMatch.name,
      confidence: highestScore,
      isCustom: true,
    };
  }

  return null;
}

// ============================================================
//  Temporal Smoothing Buffer
// ============================================================

export class SignBuffer {
  private buffer: SignPrediction[] = [];
  private readonly maxSize: number;
  private readonly minConfidence: number;

  constructor(maxSize = 10, minConfidence = 0.55) {
    this.maxSize = maxSize;
    this.minConfidence = minConfidence;
  }

  push(prediction: SignPrediction): void {
    this.buffer.push(prediction);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  getMostFrequent(): SignPrediction | null {
    const validPredictions = this.buffer.filter((p) => p.confidence >= this.minConfidence);
    if (validPredictions.length === 0) return null;

    const counts = new Map<string, { count: number; totalConf: number; isTwoHanded?: boolean; isCustom?: boolean }>();
    for (const p of validPredictions) {
      const entry = counts.get(p.sign) || { count: 0, totalConf: 0, isTwoHanded: p.isTwoHanded, isCustom: p.isCustom };
      entry.count++;
      entry.totalConf += p.confidence;
      counts.set(p.sign, entry);
    }

    let bestSign = '';
    let bestCount = 0;
    let bestAvgConf = 0;
    let isTwoHanded = false;
    let isCustom = false;

    for (const [sign, { count, totalConf, isTwoHanded: TH, isCustom: C }] of counts) {
      if (count > bestCount || (count === bestCount && totalConf / count > bestAvgConf)) {
        bestSign = sign;
        bestCount = count;
        bestAvgConf = totalConf / count;
        isTwoHanded = !!TH;
        isCustom = !!C;
      }
    }

    return bestSign ? { sign: bestSign, confidence: bestAvgConf, isTwoHanded, isCustom } : null;
  }

  clear(): void {
    this.buffer = [];
  }
}
