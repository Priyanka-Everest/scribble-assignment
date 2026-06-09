import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name must not be empty").optional()
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name must not be empty").optional()
});

export const startGameSchema = z.object({
  participantId: z.string().uuid("participantId must be a valid UUID")
});

export const guessSchema = z.object({
  participantId: z.string().uuid("participantId must be a valid UUID"),
  guess: z.string().trim().min(1, "Guess must not be empty")
});

export const endGameSchema = z.object({
  participantId: z.string().uuid("participantId must be a valid UUID")
});

export const restartGameSchema = z.object({
  participantId: z.string().uuid("participantId must be a valid UUID")
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
