/**
 * Dashboard Module
 * Handles visualization of test results and progress
 */

const Dashboard = {
  // Store loaded results
  results: [],

  /**
   * Initialize dashboard functionality
   */
  init() {
    // Load results from storage
    this.loadResults();

    // Setup dashboard if on dashboard tab
    if (document.getElementById("dashboard").classList.contains("active")) {
      this.renderDashboard();
    }
  },

  /**
   * Load test results from storage
   */
  loadResults() {
    this.results = JSON.parse(localStorage.getItem("testResults")) || [];

    // Sort by timestamp (newest first)
    this.results.sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  },

  /**
   * Render the dashboard with test results
   */
  renderDashboard() {
    this.renderRecentTests();
    this.renderSkillsChart();
    this.renderProgressChart();
    this.renderRecommendations();
  },

  /**
   * Render the recent tests table
   */
  renderRecentTests() {
    const tableBody = document.getElementById("tests-table");

    if (this.results.length === 0) {
      tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-4 text-center text-gray-500">No test history available</td>
                </tr>
            `;
      return;
    }

    let html = "";

    this.results.slice(0, 5).forEach((result) => {
      const date = new Date(result.timestamp).toLocaleDateString();
      const category = this.formatCategory(result.category);
      const difficulty = this.formatDifficulty(result.difficulty);

      html += `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4">${date}</td>
                    <td class="px-6 py-4">${category}</td>
                    <td class="px-6 py-4">${difficulty}</td>
                    <td class="px-6 py-4">${result.score}%</td>
                    <td class="px-6 py-4">
                        <button class="view-result-btn text-blue-600 hover:underline" data-id="${result.testId}">
                            View Details
                        </button>
                    </td>
                </tr>
            `;
    });

    tableBody.innerHTML = html;

    // Add event listeners to view buttons
    const viewButtons = tableBody.querySelectorAll(".view-result-btn");
    viewButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        this.viewResultDetails(btn.dataset.id);
      });
    });
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
   * Render skills chart
   * This is a placeholder that would normally use a charting library
   */
  renderSkillsChart() {
    const chartContainer = document.getElementById("skills-chart");

    if (this.results.length === 0) {
      chartContainer.innerHTML = `
                <p class="text-center text-gray-500 py-16">Complete tests to see your skills chart</p>
            `;
      return;
    }

    // Group results by category
    const categories = {};
    this.results.forEach((result) => {
      if (!categories[result.category]) {
        categories[result.category] = [];
      }
      categories[result.category].push(result.score);
    });

    // Calculate average score per category
    const avgScores = {};
    for (const category in categories) {
      const scores = categories[category];
      avgScores[category] =
        scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }

    // Create a simple bar chart
    let html = `<div class="py-4">`;

    for (const category in avgScores) {
      const score = Math.round(avgScores[category]);
      html += `
                <div class="mb-4">
                    <div class="flex justify-between items-center mb-1">
                        <div>${this.formatCategory(category)}</div>
                        <div>${score}%</div>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2.5">
                        <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${score}%"></div>
                    </div>
                </div>
            `;
    }

    html += `</div>`;
    chartContainer.innerHTML = html;
  },

  /**
   * Render progress chart
   * This is a placeholder that would normally use a charting library
   */
  renderProgressChart() {
    const chartContainer = document.getElementById("progress-chart");

    if (this.results.length < 2) {
      chartContainer.innerHTML = `
                <p class="text-center text-gray-500 py-16">Complete more tests to see your progress</p>
            `;
      return;
    }

    // Sort by timestamp (oldest first)
    const sortedResults = [...this.results].sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });

    // Create a simple line graph visual
    let html = `
            <div class="relative h-full py-4">
                <div class="flex justify-between text-xs text-gray-500 mb-1">
        `;

    // X-axis labels (dates)
    sortedResults.slice(0, 5).forEach((result) => {
      const date = new Date(result.timestamp).toLocaleDateString();
      html += `<div>${date}</div>`;
    });

    html += `
                </div>
                <div class="relative h-32 mt-2">
        `;

    // Connect the points with lines
    const pointsArray = [];
    sortedResults.slice(0, 5).forEach((result, index) => {
      const x = Math.round((index / 4) * 100); // 4 is max number of segments for 5 points
      const y = Math.round(100 - result.score);
      pointsArray.push(x + "," + y);
    });

    html += `
                    <svg class="absolute inset-0 w-full h-full">
                        <polyline 
                            points="${pointsArray.join(' ')}" 
                            fill="none" 
                            stroke="#2563eb" 
                            stroke-width="2" 
                        />
        `;

    // Add points
    sortedResults.slice(0, 5).forEach((result, index) => {
      const x = Math.round((index / 4) * 100);
      const y = Math.round(100 - result.score);

      html += `
                        <circle 
                            cx="${x}%" 
                            cy="${y}%" 
                            r="4" 
                            fill="#2563eb" 
                        />
            `;
    });

    html += `
                    </svg>
                </div>
                <div class="mt-2 text-xs text-gray-500">Score percentages over time</div>
            </div>
        `;

    chartContainer.innerHTML = html;
  },

  /**
   * Render the latest recommendations
   */
  renderRecommendations() {
    const recommendationsDiv = document.getElementById("ai-recommendations");

    if (this.results.length === 0) {
      recommendationsDiv.innerHTML = `
                <p class="text-gray-500">Complete more tests to receive personalized recommendations</p>
            `;
      return;
    }

    // Get the latest result with recommendations
    const latestResult = this.results.find((r) => r.recommendations);

    if (!latestResult || !latestResult.recommendations) {
      recommendationsDiv.innerHTML = `
                <p class="text-gray-500">No recommendations available yet</p>
            `;
      return;
    }

    const recs = latestResult.recommendations;

    let html = `
            <div>
                <p class="mb-2">Based on your ${this.formatCategory(
                  latestResult.category
                )} assessment:</p>
                
                <div class="mb-3">
                    <h5 class="font-semibold">Recommendations:</h5>
                    <ul class="list-disc pl-5">
                        ${recs.recommendations
                          .slice(0, 3)
                          .map((r) => `<li>${r}</li>`)
                          .join("")}
                    </ul>
                </div>
                
                <div>
                    <h5 class="font-semibold">Suggested Resources:</h5>
                    <ul class="list-disc pl-5">
                        ${recs.resources
                          .slice(0, 2)
                          .map(
                            (r) =>
                              `<li><strong>${r.title}</strong>: ${r.description}</li>`
                          )
                          .join("")}
                    </ul>
                </div>
            </div>
        `;

    recommendationsDiv.innerHTML = html;
  },

  /**
   * View detailed results for a specific test
   * @param {string} testId - ID of the test to view
   */
  viewResultDetails(testId) {
    const result = this.results.find((r) => r.testId === testId);

    if (!result) {
      return;
    }

    // Create modal overlay
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50";

    // Create modal content
    modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
                <div class="p-6 border-b">
                    <div class="flex justify-between items-center">
                        <h3 class="text-xl font-semibold">Test Result Details</h3>
                        <button class="close-modal text-gray-400 hover:text-gray-500">
                            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="p-6">
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <p class="text-sm text-gray-500">Category</p>
                            <p class="font-medium">${this.formatCategory(
                              result.category
                            )}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Difficulty</p>
                            <p class="font-medium">${this.formatDifficulty(
                              result.difficulty
                            )}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Score</p>
                            <p class="font-medium">${result.score}%</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Date</p>
                            <p class="font-medium">${new Date(
                              result.timestamp
                            ).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Time Spent</p>
                            <p class="font-medium">${Math.floor(
                              result.timeSpent / 60
                            )}m ${result.timeSpent % 60}s</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Skill Level</p>
                            <p class="font-medium">${result.skillLevel || 'N/A'}</p>
                        </div>
                    </div>
                    
                    ${
                      result.recommendations
                        ? `
                    <div class="mb-6">
                        <h4 class="font-semibold mb-2">Recommendations</h4>
                        <div class="p-4 bg-gray-50 rounded">
                            <div class="mb-3">
                                <h5 class="font-medium">Strengths:</h5>
                                <ul class="list-disc pl-5">
                                    ${result.recommendations.strengths
                                      .map((s) => `<li>${s}</li>`)
                                      .join("")}
                                </ul>
                            </div>
                            
                            <div class="mb-3">
                                <h5 class="font-medium">Areas for Improvement:</h5>
                                <ul class="list-disc pl-5">
                                    ${result.recommendations.weaknesses
                                      .map((w) => `<li>${w}</li>`)
                                      .join("")}
                                </ul>
                            </div>
                            
                            <div>
                                <h5 class="font-medium">Suggested Resources:</h5>
                                <ul class="list-disc pl-5">
                                    ${result.recommendations.resources
                                      .map(
                                        (r) =>
                                          `<li><strong>${r.title}</strong>: ${r.description}</li>`
                                      )
                                      .join("")}
                                </ul>
                            </div>
                        </div>
                    </div>
                    `
                        : ""
                    }
                    
                    <div class="flex justify-end">
                        <button class="close-modal bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;

    // Add to body
    document.body.appendChild(modal);

    // Add close handlers
    modal.querySelectorAll(".close-modal").forEach((btn) => {
      btn.addEventListener("click", () => {
        modal.remove();
      });
    });
  }
};

// Initialize dashboard when document is ready
document.addEventListener("DOMContentLoaded", () => {
  Dashboard.init();
});
