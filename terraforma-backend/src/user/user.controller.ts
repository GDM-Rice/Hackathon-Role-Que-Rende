import { Body, Controller, Delete, Get, Patch, Post } from '@nestjs/common';
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

  @Patch('me')
  updateMe(@CurrentUser('sub') userId: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(userId, dto);
  }

  @Delete('me')
  removeMe(@CurrentUser('sub') userId: string) {
    return this.userService.remove(userId);
  }
}
