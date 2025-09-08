import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IELTSWritingSubmissionService } from "./ielts-writing-submission.service";
import { IELTSWritingSubmissionStatus } from "./schemas/ielts-writing-submission.schema";

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly apiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly ieltsWritingSubmissionService: IELTSWritingSubmissionService
  ) {
    this.apiKey = this.configService.get<string>("OPENAI_API_KEY");
  }

  async analyzeWritingSubmission(submissionId: string): Promise<void> {
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

      // Simulate AI analysis (replace with actual OpenAI API calls)
      const mockAnalysis = {
        score: 7.5,
        criteriaScores: {
          taskResponse: 7,
          coherence: 8,
          lexical: 7,
          grammar: 8,
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
              introduction: "This essay will discuss...",
              body: [
                "First paragraph with improved structure...",
                "Second paragraph with better coherence...",
              ],
              conclusion: "In conclusion, the analysis shows...",
              criteriaResponse: {
                taskResponse: "Good task response with clear position",
                coherence: "Well-organized paragraphs with clear transitions",
                lexical: "Adequate vocabulary with some variety",
                grammar: "Generally accurate with minor errors",
              },
            },
            band8: {
              introduction: "This comprehensive analysis will examine...",
              body: [
                "Sophisticated first paragraph...",
                "Advanced second paragraph...",
              ],
              conclusion: "To conclude, the evidence demonstrates...",
              criteriaResponse: {
                taskResponse:
                  "Excellent task response with sophisticated analysis",
                coherence: "Highly coherent with sophisticated linking",
                lexical: "Wide range of vocabulary used effectively",
                grammar: "Highly accurate with complex structures",
              },
            },
            band9: {
              introduction:
                "This in-depth examination will critically analyze...",
              body: [
                "Exceptional first paragraph...",
                "Outstanding second paragraph...",
              ],
              conclusion: "Ultimately, the comprehensive analysis reveals...",
              criteriaResponse: {
                taskResponse:
                  "Outstanding task response with critical analysis",
                coherence: "Perfect coherence with seamless flow",
                lexical: "Exceptional vocabulary range and precision",
                grammar: "Perfect accuracy with sophisticated structures",
              },
            },
          },
        },
      };

      // Update submission with analysis results
      await this.ieltsWritingSubmissionService.update(submissionId, {
        status: IELTSWritingSubmissionStatus.ANALYZED,
      });

      this.logger.log(`Successfully analyzed submission ${submissionId}`);
    } catch (error) {
      this.logger.error(`Failed to analyze submission ${submissionId}:`, error);

      // Update status to FAILED_TO_CHECK
      await this.ieltsWritingSubmissionService.updateStatus(
        submissionId,
        IELTSWritingSubmissionStatus.FAILED_TO_CHECK
      );

      throw error;
    }
  }

  async generateWritingTask(type: string, topic?: string): Promise<string> {
    // Simulate AI-generated writing task
    const mockTasks = {
      TASK_ONE:
        "The chart below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.",
      TASK_TWO:
        "Some people believe that technology has made our lives more complicated, while others argue that it has simplified our daily routines. Discuss both views and give your own opinion.",
    };

    return mockTasks[type] || mockTasks["TASK_TWO"];
  }
}
