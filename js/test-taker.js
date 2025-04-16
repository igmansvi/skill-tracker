/**
 * Test Taker Module
 * Handles the test taking experience
 */

const TestTaker = {
  // Current test state
  currentTest: null,
  currentQuestionIndex: 0,
  answers: [],
  timer: null,
  timeSpent: 0,

  /**
   * Initialize test taker functionality
   */
  init() {
    const startTestBtn = document.getElementById("start-test");
    const prevBtn = document.getElementById("prev-question");
    const nextBtn = document.getElementById("next-question");
    const submitBtn = document.getElementById("submit-test");
    const viewDashboardBtn = document.getElementById("view-dashboard");

    if (startTestBtn) {
      startTestBtn.addEventListener("click", this.handleStartTest.bind(this));
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", this.handlePrevQuestion.bind(this));
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", this.handleNextQuestion.bind(this));
    }

    if (submitBtn) {
      submitBtn.addEventListener("click", this.handleSubmitTest.bind(this));
    }

    if (viewDashboardBtn) {
      viewDashboardBtn.addEventListener(
        "click",
        this.handleViewDashboard.bind(this)
      );
    }
  },

  /**
   * Handle starting a new test
   */
  async handleStartTest() {
    const category = document.getElementById("take-test-category").value;
    const difficulty = document.getElementById("take-difficulty").value;

    // Generate a new test via API if one doesn't already exist
    let testId = localStorage.getItem("currentTestId");
    let test = null;

    if (testId) {
      test = TestGenerator.getTestById(testId);

      // Check if the saved test matches the selected parameters
      if (
        test &&
        (test.category !== category || test.difficulty !== difficulty)
      ) {
        test = null; // Force new test generation if parameters don't match
      }
    }

    // If no suitable test, generate a new one
    if (!test) {
      const startBtn = document.getElementById("start-test");
      startBtn.textContent = "Generating Test...";
      startBtn.disabled = true;

      const questions = await API.generateTest({
        userType: "general", // Default to general user
        category,
        difficulty,
        questionCount: 10, // Default to 10 questions
      });

      startBtn.textContent = "Start Test";
      startBtn.disabled = false;

      test = {
        id: "test_" + Date.now(),
        timestamp: new Date().toISOString(),
        userType: "general",
        category,
        difficulty,
        questionCount: questions.length,
        questions,
      };

      TestGenerator.saveTestToStorage(test);
    }

    this.loadAndStartTest(test.id);
  },

  /**
   * Load and start a test by ID
   * @param {string} testId - The ID of the test to start
   */
  loadAndStartTest(testId) {
    const test = TestGenerator.getTestById(testId);

    if (!test) {
      console.error("Test not found:", testId);
      return;
    }

    // Initialize test state
    this.currentTest = test;
    this.currentQuestionIndex = 0;
    this.answers = new Array(test.questions.length).fill(null);
    this.timeSpent = 0;

    // Hide test selection, show test container
    document.getElementById("test-selection").classList.add("hidden");
    document.getElementById("test-container").classList.remove("hidden");

    // Update test title
    document.getElementById(
      "test-title"
    ).textContent = `${TestGenerator.formatCategory(
      test.category
    )} - ${TestGenerator.formatDifficulty(test.difficulty)}`;

    // Start timer
    this.startTimer();

    // Show first question
    this.showQuestion(0);
  },

  /**
   * Start the test timer
   */
  startTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    const timerDisplay = document.getElementById("test-timer");
    const startTime = Date.now();

    this.timer = setInterval(() => {
      this.timeSpent = Math.floor((Date.now() - startTime) / 1000);
      timerDisplay.textContent = this.formatTime(this.timeSpent);
    }, 1000);
  },

  /**
   * Format seconds as MM:SS
   * @param {number} seconds - Time in seconds
   * @returns {string} - Formatted time string
   */
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  },

  /**
   * Display a question by index
   * @param {number} index - Question index
   */
  showQuestion(index) {
    if (
      !this.currentTest ||
      index < 0 ||
      index >= this.currentTest.questions.length
    ) {
      return;
    }

    this.currentQuestionIndex = index;
    const question = this.currentTest.questions[index];
    const container = document.getElementById("question-container");

    // Update progress bar
    const progressPercent =
      ((index + 1) / this.currentTest.questions.length) * 100;
    document.getElementById("progress-bar").style.width = `${progressPercent}%`;

    let html = "";

    // Question number and text
    html += `
            <div class="mb-4">
                <div class="text-sm text-gray-500 mb-1">Question ${
                  index + 1
                } of ${this.currentTest.questions.length}</div>
                <div class="question-text">${question.question_text}</div>
            </div>
        `;

    // For reading questions, add the passage
    if (question.type === "reading" && question.passage) {
      html += `
                <div class="reading-passage">
                    ${question.passage}
                </div>
            `;
    }

    // Question content based on type
    switch (question.type) {
      case "multiple_choice":
        html += this.renderMultipleChoiceQuestion(question, index);
        break;

      case "text_input":
      case "writing":
        html += this.renderTextInputQuestion(question, index);
        break;

      default:
        html += "<p>Unsupported question type.</p>";
    }

    container.innerHTML = html;

    // Add event listeners to options
    if (question.type === "multiple_choice") {
      const options = container.querySelectorAll(".option");
      options.forEach((option) => {
        option.addEventListener("click", this.handleOptionSelect.bind(this));
      });
    }

    // Add event listener to text inputs
    if (question.type === "text_input" || question.type === "writing") {
      const textarea = container.querySelector(".text-answer");
      textarea.addEventListener("input", this.handleTextInput.bind(this));

      // Restore saved answer if available
      if (this.answers[index]) {
        textarea.value = this.answers[index];
      }
    }

    // Update navigation buttons
    this.updateNavigationButtons();
  },

  /**
   * Render a multiple choice question
   * @param {Object} question - Question data
   * @param {number} index - Question index
   * @returns {string} - HTML string
   */
  renderMultipleChoiceQuestion(question, index) {
    let html = '<div class="options-container">';

    question.options.forEach((option, optIndex) => {
      const isSelected = this.answers[index] === option;
      const selectedClass = isSelected ? "selected" : "";

      html += `
                <div class="option ${selectedClass}" data-index="${optIndex}" data-value="${option}">
                    <div class="flex items-center">
                        <div class="w-5 h-5 rounded-full border border-gray-400 mr-3 flex items-center justify-center">
                            ${
                              isSelected
                                ? '<div class="w-3 h-3 rounded-full bg-blue-600"></div>'
                                : ""
                            }
                        </div>
                        <div>${option}</div>
                    </div>
                </div>
            `;
    });

    html += "</div>";
    return html;
  },

  /**
   * Render a text input question
   * @param {Object} question - Question data
   * @param {number} index - Question index
   * @returns {string} - HTML string
   */
  renderTextInputQuestion(question, index) {
    return `
            <div>
                ${
                  question.criteria
                    ? `<p class="text-sm text-gray-600 mb-2">Criteria: ${question.criteria}</p>`
                    : ""
                }
                <textarea class="text-answer" placeholder="Type your answer here...">${
                  this.answers[index] || ""
                }</textarea>
            </div>
        `;
  },

  /**
   * Update navigation buttons based on current question
   */
  updateNavigationButtons() {
    const prevBtn = document.getElementById("prev-question");
    const nextBtn = document.getElementById("next-question");
    const submitBtn = document.getElementById("submit-test");

    // Previous button - disabled on first question
    prevBtn.disabled = this.currentQuestionIndex === 0;
    prevBtn.classList.toggle("opacity-50", prevBtn.disabled);

    // Next button - hidden on last question
    const isLastQuestion =
      this.currentQuestionIndex === this.currentTest.questions.length - 1;
    nextBtn.classList.toggle("hidden", isLastQuestion);

    // Submit button - shown only on last question
    submitBtn.classList.toggle("hidden", !isLastQuestion);
  },

  /**
   * Handle option selection in multiple choice questions
   * @param {Event} event - Click event
   */
  handleOptionSelect(event) {
    const optionDiv = event.currentTarget;
    const value = optionDiv.dataset.value;

    // Save the answer
    this.answers[this.currentQuestionIndex] = value;

    // Update UI
    const options = optionDiv.parentElement.querySelectorAll(".option");
    options.forEach((opt) => {
      opt.classList.remove("selected");
      opt.querySelector(".w-3")?.remove();
    });

    optionDiv.classList.add("selected");
    const indicator = optionDiv.querySelector(".w-5");
    indicator.innerHTML =
      '<div class="w-3 h-3 rounded-full bg-blue-600"></div>';
  },

  /**
   * Handle text input in essay questions
   * @param {Event} event - Input event
   */
  handleTextInput(event) {
    const textarea = event.currentTarget;
    this.answers[this.currentQuestionIndex] = textarea.value;
  },

  /**
   * Navigate to previous question
   */
  handlePrevQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.showQuestion(this.currentQuestionIndex - 1);
    }
  },

  /**
   * Navigate to next question
   */
  handleNextQuestion() {
    if (this.currentQuestionIndex < this.currentTest.questions.length - 1) {
      this.showQuestion(this.currentQuestionIndex + 1);
    }
  },

  /**
   * Handle test submission
   */
  async handleSubmitTest() {
    // Stop the timer
    clearInterval(this.timer);

    // Calculate score
    const score = this.calculateScore();

    // Get incorrect questions for recommendations
    const wrongAnswers = this.getWrongAnswers();

    // Hide test container and show results
    document.getElementById("test-container").classList.add("hidden");
    document.getElementById("test-result").classList.remove("hidden");

    // Display score
    const scorePercentage = document.getElementById("score-percentage");
    scorePercentage.textContent = `${score.percentage}%`;

    // Determine skill level
    let skillLevel = "Beginner";
    if (score.percentage >= 80) {
      skillLevel = "Advanced";
    } else if (score.percentage >= 50) {
      skillLevel = "Intermediate";
    }

    document.getElementById("skill-level").innerHTML = `
            <p>Your skill level: <strong>${skillLevel}</strong></p>
            <p>You answered ${score.correct} out of ${
      this.currentTest.questions.length
    } questions correctly.</p>
            <p>Time taken: ${this.formatTime(this.timeSpent)}</p>
        `;

    // Show loading message for recommendations
    document.getElementById("recommendation-text").innerHTML = `
            <div class="flex justify-center items-center py-6">
                <div class="spinner mr-3"></div>
                <p>Generating personalized recommendations...</p>
            </div>
        `;

    // Generate recommendations
    const recommendations = await API.generateRecommendations({
      category: this.currentTest.category,
      score: score.percentage,
      wrongAnswers,
      userType: this.currentTest.userType,
    });

    // Display recommendations
    document.getElementById("recommendation-text").innerHTML =
      this.formatRecommendations(recommendations);

    // Save the results
    this.saveResults({
      testId: this.currentTest.id,
      category: this.currentTest.category,
      difficulty: this.currentTest.difficulty,
      score: score.percentage,
      timeSpent: this.timeSpent,
      timestamp: new Date().toISOString(),
      skillLevel,
      recommendations,
    });
  },

  /**
   * Calculate test score
   * @returns {Object} - Score information
   */
  calculateScore() {
    let correct = 0;
    let total = this.currentTest.questions.length;

    this.currentTest.questions.forEach((question, i) => {
      if (question.type === "multiple_choice") {
        if (this.answers[i] === question.correct_answer) {
          correct++;
        }
      } else {
        // For text questions, give half credit if they provided a substantial answer
        // This is a simplified approach - in a real system you would use AI to evaluate
        if (this.answers[i] && this.answers[i].length > 50) {
          correct += 0.5;
        }
      }
    });

    const percentage = Math.round((correct / total) * 100);

    return {
      correct,
      total,
      percentage,
    };
  },

  /**
   * Get wrong answers for recommendation generation
   * @returns {Array} - List of wrong answer concepts
   */
  getWrongAnswers() {
    const wrongAnswers = [];

    this.currentTest.questions.forEach((question, i) => {
      if (
        question.type === "multiple_choice" &&
        this.answers[i] !== question.correct_answer
      ) {
        // Extract the concept from the question (simplified)
        const concept = question.question_text.split(" ").slice(0, 3).join(" ");
        wrongAnswers.push(concept);
      }
    });

    return wrongAnswers;
  },

  /**
   * Format recommendations for display
   * @param {Object} recs - Recommendations from API
   * @returns {string} - Formatted HTML
   */
  formatRecommendations(recs) {
    // Create skill level indicator
    const skillLevelPercentage = {
      beginner: 33,
      intermediate: 66,
      advanced: 100,
    };

    const skillLevel = recs.skillLevel.toLowerCase();
    const levelPercentage = skillLevelPercentage[skillLevel] || 50;

    let html = `
      <div class="mb-6">
        <div class="flex justify-between items-center mb-2">
          <h5 class="font-semibold text-gray-800">Skill Proficiency Level:</h5>
          <span class="text-sm font-medium capitalize text-blue-700">${
            recs.skillLevel
          }</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2.5">
          <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${levelPercentage}%"></div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="bg-green-50 p-4 rounded-lg border border-green-100">
          <h5 class="font-semibold text-green-800 flex items-center mb-3">
            <i class="fa-solid fa-circle-check mr-2"></i>
            Strengths
          </h5>
          <ul class="list-disc pl-5 space-y-1.5 text-green-800">
            ${recs.strengths.map((s) => `<li>${s}</li>`).join("")}
          </ul>
        </div>
        
        <div class="bg-amber-50 p-4 rounded-lg border border-amber-100">
          <h5 class="font-semibold text-amber-800 flex items-center mb-3">
            <i class="fa-solid fa-triangle-exclamation mr-2"></i>
            Areas for Improvement
          </h5>
          <ul class="list-disc pl-5 space-y-1.5 text-amber-800">
            ${recs.weaknesses.map((w) => `<li>${w}</li>`).join("")}
          </ul>
        </div>
      </div>
      
      <div class="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
        <h5 class="font-semibold text-blue-800 flex items-center mb-3">
          <i class="fa-solid fa-lightbulb mr-2"></i>
          Professional Development Plan
        </h5>
        <ol class="list-decimal pl-5 space-y-2 text-blue-800">
          ${recs.recommendations
            .map((r) => `<li class="pb-2">${r}</li>`)
            .join("")}
        </ol>
      </div>
      
      <div class="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
        <h5 class="font-semibold text-indigo-800 flex items-center mb-3">
          <i class="fa-solid fa-book mr-2"></i>
          Recommended Resources
        </h5>
        <div class="space-y-3">
          ${recs.resources
            .map(
              (r) => `
            <div class="resource-item border-l-4 border-indigo-300 pl-3 py-1">
              <h6 class="font-medium text-indigo-900">${r.title}</h6>
              <div class="flex items-center text-xs text-indigo-600 mb-1">
                <span class="bg-indigo-100 rounded px-2 py-0.5">${r.type}</span>
              </div>
              <p class="text-indigo-800 text-sm">${r.description}</p>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;

    return html;
  },

  /**
   * Save test results
   * @param {Object} results - Test results
   */
  saveResults(results) {
    // Get existing results or initialize
    const allResults = JSON.parse(localStorage.getItem("testResults")) || [];

    // Add new results
    allResults.push(results);

    // Save back to storage
    localStorage.setItem("testResults", JSON.stringify(allResults));
  },

  /**
   * Handle view dashboard button click
   */
  handleViewDashboard() {
    // Switch to dashboard tab
    const dashboardTab = document.querySelector('[data-tab="dashboard"]');
    if (dashboardTab) {
      dashboardTab.click();
    }
  },
};
