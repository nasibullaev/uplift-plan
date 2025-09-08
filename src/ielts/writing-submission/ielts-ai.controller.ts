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
  @ApiOperation({ summary: "Analyze IELTS writing submission with AI" })
  @ApiResponse({ status: 200, description: "Analysis completed successfully" })
  @ApiResponse({ status: 404, description: "Submission not found" })
  async analyzeSubmission(@Param() params: ObjectIdDto) {
    await this.geminiService.analyzeWritingSubmission(params.id);
    return {
      message: "Analysis completed successfully",
      submissionId: params.id,
    };
  }
}
