/**
 * sentenceBuffer.ts — Continuous Sign Recognition (CSLR) Sentence Compiler
 * Converts stream of individual sign gesture tokens into natural, punctuated English sentences.
 */

export interface TokenEntry {
  sign: string;
  timestamp: number;
  confidence: number;
}

export class SentenceBuffer {
  private tokens: TokenEntry[] = [];
  private maxTokens: number;
  private cooldownMs: number;
  private lastAddedTime: number = 0;

  constructor(maxTokens = 20, cooldownMs = 1200) {
    this.maxTokens = maxTokens;
    this.cooldownMs = cooldownMs;
  }

  /**
   * Pushes a newly detected sign token.
   * Filters out immediate rapid duplicates unless cooldown period has elapsed.
   */
  public addToken(sign: string, confidence: number = 1.0): boolean {
    const now = Date.now();
    const cleanSign = sign.toUpperCase().trim();
    if (!cleanSign) return false;

    // Check last token to avoid repeating same sign rapidly
    const lastToken = this.tokens[this.tokens.length - 1];
    if (lastToken && lastToken.sign === cleanSign && now - this.lastAddedTime < this.cooldownMs) {
      return false;
    }

    this.tokens.push({ sign: cleanSign, timestamp: now, confidence });
    this.lastAddedTime = now;

    if (this.tokens.length > this.maxTokens) {
      this.tokens.shift();
    }

    return true;
  }

  /**
   * Returns current raw tokens array.
   */
  public getTokens(): string[] {
    return this.tokens.map((t) => t.sign);
  }

  /**
   * Removes last token (Backspace).
   */
  public popToken(): string | undefined {
    return this.tokens.pop()?.sign;
  }

  /**
   * Clears sentence buffer.
   */
  public clear(): void {
    this.tokens = [];
    this.lastAddedTime = 0;
  }

  /**
   * Compiles accumulated tokens into a clean, punctuated English sentence.
   * Appends proper capitalization and grammar polish.
   */
  public compileSentence(): string {
    if (this.tokens.length === 0) return '';

    const words = this.tokens.map((t) => t.sign.toLowerCase());

    // Basic ASL Gloss to English Sentence Mapping Rules
    const sentence = words
      .map((w, idx) => {
        if (idx === 0) return w.charAt(0).toUpperCase() + w.slice(1);
        if (w === 'i' || w === 'asl') return w.toUpperCase();
        return w;
      })
      .join(' ');

    return sentence + '.';
  }
}
