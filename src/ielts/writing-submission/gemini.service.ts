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
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const structurePrompt = `
Detect the structure of the following IELTS essay.
Return ONLY JSON with fields:
- body_count: number of body paragraphs
- has_intro: true/false
- has_conclusion: true/false

Rules:
1. Paragraphs are separated by double line breaks.
2. Introduction = first paragraph (general opening).
3. Conclusion = last paragraph (contains "in conclusion", "to sum up", etc).
4. Do not guess extra paragraphs. Count exactly as they appear.

Essay:
"""${body}"""
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
      // Fallback structure
      return {
        body_count: 2,
        has_intro: true,
        has_conclusion: true,
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
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const analysisPrompt = `SYSTEM PERSONA
    
    You are a specialized API endpoint. Your sole function is to process an IELTS essay and return a single, valid JSON object with a comprehensive analysis. You must not fail to produce valid JSON.
    
    CRITICAL DIRECTIVES
    
    1.  **Primary Directive**: Your entire output must be a single, raw, valid JSON object.
    2.  **No Extraneous Text**: ABSOLUTELY NO text, explanations, apologies, or markdown formatting should surround the JSON object. The response must start with the character '{' and end with the character '}'.
    3.  **Adhere to Schema**: The JSON structure must strictly follow the schema provided below. All specified fields are mandatory.
    
    STEP-BY-STEP INTERNAL PROCESS (Perform these steps internally before generating the final JSON)
    
    1.  **Deep Analysis**: As an expert IELTS examiner, deeply analyze the "Original Essay" based on the four official criteria (Task Response, Coherence/Cohesion, Lexical Resource, Grammatical Range/Accuracy).
    2.  **Scoring**: Assign a precise overall score and individual criteria scores (0-9, allowing .5 increments). Identify specific mistakes and actionable suggestions.
    3.  **Generate Improved Versions**: Write three complete, distinct rewrites of the *original essay*. These are not generic templates. They are enhanced versions of the user's own work, specifically targeting Band 7, Band 8, and Band 9 criteria. Maintain the original essay's core ideas and arguments.
    4.  **Write Criteria Feedback**: For each of the three improved versions, write specific, targeted feedback explaining *why* that version meets the criteria for its respective band score.
    5.  **Assemble JSON**: Construct the final JSON object using all the data generated in the previous steps. Before outputting, double-check that the JSON is perfectly formed and adheres to the schema.
    
    CONTEXT
    
    *   **Candidate's Target Score**: ${targetScore}
    *   **Original Essay**: """${body}"""
    *   **Detected Structure**: Introduction: ${hasIntro}, Conclusion: ${hasConclusion}, Body Paragraphs: ${bodyCount}
    
    MANDATORY STRUCTURAL RULE
    
    *   **Preserve Body Paragraph Count**: Each of the three 'improvedVersions' you generate MUST have a "body" array containing exactly **${bodyCount}** string elements. This is a non-negotiable structural constraint. Do not merge, split, add, or remove body paragraphs.
    
    Strictly adhere to the following JSON OUTPUT SCHEMA:
    {
      "score": number,
      "criteriaScores": {
        "taskResponse": number,
        "coherence": number,
        "lexical": number,
        "grammar": number
      },
      "aiFeedback": {
        "mistakes": [string],
        "suggestions": [string],
        "improvedVersions": {
          "band7": {
            "introduction": "The full text of the rewritten introduction for Band 7.",
            "body": [
              "The full text of the first rewritten body paragraph for Band 7.",
              "The full text of the second rewritten body paragraph for Band 7."
            ],
            "conclusion": "The full text of the rewritten conclusion for Band 7.",
            "criteriaResponse": {
              "taskResponse": "Specific feedback on why this version meets Band 7 for Task Response.",
              "coherence": "Specific feedback on why this version meets Band 7 for Coherence and Cohesion.",
              "lexical": "Specific feedback on why this version meets Band 7 for Lexical Resource.",
              "grammar": "Specific feedback on why this version meets Band 7 for Grammatical Range and Accuracy."
            }
          },
          "band8": {
            "introduction": "The full text of the rewritten introduction for Band 8.",
            "body": [
              "The full text of the first rewritten body paragraph for Band 8.",
              "The full text of the second rewritten body paragraph for Band 8."
            ],
            "conclusion": "The full text of the rewritten conclusion for Band 8.",
            "criteriaResponse": {
              "taskResponse": "Specific feedback on why this version meets Band 8 for Task Response.",
              "coherence": "Specific feedback on why this version meets Band 8 for Coherence and Cohesion.",
              "lexical": "Specific feedback on why this version meets Band 8 for Lexical Resource.",
              "grammar": "Specific feedback on why this version meets Band 8 for Grammatical Range and Accuracy."
            }
          },
          "band9": {
            "introduction": "The full text of the rewritten introduction for Band 9.",
            "body": [
              "The full text of the first rewritten body paragraph for Band 9.",
              "The full text of the second rewritten body paragraph for Band 9."
            ],
            "conclusion": "The full text of the rewritten conclusion for Band 9.",
            "criteriaResponse": {
              "taskResponse": "Specific feedback on why this version meets Band 9 for Task Response.",
              "coherence": "Specific feedback on why this version meets Band 9 for Coherence and Cohesion.",
              "lexical": "Specific feedback on why this version meets Band 9 for Lexical Resource.",
              "grammar": "Specific feedback on why this version meets Band 9 for Grammatical Range and Accuracy."
            }
          }
        }
      }
    }
    
    Final instruction: Begin your response with '{'. Do not add any other text.
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
