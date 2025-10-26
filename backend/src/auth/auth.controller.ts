import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  // ✅ Unified login - includes mustReset flag
  @Post("login")
  @UsePipes(new ValidationPipe({ transform: true }))
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const tokens = await this.authService.login(user);
    return { status: "ok", ...tokens }; // mustReset included here
  }

  @Post("refresh")
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  // ✅ For password reset (popup form)
  @UseGuards(JwtAuthGuard)
  @Post("change-password")
  async changePassword(
    @Req() req,
    @Body() body: { oldPassword: string; newPassword: string }
  ) {
    const userId = req.user.userId;
    return this.authService.changePassword(
      userId,
      body.oldPassword,
      body.newPassword
    );
  }
}
