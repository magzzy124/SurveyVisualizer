import React, { useState, useEffect } from "react";
import "./PopupTable.css";

interface Question {
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

interface PopupTableProps {
  questions: Question[];
  onClose: () => void;
  header?: string;
  // optional initial expanded question index (useful when opening with a
  // single question pre-expanded)
  initialExpandedIndex?: number;
}

const PopupTable: React.FC<PopupTableProps> = ({
  questions,
  onClose,
  header,
  initialExpandedIndex,
}) => {
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  // track which questions have their answers revealed
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const toggleExpand = (index: number) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  const toggleReveal = (index: number) => {
    setRevealed((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  useEffect(() => {
    // if an initialExpandedIndex is provided, expand that question
    if (
      typeof initialExpandedIndex === "number" &&
      initialExpandedIndex >= 0 &&
      initialExpandedIndex < questions.length
    ) {
      setExpandedQuestion(initialExpandedIndex);
    }
  }, [initialExpandedIndex, questions.length]);

  const decodeHtmlEntities = (text: string) => {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
  };

  return (
    <div
      className="popup-overlay"
      onClick={(e) => {
        const target = e.target as HTMLElement | null;
        if (target && target.classList.contains("popup-overlay")) onClose();
      }}
    >
      <div className="popup-content">
        <h2>{header}</h2>
        <div className="question-list">
          {questions.map((q, index) => (
            <div key={index} className="question-item">
              <div
                className="question-header"
                onClick={() => toggleExpand(index)}
                style={{ cursor: "pointer" }}
              >
                {q.question}
              </div>
              {expandedQuestion === index && (
                <div className="question-details">
                  <ul>
                    {[q.correct_answer, ...q.incorrect_answers].map(
                      (answer, idx) => {
                        const decoded = decodeHtmlEntities(answer);
                        const correctDecoded = decodeHtmlEntities(
                          q.correct_answer
                        );
                        const isCorrect = decoded === correctDecoded;
                        const isRevealed = !!revealed[index];
                        const className = isRevealed
                          ? isCorrect
                            ? "answer correct"
                            : "answer incorrect"
                          : "answer";
                        return (
                          <li key={idx} className={className}>
                            {decoded}
                          </li>
                        );
                      }
                    )}
                  </ul>
                  <button onClick={() => toggleReveal(index)}>
                    {revealed[index] ? "Hide Answer" : "Show Correct Answer"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PopupTable;
