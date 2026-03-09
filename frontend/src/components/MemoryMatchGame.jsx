import { useEffect, useMemo, useRef, useState } from 'react';

const CARD_VALUES = ['A', 'B', 'C', 'D', 'E', 'F'];

function buildDeck() {
  const duplicated = [...CARD_VALUES, ...CARD_VALUES].map((value, index) => ({
    id: `${value}-${index}-${Date.now()}`,
    value,
    isFaceUp: false,
    isMatched: false,
  }));

  for (let i = duplicated.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [duplicated[i], duplicated[j]] = [duplicated[j], duplicated[i]];
  }

  return duplicated;
}

export default function MemoryMatchGame({ onWin }) {
  const pendingTimeoutRef = useRef(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [cards, setCards] = useState([]);
  const [firstPick, setFirstPick] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [moves, setMoves] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [gameWon, setGameWon] = useState(false);

  useEffect(() => {
    if (!hasStarted || gameWon) {
      return undefined;
    }

    const timerId = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [hasStarted, gameWon]);

  useEffect(() => {
    if (!hasStarted || gameWon || cards.length === 0) {
      return;
    }

    const allMatched = cards.every((card) => card.isMatched);
    if (!allMatched) {
      return;
    }

    setGameWon(true);
    const score = Math.max(1, 1000 - moves * 10 - elapsedSeconds * 5);
    onWin({ moves, timeSeconds: elapsedSeconds, score });
  }, [cards, elapsedSeconds, gameWon, hasStarted, moves, onWin]);

  const matchedCount = useMemo(
    () => cards.filter((card) => card.isMatched).length,
    [cards]
  );

  useEffect(() => {
    return () => {
      if (pendingTimeoutRef.current) {
        clearTimeout(pendingTimeoutRef.current);
      }
    };
  }, []);

  function startNewGame() {
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }

    setCards(buildDeck());
    setHasStarted(true);
    setFirstPick(null);
    setIsChecking(false);
    setMoves(0);
    setElapsedSeconds(0);
    setGameWon(false);
  }

  function handleCardClick(clickedIndex) {
    if (!hasStarted || gameWon || isChecking) {
      return;
    }

    const clickedCard = cards[clickedIndex];
    if (!clickedCard || clickedCard.isFaceUp || clickedCard.isMatched) {
      return;
    }

    const nextCards = cards.map((card, index) =>
      index === clickedIndex ? { ...card, isFaceUp: true } : card
    );
    setCards(nextCards);

    if (firstPick === null) {
      setFirstPick(clickedIndex);
      return;
    }

    const firstCard = nextCards[firstPick];
    const secondCard = nextCards[clickedIndex];

    setMoves((prev) => prev + 1);
    setIsChecking(true);

    if (firstCard.value === secondCard.value) {
      pendingTimeoutRef.current = setTimeout(() => {
        setCards((prevCards) =>
          prevCards.map((card, index) =>
            index === firstPick || index === clickedIndex
              ? { ...card, isMatched: true }
              : card
          )
        );
        setFirstPick(null);
        setIsChecking(false);
        pendingTimeoutRef.current = null;
      }, 350);
      return;
    }

    pendingTimeoutRef.current = setTimeout(() => {
      setCards((prevCards) =>
        prevCards.map((card, index) =>
          index === firstPick || index === clickedIndex
            ? { ...card, isFaceUp: false }
            : card
        )
      );
      setFirstPick(null);
      setIsChecking(false);
      pendingTimeoutRef.current = null;
    }, 800);
  }

  return (
    <section className="game-card card">
      <div className="game-header">
        <div>
          <h2>Memory Match</h2>
          <p className="muted">Find all 6 pairs in as few moves and seconds as possible.</p>
        </div>
        <button type="button" className="primary-button" onClick={startNewGame}>
          {hasStarted ? 'Restart Game' : 'Start Game'}
        </button>
      </div>

      <div className="stats-row">
        <span>Moves: {moves}</span>
        <span>Time: {elapsedSeconds}s</span>
        <span>Matched: {matchedCount}/{cards.length || 12}</span>
      </div>

      {!hasStarted ? (
        <p className="muted">Press Start Game to begin.</p>
      ) : (
        <div className="board">
          {cards.map((card, index) => {
            const isVisible = card.isFaceUp || card.isMatched;

            return (
              <button
                key={card.id}
                type="button"
                className={`tile ${isVisible ? 'tile-open' : ''}`}
                onClick={() => handleCardClick(index)}
                disabled={gameWon || isChecking}
              >
                {isVisible ? card.value : '?'}
              </button>
            );
          })}
        </div>
      )}

      {gameWon && <p className="success-text">You won! Your score has been saved.</p>}
    </section>
  );
}
