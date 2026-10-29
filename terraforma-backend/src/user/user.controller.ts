import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';
import { Throttle } from '../common/limite.js';
import { CurrentUser } from '../auth/decorators/CurrentUser.decorator.js';
import { Public } from '../auth/decorators/isPublic.decorator.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserService } from './user.service.js';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Cadastro: único endpoint público deste controller.
  @Public()
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  // Todas as demais rotas atuam SOMENTE sobre o usuário do token (id vem de `sub`, nunca da URL).
  @Get('me')
  findMe(@CurrentUser('sub') userId: string) {
    return this.userService.findOne(userId);
  }

  // Limite baixo: quem tem o token não pode ficar chutando a senha atual.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Patch('me')
  updateMe(@CurrentUser('sub') userId: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(userId, dto);
  }

  // O tutorial de boas-vindas foi concluído: nos próximos logins (em qualquer aparelho) ele não aparece.
  @HttpCode(HttpStatus.OK)
  @Post('me/boas-vindas')
  concluirBoasVindas(@CurrentUser('sub') userId: string) {
    return this.userService.concluirBoasVindas(userId);
  }

  @Delete('me')
  removeMe(@CurrentUser('sub') userId: string) {
    return this.userService.remove(userId);
  }
}
