import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
} from '@nestjs/common';
import { Throttle } from '../common/limite.js';
import { UserService } from '../user/user.service.js';
import { AuthService } from './auth.service.js';
import { Public } from './decorators/isPublic.decorator.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { LoginRequestBody } from './dto/loginRequestBody.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import type { AuthenticatedRequest } from './types/authenticated-request.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // 5 por minuto
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() body: LoginRequestBody) {
    return this.authService.login(body);
  }

  @Get('me')
  getProfile(@Request() req: AuthenticatedRequest) {
    return this.userService.findOne(req.user.sub);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } }) // 3 por minuto
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return {
      message:
        'Se o email estiver cadastrado, você receberá as instruções para redefinir a senha.',
    };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.novaSenha);
    return { message: 'Senha redefinida com sucesso.' };
  }
}
