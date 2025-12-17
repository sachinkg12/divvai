import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { User, UserProfile } from '@divvai/shared';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('profile')
  @UseGuards(AuthGuard)
  async getProfile(@CurrentUser() user: User): Promise<{ data: UserProfile }> {
    const profile = await this.authService.getProfile(user.id);
    return { data: profile };
  }
}

