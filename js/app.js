/**
 * Main Application Module
 * Handles initialization and tab navigation
 */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize all modules
  initModules();

  // Set up tab navigation
  setupTabNavigation();

  // Set up start buttons on home page
  setupStartButtons();
});

/**
 * Initialize all application modules
 */
function initModules() {
  // Initialize test generator
  if (typeof TestGenerator !== "undefined") {
    TestGenerator.init();
  }

  // Initialize test taker
  if (typeof TestTaker !== "undefined") {
    TestTaker.init();
  }

  // Initialize dashboard
  if (typeof Dashboard !== "undefined") {
    Dashboard.init();
  }
}

/**
 * Set up tab navigation
 */
function setupTabNavigation() {
  const tabButtons = document.querySelectorAll(".tab-btn");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Get the tab to show
      const tabId = button.getAttribute("data-tab");

      // Hide all tabs and remove active class from buttons
      document.querySelectorAll(".tab-content").forEach((tab) => {
        tab.classList.add("hidden");
        tab.classList.remove("active");
      });

      document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.classList.remove("active");
      });

      // Show the selected tab and mark button as active
      document.getElementById(tabId).classList.remove("hidden");
      document.getElementById(tabId).classList.add("active");
      button.classList.add("active");

      // Special handling for dashboard tab
      if (tabId === "dashboard" && typeof Dashboard !== "undefined") {
        Dashboard.renderDashboard();
      }
    });
  });
}

/**
 * Set up start buttons on home page
 */
function setupStartButtons() {
  const startButtons = document.querySelectorAll(".start-btn");

  startButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabId = button.getAttribute("data-tab");
      const tabButton = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);

      if (tabButton) {
        tabButton.click();
      }
    });
  });
}

/**
 * Helper function to format a date
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
  if (typeof date === "string") {
    date = new Date(date);
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Helper function to show a notification
 * @param {string} message - The message to show
 * @param {string} type - The type of message (success, error)
 */
function showNotification(message, type = "success") {
  // Create notification element
  const notification = document.createElement("div");
  notification.className =
    type === "success"
      ? "fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded"
      : "fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded";

  notification.innerHTML = `
        <span class="block sm:inline">${message}</span>
        <button class="absolute top-0 right-0 px-4 py-3">
            <svg class="fill-current h-6 w-6" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
        </button>
    `;

  // Add to body
  document.body.appendChild(notification);

  // Add close button event
  notification.querySelector("button").addEventListener("click", () => {
    notification.remove();
  });

  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.remove();
  }, 5000);
}
