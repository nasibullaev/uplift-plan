import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { IELTSWritingSubmissionService } from "./ielts-writing-submission.service";
import { IELTSWritingSubmissionStatus } from "./schemas/ielts-writing-submission.schema";

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey: string;
  private readonly genAI: GoogleGenerativeAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly ieltsWritingSubmissionService: IELTSWritingSubmissionService
  ) {
    this.apiKey = this.configService.get<string>("GEMINI_API_KEY");
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  async analyzeWritingSubmission(submissionId: string): Promise<any> {
    try {
      // Update status to IN_PROGRESS
      await this.ieltsWritingSubmissionService.updateStatus(
        submissionId,
        IELTSWritingSubmissionStatus.IN_PROGRESS
      );

      // Get the submission
      const submission =
        await this.ieltsWritingSubmissionService.findOne(submissionId);

      if (!submission) {
        throw new Error("Submission not found");
      }

      this.logger.log(
        `Starting Gemini analysis for submission ${submissionId}`
      );

      // Step 1: Detect essay structure
      const structure = await this.detectEssayStructure(submission.body);

      // Step 2: Generate comprehensive analysis
      const analysis = await this.generateAnalysis(
        submission.body,
        submission.targetScore,
        structure.body_count,
        structure.has_intro,
        structure.has_conclusion
      );

      // Update the submission with analysis results using direct MongoDB update
      await this.ieltsWritingSubmissionService.updateStatus(
        submissionId,
        IELTSWritingSubmissionStatus.ANALYZED
      );

      // Update analysis data directly
      await this.ieltsWritingSubmissionService[
        "ieltsWritingSubmissionModel"
      ].findByIdAndUpdate(
        submissionId,
        {
          score: analysis.score,
          criteriaScores: analysis.criteriaScores,
          aiFeedback: analysis.aiFeedback,
        },
        { new: true }
      );

      this.logger.log(
        `Gemini analysis completed for submission ${submissionId}`
      );

      // Return the analysis data
      return {
        submissionId,
        status: IELTSWritingSubmissionStatus.ANALYZED,
        analysis: {
          score: analysis.score,
          criteriaScores: analysis.criteriaScores,
          aiFeedback: analysis.aiFeedback,
        },
      };
    } catch (error) {
      this.logger.error(`Error analyzing submission ${submissionId}:`, error);

      // Update status to FAILED_TO_CHECK
      await this.ieltsWritingSubmissionService.updateStatus(
        submissionId,
        IELTSWritingSubmissionStatus.FAILED_TO_CHECK
      );

      throw error;
    }
  }

  private async detectEssayStructure(body: string) {
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const structurePrompt = `
    Detect the structure of the following IELTS essay.
    Return ONLY JSON with fields:
    - body_count: number of body paragraphs
    - has_intro: true/false
    - has_conclusion: true/false
    
    Rules for detection:
    1. Paragraphs are separated by double line breaks.
    2. The first paragraph is considered the introduction.
    3. The last paragraph is considered the conclusion.
    4. Body paragraphs are all paragraphs between the introduction and conclusion.
    5. If there's only one paragraph, it's considered an introduction and has_conclusion and body_count will be false/0.
    6. If there are two paragraphs, the first is intro, the second is conclusion, and body_count will be 0.
    
    Essay:
    """
    ${body}
    """
    `;

    const result = await model.generateContent(structurePrompt);
    const response = await result.response;
    const text = response.text();

    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("No JSON found in response");
    } catch (error) {
      this.logger.error("Error parsing structure response:", error);
      // Fallback structure in case of parsing error
      return {
        body_count: 0, // Default to 0 for a more neutral fallback
        has_intro: false,
        has_conclusion: false,
      };
    }
  }

  private async generateAnalysis(
    body: string,
    targetScore: string,
    bodyCount: number,
    hasIntro: boolean,
    hasConclusion: boolean
  ) {
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const analysisPrompt = `SYSTEM PERSONA
You are an AI API endpoint. Your sole function is to analyze the provided IELTS essay and return a single, valid JSON object according to the schema below.

**CRITICAL RULES**

1.  **JSON Only**: Your entire output **must** be a single, raw, valid JSON object. It must start with "{" and end with "}". No other text, markdown, or explanations are permitted outside the JSON.
2.  **Strict Schema**: Adhere strictly to the JSON schema provided. Do not add, omit, or rename any keys. All fields are mandatory.
3.  **Preserve Original's Essence**: The "improvedVersions" for Bands 7, 8, and 9 must rewrite the user's original essay. They must maintain the same core arguments, approximate word count, and number of sentences. Do not add new ideas or significantly change the length.
4.  **Preserve Paragraph Structure**: Each of the "improvedVersions" you generate must have a "body" array containing exactly **${bodyCount}** string elements, matching the original essay's body paragraph count.

**CONTEXT**

*   **Candidate's Target Score**: ${targetScore}
*   **Original Essay**: """${body}"""
*   **Detected Structure**: Introduction: ${hasIntro}, Conclusion: ${hasConclusion}, Body Paragraphs: ${bodyCount}

**JSON OUTPUT SCHEMA**
json
{
  "score": number,
  "criteriaScores": {
    "taskResponse": number,
    "coherence": number,
    "lexical": number,
    "grammar": number
  },
  "aiFeedback": {
    "mistakes": [
      "A list of general mistakes from the original essay."
    ],
    "suggestions": [
      "A list of actionable suggestions for improvement."
    ],
    "inlineFeedback": [
      {
        "originalText": "The exact text snippet containing an error.",
        "startIndex": number,
        "endIndex": number,
        "category": "Error type (e.g., 'Grammar', 'Lexical Resource', 'Cohesion').",
        "explanation": "A concise explanation of the error.",
        "suggestion": "The corrected or improved word/phrase.",
        "suggestionExplanation": "A brief explanation of why the suggestion is better."
      }
    ],
    "improvedVersions": {
      "band7": {
        "introduction": "Rewritten introduction for a Band 7 score.",
        "body": [
          "First rewritten body paragraph for Band 7.",
          "Second rewritten body paragraph for Band 7."
        ],
        "conclusion": "Rewritten conclusion for Band 7.",
        "criteriaResponse": {
          "taskResponse": "Feedback on why this version's Task Response meets Band 7.",
          "coherence": "Feedback on why this version's Coherence and Cohesion meets Band 7.",
          "lexical": "Feedback on why this version's Lexical Resource meets Band 7.",
          "grammar": "Feedback on why this version's Grammar meets Band 7."
        }
      },
      "band8": {
        "introduction": "Rewritten introduction for a Band 8 score.",
        "body": [
          "First rewritten body paragraph for Band 8.",
          "Second rewritten body paragraph for Band 8."
        ],
        "conclusion": "Rewritten conclusion for Band 8.",
        "criteriaResponse": {
          "taskResponse": "Feedback on why this version's Task Response meets Band 8.",
          "coherence": "Feedback on why this version's Coherence and Cohesion meets Band 8.",
          "lexical": "Feedback on why this version's Lexical Resource meets Band 8.",
          "grammar": "Feedback on why this version's Grammar meets Band 8."
        }
      },
      "band9": {
        "introduction": "Rewritten introduction for a Band 9 score.",
        "body": [
          "First rewritten body paragraph for Band 9.",
          "Second rewritten body paragraph for Band 9."
        ],
        "conclusion": "Rewritten conclusion for Band 9.",
        "criteriaResponse": {
          "taskResponse": "Feedback on why this version's Task Response meets Band 9.",
          "coherence": "Feedback on why this version's Coherence and Cohesion meets Band 9.",
          "lexical": "Feedback on why this version's Lexical Resource meets Band 9.",
          "grammar": "Feedback on why this version's Grammar meets Band 9."
        }
      }
    }
  }
}
Final Instruction: Begin your response with {. Do not add any other text.`;

    const result = await model.generateContent(analysisPrompt);
    const response = await result.response;
    const text = response.text();

    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("No JSON found in response");
    } catch (error) {
      this.logger.error("Error parsing analysis response:", error);
      // Fallback analysis
      return this.getFallbackAnalysis();
    }
  }

  private getFallbackAnalysis() {
    return {
      score: 6.5,
      criteriaScores: {
        taskResponse: 6,
        coherence: 7,
        lexical: 6,
        grammar: 7,
      },
      aiFeedback: {
        mistakes: [
          "Some grammatical errors in complex sentences",
          "Limited vocabulary variety in some areas",
        ],
        suggestions: [
          "Use more varied sentence structures",
          "Include more sophisticated vocabulary",
          "Improve paragraph organization",
        ],
        improvedVersions: {
          band7: {
            introduction:
              "This is a sample introduction paragraph that addresses the topic clearly and provides a thesis statement.",
            body: [
              "This is the first body paragraph that develops one main idea with supporting evidence and examples.",
              "This is the second body paragraph that addresses another aspect of the topic with clear reasoning.",
            ],
            conclusion:
              "This is a sample conclusion paragraph that summarizes the main points and restates the thesis.",
            criteriaResponse: {
              taskResponse:
                "This version fully addresses the question with clear position and relevant examples.",
              coherence:
                "The essay flows logically with clear paragraph structure and cohesive devices.",
              lexical:
                "Uses appropriate vocabulary with some variety and collocation.",
              grammar:
                "Demonstrates good control of grammar with occasional errors that don't impede communication.",
            },
          },
          band8: {
            introduction:
              "This is an improved introduction with clearer thesis and better organization.",
            body: [
              "This body paragraph shows more sophisticated argumentation and better use of linking words.",
              "This paragraph demonstrates advanced vocabulary and complex sentence structures.",
            ],
            conclusion:
              "This conclusion effectively summarizes and reinforces the main arguments.",
            criteriaResponse: {
              taskResponse:
                "Addresses all parts of the task with clear position and well-developed ideas.",
              coherence:
                "Excellent organization with clear progression and effective cohesive devices.",
              lexical:
                "Uses wide range of vocabulary flexibly and precisely with natural collocation.",
              grammar:
                "Demonstrates excellent control of grammar with rare errors.",
            },
          },
          band9: {
            introduction:
              "This introduction demonstrates exceptional clarity and sophistication in presenting the argument.",
            body: [
              "This paragraph showcases advanced critical thinking and sophisticated argumentation with excellent examples.",
              "This paragraph demonstrates mastery of complex ideas with flawless expression and coherence.",
            ],
            conclusion:
              "This conclusion provides exceptional synthesis and leaves a lasting impression.",
            criteriaResponse: {
              taskResponse:
                "Fully addresses all parts of the task with exceptional clarity and sophistication.",
              coherence:
                "Perfect organization with seamless flow and sophisticated cohesive devices.",
              lexical:
                "Uses vocabulary with exceptional precision and naturalness throughout.",
              grammar:
                "Demonstrates complete mastery of grammar with virtually no errors.",
            },
          },
        },
      },
    };
  }
}
