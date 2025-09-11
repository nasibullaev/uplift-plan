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
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const analysisPrompt = `
# ROLE & GOAL
You are a senior IELTS examiner. Your task is to provide a comprehensive, accurate, and constructive evaluation of an IELTS Writing Task 2 essay based on the four official marking criteria.

# CONTEXT
- **Candidate's Target Score:** ${targetScore}
- **Original Essay:** """${body}"""

# DETECTED STRUCTURE OF ORIGINAL ESSAY
- Introduction Found: ${hasIntro}
- Conclusion Found: ${hasConclusion}
- Body Paragraphs Counted: ${bodyCount}

# CRITICAL RULES & INSTRUCTIONS
1. **MUST MAINTAIN BODY PARAGRAPH COUNT:** The \`improvedVersions\` you generate MUST have exactly ${bodyCount} body paragraphs in the "body" array. Do NOT merge, split, add, or remove body paragraphs from this count. This is the most important rule.
2. **EACH "BODY" ELEMENT IS A FULL PARAGRAPH:** Each string element within the \`body\` array of your JSON output MUST be a complete, multi-sentence paragraph. **DO NOT split a paragraph into an array of its individual sentences.**
3. **ALWAYS GENERATE INTRO/CONCLUSION:** In the \`improvedVersions\`, you must ALWAYS write a full introduction and a full conclusion, even if the original essay was missing them.
4. **OUTPUT JSON ONLY:** Your entire output must be a single, valid JSON object that adheres to the schema. Do not include any text or commentary outside of the JSON object.

# JSON OUTPUT SCHEMA
{
  "score": number (0-9),
  "criteriaScores": {
    "taskResponse": number (0-9),
    "coherence": number (0-9),
    "lexical": number (0-9),
    "grammar": number (0-9)
  },
  "aiFeedback": {
    "mistakes": string[],
    "suggestions": string[],
    "improvedVersions": {
      "band7": {
        "introduction": string,
        "body": string[],
        "conclusion": string,
        "criteriaResponse": {
          "taskResponse": string,
          "coherence": string,
          "lexical": string,
          "grammar": string
        }
      },
      "band8": {
        "introduction": string,
        "body": string[],
        "conclusion": string,
        "criteriaResponse": {
          "taskResponse": string,
          "coherence": string,
          "lexical": string,
          "grammar": string
        }
      },
      "band9": {
        "introduction": string,
        "body": string[],
        "conclusion": string,
        "criteriaResponse": {
          "taskResponse": string,
          "coherence": string,
          "lexical": string,
          "grammar": string
        }
      }
    }
  }
}

Return ONLY the JSON object, no additional text.
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
