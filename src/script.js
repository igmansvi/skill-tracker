// Navigation
const sections = {
  generate: document.getElementById("generateSection"),
  take: document.getElementById("takeSection"),
  results: document.getElementById("resultsSection"),
};

const navButtons = {
  generate: document.getElementById("navGenerate"),
  take: document.getElementById("navTake"),
  results: document.getElementById("navResults"),
};

function showSection(sectionName) {
  // Hide all sections
  Object.values(sections).forEach((section) => section.classList.add("hidden"));

  // Show the requested section
  sections[sectionName].classList.remove("hidden");

  // Update nav buttons
  Object.entries(navButtons).forEach(([name, button]) => {
    if (name === sectionName) {
      button.classList.remove("text-gray-600");
      button.classList.add("text-blue-600", "border-b-2", "border-blue-600");
    } else {
      button.classList.remove("text-blue-600", "border-b-2", "border-blue-600");
      button.classList.add("text-gray-600");
    }
  });
}

navButtons.generate.addEventListener("click", () => showSection("generate"));
navButtons.take.addEventListener("click", () => showSection("take"));
navButtons.results.addEventListener("click", () => showSection("results"));

// API Interaction
function generateContent(text) {
  const api_key = "AIzaSyDdoFDdA4MB5UjKtXZOITwd2ZvOwLFaNKg";
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text,
            },
          ],
        },
      ],
    }),
  };

  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${api_key}`,
    options
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error("HTTP error! Status: " + response.status);
      }
      return response.json();
    })
    .then((data) => {
      const result = data.candidates[0].content.parts[0].text;
      return result;
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });
}

// Generate Test Section
function createGeneratePrompt() {
  const userType = document.getElementById("userType").value;
  const testType = document.getElementById("testType").value;
  const difficulty = document.getElementById("difficulty").value;
  const questionsCount = document.getElementById("questionsCount").value;

  let testTypeLabel = getTestTypeLabel(testType);

  return `Create a ${difficulty} level ${testTypeLabel} for a ${userType} with ${questionsCount} questions. Format it with clear instructions, numbered questions, and multiple choice options (A, B, C, D). For each question, clearly mark the correct answer in a way that can be parsed by a program (e.g., "Correct: A"). For personality tests, include an interpretation guide at the end.`;
}

function getTestTypeLabel(testType) {
  switch (testType) {
    case "aptitude":
      return "Aptitude Test";
    case "reading":
      return "Reading Skills Test";
    case "writing":
      return "Writing Skills Test";
    case "personality":
      return "Personality Test";
    default:
      return "General Test";
  }
}

function formatResult(text) {
  // Convert markdown-like syntax to HTML with question IDs for the test-taking feature
  let formattedText = text
    .replace(/\n\n/g, "<br><br>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^# (.*?)$/gm, '<h1 class="text-xl font-bold my-2">$1</h1>')
    .replace(/^## (.*?)$/gm, '<h2 class="text-lg font-bold my-2">$1</h2>')
    .replace(/^### (.*?)$/gm, '<h3 class="text-md font-bold my-2">$1</h3>');

  // Process numbered questions and add data attributes
  let questionCount = 0;
  formattedText = formattedText.replace(
    /^(\d+)\.\s(.*?)$/gm,
    (match, number, text) => {
      questionCount++;
      return `<div class="question" id="question-${questionCount}"><p class="my-1 font-bold">Question ${number}: ${text}</p>`;
    }
  );

  // Process options
  formattedText = formattedText.replace(
    /^([A-D])\.?\s(.*?)$/gm,
    '<div class="option"><span class="font-medium">$1.</span> $2</div>'
  );

  // Close question divs (this is a simplification)
  formattedText = formattedText.replace(
    /(<div class="option">.*?<\/div>)\s*(?=<div class="question"|$)/gs,
    "$1</div>"
  );

  return formattedText;
}

document.getElementById("generateBtn").addEventListener("click", async () => {
  const generatedTestElement = document.getElementById("generatedTest");
  const loadingIndicator = document.getElementById("generateLoadingIndicator");

  // Show loading indicator and hide previous results
  loadingIndicator.classList.remove("hidden");
  generatedTestElement.innerHTML = "";

  try {
    const prompt = createGeneratePrompt();
    const result = await generateContent(prompt);

    // Format the result
    generatedTestElement.innerHTML = formatResult(result);

    // Store the generated test for later use
    localStorage.setItem("lastGeneratedTest", result);
    localStorage.setItem(
      "lastTestType",
      document.getElementById("testType").value
    );
    localStorage.setItem(
      "lastTestDifficulty",
      document.getElementById("difficulty").value
    );

    // Show take test button
    generatedTestElement.innerHTML += `
        <div class="mt-6 pt-4 border-t border-gray-300">
            <button id="takeGeneratedTestBtn" class="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 cursor-pointer">
                Take This Test Now
            </button>
        </div>
    `;

    document
      .getElementById("takeGeneratedTestBtn")
      .addEventListener("click", () => {
        showSection("take");
        document.getElementById("takeTestType").value =
          document.getElementById("testType").value;
        document.getElementById("takeDifficulty").value =
          document.getElementById("difficulty").value;
        startTest();
      });
  } catch (error) {
    generatedTestElement.textContent = `Error: ${error.message}`;
  } finally {
    // Hide loading indicator
    loadingIndicator.classList.add("hidden");
  }
});

// Take Test Section
document.getElementById("startTestBtn").addEventListener("click", startTest);

async function startTest() {
  const testContentElement = document.getElementById("testContent");
  const testQuestionsElement = document.getElementById("testQuestions");
  const selectionFormElement = document.getElementById("testSelectionForm");
  const loadingIndicator = document.getElementById("takeLoadingIndicator");

  // Show loading indicator and hide other elements
  loadingIndicator.classList.remove("hidden");
  testContentElement.classList.add("hidden");
  selectionFormElement.classList.add("hidden");

  try {
    let testContent;

    // Check if we have a generated test
    const lastGeneratedTest = localStorage.getItem("lastGeneratedTest");
    const lastTestType = localStorage.getItem("lastTestType");
    const lastTestDifficulty = localStorage.getItem("lastTestDifficulty");

    const selectedTestType = document.getElementById("takeTestType").value;
    const selectedDifficulty = document.getElementById("takeDifficulty").value;

    if (
      lastGeneratedTest &&
      lastTestType === selectedTestType &&
      lastTestDifficulty === selectedDifficulty
    ) {
      testContent = lastGeneratedTest;
    } else {
      // Generate a new test
      const prompt = createTakeTestPrompt();
      testContent = await generateContent(prompt);
      localStorage.setItem("lastGeneratedTest", testContent);
      localStorage.setItem("lastTestType", selectedTestType);
      localStorage.setItem("lastTestDifficulty", selectedDifficulty);
    }

    // Process the test content to create an interactive quiz
    const parsedTest = parseTestContent(testContent);
    renderTest(parsedTest, testQuestionsElement);

    // Show the test
    testContentElement.classList.remove("hidden");
  } catch (error) {
    testQuestionsElement.textContent = `Error: ${error.message}`;
    testContentElement.classList.remove("hidden");
  } finally {
    // Hide loading indicator
    loadingIndicator.classList.add("hidden");
  }
}

function createTakeTestPrompt() {
  const testType = document.getElementById("takeTestType").value;
  const difficulty = document.getElementById("takeDifficulty").value;
  const testTypeLabel = getTestTypeLabel(testType);

  return `Create a ${difficulty} level ${testTypeLabel} with 10 multiple-choice questions. Format each question with options A, B, C, and D. For each question, clearly indicate the correct answer in a format like "Correct: A" at the end of the question. For personality tests, include an interpretation guide at the end explaining how to interpret the results.`;
}

function parseTestContent(content) {
  // Basic parsing function - in a real app, this would be more sophisticated
  const questions = [];

  // Match questions and options
  const questionRegex = /(\d+)\.\s+(.*?)(?=\d+\.\s+|\n*$)/gs;
  let match;

  while ((match = questionRegex.exec(content)) !== null) {
    const questionNumber = match[1];
    const questionText = match[2].trim();

    // Extract the question and options
    const questionLines = questionText
      .split("\n")
      .filter((line) => line.trim());

    if (questionLines.length >= 5) {
      // Question + 4 options
      const question = questionLines[0];
      const options = [];
      let correctAnswer = "";

      // Process options and look for correct answer
      for (let i = 1; i < questionLines.length; i++) {
        const line = questionLines[i].trim();

        if (
          line.startsWith("A") ||
          line.startsWith("B") ||
          line.startsWith("C") ||
          line.startsWith("D")
        ) {
          const optionLetter = line[0];
          const optionText = line.substring(line.indexOf(" ") + 1).trim();
          options.push({ letter: optionLetter, text: optionText });
        }

        if (line.toLowerCase().includes("correct:")) {
          const answerMatch = line.match(/correct:\s*([A-D])/i);
          if (answerMatch) {
            correctAnswer = answerMatch[1];
          }
        }
      }

      if (options.length > 0) {
        questions.push({
          number: questionNumber,
          question: question,
          options: options,
          correctAnswer: correctAnswer,
        });
      }
    }
  }

  return {
    questions: questions,
    testType: document.getElementById("takeTestType").value,
    difficulty: document.getElementById("takeDifficulty").value,
  };
}

function renderTest(parsedTest, container) {
  container.innerHTML = "";

  parsedTest.questions.forEach((q) => {
    const questionDiv = document.createElement("div");
    questionDiv.className = "p-4 border border-gray-200 rounded-lg";
    questionDiv.dataset.questionNumber = q.number;
    questionDiv.dataset.correctAnswer = q.correctAnswer;

    questionDiv.innerHTML = `
        <p class="font-medium mb-2">${q.number}. ${q.question}</p>
        <div class="space-y-2 options-container">
            ${q.options
              .map(
                (opt) => `
                <label class="flex items-start p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                    <input type="radio" name="question-${q.number}" value="${opt.letter}" class="mt-1 mr-2">
                    <span><strong>${opt.letter}.</strong> ${opt.text}</span>
                </label>
            `
              )
              .join("")}
        </div>
    `;

    container.appendChild(questionDiv);
  });
}

document.getElementById("submitTestBtn").addEventListener("click", () => {
  const testQuestions = document.querySelectorAll("#testQuestions > div");
  let correctAnswers = 0;
  let totalQuestions = testQuestions.length;
  let userAnswers = [];

  testQuestions.forEach((question) => {
    const questionNumber = question.dataset.questionNumber;
    const correctAnswer = question.dataset.correctAnswer;
    const selectedOption = question.querySelector(
      'input[type="radio"]:checked'
    );

    if (selectedOption) {
      const userAnswer = selectedOption.value;
      userAnswers.push({
        question: questionNumber,
        userAnswer: userAnswer,
        correctAnswer: correctAnswer,
        isCorrect: userAnswer === correctAnswer,
      });

      if (userAnswer === correctAnswer) {
        correctAnswers++;
        selectedOption.parentElement.classList.add(
          "bg-green-50",
          "border-green-300"
        );
      } else {
        selectedOption.parentElement.classList.add(
          "bg-red-50",
          "border-red-300"
        );
        // Highlight correct answer
        const correctOption = question.querySelector(
          `input[value="${correctAnswer}"]`
        );
        if (correctOption) {
          correctOption.parentElement.classList.add(
            "bg-green-50",
            "border-green-300"
          );
        }
      }
    }
  });

  // Calculate score
  const score =
    totalQuestions > 0
      ? Math.round((correctAnswers / totalQuestions) * 100)
      : 0;

  // Save test results
  saveTestResults({
    testType: document.getElementById("takeTestType").value,
    difficulty: document.getElementById("takeDifficulty").value,
    score: score,
    date: new Date().toISOString(),
    answers: userAnswers,
  });

  // Show results
  showTestResults();

  // Disable form inputs
  document.querySelectorAll("#testQuestions input").forEach((input) => {
    input.disabled = true;
  });

  // Show results button
  document.getElementById(
    "submitTestBtn"
  ).innerHTML = `Test Submitted - View Results Dashboard`;
  document.getElementById("submitTestBtn").addEventListener("click", () => {
    showSection("results");
  });
});

// Results Dashboard Section
function saveTestResults(results) {
  // Get existing results
  let allResults = JSON.parse(localStorage.getItem("testResults") || "[]");

  // Add new results
  allResults.push(results);

  // Save back to localStorage
  localStorage.setItem("testResults", JSON.stringify(allResults));

  // Generate recommendations
  generateRecommendations(results);
}

function showTestResults() {
  // Get results from localStorage
  const allResults = JSON.parse(localStorage.getItem("testResults") || "[]");

  if (allResults.length === 0) {
    document.getElementById("noResultsMsg").classList.remove("hidden");
    document.getElementById("resultsSummary").classList.add("hidden");
    return;
  }

  // Show most recent result
  const latestResult = allResults[allResults.length - 1];

  document.getElementById("noResultsMsg").classList.add("hidden");
  document.getElementById("resultsSummary").classList.remove("hidden");

  document.getElementById("resultTestType").textContent = getTestTypeLabel(
    latestResult.testType
  );
  document.getElementById("resultScore").textContent = `${latestResult.score}%`;

  // Determine skill level based on score and difficulty
  let skillLevel;
  if (latestResult.score < 50) {
    skillLevel = "Beginner";
  } else if (latestResult.score < 80) {
    skillLevel = "Intermediate";
  } else {
    skillLevel = "Advanced";
  }

  document.getElementById("resultSkillLevel").textContent = skillLevel;

  // Update skill chart
  updateSkillChart(allResults);
}

function updateSkillChart(results) {
  const chartContainer = document.getElementById("skillLevelChart");
  chartContainer.innerHTML = "";

  // Group results by test type
  const testTypes = ["aptitude", "reading", "writing", "personality"];
  const testTypeData = {};

  testTypes.forEach((type) => {
    const typeResults = results.filter((r) => r.testType === type);
    if (typeResults.length > 0) {
      // Calculate average score
      const avgScore =
        typeResults.reduce((sum, r) => sum + r.score, 0) / typeResults.length;
      testTypeData[type] = avgScore;
    } else {
      testTypeData[type] = 0;
    }
  });

  // Create chart bars
  const colors = {
    aptitude: "bg-blue-500",
    reading: "bg-green-500",
    writing: "bg-purple-500",
    personality: "bg-yellow-500",
  };

  testTypes.forEach((type, index) => {
    const score = testTypeData[type];
    const height = score > 0 ? Math.max(20, (score / 100) * 230) : 20; // Minimum height for visibility

    const bar = document.createElement("div");
    bar.className = `${colors[type]} relative flex-1 mx-2 rounded-t`;
    bar.style.height = `${height}px`;

    const label = document.createElement("div");
    label.className = "absolute -top-6 left-0 right-0 text-center text-xs";
    label.textContent = score > 0 ? `${Math.round(score)}%` : "N/A";

    bar.appendChild(label);
    chartContainer.appendChild(bar);
  });
}

async function generateRecommendations(testResult) {
  try {
    const testTypeLabel = getTestTypeLabel(testResult.testType);
    const prompt = `Based on a ${testResult.difficulty} level ${testTypeLabel} where the user scored ${testResult.score}%, provide 3 specific recommendations for improvement. Format each recommendation as a bullet point with a title and brief explanation. Keep it concise but actionable.`;

    const recommendations = await generateContent(prompt);

    // Store recommendations
    localStorage.setItem("lastRecommendations", recommendations);

    // Display recommendations
    document.getElementById("noRecomMsg").classList.add("hidden");
    document.getElementById("recomContent").classList.remove("hidden");

    // Format recommendations
    let formattedRecom = recommendations
      .replace(/\n\n/g, "<br><br>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(
        /^-\s*(.*?)$/gm,
        '<li class="flex items-start mb-3"><div class="mr-2 mt-1 text-green-500">✓</div><div>$1</div></li>'
      );

    document.getElementById(
      "recomContent"
    ).innerHTML = `<ul class="list-none pl-0">${formattedRecom}</ul>`;
  } catch (error) {
    console.error("Error generating recommendations:", error);
  }
}

// Initialize dashboard if there are saved results
navButtons.results.addEventListener("click", () => {
  showTestResults();
});
