import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Health check público, usado pelo Railway (e outros) para saber se o
  // serviço subiu corretamente.
  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }
}
