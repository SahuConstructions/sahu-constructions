import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  async getSystemOverview() {
    return this.adminService.getSystemOverview();
  }

  @Get('activity')
  async getRecentActivity() {
    return this.adminService.getRecentActivity();
  }

  @Get('summary')
  async getAdminSummary() {
    return this.adminService.getAdminSummary();
  }
}
