import { useEffect, useState } from "react";
import type { Question, QuestionsIndex } from "./types/types";
import "./App.css";
import {
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Cell,
  ResponsiveContainer,
} from "recharts";
import PopupTable from "./components/PopupTable";
import decodeHtmlEntities from "./assets/utils/decodeHtmlEntities";

function App() {
  const [questions, setQuestions] = useState<QuestionsIndex>({
    categories: {},
    difficulties: {},
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [popupData, setPopupData] = useState<Question[] | null>(null);
  const [popupHeader, setPopupHeader] = useState<string>("");
  const [popupInitialExpandedIndex, setPopupInitialExpandedIndex] = useState<
    number | undefined
  >(undefined);

  type TooltipEntry = { value?: number; payload?: { questions?: number } };
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: TooltipEntry[];
    label?: string | number;
  }) => {
    if (!active || !payload || !payload.length) return null;
    const value =
      (payload[0] as TooltipEntry).value ??
      (payload[0] as TooltipEntry).payload?.questions;
    return (
      <div className="custom-tooltip">
        <div className="tooltip-label">{label}</div>
        <div className="tooltip-value">{value} questions</div>
      </div>
    );
  };

  useEffect(() => {
    // Prevent layout shift when the popup opens by compensating for the scrollbar width.
    const body = document.body;
    if (popupData != null) {
      body.dataset.originalPaddingRight = body.style.paddingRight || "";
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }
      body.style.overflow = "hidden";
    } else {
      body.style.overflow = "auto";
      if (body.dataset.originalPaddingRight !== undefined) {
        body.style.paddingRight = body.dataset.originalPaddingRight;
        delete body.dataset.originalPaddingRight;
      }
    }
  }, [popupData]);

  const openPopup = (filterKey?: string) => {
    const key = filterKey ?? "";
    const filteredQuestions =
      questions.categories[key] || questions.difficulties[key] || [];
    setPopupData(filteredQuestions);
    setPopupHeader(key || "");
    setPopupInitialExpandedIndex(undefined);
  };

  const openPopupForQuestion = (question: Question) => {
    setPopupData([question]);
    setPopupHeader(question.category || "Question");
    setPopupInitialExpandedIndex(0);
  };

  useEffect(() => {
    fetch("https://opentdb.com/api.php?amount=50")
      .then((response) => response.json())
      .then((data) => {
        const results = (data as { results?: Question[] })?.results || [];

        const organizedData = results
          .map((q: Question) => {
            const questionText = q.question
              ? decodeHtmlEntities(q.question)
              : "";
            return {
              ...(q as Question),
              question: questionText,
            } as Question;
          })
          .reduce(
            (acc: QuestionsIndex, question: Question) => {
              const category = question.category || "";
              const difficulty = question.difficulty || "";

              if (!acc.categories[category]) acc.categories[category] = [];
              acc.categories[category].push(question);

              if (!acc.difficulties[difficulty])
                acc.difficulties[difficulty] = [];
              acc.difficulties[difficulty].push(question);

              return acc;
            },
            { categories: {}, difficulties: {} } as QuestionsIndex,
          );
        setQuestions(organizedData);
      });
  }, []);

  const yAxisWidth = Math.max(
    ...Object.keys(questions.categories || {}).map((name) => name.length * 8),
    100,
  );

  return (
    <div>
      <header className="app-header">
        <h1>Survey Visualizer</h1>
        <p className="subtitle">
          Explore question distributions and inspect items
        </p>
      </header>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          margin: "20px",
        }}
      >
        <section style={{ marginBottom: "30px", width: "80%" }}>
          <h2>Categories</h2>
          <select
            className="category-select"
            onChange={(e) => setSelectedCategory(e.target.value)}
            value={selectedCategory}
          >
            <option value="">All</option>
            {Object.keys(questions.categories || {}).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </section>
        {popupData && (
          <PopupTable
            questions={popupData}
            onClose={() => setPopupData(null)}
            header={popupHeader}
            initialExpandedIndex={popupInitialExpandedIndex}
          />
        )}
        <section style={{ marginBottom: "30px", width: "80%" }}>
          <h3>Filtered Questions</h3>
          <ul className="filtered-list">
            {selectedCategory
              ? questions.categories?.[selectedCategory]?.map((q, idx) => (
                  <li
                    key={idx}
                    className="filtered-item"
                    onClick={() => openPopupForQuestion(q)}
                  >
                    <div className="index">{idx + 1}</div>
                    <div className="question-text">{q.question}</div>
                  </li>
                ))
              : Object.values(questions.categories || {})
                  .flat()
                  .map((q, idx) => (
                    <li
                      key={idx}
                      className="filtered-item"
                      onClick={() => openPopupForQuestion(q)}
                    >
                      <div className="index">{idx + 1}</div>
                      <div className="question-text">{q.question}</div>
                    </li>
                  ))}
          </ul>
        </section>
        <section style={{ marginBottom: "30px", width: "80%" }}>
          <h2>Questions by Category</h2>
          <ResponsiveContainer width="100%" height={600}>
            <BarChart
              layout="vertical"
              data={Object.keys(questions.categories || {}).map((key) => ({
                name: key,
                questions: questions.categories[key].length,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={yAxisWidth} />
              <Tooltip
                content={<CustomTooltip />}
                animationDuration={80}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="questions"
                fill="#8884d8"
                onClick={(data) => openPopup((data as { name?: string })?.name)}
              />
            </BarChart>
          </ResponsiveContainer>
        </section>
        <section style={{ width: "80%", maxWidth: "600px" }}>
          <h2>Questions by Difficulty</h2>
          <ResponsiveContainer width="100%" height={300}>
            {/* Always show difficulties in the order: easy, medium, hard */}
            <BarChart
              data={["easy", "medium", "hard"].map((key) => ({
                name: key,
                questions:
                  questions.difficulties && questions.difficulties[key]
                    ? questions.difficulties[key].length
                    : 0,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                content={<CustomTooltip />}
                animationDuration={80}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="questions"
                onClick={(data) => openPopup((data as { name?: string })?.name)}
              >
                {["easy", "medium", "hard"].map((difficulty, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      difficulty === "easy"
                        ? "green"
                        : difficulty === "medium"
                          ? "yellow"
                          : "red"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>
    </div>
  );
}

export default App;
