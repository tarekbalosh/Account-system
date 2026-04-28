// src/auth/auth.controller.ts
import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('login')
  getLoginInfo() {
    return { 
      message: 'Authentication endpoint', 
      instruction: 'Please use POST method to login with email and password.',
      endpoint: '/api/auth/login',
      method: 'POST'
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
