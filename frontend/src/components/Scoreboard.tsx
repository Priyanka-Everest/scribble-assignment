import { Card } from "./Card";
import type { Participant } from "../services/api";

interface ScoreboardProps {
  participants: Participant[];
  scores: Record<string, number>;
}

export function Scoreboard({ participants, scores }: ScoreboardProps) {
  const sorted = [...participants].sort(
    (a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0)
  );

  return (
    <Card title="Scoreboard">
      <ul className="player-list">
        {sorted.map((p) => (
          <li key={p.id}>
            <span>{p.name}</span>
            <strong>{scores[p.id] ?? 0}</strong>
          </li>
        ))}
      </ul>
    </Card>
  );
}
