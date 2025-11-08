import { useEffect, useState } from "react";
import "./App.css";
import {
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Cell,
} from "recharts";

function App() {
  const [questions, setQuestions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    fetch("https://opentdb.com/api.php?amount=50")
      .then((response) => response.json())
      .then((data) => {
        const decodeHtmlEntities = (text) => {
          const textarea = document.createElement("textarea");
          textarea.innerHTML = text;
          return textarea.value;
        };

        const organizedData = data.results.reduce(
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

            console.log(acc);
            return acc;
          },
          { categories: {}, difficulties: {} },
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
      <main
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
        <section style={{ marginBottom: "30px", width: "80%" }}>
          <h3>Filtered Questions</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {selectedCategory
              ? questions.categories?.[selectedCategory]?.map((q, idx) => (
                  <li
                    key={idx}
                    style={{ padding: "10px", borderBottom: "1px solid gray" }}
                  >
                    {q.question}
                  </li>
                ))
              : Object.values(questions.categories || {})
                  .flat()
                  .map((q, idx) => (
                    <li
                      key={idx}
                      style={{
                        padding: "10px",
                        borderBottom: "1px solid gray",
                      }}
                    >
                      {q.question}
                    </li>
                  ))}
          </ul>
        </section>
        <section style={{ marginBottom: "30px", width: "80%" }}>
          <h2>Questions by Category</h2>
          <BarChart
            width={800}
            height={600}
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
            <Legend />
            <Bar dataKey="questions" fill="#8884d8" />
          </BarChart>
        </section>
        <section style={{ width: "80%" }}>
          <h2>Questions by Difficulty</h2>
          <BarChart
            width={600}
            height={300}
            data={Object.keys(questions.difficulties || {}).map((key) => ({
              name: key,
              questions: questions.difficulties[key].length,
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="questions">
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
        </section>
      </main>
    </div>
  );
}

export default App;
