// src/utils/countdownMessages.ts
//
// The preset countdown lines shown under the event hero. Lifted verbatim out of
// MemberDashboardPage so planner mode and couple mode read from one list — the
// strings were previously module-local there and would have drifted the moment
// a second page copied them.

export const ALMOST_THERE_MSGS = [
  "The excitement is building as your wedding day gets closer 🎉",
  "Only a little more time before your forever begins 💫",
  "You are so close to the moment you have been waiting for 🤍",
];

export const TODAY_MSGS = [
  "Today is your wedding day and it is finally here 💍",
  "This is the moment where your forever begins 🤍",
  "Everything has led to this beautiful day ✨",
];

export const PAST_MSGS = [
  "Your wedding day has passed but your journey together continues 🤍",
  "A beautiful day has ended and a lifetime together begins ✨",
  "The celebration is over but your story together goes on 🥂",
];

export const FAR_MSGS = [
  "Your big day is coming and every day brings you closer 💍",
  "Counting down to the start of your forever ✨",
  "A beautiful day is waiting for you ahead 🤍",
];

/** Under 15 days is "almost there"; anything further out is "far". */
export const ALMOST_THERE_DAYS = 15;

export const randomMsg = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
