import { useState } from "react";
import { api } from "../services/api";

interface GuessFormProps {
  code: string;
  participantId: string;
  onGuessSubmitted?: () => void;
}

export function GuessForm({ code, participantId, onGuessSubmitted }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = guessText.trim();
    if (!trimmed) {
      setError("Guess must not be empty");
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      await api.submitGuess(code, participantId, trimmed);
      setGuessText("");
      onGuessSubmitted?.();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to submit guess");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => setGuessText(event.target.value)}
          placeholder="Type your guess here..."
          disabled={isSubmitting}
        />
      </label>
      {error ? <p className="form__error">{error}</p> : null}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Guess"}
        </button>
      </div>
    </form>
  );
}
