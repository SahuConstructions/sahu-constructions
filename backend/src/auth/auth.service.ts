import { Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  // ✅ Validates both normal & temporary passwords
  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
  
    // Compare with main password (always hashed)
    const isPasswordMatch = await bcrypt.compare(password, user.password);
  
    // Check temp password (can be plain or hashed)
    let isTempPassword = false;
    if (user.tempPassword) {
      const tempMatch =
        user.tempPassword === password ||
        (await bcrypt.compare(password, user.tempPassword));
      if (tempMatch) isTempPassword = true;
    }
  
    // Reject invalid credentials
    if (!isPasswordMatch && !isTempPassword) return null;
  
    // Fetch employee info
    const employee = await this.prisma.employee.findUnique({
      where: { userId: user.id },
    });
  
    console.log(
      `[Auth] Login detected: ${email}, tempPass=${isTempPassword}, role=${user.role}`
    );
  
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      employeeId: employee?.id ?? null,
      mustReset: isTempPassword, // ✅ Will now be true for temp passwords
    };
  }   

  // ✅ Includes mustReset flag in login response
  async login(userObj: { id: number; email: string; role: string; mustReset?: boolean }) {
    const payload = { email: userObj.email, sub: userObj.id, role: userObj.role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || "3600s",
    });

    const refreshToken = this.jwtService.sign(
      { sub: userObj.id },
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRES_IN || "3600s",
      mustReset: userObj.mustReset || false,
    };
  }

  // ✅ Handles both old or temp password
  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException("User not found");

    const isTempPassword = user.tempPassword && oldPassword === user.tempPassword;
    const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isTempPassword && !isPasswordMatch) {
      throw new BadRequestException("Old password is incorrect");
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed, tempPassword: null }, // clear temp
    });

    return { message: "✅ Password changed successfully" };
  }

  // ✅ Token refresh logic (unchanged)
  async refresh(refreshToken: string) {
    try {
      const decoded: any = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET,
      });
      const user = await this.prisma.user.findUnique({ where: { id: decoded.sub } });
      if (!user) throw new UnauthorizedException("User not found for refresh token");

      return this.login({ id: user.id, email: user.email, role: user.role });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }
}
