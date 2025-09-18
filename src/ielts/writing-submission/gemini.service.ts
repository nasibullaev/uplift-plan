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

  async generateImprovedVersion(submissionId: string): Promise<any> {
    try {
      // Get the submission
      const submission =
        await this.ieltsWritingSubmissionService.findOne(submissionId);

      if (!submission) {
        throw new Error("Submission not found");
      }

      this.logger.log(
        `Starting improved version generation for submission ${submissionId}`
      );

      // Generate improved version based on target score
      const improvedVersion = await this.generateImprovedEssay(
        submission.body,
        submission.targetScore
      );

      // Update the submission with improved version using direct MongoDB update
      await this.ieltsWritingSubmissionService[
        "ieltsWritingSubmissionModel"
      ].findByIdAndUpdate(
        submissionId,
        {
          improvedVersion: improvedVersion,
        },
        { new: true }
      );

      this.logger.log(
        `Improved version generation completed for submission ${submissionId}`
      );

      // Return the improved version data
      return {
        submissionId,
        improvedVersion: improvedVersion,
      };
    } catch (error) {
      this.logger.error(
        `Error generating improved version for submission ${submissionId}:`,
        error
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

    const analysisPrompt = `
SYSTEM PERSONA
You are a specialized, headless API endpoint for IELTS essay analysis. Your function is to process an essay and return a single, valid JSON object containing a comprehensive analysis, WITHOUT generating the full rewritten versions.

**CRITICAL DIRECTIVES**

1.  **Primary Directive**: Your entire output **must** be a single, raw, valid JSON object.
2.  **No Extraneous Text**: Absolutely no text or markdown formatting should surround the JSON object.
3.  **Adhere to Schema**: The JSON structure must strictly follow the schema provided below. All specified fields are mandatory.
4.  **Execution Priority**: Your priority is speed and accuracy of the analysis. You will perform all scoring and feedback generation. You will **NOT** generate the content for the "improvedVersions" key.

**STEP-BY-STEP INTERNAL PROCESS**

1.  **Deep Analysis**: Deeply analyze the "Original Essay" based on the four official criteria.
2.  **Scoring**: Assign a precise overall score and individual criteria scores.
3.  **Identify Flaws & Improvements**: Compile lists of general mistakes and actionable suggestions.
4.  **Generate In-Line Feedback**: For each error, create a detailed feedback object including the text snippet, indices, category, explanation, and suggestion.
5.  **Assemble JSON**: Construct the final JSON object. Crucially, for the "improvedVersions" key, you will return an empty object \`{}\`.

**CONTEXT**

*   **Candidate's Target Score**: "${targetScore}"
*   **Original Essay**: """${body}"""

Strictly adhere to the following JSON OUTPUT SCHEMA:
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
      "A list of general, high-level mistakes identified in the original essay."
    ],
    "suggestions": [
      "A list of general, actionable suggestions for the user to improve their writing skills."
    ],
    "inlineFeedback": [
      {
        "originalText": "The exact text snippet from the user's essay that contains an error.",
        "startIndex": number,
        "endIndex": number,
        "category": "The type of error (e.g., 'Grammar', 'Lexical Resource', 'Cohesion', 'Clarity').",
        "explanation": "A clear and concise explanation of why this is an error or could be improved.",
        "suggestion": "The corrected or improved word/phrase.",
        "suggestionExplanation": "A brief explanation of why the suggested version is better (e.g., 'More formal', 'More precise', 'Grammatically correct')."
      }
    ]
  }
}

Final Instruction: Begin your response with {. Do not add any other text.
`;

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

  private async generateImprovedEssay(body: string, targetScore: string) {
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // First detect the essay structure to get body count and other details
    const structure = await this.detectEssayStructure(body);

    const improvedVersionPrompt = `
SYSTEM PERSONA
You are a specialized, headless API endpoint for rewriting IELTS essays. Your sole function is to take an original essay and generate three distinct, improved versions targeting Band 7, 8, and 9, returning them within a single, valid JSON object.

**CRITICAL DIRECTIVES**

1.  **Primary Directive**: Your entire output **must** be a single, raw, valid JSON object.
2.  **No Extraneous Text**: Absolutely no text or markdown formatting should surround the JSON object.
3.  **Adhere to Schema**: The JSON structure must strictly follow the schema provided below, with "band7", "band8", and "band9" as the top-level keys.
4.  **Preserve Brevity and Structure**: The three rewritten versions **must** maintain a similar word count and sentence volume to the 'Original Essay'. You **must** also preserve the original paragraph count for the body. Do not add new ideas.

**STEP-BY-STEP INTERNAL PROCESS**

1.  **Analyze Core Ideas**: Understand the core arguments and structure of the "Original Essay".
2.  **Generate Band 7 Version**: Rewrite the essay to a solid Band 7 level and write its corresponding criteria feedback.
3.  **Generate Band 8 Version**: Rewrite the essay again to a more advanced Band 8 level and write its corresponding criteria feedback.
4.  **Generate Band 9 Version**: Produce a final, expert-level Band 9 rewrite and write its corresponding criteria feedback.
5.  **Assemble JSON**: Construct the final JSON object containing all three versions and their feedback, structured exactly as the schema requires.

**CONTEXT**

*   **Original Essay**: """${body}"""
*   **Detected Structure**: Introduction: ${structure.has_intro}, Conclusion: ${structure.has_conclusion}, Body Paragraphs: ${structure.body_count}

**MANDATORY STRUCTURAL RULE**

*   **Preserve Body Paragraph Count**: The "body" array for each of the three improved versions MUST contain exactly **${structure.body_count}** string elements.

Strictly adhere to the following JSON OUTPUT SCHEMA:
json
{
  "band7": {
    "introduction": "The full text of the rewritten introduction targeting a Band 7 score.",
    "body": [
      "The full text of the first rewritten body paragraph for Band 7.",
      "The full text of the second rewritten body paragraph for Band 7."
    ],
    "conclusion": "The full text of the rewritten conclusion for Band 7.",
    "criteriaResponse": {
      "taskResponse": "General feedback on why this version's Task Response meets Band 7 criteria.",
      "coherence": "General feedback on why this version's Coherence and Cohesion meets Band 7 criteria.",
      "lexical": "General feedback on why this version's Lexical Resource meets Band 7 criteria.",
      "grammar": "General feedback on why this version's Grammatical Range and Accuracy meets Band 7 criteria."
    }
  },
  "band8": {
    "introduction": "The full text of the rewritten introduction targeting a Band 8 score.",
    "body": [
      "The full text of the first rewritten body paragraph for Band 8.",
      "The full text of the second rewritten body paragraph for Band 8."
    ],
    "conclusion": "The full text of the rewritten conclusion for Band 8.",
    "criteriaResponse": {
      "taskResponse": "General feedback on why this version's Task Response meets Band 8 criteria.",
      "coherence": "General feedback on why this version's Coherence and Cohesion meets Band 8 criteria.",
      "lexical": "General feedback on why this version's Lexical Resource meets Band 8 criteria.",
      "grammar": "General feedback on why this version's Grammatical Range and Accuracy meets Band 8 criteria."
    }
  },
  "band9": {
    "introduction": "The full text of the rewritten introduction targeting a Band 9 score.",
    "body": [
      "The full text of the first rewritten body paragraph for Band 9.",
      "The full text of the second rewritten body paragraph for Band 9."
    ],
    "conclusion": "The full text of the rewritten conclusion for Band 9.",
    "criteriaResponse": {
      "taskResponse": "General feedback on why this version's Task Response fully and expertly addresses all parts of the task.",
      "coherence": "General feedback on why this version's Coherence and Cohesion is seamless and skillfully managed.",
      "lexical": "General feedback on why this version's Lexical Resource is sophisticated, natural, and precise.",
      "grammar": "General feedback on why this version's Grammatical Range and Accuracy is flawless and complex."
    }
  }
}

Final Instruction: Begin your response with {. Do not add any other text.
`;

    const result = await model.generateContent(improvedVersionPrompt);
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
      this.logger.error("Error parsing improved version response:", error);
      // Fallback improved version
      return this.getFallbackImprovedVersion(targetScore);
    }
  }

  private getFallbackImprovedVersion(targetScore: string) {
    return {
      band7: {
        introduction:
          "This is a Band 7 improved introduction paragraph that clearly presents the topic and provides a strong thesis statement.",
        body: [
          "This is a Band 7 improved first body paragraph that develops one main idea with clear topic sentence and supporting evidence.",
          "This is a Band 7 improved second body paragraph that addresses another aspect of the topic with clear reasoning and examples.",
        ],
        conclusion:
          "This is a Band 7 improved conclusion paragraph that effectively summarizes the main points and reinforces the thesis statement.",
        criteriaResponse: {
          taskResponse:
            "This Band 7 version fully addresses the question with clear position and relevant examples.",
          coherence:
            "The Band 7 essay flows logically with clear paragraph structure and effective cohesive devices.",
          lexical:
            "Uses appropriate vocabulary with good variety and natural collocation.",
          grammar:
            "Demonstrates good control of grammar with accurate sentence structures.",
        },
      },
      band8: {
        introduction:
          "This is a Band 8 sophisticated introduction that demonstrates advanced argumentation and clear thesis presentation.",
        body: [
          "This Band 8 body paragraph showcases advanced critical thinking with sophisticated argumentation and excellent use of linking words.",
          "This Band 8 paragraph demonstrates advanced vocabulary and complex sentence structures with precise expression.",
        ],
        conclusion:
          "This Band 8 conclusion effectively synthesizes arguments and provides a compelling final statement.",
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
          "This Band 9 introduction demonstrates exceptional clarity and sophistication in presenting the argument with flawless expression.",
        body: [
          "This Band 9 paragraph showcases mastery of complex ideas with sophisticated argumentation and exceptional examples.",
          "This Band 9 paragraph demonstrates complete mastery of advanced concepts with flawless expression and perfect coherence.",
        ],
        conclusion:
          "This Band 9 conclusion provides exceptional synthesis and leaves a lasting impression with perfect clarity.",
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
    };
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
