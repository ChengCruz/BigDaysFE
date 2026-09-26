// src/api/hooks/useAnswersApi.ts
import { useMutation } from "@tanstack/react-query";
import client from "../client";
import { AnswerEndpoints } from "../endpoints";

export interface AnswerItem {
  answerId: string;
  questionId: string;
  text: string;
}

export function useUpdateAnswer() {
  // Not instrumented: nothing calls this hook (only its AnswerItem type is
  // imported elsewhere). A trackAction here would add a module row that is
  // guaranteed to read zero forever, and a zero is supposed to mean "nobody
  // uses this feature", not "no code path can reach it".
  return useMutation({
    mutationFn: (payload: {
      answerId: string;
      eventGuid: string;
      rsvpGuid: string;
      questionId: string;
      text: string;
    }) =>
      client
        .post(AnswerEndpoints.update(), {
          AnswerId: payload.answerId,
          EventGuid: payload.eventGuid,
          RsvpId: payload.rsvpGuid,
          QuestionId: payload.questionId,
          Text: payload.text,
        })
        .then((r) => r.data),
  });
}
