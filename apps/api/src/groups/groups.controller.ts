import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GroupsService } from './groups.service';
import { CreateGroupRequest, Group, GroupWithMembers } from '@divvai/shared';
import { User } from '@divvai/shared';

@Controller('groups')
@UseGuards(AuthGuard)
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @Get()
  async getGroups(@CurrentUser() user: User): Promise<{ data: Group[] }> {
    const groups = await this.groupsService.getUserGroups(user.id);
    return { data: groups };
  }

  @Get(':id')
  async getGroup(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{ data: GroupWithMembers }> {
    const group = await this.groupsService.getGroup(id, user.id);
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return { data: group };
  }

  @Post()
  async createGroup(
    @Body() createGroupDto: CreateGroupRequest,
    @CurrentUser() user: User,
  ): Promise<{ data: Group }> {
    const group = await this.groupsService.createGroup(createGroupDto, user.id);
    return { data: group };
  }
}

