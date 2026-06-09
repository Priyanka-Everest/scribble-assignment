import { randomUUID } from "node:crypto";
import type { Guess, Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();

function now() {
  return new Date().toISOString();
}

function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < 4; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
}

function generateUniqueCode() {
  let code = generateCode();

  while (rooms.has(code)) {
    code = generateCode();
  }

  return code;
}

function displayName(name?: string) {
  const trimmed = name?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "Player";
}

function createParticipant(name?: string): Participant {
  return {
    id: randomUUID(),
    name: displayName(name),
    joinedAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName?: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    drawerId: null,
    secretWord: null,
    guesses: [],
    scores: {},
    participants: [participant],
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName?: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const participant = createParticipant(playerName);
  room.participants.push(participant);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

type StartGameError = { error: number; message: string };
type StartGameSuccess = { room: Room };
type StartGameResult = StartGameError | StartGameSuccess;

export function startGame(code: string, participantId: string): StartGameResult {
  const room = rooms.get(code);

  if (!room) {
    return { error: 404, message: "Room not found" };
  }

  if (room.status !== "lobby") {
    return { error: 400, message: "Room is not in lobby status" };
  }

  if (room.hostId !== participantId) {
    return { error: 403, message: "Only the host can start the game" };
  }

  if (room.participants.length < 2) {
    return { error: 400, message: "At least 2 players are required to start" };
  }

  room.status = "playing";
  room.drawerId = room.participants[0].id;
  room.secretWord = STARTER_WORDS[0];
  room.scores = Object.fromEntries(room.participants.map((p) => [p.id, 0]));
  room.guesses = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

type EndGameError = { error: number; message: string };
type EndGameSuccess = { room: Room };
type EndGameResult = EndGameError | EndGameSuccess;

export function endGame(code: string, participantId: string): EndGameResult {
  const room = rooms.get(code);

  if (!room) {
    return { error: 404, message: "Room not found" };
  }

  if (room.status !== "playing") {
    return { error: 400, message: "Room is not in playing status" };
  }

  if (room.hostId !== participantId) {
    return { error: 403, message: "Only the host can end the round" };
  }

  room.status = "result";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

type RestartGameError = { error: number; message: string };
type RestartGameSuccess = { room: Room };
type RestartGameResult = RestartGameError | RestartGameSuccess;

export function restartGame(code: string, participantId: string): RestartGameResult {
  const room = rooms.get(code);

  if (!room) {
    return { error: 404, message: "Room not found" };
  }

  if (room.status !== "result") {
    return { error: 400, message: "Room is not in result status" };
  }

  if (room.hostId !== participantId) {
    return { error: 403, message: "Only the host can restart the game" };
  }

  room.status = "lobby";
  room.drawerId = null;
  room.secretWord = null;
  room.guesses = [];
  room.scores = {};
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

type SubmitGuessError = { error: number; message: string };
type SubmitGuessSuccess = { room: Room };
type SubmitGuessResult = SubmitGuessError | SubmitGuessSuccess;

export function submitGuess(code: string, participantId: string, guess: string): SubmitGuessResult {
  const room = rooms.get(code);

  if (!room) {
    return { error: 404, message: "Room not found" };
  }

  if (room.status !== "playing") {
    return { error: 400, message: "Room is not in playing status" };
  }

  if (participantId === room.drawerId) {
    return { error: 403, message: "The drawer cannot submit guesses" };
  }

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    return { error: 400, message: "Participant not found in this room" };
  }

  const trimmed = guess.trim();
  const correct = trimmed.toLowerCase() === room.secretWord!.toLowerCase();

  room.scores[participantId] = (room.scores[participantId] ?? 0) + (correct ? 100 : 0);

  const guessRecord: Guess = {
    participantId,
    participantName: participant.name,
    word: trimmed,
    correct,
    submittedAt: now()
  };

  room.guesses.push(guessRecord);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function getRoom(code: string) {
  const room = rooms.get(code);
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isPlaying = room.status === "playing";
  const isResult = room.status === "result";
  const isDrawer = isPlaying && viewerParticipantId === room.drawerId;

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    drawerId: room.drawerId,
    secretWord: isDrawer || isResult ? room.secretWord : null,
    guesses: room.guesses.map((g) => ({ ...g })),
    scores: { ...room.scores },
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: isPlaying || isResult ? [] : listWords(),
    roles: [...STARTER_ROLES]
  };
}
