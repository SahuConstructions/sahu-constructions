import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { EmployeesService } from './employees.service';
import { RolesGuard } from '../auth/roles.guard';

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  // ✅ HR/Admin can create employee profiles with salary details
  @Post()
  @Roles('HR', 'ADMIN')
  async create(@Body() body: any) {
    return this.employeesService.createEmployee(body);
  }

  // ✅ HR/Admin can view all employees
  @Get()
  @Roles('HR', 'ADMIN')
  async findAll() {
    return this.employeesService.findAll();
  }

  // ✅ HR/Admin can view one employee
  @Get(':id')
  @Roles('HR', 'ADMIN')
  async findOne(@Param('id') id: string) {
    return this.employeesService.findOne(Number(id));
  }

  // ✅ HR/Admin can update employee info
  @Put(':id')
  @Roles('HR', 'ADMIN')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.employeesService.updateEmployee(Number(id), body);
  }

  // ✅ HR/Admin can remove employee
  @Delete(':id')
  @Roles('HR', 'ADMIN')
  async remove(@Param('id') id: string) {
    return this.employeesService.removeEmployee(Number(id));
  }

  // ✅ HR can reset employee password
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HR')
  @Post(':id/reset-password')
  async resetPassword(@Param('id') id: number) {
    return this.employeesService.resetEmployeePassword(Number(id));
  }
}
