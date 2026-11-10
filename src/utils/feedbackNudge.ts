// src/utils/feedbackNudge.ts
//
// Dismissal state for the feedback nudge banner. Close hides it for this
// browser tab session only, so it comes back on the next login or tab until the
// person replies and is taken off the backend list. There is deliberately no
// "don't show again": the point is to keep nudging until they answer.
//
// Same defensive storage handling as whatsNew.ts: private mode or a blocked
// store must never throw into the render path.

const keyFor = (userGuid: string) => `bigdays.feedbackNudge.${userGuid}`;

export function isNudgeClosed(userGuid: string): boolean {
  try {
    return sessionStorage.getItem(keyFor(userGuid)) === "1";
  } catch {
    return false;
  }
}

export function closeNudge(userGuid: string): void {
  try {
    sessionStorage.setItem(keyFor(userGuid), "1");
  } catch {
    /* storage unavailable: the banner just hides until the next render */
  }
}
