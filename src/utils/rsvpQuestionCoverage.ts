// src/utils/rsvpQuestionCoverage.ts
// Shared by the RSVP designer canvas, the guest-facing renderer, and the
// Questions pages, so "is this question actually placed in the design" is
// computed the same way everywhere and can't drift between them.
import type { RsvpBlock } from "../types/rsvpDesign";

/**
 * Every questionId already referenced by some block, either as a standalone
 * formField block or inside a guestDetails block's customQuestions.
 */
export function coveredQuestionIds(blocks: RsvpBlock[] | undefined): Set<string> {
  const covered = new Set<string>();
  if (!blocks) return covered;
  for (const b of blocks) {
    if (b.type === "formField" && b.questionId) {
      covered.add(b.questionId);
    } else if (b.type === "guestDetails" && b.customQuestions) {
      for (const q of b.customQuestions) {
        if (q.questionId) covered.add(q.questionId);
      }
    }
  }
  return covered;
}
