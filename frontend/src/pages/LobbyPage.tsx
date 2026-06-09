import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { api, type RoomSnapshot } from "../services/api";
import { useRoomState, useRoomStore } from "../state/roomStore";

const POLL_INTERVAL_MS = 2000;

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [startError, setStartError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current !== null) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    const code = room.code;

    pollingRef.current = setInterval(async () => {
      try {
        const response = await api.fetchRoom(code, participantId ?? undefined);
        const snapshot: RoomSnapshot = response.room;

        roomStore.setRoomSnapshot(snapshot);

        if (snapshot.status === "playing") {
          stopPolling();
          navigate("/game");
        }
      } catch (err) {
        const status = (err as { status?: number }).status;
        if (status === 404) {
          stopPolling();
          navigate("/", { replace: true, state: { error: "Room not found" } });
        }
      }
    }, POLL_INTERVAL_MS);

    return stopPolling;
  }, [navigate, participantId, room, roomStore, stopPolling]);

  async function handleStartGame() {
    if (!room || !participantId) return;

    try {
      setStartError(null);
      setIsStarting(true);
      await api.startGame(room.code, participantId);
      stopPolling();
      navigate("/game");
    } catch (caughtError) {
      setStartError(caughtError instanceof Error ? caughtError.message : "Unable to start game");
    } finally {
      setIsStarting(false);
    }
  }

  if (!room) {
    return null;
  }

  const isHost = participantId === room.hostId;
  const hasEnoughPlayers = room.participants.length >= 2;
  const canStart = isHost && hasEnoughPlayers;

  const startButtonLabel = !isHost
    ? "Only the host can start"
    : !hasEnoughPlayers
      ? "Need at least 2 players"
      : isStarting
        ? "Starting..."
        : "Start Game";

  return (
    <section className="panel placeholder-page">
      <div className="lobby-header">
        <PageHeader
          kicker="Waiting for players"
          title="Lobby"
          description="Share the room code with friends so they can join your game."
        />
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="summary-grid">
        <Card title="Participants">
          {room.participants.length === 0 ? (
            <p>No participants are connected to this room yet.</p>
          ) : (
            <ul className="player-list">
              {room.participants.map((participant) => (
                <li key={participant.id}>
                  <span>{participant.name}</span>
                  {participant.id === room.hostId ? (
                    <span className="player-list__meta">Host</span>
                  ) : (
                    <span className="player-list__meta">joined</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p>
            {room.participants.length} / 2+ players
            {hasEnoughPlayers ? " — ready to start" : " — waiting for more players"}
          </p>
          {startError ? <p className="form__error">{startError}</p> : null}
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button
          className="button button--primary"
          disabled={!canStart || isStarting}
          title={canStart ? undefined : startButtonLabel}
          onClick={handleStartGame}
        >
          {startButtonLabel}
        </button>
      </div>
    </section>
  );
}
