import Container from "../../utils/Container";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { getFromStorage } from "../../utils/storage"; // adjust path
const CACHE_KEY = "wordListCache";
const QUIZ_STORAGE_KEY = "quizState";
const QUIZ_LENGTH = 30;

const Quiz = () => {
  const [mode, setMode] = useState(""); // "single" or "multi"
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [words, setWords] = useState([]);
  const [quizWords, setQuizWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [quizStarted, setQuizStarted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load words and previous quiz state
  useEffect(() => {
    const loadWordsAndState = async () => {
      const cachedData = await getFromStorage(CACHE_KEY);
      const wordList = cachedData?.words || [];
      setWords(wordList);

      const savedState = JSON.parse(localStorage.getItem(QUIZ_STORAGE_KEY));
      if (savedState) {
        setMode(savedState.mode || "");
        setPlayer1(savedState.player1);
        setPlayer2(savedState.player2);
        setQuizWords(savedState.quizWords);
        setCurrentIndex(savedState.currentIndex);
        setScores(savedState.scores);
        setQuizStarted(savedState.quizStarted);
      }
      setLoading(false);
    };
    loadWordsAndState();
  }, []);

  // Save quiz state
  useEffect(() => {
    if (quizStarted) {
      const stateToSave = {
        mode,
        player1,
        player2,
        quizWords,
        currentIndex,
        scores,
        quizStarted,
      };
      localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(stateToSave));
    }
  }, [mode, player1, player2, quizWords, currentIndex, scores, quizStarted]);

  // Start quiz
  const startQuiz = () => {
    if (mode === "single" && !player1.trim()) {
      setPlayer1("YOU");
    }

    const shuffled = [...words].sort(() => 0.5 - Math.random());
    const selectedWords = shuffled.slice(
      0,
      Math.min(QUIZ_LENGTH, words.length)
    );
    setQuizWords(selectedWords);
    setCurrentIndex(0);
    setScores({ player1: 0, player2: 0 });
    setShowMeaning(false);
    setQuizStarted(true);

    localStorage.setItem(
      QUIZ_STORAGE_KEY,
      JSON.stringify({
        mode,
        player1,
        player2,
        quizWords: selectedWords,
        currentIndex: 0,
        scores: { player1: 0, player2: 0 },
        quizStarted: true,
      })
    );
  };

  const handleScore = (player, delta) => {
    setScores((prev) => ({ ...prev, [player]: (prev[player] || 0) + delta }));
  };

  const nextWord = () => {
    if (currentIndex + 1 < quizWords.length) {
      setCurrentIndex(currentIndex + 1);
      setShowMeaning(false);
    } else {
      const finalScores = { ...scores };
      const winner =
        mode === "single"
          ? `${player1}'s Score: ${finalScores.player1}`
          : finalScores.player1 === finalScores.player2
          ? "It's a tie!"
          : finalScores.player1 > finalScores.player2
          ? player1
          : player2;

      Swal.fire({
        title: "Quiz Finished!",
        html:
          mode === "single"
            ? `<p>${player1}: ${finalScores.player1}</p>`
            : `<p>${player1}: ${finalScores.player1}</p><p>${player2}: ${finalScores.player2}</p><p>Winner: <strong>${winner}</strong></p>`,
        icon: "success",
      });

      const history = JSON.parse(localStorage.getItem("quizScores") || "[]");
      history.push({
        mode,
        player1: { name: player1, score: finalScores.player1 },
        ...(mode === "multi" && {
          player2: { name: player2, score: finalScores.player2 },
        }),
        date: new Date().toISOString(),
      });
      localStorage.setItem("quizScores", JSON.stringify(history));

      // Reset quiz
      setQuizStarted(false);
      setQuizWords([]);
      localStorage.removeItem(QUIZ_STORAGE_KEY);
    }
  };

  const resetQuiz = () => {
    Swal.fire({
      title: "Reset Quiz?",
      text: "All progress will be lost. Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, reset",
    }).then((result) => {
      if (result.isConfirmed) {
        setQuizWords([]);
        setCurrentIndex(0);
        setScores({ player1: 0, player2: 0 });
        setShowMeaning(false);
        setQuizStarted(false);
        localStorage.removeItem(QUIZ_STORAGE_KEY);
      }
    });
  };

  if (loading) {
    return (
      <div className="p-4 bg-gray-800 text-white rounded">
        <p>Loading words...</p>
      </div>
    );
  }

  if (!quizStarted) {
    if (!mode) {
      // Mode selection screen
      return (
        <Container>
          <div className="p-4 text-white rounded min-h-screen flex flex-col justify-center items-center">
            <h2 className="text-2xl font-bold mb-6 text-center">Choose Mode</h2>
            <div className="flex gap-4">
              <button
                onClick={() => setMode("single")}
                className="bg-blue-600 hover:bg-blue-700 p-2 rounded font-bold"
              >
                Play Yourself
              </button>
              <button
                onClick={() => setMode("multi")}
                className="bg-green-600 hover:bg-green-700 p-2 rounded font-bold"
              >
                Play with a Friend
              </button>
            </div>
          </div>
        </Container>
      );
    }

    // Player name input screen
    return (
      <Container>
        <div className="p-4 text-white rounded min-h-screen flex flex-col justify-center items-center">
          <h2 className="text-2xl font-bold mb-4 text-center">Start Quiz</h2>
          <div className="flex flex-col gap-2 mb-4 w-full max-w-sm">
            <input
              type="text"
              placeholder="Player 1: Name"
              value={player1}
              onChange={(e) => setPlayer1(e.target.value)}
              defaultValue="YOU"
              className="p-2 rounded text-black"
            />
            {mode === "multi" && (
              <input
                type="text"
                placeholder="Player 2: Name"
                value={player2}
                onChange={(e) => setPlayer2(e.target.value)}
                className="p-2 rounded text-black"
              />
            )}
          </div>
          <div className="flex gap-4">
            <button
              disabled={
                !player1 || (mode === "multi" && !player2) || words.length === 0
              }
              onClick={startQuiz}
              className="bg-blue-600 hover:bg-blue-700 p-2 rounded font-bold"
            >
              Start Quiz
            </button>
            <button
              onClick={() => setMode("")}
              className="bg-red-600 hover:bg-red-700 p-2 rounded font-bold"
            >
              Back
            </button>
          </div>
          {words.length === 0 && (
            <p className="mt-4 text-red-400 text-center">
              No words available for the quiz.
            </p>
          )}
        </div>
      </Container>
    );
  }

  const currentWord = quizWords[currentIndex];

  return (
    <Container>
      <div className="p-2 bg-gray-800 text-white rounded min-h-screen flex flex-col items-center mt-4">
        <div className="w-full flex justify-end">
          <button
            onClick={resetQuiz}
            className="btn btn-sm btn-warning mb-4 mt-4"
          >
            Reset
          </button>
        </div>
        <h2 className="text-xl font-bold mb-12 text-center">
          Word {currentIndex + 1} / {quizWords.length}
        </h2>

        <div className="text-3xl font-bold mb-4 text-orange-600 text-center">
          {currentWord?.value || "No word available"}
        </div>

        {showMeaning && (
          <div className="mb-4 text-yellow-300 text-center">
            {(currentWord?.meaning && currentWord.meaning.join(", ")) ||
              "No meaning available"}
          </div>
        )}

        <button
          onClick={() => setShowMeaning(true)}
          className="btn btn-sm btn-primary rounded mb-4"
        >
          Reveal Meaning
        </button>

        <div className="flex justify-center w-full md:w-8/12 lg:w-8/12 gap-8 mt-24">
          {/* Player 1 */}
          <div className="flex flex-col items-center gap-2 border rounded-md p-12 md:p-24 lg:p-24">
            <div className="font-bold">{player1}</div>
            <div className="text-xl">{scores.player1}</div>
            <div className="flex gap-3">
              <button
                onClick={() => handleScore("player1", -1)}
                className="bg-red-500 px-4 rounded"
              >
                -
              </button>
              <button
                onClick={() => handleScore("player1", 1)}
                className="bg-green-500 px-4 rounded"
              >
                +
              </button>
            </div>
          </div>

          {/* Player 2 (only for multi) */}
          {mode === "multi" && (
            <div className="flex flex-col items-center gap-2 border rounded-md p-12 md:p-24 lg:p-24">
              <div className="font-bold">{player2}</div>
              <div className="text-xl">{scores.player2}</div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleScore("player2", -1)}
                  className="bg-red-500 px-4 rounded"
                >
                  -
                </button>
                <button
                  onClick={() => handleScore("player2", 1)}
                  className="bg-green-500 px-4 rounded"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        <button onClick={nextWord} className="btn btn-sm btn-info mt-24">
          Next Word
        </button>
      </div>
    </Container>
  );
};

export default Quiz;
