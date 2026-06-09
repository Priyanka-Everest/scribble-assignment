import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { api, type RoomSnapshot } from "../services/api";
import { useRoomState } from "../state/roomStore";

const POLL_INTERVAL_MS = 2000;
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;

export function GamePage() {
  const navigate = useNavigate();
  const { room: contextRoom, participantId } = useRoomState();
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(contextRoom);

  // Canvas refs and drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const handleNavigate404 = useCallback(() => {
    navigate("/", { replace: true, state: { error: "Room not found" } });
  }, [navigate]);

  useEffect(() => {
    if (!contextRoom) {
      navigate("/", { replace: true });
      return;
    }

    const code = contextRoom.code;
    const pid = participantId ?? undefined;

    // Initial fetch on mount — immediate load + 404 guard
    api
      .fetchRoom(code, pid)
      .then((response) => setSnapshot(response.room))
      .catch((err: { status?: number }) => {
        if (err.status === 404) handleNavigate404();
      });

    // Continuous polling
    const intervalId = setInterval(() => {
      api
        .fetchRoom(code, pid)
        .then((response) => setSnapshot(response.room))
        .catch((err: { status?: number }) => {
          if (err.status === 404) {
            clearInterval(intervalId);
            handleNavigate404();
          }
        });
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [contextRoom, navigate, participantId, handleNavigate404]);

  if (!snapshot) {
    return null;
  }

  const isDrawer = participantId !== null && participantId === snapshot.drawerId;
  const viewer = snapshot.participants.find((p) => p.id === participantId) ?? null;

  // Canvas event helpers
  function getCanvasPos(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function handleMouseDown(event: React.MouseEvent<HTMLCanvasElement>) {
    isDrawingRef.current = true;
    lastPosRef.current = getCanvasPos(event);
  }

  function handleMouseMove(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current || !lastPosRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const pos = getCanvasPos(event);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#000000";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPosRef.current = pos;
  }

  function handleMouseUp() {
    isDrawingRef.current = false;
    lastPosRef.current = null;
  }

  function handleClearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">
            {isDrawer ? "You are drawing!" : "Guess the Word!"}
          </h1>
        </div>
        <RoomCodeBadge code={snapshot.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Card title="Players">
            <ul className="player-list">
              {snapshot.participants.map((p) => (
                <li key={p.id}>
                  <span>{p.name}</span>
                  <span className="player-list__meta">
                    {p.id === snapshot.drawerId ? "Drawer" : "Guesser"}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
          <Scoreboard participants={snapshot.participants} scores={snapshot.scores} />
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              style={{
                display: "block",
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                cursor: isDrawer ? "crosshair" : "default",
                touchAction: "none"
              }}
              onMouseDown={isDrawer ? handleMouseDown : undefined}
              onMouseMove={isDrawer ? handleMouseMove : undefined}
              onMouseUp={isDrawer ? handleMouseUp : undefined}
              onMouseLeave={isDrawer ? handleMouseUp : undefined}
            />
            {isDrawer && (
              <div className="button-row button-row--compact" style={{ marginTop: "8px" }}>
                <button className="button button--secondary" type="button" onClick={handleClearCanvas}>
                  Clear Canvas
                </button>
              </div>
            )}
          </Card>

          {snapshot.guesses.length > 0 && (
            <Card title="Guess History">
              <ul className="player-list">
                {snapshot.guesses.map((g, i) => (
                  <li key={i}>
                    <span>
                      <strong>{g.participantName}</strong>: {g.word}
                    </span>
                    <span className="player-list__meta">
                      {g.correct ? "Correct ✓" : "Incorrect ✗"}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{viewer?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{isDrawer ? "Drawer" : "Guesser"}</dd>
              </div>
              <div>
                <dt>Word</dt>
                <dd>{isDrawer && snapshot.secretWord ? snapshot.secretWord : "Guess the word!"}</dd>
              </div>
            </dl>
          </Card>

          {!isDrawer && participantId && (
            <Card title="Your Guess">
              <GuessForm code={snapshot.code} participantId={participantId} />
            </Card>
          )}
        </aside>
      </div>

      <div className="button-row">
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
