import { useEffect, useState } from "react";
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

function App() {
  const [questions, setQuestions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [popupData, setPopupData] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupHeader, setPopupHeader] = useState("");
  const [popupInitialExpandedIndex, setPopupInitialExpandedIndex] = useState<
    number | undefined
  >(undefined);

  useEffect(() => {
    // Prevent layout shift when the popup opens by compensating for the
    // scrollbar width. When overflow is hidden the scrollbar disappears and
    // content can shift horizontally; add an equivalent right padding while
    // popup is open and restore the original padding when closed.
    const body = document.body;
    if (isPopupOpen) {
      // store original padding-right so we can restore it later
      body.dataset.originalPaddingRight = body.style.paddingRight || "";
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }
      body.style.overflow = "hidden";
    } else {
      body.style.overflow = "auto";
      // restore original padding-right
      if (body.dataset.originalPaddingRight !== undefined) {
        body.style.paddingRight = body.dataset.originalPaddingRight;
        delete body.dataset.originalPaddingRight;
      }
    }
  }, [isPopupOpen]);

  const openPopup = (filterKey) => {
    const filteredQuestions =
      questions.categories?.[filterKey] ||
      questions.difficulties?.[filterKey] ||
      [];
    setPopupData(filteredQuestions);
    setPopupHeader(filterKey);
    setPopupInitialExpandedIndex(undefined);
    setIsPopupOpen(true);
  };

  const openPopupForQuestion = (question) => {
    setPopupData([question]);
    // use the question category as header when available
    setPopupHeader(question.category || "Question");
    setPopupInitialExpandedIndex(0);
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setPopupData(null);
    setIsPopupOpen(false);
  };

  useEffect(() => {
    fetch("https://opentdb.com/api.php?amount=50")
      .then((response) => response.json())
      .then((data) => {
        const decodeHtmlEntities = (text) => {
          const textarea = document.createElement("textarea");
          textarea.innerHTML = text;
          return textarea.value;
        };

        const organizedData = data.results
          .map((question) => {
            question.question = decodeHtmlEntities(question.question); // Decode HTML entities in questions
            return question;
          })
          .reduce(
            (acc, question) => {
              question.category = decodeHtmlEntities(question.category);
              if (!acc.categories[question.category]) {
                acc.categories[question.category] = [];
              }
              acc.categories[question.category].push(question);

              if (!acc.difficulties[question.difficulty]) {
                acc.difficulties[question.difficulty] = [];
              }
              acc.difficulties[question.difficulty].push(question);

              return acc;
            },
            { categories: {}, difficulties: {} }
          );
        console.log(organizedData);
        setQuestions(organizedData);
      });
  }, []);

  const yAxisWidth = Math.max(
    ...Object.keys(questions.categories || {}).map((name) => name.length * 8),
    100
  );

  return (
    <div>
      <header
        style={{
          textAlign: "center",
          padding: "20px",
          background: "#282c34",
          color: "white",
        }}
      >
        <h1>Survey Visualizer</h1>
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
            onChange={(e) => setSelectedCategory(e.target.value)}
            value={selectedCategory}
            style={{ padding: "10px", width: "100%", borderRadius: "5px" }}
          >
            <option value="">All</option>
            {Object.keys(questions.categories || {}).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </section>
        {isPopupOpen && popupData && (
          <PopupTable
            questions={popupData}
            onClose={closePopup}
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
              <Tooltip />
              <Bar
                dataKey="questions"
                fill="#8884d8"
                onClick={(data, index) => openPopup(data.name)}
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
              <Tooltip />
              <Bar dataKey="questions" onClick={(data) => openPopup(data.name)}>
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
