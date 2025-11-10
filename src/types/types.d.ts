export interface Question {
  type: string;
  difficulty: "easy" | "medium" | "hard" | string;
  category: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

export interface QuestionsIndex {
  categories: Record<string, Question[]>;
  difficulties: Record<string, Question[]>;
}
