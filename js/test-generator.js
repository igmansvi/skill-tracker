/**
 * Test Generator Module
 * Handles creation of tests based on user selections
 */

const TestGenerator = {
  // Store the currently generated test
  currentTest: null,

  /**
   * Initialize test generator functionality
   */
  init() {
    const generateForm = document.getElementById("generate-form");
    const takeGeneratedTestBtn = document.getElementById("take-generated-test");

    if (generateForm) {
      generateForm.addEventListener(
        "submit",
        this.handleGenerateForm.bind(this)
      );
    }

    if (takeGeneratedTestBtn) {
      takeGeneratedTestBtn.addEventListener(
        "click",
        this.handleTakeGeneratedTest.bind(this)
      );
    }
  },

  /**
   * Handle form submission to generate a test
   * @param {Event} event - Form submit event
   */
  async handleGenerateForm(event) {
    event.preventDefault();

    const userType = document.getElementById("user-type").value;
    const category = document.getElementById("test-category").value;
    const difficulty = document.getElementById("difficulty").value;
    const questionCount = parseInt(
      document.getElementById("question-count").value
    );

    // Show loading state
    const submitBtn = event.submitter;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Generating...";
    submitBtn.disabled = true;

    // Generate test via API
    const questions = await API.generateTest({
      userType,
      category,
      difficulty,
      questionCount,
    });

    // Reset button state
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;

    // Store the current test
    this.currentTest = {
      id: this.generateTestId(),
      timestamp: new Date().toISOString(),
      userType,
      category,
      difficulty,
      questionCount,
      questions,
    };

    // Save to local storage
    this.saveTestToStorage(this.currentTest);

    // Display test details
    this.displayTestDetails(this.currentTest);
  },

  /**
   * Generate a unique test ID
   * @returns {string} - Unique ID
   */
  generateTestId() {
    return "test_" + Date.now();
  },

  /**
   * Save a generated test to local storage
   * @param {Object} test - The test to save
   */
  saveTestToStorage(test) {
    // Get existing tests or initialize empty array
    const tests = JSON.parse(localStorage.getItem("savedTests")) || [];

    // Add new test
    tests.push(test);

    // Save back to storage
    localStorage.setItem("savedTests", JSON.stringify(tests));

    // Save current test ID
    localStorage.setItem("currentTestId", test.id);
  },

  /**
   * Display test details after generation
   * @param {Object} test - The test to display
   */
  displayTestDetails(test) {
    const resultDiv = document.getElementById("generation-result");
    const detailsDiv = document.getElementById("test-details");

    detailsDiv.innerHTML = `
            <p><strong>Category:</strong> ${this.formatCategory(
              test.category
            )}</p>
            <p><strong>Difficulty:</strong> ${this.formatDifficulty(
              test.difficulty
            )}</p>
            <p><strong>Questions:</strong> ${test.questionCount}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        `;

    resultDiv.classList.remove("hidden");
  },

  /**
   * Format category names for display
   * @param {string} category - Category ID
   * @returns {string} - Formatted category name
   */
  formatCategory(category) {
    const categories = {
      aptitude: "Aptitude",
      reading: "Reading Skills",
      writing: "Writing Skills",
      personality: "Personality Assessment",
    };

    return categories[category] || category;
  },

  /**
   * Format difficulty levels for display
   * @param {string} difficulty - Difficulty ID
   * @returns {string} - Formatted difficulty name
   */
  formatDifficulty(difficulty) {
    const difficulties = {
      easy: "Easy",
      medium: "Medium",
      hard: "Hard",
    };

    return difficulties[difficulty] || difficulty;
  },

  /**
   * Handle clicking the "Take This Test" button
   */
  handleTakeGeneratedTest() {
    if (this.currentTest) {
      // Switch to the take test tab
      const takeTab = document.querySelector('[data-tab="take"]');
      if (takeTab) {
        takeTab.click();
      }

      // Start the test
      TestTaker.loadAndStartTest(this.currentTest.id);
    }
  },

  /**
   * Get a test by ID
   * @param {string} testId - The ID of the test to retrieve
   * @returns {Object|null} - The test object or null if not found
   */
  getTestById(testId) {
    const tests = JSON.parse(localStorage.getItem("savedTests")) || [];
    return tests.find((test) => test.id === testId) || null;
  },
};
