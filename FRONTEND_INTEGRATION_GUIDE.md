# IELTS Writing Submission & Analysis - Frontend Integration Guide

This guide provides comprehensive instructions for frontend developers on how to integrate with the IELTS writing submission and AI analysis system.

## Table of Contents

1. [Authentication](#authentication)
2. [Writing Submission Flow](#writing-submission-flow)
3. [AI Analysis Integration](#ai-analysis-integration)
4. [Retrieving Results](#retrieving-results)
5. [Error Handling](#error-handling)
6. [UI/UX Recommendations](#uiux-recommendations)
7. [Code Examples](#code-examples)

## Authentication

### 1. User Registration

```javascript
// Register a new user
const registerUser = async (userData) => {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: "password123",
    }),
  });

  const result = await response.json();
  if (response.ok) {
    // Store the access token
    localStorage.setItem("accessToken", result.data.accessToken);
    localStorage.setItem("user", JSON.stringify(result.data.user));
  }
  return result;
};
```

### 2. User Login

```javascript
// Login existing user
const loginUser = async (credentials) => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "john@example.com",
      password: "password123",
    }),
  });

  const result = await response.json();
  if (response.ok) {
    localStorage.setItem("accessToken", result.data.accessToken);
    localStorage.setItem("user", JSON.stringify(result.data.user));
  }
  return result;
};
```

### 3. Token Management

```javascript
// Get stored token
const getAuthToken = () => {
  return localStorage.getItem("accessToken");
};

// Check if user is authenticated
const isAuthenticated = () => {
  const token = getAuthToken();
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};
```

## Writing Submission Flow

### 1. Create Writing Submission

```javascript
const submitWriting = async (submissionData) => {
  const token = getAuthToken();

  const response = await fetch("/api/ielts-writing-submission", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      body: submissionData.essayText,
      topic: "CUSTOM", // or 'GENERATED'
      customWritingQuestion: submissionData.question,
      targetScore: "BAND_SEVEN", // or 'BAND_EIGHT', 'BAND_NINE'
    }),
  });

  const result = await response.json();
  return result;
};
```

### 2. Submission Data Structure

```javascript
const submissionData = {
  essayText: `Technology has revolutionized the way we live and work. 
              In my opinion, the benefits of technology far outweigh the drawbacks...`,
  question:
    "Some people believe that technology has more benefits than drawbacks. Do you agree or disagree?",
  targetScore: "BAND_SEVEN",
};
```

### 3. Response Structure

```javascript
// Successful submission response
{
  "message": "IELTS writing submission created successfully",
  "data": {
    "_id": "68beee3ea02d9604a4cadce0",
    "user": "68bee8bc518e476552373a9f",
    "customWritingQuestion": "Some people believe that technology has more benefits than drawbacks...",
    "body": "Technology has revolutionized the way we live and work...",
    "status": "IDLE",
    "topic": "CUSTOM",
    "targetScore": "BAND_SEVEN",
    "createdAt": "2025-09-08T14:54:54.612Z",
    "updatedAt": "2025-09-08T14:54:54.612Z"
  }
}
```

## AI Analysis Integration

### 1. Trigger AI Analysis

```javascript
const analyzeWriting = async (submissionId) => {
  const token = getAuthToken();

  const response = await fetch(`/api/ielts-ai/analyze/${submissionId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();
  return result;
};
```

### 2. Analysis Status Tracking

```javascript
const checkAnalysisStatus = async (submissionId) => {
  const token = getAuthToken();

  const response = await fetch(
    `/api/ielts-writing-submission/${submissionId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result = await response.json();
  return result.data.status; // 'IDLE', 'IN_PROGRESS', 'ANALYZED', 'FAILED_TO_CHECK'
};
```

### 3. Polling for Results

```javascript
const pollForResults = async (submissionId, maxAttempts = 30) => {
  let attempts = 0;

  const poll = async () => {
    const status = await checkAnalysisStatus(submissionId);

    if (status === "ANALYZED") {
      return await getSubmissionResults(submissionId);
    } else if (status === "FAILED_TO_CHECK") {
      throw new Error("Analysis failed");
    } else if (attempts >= maxAttempts) {
      throw new Error("Analysis timeout");
    }

    attempts++;
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
    return poll();
  };

  return poll();
};
```

## Retrieving Results

### 1. Get Submission Results

```javascript
const getSubmissionResults = async (submissionId) => {
  const token = getAuthToken();

  const response = await fetch(
    `/api/ielts-writing-submission/${submissionId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result = await response.json();
  return result.data;
};
```

### 2. Get User's Submissions

```javascript
const getUserSubmissions = async () => {
  const token = getAuthToken();

  const response = await fetch("/api/ielts-writing-submission/my-submissions", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();
  return result.data;
};
```

### 3. Results Data Structure

```javascript
// Complete analysis results
{
  "_id": "68beee3ea02d9604a4cadce0",
  "user": {
    "_id": "68bee8bc518e476552373a9f",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN"
  },
  "customWritingQuestion": "Some people believe that technology has more benefits than drawbacks...",
  "body": "Technology has revolutionized the way we live and work...",
  "status": "ANALYZED",
  "topic": "CUSTOM",
  "targetScore": "BAND_SEVEN",
  "score": 6.5,
  "criteriaScores": {
    "taskResponse": 6,
    "coherence": 7,
    "lexical": 6,
    "grammar": 7
  },
  "aiFeedback": {
    "mistakes": [
      "Some grammatical errors in complex sentences",
      "Limited vocabulary variety in some areas"
    ],
    "suggestions": [
      "Use more varied sentence structures",
      "Include more sophisticated vocabulary",
      "Improve paragraph organization"
    ],
    "improvedVersions": {
      "band7": {
        "introduction": "This is a sample introduction paragraph...",
        "body": [
          "This is the first body paragraph...",
          "This is the second body paragraph..."
        ],
        "conclusion": "This is a sample conclusion paragraph...",
        "criteriaResponse": {
          "taskResponse": "This version fully addresses the question...",
          "coherence": "The essay flows logically...",
          "lexical": "Uses appropriate vocabulary...",
          "grammar": "Demonstrates good control of grammar..."
        }
      },
      "band8": { /* Similar structure */ },
      "band9": { /* Similar structure */ }
    }
  }
}
```

## Error Handling

### 1. HTTP Status Codes

```javascript
const handleApiResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();

    switch (response.status) {
      case 401:
        // Unauthorized - redirect to login
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
        break;
      case 403:
        // Forbidden - insufficient permissions
        throw new Error("You do not have permission to perform this action");
      case 404:
        // Not found
        throw new Error("Resource not found");
      case 500:
        // Server error
        throw new Error("Server error. Please try again later.");
      default:
        throw new Error(error.message || "An error occurred");
    }
  }

  return response.json();
};
```

### 2. Analysis Error Handling

```javascript
const handleAnalysisErrors = (error) => {
  if (error.message.includes("timeout")) {
    return "Analysis is taking longer than expected. Please try again later.";
  } else if (error.message.includes("failed")) {
    return "Analysis failed. Please check your essay and try again.";
  } else {
    return "An error occurred during analysis. Please try again.";
  }
};
```

## UI/UX Recommendations

### 1. Submission Form

```jsx
const WritingSubmissionForm = () => {
  const [essayText, setEssayText] = useState("");
  const [question, setQuestion] = useState("");
  const [targetScore, setTargetScore] = useState("BAND_SEVEN");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await submitWriting({
        essayText,
        question,
        targetScore,
      });

      // Redirect to analysis page
      window.location.href = `/analysis/${result.data._id}`;
    } catch (error) {
      alert("Submission failed: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Writing Question:</label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter your IELTS writing question..."
          required
        />
      </div>

      <div>
        <label>Your Essay:</label>
        <textarea
          value={essayText}
          onChange={(e) => setEssayText(e.target.value)}
          placeholder="Write your essay here..."
          rows={15}
          required
        />
      </div>

      <div>
        <label>Target Score:</label>
        <select
          value={targetScore}
          onChange={(e) => setTargetScore(e.target.value)}
        >
          <option value="BAND_SEVEN">Band 7</option>
          <option value="BAND_EIGHT">Band 8</option>
          <option value="BAND_NINE">Band 9</option>
        </select>
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit Essay"}
      </button>
    </form>
  );
};
```

### 2. Analysis Progress

```jsx
const AnalysisProgress = ({ submissionId }) => {
  const [status, setStatus] = useState("IDLE");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const pollStatus = async () => {
      try {
        const currentStatus = await checkAnalysisStatus(submissionId);
        setStatus(currentStatus);

        if (currentStatus === "IN_PROGRESS") {
          setProgress((prev) => Math.min(prev + 10, 90));
        } else if (currentStatus === "ANALYZED") {
          setProgress(100);
          // Redirect to results
          window.location.href = `/results/${submissionId}`;
        }
      } catch (error) {
        console.error("Status check failed:", error);
      }
    };

    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [submissionId]);

  return (
    <div className="analysis-progress">
      <h3>Analyzing Your Essay...</h3>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <p>Status: {status}</p>
    </div>
  );
};
```

### 3. Results Display

```jsx
const ResultsDisplay = ({ submissionId }) => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await getSubmissionResults(submissionId);
        setResults(data);
      } catch (error) {
        console.error("Failed to fetch results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [submissionId]);

  if (loading) return <div>Loading results...</div>;
  if (!results) return <div>Failed to load results</div>;

  return (
    <div className="results-container">
      <div className="score-overview">
        <h2>Overall Score: {results.score}/9</h2>
        <div className="criteria-scores">
          <div>Task Response: {results.criteriaScores.taskResponse}/9</div>
          <div>Coherence: {results.criteriaScores.coherence}/9</div>
          <div>Lexical Resource: {results.criteriaScores.lexical}/9</div>
          <div>Grammar: {results.criteriaScores.grammar}/9</div>
        </div>
      </div>

      <div className="feedback-section">
        <h3>Mistakes Found:</h3>
        <ul>
          {results.aiFeedback.mistakes.map((mistake, index) => (
            <li key={index}>{mistake}</li>
          ))}
        </ul>

        <h3>Suggestions:</h3>
        <ul>
          {results.aiFeedback.suggestions.map((suggestion, index) => (
            <li key={index}>{suggestion}</li>
          ))}
        </ul>
      </div>

      <div className="improved-versions">
        <h3>Improved Versions:</h3>
        {Object.entries(results.aiFeedback.improvedVersions).map(
          ([band, version]) => (
            <div key={band} className="version-section">
              <h4>{band.toUpperCase()} Version</h4>
              <div className="version-content">
                <p>
                  <strong>Introduction:</strong> {version.introduction}
                </p>
                <div>
                  <strong>Body:</strong>
                  {version.body.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
                <p>
                  <strong>Conclusion:</strong> {version.conclusion}
                </p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};
```

## Code Examples

### Complete Integration Example

```javascript
class IELTSWritingService {
  constructor(baseURL = "/api") {
    this.baseURL = baseURL;
  }

  getAuthHeaders() {
    const token = localStorage.getItem("accessToken");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  async submitEssay(essayData) {
    const response = await fetch(`${this.baseURL}/ielts-writing-submission`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(essayData),
    });

    if (!response.ok) {
      throw new Error(`Submission failed: ${response.statusText}`);
    }

    return response.json();
  }

  async analyzeEssay(submissionId) {
    const response = await fetch(
      `${this.baseURL}/ielts-ai/analyze/${submissionId}`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getResults(submissionId) {
    const response = await fetch(
      `${this.baseURL}/ielts-writing-submission/${submissionId}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch results: ${response.statusText}`);
    }

    return response.json();
  }

  async waitForAnalysis(submissionId, timeout = 60000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const results = await this.getResults(submissionId);

      if (results.data.status === "ANALYZED") {
        return results.data;
      } else if (results.data.status === "FAILED_TO_CHECK") {
        throw new Error("Analysis failed");
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    throw new Error("Analysis timeout");
  }
}

// Usage
const writingService = new IELTSWritingService();

const submitAndAnalyze = async (essayData) => {
  try {
    // Submit essay
    const submission = await writingService.submitEssay(essayData);
    console.log("Essay submitted:", submission.data._id);

    // Start analysis
    await writingService.analyzeEssay(submission.data._id);
    console.log("Analysis started");

    // Wait for results
    const results = await writingService.waitForAnalysis(submission.data._id);
    console.log("Analysis complete:", results);

    return results;
  } catch (error) {
    console.error("Error:", error.message);
    throw error;
  }
};
```

## API Endpoints Summary

| Method | Endpoint                                   | Description                      | Auth Required |
| ------ | ------------------------------------------ | -------------------------------- | ------------- |
| POST   | `/auth/register`                           | Register new user                | No            |
| POST   | `/auth/login`                              | User login                       | No            |
| POST   | `/ielts-writing-submission`                | Submit essay                     | Yes           |
| GET    | `/ielts-writing-submission/:id`            | Get submission details           | Yes           |
| GET    | `/ielts-writing-submission/my-submissions` | Get user's submissions           | Yes           |
| GET    | `/ielts-writing-submission`                | Get all submissions (Admin only) | Yes (Admin)   |
| POST   | `/ielts-ai/analyze/:id`                    | Start AI analysis                | Yes           |

## Environment Variables

Make sure to set these environment variables in your backend:

```env
JWT_SECRET=your-jwt-secret-key
GEMINI_API_KEY=your-gemini-api-key
MONGODB_URI=your-mongodb-connection-string
```

## Support

For technical support or questions about the API, please refer to the Swagger documentation at `/api-docs` when the server is running.
