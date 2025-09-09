import {
  Controller,
  Post,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { GeminiService } from "./gemini.service";
import { ObjectIdDto } from "./dto/ielts-writing-submission.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

@ApiTags("ielts-ai")
@Controller("ielts-ai")
export class IELTSAIController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post("analyze/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Analyze IELTS writing submission with AI",
    description:
      "Analyzes an IELTS writing submission using AI and returns comprehensive feedback including scores, mistakes, suggestions, and improved versions for different band levels.",
  })
  @ApiResponse({
    status: 200,
    description: "Analysis completed successfully",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Analysis completed successfully",
        },
        submissionId: {
          type: "string",
          example: "68c0649e2d28176e17649eeb",
        },
        status: {
          type: "string",
          enum: ["ANALYZED", "FAILED_TO_CHECK"],
          example: "ANALYZED",
        },
        analysis: {
          type: "object",
          properties: {
            score: {
              type: "number",
              minimum: 0,
              maximum: 9,
              example: 7.5,
              description: "Overall IELTS band score",
            },
            criteriaScores: {
              type: "object",
              properties: {
                taskResponse: {
                  type: "number",
                  minimum: 0,
                  maximum: 9,
                  example: 7,
                  description: "Task Response score",
                },
                coherence: {
                  type: "number",
                  minimum: 0,
                  maximum: 9,
                  example: 8,
                  description: "Coherence and Cohesion score",
                },
                lexical: {
                  type: "number",
                  minimum: 0,
                  maximum: 9,
                  example: 7,
                  description: "Lexical Resource score",
                },
                grammar: {
                  type: "number",
                  minimum: 0,
                  maximum: 9,
                  example: 8,
                  description: "Grammatical Range and Accuracy score",
                },
              },
            },
            aiFeedback: {
              type: "object",
              properties: {
                mistakes: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  example: [
                    "Some grammatical errors in complex sentences",
                    "Limited vocabulary variety in some areas",
                  ],
                  description: "List of identified mistakes",
                },
                suggestions: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  example: [
                    "Use more varied sentence structures",
                    "Include more sophisticated vocabulary",
                    "Improve paragraph organization",
                  ],
                  description: "List of improvement suggestions",
                },
                improvedVersions: {
                  type: "object",
                  properties: {
                    band7: {
                      type: "object",
                      properties: {
                        introduction: {
                          type: "string",
                          example: "This is a sample introduction paragraph...",
                        },
                        body: {
                          type: "array",
                          items: {
                            type: "string",
                          },
                          example: [
                            "This is the first body paragraph...",
                            "This is the second body paragraph...",
                          ],
                        },
                        conclusion: {
                          type: "string",
                          example: "This is a sample conclusion paragraph...",
                        },
                        criteriaResponse: {
                          type: "object",
                          properties: {
                            taskResponse: {
                              type: "string",
                              example:
                                "This version fully addresses the question...",
                            },
                            coherence: {
                              type: "string",
                              example: "The essay flows logically...",
                            },
                            lexical: {
                              type: "string",
                              example: "Uses appropriate vocabulary...",
                            },
                            grammar: {
                              type: "string",
                              example:
                                "Demonstrates good control of grammar...",
                            },
                          },
                        },
                      },
                    },
                    band8: {
                      type: "object",
                      description: "Band 8 improved version",
                    },
                    band9: {
                      type: "object",
                      description: "Band 9 improved version",
                    },
                  },
                  description: "Improved versions for different band levels",
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: "Submission not found" })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token required",
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error during analysis",
  })
  async analyzeSubmission(@Param() params: ObjectIdDto) {
    const result = await this.geminiService.analyzeWritingSubmission(params.id);
    return {
      message: "Analysis completed successfully",
      submissionId: result.submissionId,
      status: result.status,
      analysis: result.analysis,
    };
  }
}
