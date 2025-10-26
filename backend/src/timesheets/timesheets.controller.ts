import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  Patch,
  ParseIntPipe,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { TimesheetsService } from "./timesheets.service";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";

@Controller("timesheets")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TimesheetsController {
  constructor(private timesheetsService: TimesheetsService) {}

  // Employee: create timesheet
  @Post()
  async create(@Req() req, @Body() body: { project: string; task: string; hours: number; date: string }) {
    const userId = req.user.userId;
    return this.timesheetsService.create(userId, {
      project: body.project,
      task: body.task,
      hours: body.hours,
      date: new Date(body.date),
    });
  }

  // Employee: view own timesheets
  @Get("me")
  async getMyTimesheets(@Req() req) {
    const userId = req.user.userId;
    return this.timesheetsService.getMyTimesheets(userId);
  }

  // Manager/HR/Admin: view all timesheets
  @Get()
  @Roles("MANAGER", "HR", "ADMIN")
  async getAll() {
    return this.timesheetsService.getAllTimesheets();
  }

  // Manager/HR/Admin: monthly report
  @Get("report/:year/:month")
  @Roles("MANAGER", "HR", "ADMIN")
  async report(@Param("year") year: number, @Param("month") month: number) {
    return this.timesheetsService.getMonthlySummary(+year, +month);
  }  

  // ✅ Unified approval flow
  @Post(":id/action")
  @Roles("MANAGER", "HR", "ADMIN")
  async takeAction(
    @Req() req,
    @Param("id", ParseIntPipe) id: number,
    @Body() body: { action: string; comments?: string }
  ) {
    return this.timesheetsService.takeAction(req.user, id, body.action, body.comments);
  }
  @Get("daily-hours/:date")
async getDailyHours(@Req() req, @Param("date") date: string) {
  const userId = req.user.userId;
  return this.timesheetsService.getDailyHours(userId, date);
}

}
