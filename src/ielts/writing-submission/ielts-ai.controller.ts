import { Controller, Post, Param, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { OpenAIService } from "./openai.service";
import { ObjectIdDto } from "./dto/ielts-writing-submission.dto";

@ApiTags("ielts-ai")
@Controller("ielts-ai")
export class IELTSAIController {
  constructor(private readonly openAIService: OpenAIService) {}

  @Post("analyze/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Analyze IELTS writing submission with AI" })
  @ApiResponse({ status: 200, description: "Analysis completed successfully" })
  @ApiResponse({ status: 404, description: "Submission not found" })
  async analyzeSubmission(@Param() params: ObjectIdDto) {
    await this.openAIService.analyzeWritingSubmission(params.id);
    return {
      message: "Analysis completed successfully",
      submissionId: params.id,
    };
  }
}
