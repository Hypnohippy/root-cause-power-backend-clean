"use client";

import React, { useEffect, useState } from "react";

const MemoryChallengePage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Memory Challenge</h1>
        <p className="text-sm text-gray-500">
          Improve focus, attention, and working memory through gentle cognitive exercises.
          These games are simple, calming, and great for daily mental training.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="border rounded-xl p-4 shadow-sm bg-white/80">
          <h2 className="font-semibold mb-2">Game 1: Sequence Memory</h2>
          <p className="text-xs text-gray-500 mb-3">
            Watch the pattern of tiles, then repeat it. Each round gets one step longer.
          </p>
          <SequenceMemoryGame />
        </section>

        <section className="border rounded-xl p-4 shadow-sm bg-white/80">
          <h2 className="font-semibold mb-2">Game 2: Card Pair Match</h2>
          <p className="text-xs text-gray-500 mb-3">
            Flip cards and find matching pairs with the fewest moves possible.
          </p>
          <CardMatchGame />
        </section>
      </div>
    </div>
  );
};

/* ------------------ Game 1: Sequence Memory ------------------ */

type TileId = 0 | 1 | 2 | 3;

const SequenceMemoryGame: React.FC = () => {
  const [sequence, setSequence] = useState<TileId[]>([]);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [activeTile, setActiveTile] = useState<TileId | null>(null);
  const [level, setLevel] = useState(0);
  const [bestLevel, setBestLevel] = useState(0);
  const [message, setMessage] = useState<string>("Press Start to begin.");

  const tiles: TileId[] = [0, 1, 2, 3];

  const startGame = () => {
    const first: TileId = Math.floor(Math.random() * 4) as TileId;
    setSequence([first]);
    setLevel(1);
    setPlayerIndex(0);
    setMessage("Watch the pattern…");
    setIsShowingSequence(true);
  };

  useEffect(() => {
    if (!isShowingSequence || sequence.length === 0) return;

    let i = 0;
    setPlayerIndex(0);
    setMessage("Watch the pattern…");

    const interval = setInterval(() => {
      setActiveTile(sequence[i]);
      setTimeout(() => setActiveTile(null), 300);
      i += 1;

      if (i >= sequence.length) {
        clearInterval(interval);
        setTimeout(() => {
          setIsShowingSequence(false);
          setMessage("Now repeat the pattern.");
        }, 300);
      }
    }, 700);

    return () => clearInterval(interval);
  }, [isShowingSequence, sequence]);

  const extendSequence = () => {
    const next: TileId = Math.floor(Math.random() * 4) as TileId;
    setSequence((prev) => [...prev, next]);
    setLevel((prev) => prev + 1);
    setPlayerIndex(0);
    setIsShowingSequence(true);
    setMessage("Great! Watch the next pattern…");
  };

  const handleTileClick = (tile: TileId) => {
    if (isShowingSequence || sequence.length === 0) return;

    const correctTile = sequence[playerIndex];

    if (tile === correctTile) {
      const nextIndex = playerIndex + 1;
      setPlayerIndex(nextIndex);

      if (nextIndex === sequence.length) {
        setBestLevel((prev) => Math.max(prev, level));

        setTimeout(() => extendSequence(), 400);
      } else {
        setMessage("Good. Keep going.");
      }
    } else {
      setMessage("Incorrect. Press Start to try again.");
      setSequence([]);
      setPlayerIndex(0);
      setLevel(0);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 w-40 mx-auto">
        {tiles.map((t) => (
          <button
            key={t}
            onClick={() => handleTileClick(t)}
            className={`h-16 rounded-lg border transition-transform ${
              activeTile === t ? "scale-105 shadow-md" : ""
            } ${
              t === 0
                ? "bg-blue-200"
                : t === 1
                ? "bg-green-200"
                : t === 2
                ? "bg-yellow-200"
                : "bg-pink-200"
            }`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>Level: {level}</span>
        <span>Best: {bestLevel}</span>
      </div>

      <p className="text-xs text-gray-500 min-h-[1.5rem]">{message}</p>

      <button
        onClick={startGame}
        className="w-full text-sm font-medium rounded-lg border px-3 py-2 hover:bg-gray-50"
      >
        Start / Restart
      </button>
    </div>
  );
};

/* ------------------ Game 2: Card Match ------------------ */

type Card = {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
};

const symbols = ["🌿", "💚", "🧠", "🌈"]; // 4 pairs

const createDeck = () =>
  symbols
    .flatMap((symbol, i) => [
      { id: i * 2, symbol, isFlipped: false, isMatched: false },
      { id: i * 2 + 1, symbol, isFlipped: false, isMatched: false },
    ])
    .sort(() => Math.random() - 0.5);

const CardMatchGame: React.FC = () => {
  const [cards, setCards] = useState<Card[]>(createDeck);
  const [first, setFirst] = useState<Card | null>(null);
  const [second, setSecond] = useState<Card | null>(null);
  const [lock, setLock] = useState(false);
  const [moves, setMoves] = useState(0);
  const [best, setBest] = useState<number | null>(null);
  const [status, setStatus] = useState("Tap a card to begin.");

  const reset = () => {
    setCards(createDeck());
    setFirst(null);
    setSecond(null);
    setMoves(0);
    setLock(false);
    setStatus("New game started.");
  };

  const handleFlip = (card: Card) => {
    if (card.isMatched || card.isFlipped || lock) return;

    if (!first) {
      setFirst(card);
      flip(card);
      setStatus("Now pick a second card.");
    } else if (!second) {
      setSecond(card);
      flip(card);
      setMoves((m) => m + 1);
      setLock(true);

      if (card.symbol === first.symbol) {
        // Match
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.symbol === card.symbol ? { ...c, isMatched: true } : c
            )
          );
          setStatus("Match!");
          cleanup();
        }, 400);
      } else {
        // Not match
        setTimeout(() => {
          unflip(first);
          unflip(card);
          setStatus("Try again.");
          cleanup();
        }, 700);
      }
    }
  };

  const flip = (card: Card) =>
    setCards((prev) =>
      prev.map((c) =>
        c.id === card.id ? { ...c, isFlipped: true } : c
      )
    );

  const unflip = (card: Card) =>
    setCards((prev) =>
      prev.map((c) =>
        c.id === card.id ? { ...c, isFlipped: false } : c
      )
    );

  const cleanup = () => {
    setFirst(null);
    setSecond(null);
    setLock(false);
  };

  useEffect(() => {
    if (cards.length > 0 && cards.every((c) => c.isMatched)) {
      setStatus("Completed!");
      setBest((prev) => (prev === null ? moves : Math.min(prev, moves)));
    }
  }, [cards]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2 w-40 mx-auto">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleFlip(card)}
            className={`h-14 rounded-lg border flex items-center justify-center text-2xl ${
              card.isFlipped || card.isMatched
                ? "bg-white shadow-sm"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {card.isFlipped || card.isMatched ? card.symbol : "❓"}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>Moves: {moves}</span>
        <span>Best: {best ?? "—"}</span>
      </div>

      <p className="text-xs text-gray-500 min-h-[1.5rem]">{status}</p>

      <button
        onClick={reset}
        className="w-full text-sm font-medium rounded-lg border px-3 py-2 hover:bg-gray-50"
      >
        New Game
      </button>
    </div>
  );
};

export default MemoryChallengePage;
