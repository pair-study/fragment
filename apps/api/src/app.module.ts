import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseModule } from "@ilgam/database";

@Module({
  imports: [DatabaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
