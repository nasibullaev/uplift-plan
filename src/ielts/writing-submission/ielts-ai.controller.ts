import {
  Controller,
  Post,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { OpenAIService } from "./openai.service";
import { ObjectIdDto } from "./dto/ielts-writing-submission.dto";
import { UserPlanService } from "../../user-plan/user-plan.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

@ApiTags("ielts-ai")
@Controller("ielts-ai")
export class IELTSAIController {
  constructor(
    private readonly openAIService: OpenAIService,
    private readonly userPlanService: UserPlanService
  ) {}

  @Post("analyze/scores/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Analyze IELTS writing submission - scores only",
    description:
      "Runs a fast AI analysis that returns only overall score and criteria scores.",
  })
  @ApiResponse({ status: 200, description: "Scores generated" })
  async analyzeScores(@Param() params: ObjectIdDto) {
    const result = await this.openAIService.analyzeWritingScores(params.id);
    return {
      message: "Scores generated successfully",
      submissionId: result.submissionId,
      status: result.status,
      analysis: result.analysis,
    };
  }

  @Post("analyze/feedback/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Analyze IELTS writing submission - feedback only",
    description:
      "Runs a follow-up AI analysis that returns feedback (mistakes, suggestions, inline feedback).",
  })
  @ApiResponse({ status: 200, description: "Feedback generated" })
  async analyzeFeedback(@Param() params: ObjectIdDto) {
    const result = await this.openAIService.analyzeWritingFeedback(params.id);
    return {
      message: "Feedback generated successfully",
      submissionId: result.submissionId,
      status: result.status,
      aiFeedback: result.aiFeedback,
    };
  }

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
    const result = await this.openAIService.analyzeWritingSubmission(params.id);
    return {
      message: "Analysis completed successfully",
      submissionId: result.submissionId,
      status: result.status,
      analysis: result.analysis,
    };
  }

  @Post("improved-version/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Generate improved version of IELTS writing submission",
    description:
      "Generates an improved version of an IELTS writing submission using AI. The improved version is tailored to the user's target score and provides a better example of how the essay could be written.",
  })
  @ApiResponse({
    status: 200,
    description: "Improved version generated successfully",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Improved version generated successfully",
        },
        submissionId: {
          type: "string",
          example: "68c0649e2d28176e17649eeb",
        },
        improvedVersion: {
          type: "object",
          properties: {
            band7: {
              type: "object",
              properties: {
                introduction: {
                  type: "string",
                  example:
                    "This is a Band 7 improved introduction paragraph...",
                },
                body: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  example: [
                    "This is a Band 7 improved first body paragraph...",
                    "This is a Band 7 improved second body paragraph...",
                  ],
                },
                conclusion: {
                  type: "string",
                  example: "This is a Band 7 improved conclusion paragraph...",
                },
                criteriaResponse: {
                  type: "object",
                  properties: {
                    taskResponse: {
                      type: "string",
                      example:
                        "This Band 7 version fully addresses the question...",
                    },
                    coherence: {
                      type: "string",
                      example: "The Band 7 essay flows logically...",
                    },
                    lexical: {
                      type: "string",
                      example: "Uses appropriate Band 7 vocabulary...",
                    },
                    grammar: {
                      type: "string",
                      example: "Demonstrates good Band 7 grammar...",
                    },
                  },
                },
              },
            },
            band8: {
              type: "object",
              description:
                "Band 8 improved version with more sophisticated language and structure",
            },
            band9: {
              type: "object",
              description:
                "Band 9 improved version with expert-level language and flawless structure",
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
    description: "Internal server error during improved version generation",
  })
  async generateImprovedVersion(@Param() params: ObjectIdDto, @Request() req) {
    const canSee = await this.userPlanService.canSeeImprovedVersions(
      req.user.sub
    );
    if (!canSee) {
      throw new ForbiddenException(
        "Your current trial does not include access to improved versions."
      );
    }
    const result = await this.openAIService.generateImprovedVersion(params.id);
    return {
      message: "Improved version generated successfully",
      submissionId: result.submissionId,
      improvedVersion: result.improvedVersion,
    };
  }
}
