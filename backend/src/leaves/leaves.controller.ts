import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Req,
    UseGuards,
  } from '@nestjs/common';
  import { JwtAuthGuard } from '../auth/jwt-auth.guard';
  import { RolesGuard } from '../auth/roles.guard';
  import { Roles } from '../auth/roles.decorator';
  import { LeavesService } from './leaves.service';
  import { CreateLeaveDto } from './dto/create-leave.dto';
  import { ActionLeaveDto } from './dto/action-leave.dto';
  
  @Controller('leaves')
  @UseGuards(JwtAuthGuard, RolesGuard) // enforce both auth & role guards
  export class LeavesController {
    constructor(private leavesService: LeavesService) {}
  
    // Employee applies for leave
    @Post()
    async apply(@Req() req, @Body() dto: CreateLeaveDto) {
      return this.leavesService.apply(req.user.userId, dto);
    }
  
    // Employee views their own leaves (with audit trail)
    @Get('me')
    async myLeaves(@Req() req) {
      return this.leavesService.myLeaves(req.user.userId);
    }
  
    // Managers and HR view pending leaves
    @Get('pending')
    @Roles('MANAGER', 'HR', 'ADMIN') // 👈 now includes ADMIN
    async pending(@Req() req) {
      return this.leavesService.pending(req.user);
    }
  
    // Managers and HR take action on a leave
    @Post(':id/action')
    @Roles('MANAGER', 'HR', 'ADMIN') // allow ADMIN to take action too
    async action(
      @Req() req,
      @Param('id', ParseIntPipe) id: number,
      @Body() dto: ActionLeaveDto,
    ) {
      return this.leavesService.action(req.user, id, dto);
    }    
  
    @Get('report/summary')
    @Roles('ADMIN') // 👈 Only Admins can view reports
    async summary() {
      return this.leavesService.getSummary();
    }

    // 👇 New endpoint: get full audit trail for a leave
    @Get(':id/audit')
    @Roles('ADMIN', 'MANAGER', 'HR')
    async getAudit(@Param('id', ParseIntPipe) id: number) {
      return this.leavesService.getAudit(id);
    }
    // 👇 New endpoint: get leave balance for any employee
    @Get('balance/:id')
    @Roles('HR', 'MANAGER', 'ADMIN', 'USER')
    async getLeaveBalance(@Param('id', ParseIntPipe) userId: number) {
      const employee = await this.leavesService.getEmployeeByUserId(userId);
      return this.leavesService.getLeaveBalance(employee.id);
    }

    // 👨‍💼 Manager: view team leave balances
@Get('balances/manager')
@Roles('MANAGER')
async getManagerTeamBalances(@Req() req) {
  return this.leavesService.getManagerTeamBalances(req.user.userId);
}

// 👩‍💼 HR: view all employee leave balances
@Get('balances/hr')
@Roles('HR', 'ADMIN')
async getAllBalances() {
  return this.leavesService.getAllLeaveBalances();
}

  }
  