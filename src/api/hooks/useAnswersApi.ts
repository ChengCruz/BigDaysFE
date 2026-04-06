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
