/**
 * Chatbot Module
 * Handles chatbot functionality for skill evaluation and suggestions
 */

const Chatbot = {
  // API key for Gemini
  API_KEY: "AIzaSyDogSG1mB8D1d8ECSO71j5GhG4gBAd_hgc",

  // DOM elements
  elements: {
    container: null,
    toggle: null,
    box: null,
    messages: null,
    inputField: null,
    sendButton: null,
    closeButton: null,
  },

  // Store chat history
  chatHistory: [],

  /**
   * Initialize the chatbot functionality
   */
  init() {
    // Get DOM elements
    this.elements.container = document.getElementById("chatbot-container");
    this.elements.toggle = document.getElementById("chatbot-toggle");
    this.elements.box = document.getElementById("chatbot-box");
    this.elements.messages = document.getElementById("chatbot-messages");
    this.elements.inputField = document.getElementById("chatbot-input-field");
    this.elements.sendButton = document.getElementById("chatbot-send-btn");
    this.elements.closeButton = document.getElementById("close-chatbot");

    // Add event listeners
    this.elements.toggle.addEventListener(
      "click",
      this.toggleChatbot.bind(this)
    );
    this.elements.closeButton.addEventListener(
      "click",
      this.toggleChatbot.bind(this)
    );
    this.elements.sendButton.addEventListener(
      "click",
      this.sendMessage.bind(this)
    );
    this.elements.inputField.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        this.sendMessage();
      }
    });

    // Load chat history from localStorage if available
    this.loadChatHistory();
  },

  /**
   * Toggle chatbot visibility
   */
  toggleChatbot() {
    this.elements.box.classList.toggle("active");

    // If opening the chatbot, focus the input field
    if (this.elements.box.classList.contains("active")) {
      setTimeout(() => {
        this.elements.inputField.focus();
      }, 300);
    }
  },

  /**
   * Send a message from the user to the chatbot
   */
  sendMessage() {
    const userInput = this.elements.inputField.value.trim();

    // Don't send empty messages
    if (!userInput) return;

    // Add user message to chat
    this.addMessage(userInput, "user");

    // Clear input field
    this.elements.inputField.value = "";

    // Show typing indicator
    this.showTypingIndicator();

    // Process the user message and get a response
    this.getResponse(userInput);
  },

  /**
   * Add a message to the chat
   * @param {string} text - Message text
   * @param {string} sender - Message sender ('user' or 'bot')
   */
  addMessage(text, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}-message`;

    const messageText = document.createElement("p");
    messageText.textContent = text;

    messageDiv.appendChild(messageText);
    this.elements.messages.appendChild(messageDiv);

    // Save to chat history
    this.chatHistory.push({ text, sender });
    this.saveChatHistory();

    // Scroll to the bottom
    this.scrollToBottom();
  },

  /**
   * Show typing indicator while waiting for response
   */
  showTypingIndicator() {
    const typingDiv = document.createElement("div");
    typingDiv.className = "chatbot-typing";
    typingDiv.id = "typing-indicator";

    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("span");
      dot.className = "typing-dot";
      typingDiv.appendChild(dot);
    }

    this.elements.messages.appendChild(typingDiv);
    this.scrollToBottom();
  },

  /**
   * Remove typing indicator
   */
  removeTypingIndicator() {
    const typingIndicator = document.getElementById("typing-indicator");
    if (typingIndicator) {
      typingIndicator.remove();
    }
  },

  /**
   * Get response from the AI
   * @param {string} userInput - User's message
   */
  async getResponse(userInput) {
    try {
      const prompt = `As an expert skill evaluator, please provide helpful advice on: "${userInput}"
      
      Focus on concrete, actionable feedback and improvement suggestions. If the question isn't related to skill assessment or learning, politely redirect to that topic.
      
      Your response should be:
      1. Concise (max 1 paragraphs, divide into 2-3 key points)
      2. Specific with practical tips
      3. Encouraging but honest
      4. Educational with 1-2 resources if relevant
      
      Respond in a conversational tone.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      // Remove typing indicator
      this.removeTypingIndicator();

      // Get the response text
      let responseText =
        "I apologize, but I couldn't generate a response at this time.";

      if (data.candidates && data.candidates[0].content.parts[0].text) {
        responseText = data.candidates[0].content.parts[0].text;
      }

      // Add bot response to chat
      this.addMessage(responseText, "bot");
    } catch (error) {
      console.error("Error getting response:", error);

      // Remove typing indicator
      this.removeTypingIndicator();

      // Add error message
      this.addMessage(
        "Sorry, I encountered an error processing your request. Please try again later.",
        "bot"
      );
    }
  },

  /**
   * Scroll chat to the bottom
   */
  scrollToBottom() {
    this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
  },

  /**
   * Save chat history to localStorage
   */
  saveChatHistory() {
    localStorage.setItem("chatbotHistory", JSON.stringify(this.chatHistory));
  },

  /**
   * Load chat history from localStorage
   */
  loadChatHistory() {
    const savedHistory = localStorage.getItem("chatbotHistory");

    if (savedHistory) {
      try {
        this.chatHistory = JSON.parse(savedHistory);

        // Display up to last 10 messages for better performance
        const recentMessages = this.chatHistory.slice(-10);

        // Clear default greeting if loading history
        this.elements.messages.innerHTML = "";

        // Add messages to chat
        recentMessages.forEach((message) => {
          this.addMessage(message.text, message.sender);
        });
      } catch (error) {
        console.error("Error loading chat history:", error);
        // If error, keep the default greeting
      }
    }
  },
};

// Initialize chatbot when document is ready
document.addEventListener("DOMContentLoaded", () => {
  Chatbot.init();
});
