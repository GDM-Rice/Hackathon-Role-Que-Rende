import { Module } from '@nestjs/common';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';

@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService], // sem isto o AuthModule não consegue injetar o UserService
})
export class UserModule {}
