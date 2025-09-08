import { Module } from "@nestjs/common";
import { IELTSWritingModule } from "./writing/ielts-writing.module";
import { IELTSWritingSubmissionModule } from "./writing-submission/ielts-writing-submission.module";

@Module({
  imports: [IELTSWritingModule, IELTSWritingSubmissionModule],
  exports: [IELTSWritingModule, IELTSWritingSubmissionModule],
})
export class IELTSModule {}
