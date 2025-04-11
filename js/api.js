/**
 * API module for interacting with the Google Gemini API
 */

const API = {
  // Replace with your API key
  API_KEY: "AIzaSyDC1gOde8dXDuQD-B2OKgCesr2uoDVl4tk",
  API_URL:
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",

  /**
   * Makes a request to the Gemini API
   * @param {string} prompt - The prompt to send to the API
   * @returns {Promise<Object>} - The API response
   */
  async makeRequest(prompt) {
    try {
      const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
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
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error making API request:", error);
      return null;
    }
  },

  /**
   * Generates test questions based on given parameters
   * @param {Object} params - Test parameters
   * @returns {Promise<Array>} - Array of generated questions
   */
  async generateTest(params) {
    const { userType, category, difficulty, questionCount } = params;

    const prompt = `Generate a JSON array containing ${questionCount} ${difficulty} level ${category} questions for a ${userType}. 
        
        For multiple choice questions, include 4 options with exactly one correct answer marked.
        For reading questions, include a passage followed by questions.
        For writing questions, include instructions and evaluation criteria.
        
        Format your output as valid JSON.
        Each question should have: id, type (multiple_choice, text_input, or reading), question_text, options (for multiple choice), 
        correct_answer (for multiple choice), passage (for reading), and criteria (for writing).

        Output ONLY valid JSON with no additional text or explanation.`;

    const response = await this.makeRequest(prompt);

    if (!response || !response.candidates || !response.candidates[0]) {
      return this.getDefaultQuestions(category);
    }

    try {
      // Extract the JSON string from the response
      const jsonText = response.candidates[0].content.parts[0].text;
      // Parse JSON, remove any markdown code blocks if present
      const cleanJson = jsonText.replace(/```json|```/g, "").trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error("Error parsing question JSON:", error);
      return this.getDefaultQuestions(category);
    }
  },

  /**
   * Generates recommendations based on test results
   * @param {Object} results - Test results and user performance
   * @returns {Promise<Object>} - Personalized recommendations
   */
  async generateRecommendations(results) {
    const { category, score, wrongAnswers, userType } = results;

    const prompt = `Based on a ${userType}'s performance on a ${category} test with a score of ${score}%, 
        generate personalized recommendations for improvement. They struggled with the following concepts: 
        ${wrongAnswers.join(", ")}.
        
        Format your response as JSON with the following structure:
        {
          "skillLevel": "beginner/intermediate/advanced",
          "strengths": ["strength1", "strength2"],
          "weaknesses": ["weakness1", "weakness2"],
          "recommendations": ["specific recommendation 1", "specific recommendation 2", "specific recommendation 3"],
          "resources": [
            {"title": "Resource Name 1", "type": "book/website/course", "description": "Brief description"},
            {"title": "Resource Name 2", "type": "book/website/course", "description": "Brief description"}
          ]
        }
        
        Output ONLY valid JSON with no additional text or explanation.`;

    const response = await this.makeRequest(prompt);

    if (!response || !response.candidates || !response.candidates[0]) {
      return this.getDefaultRecommendations();
    }

    try {
      // Extract the JSON string from the response
      const jsonText = response.candidates[0].content.parts[0].text;
      // Parse JSON, remove any markdown code blocks if present
      const cleanJson = jsonText.replace(/```json|```/g, "").trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error("Error parsing recommendations JSON:", error);
      return this.getDefaultRecommendations();
    }
  },

  /**
   * Provides fallback questions in case API fails
   * @param {string} category - The category of questions
   * @returns {Array} - Default questions
   */
  getDefaultQuestions(category) {
    // Simple fallback questions
    return [
      {
        id: 1,
        type: "multiple_choice",
        question_text:
          "What is the primary benefit of using AI for skill assessment?",
        options: [
          "Cost reduction",
          "Personalized learning paths",
          "Entertainment value",
          "Reducing human involvement",
        ],
        correct_answer: "Personalized learning paths",
      },
      {
        id: 2,
        type: "multiple_choice",
        question_text:
          "Which of these is NOT a common category in skill assessment?",
        options: [
          "Aptitude testing",
          "Reading comprehension",
          "Gaming ability",
          "Personality assessment",
        ],
        correct_answer: "Gaming ability",
      },
      {
        id: 3,
        type: "text_input",
        question_text:
          "Describe how you would approach learning a new skill. What steps would you take?",
        criteria: "Clarity of thought, logical progression, realistic approach",
      },
    ];
  },

  /**
   * Provides fallback recommendations in case API fails
   * @returns {Object} - Default recommendations
   */
  getDefaultRecommendations() {
    return {
      skillLevel: "intermediate",
      strengths: ["Concept understanding", "Basic application"],
      weaknesses: ["Advanced application", "Critical thinking"],
      recommendations: [
        "Focus on practical applications of concepts",
        "Increase complexity of practice gradually",
        "Seek feedback from peers or mentors",
      ],
      resources: [
        {
          title: "Online Learning Platform",
          type: "website",
          description: "Interactive courses with practical exercises",
        },
        {
          title: "Practice Workbook",
          type: "book",
          description: "Contains progressively challenging exercises",
        },
      ],
    };
  },
};
