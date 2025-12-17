import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Group, GroupWithMembers, CreateGroupRequest } from '@divvai/shared';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async getUserGroups(userId: string): Promise<Group[]> {
    const memberships = await this.prisma.groupMember.findMany({
      where: { userId },
      include: { group: true },
    });

    return memberships.map((m) => ({
      ...m.group,
      description: m.group.description ?? undefined,
    })) as Group[];
  }

  async getGroup(groupId: string, userId: string): Promise<GroupWithMembers | null> {
    // Verify user is a member
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!group) {
      return null;
    }

    return {
      ...group,
      description: group.description ?? undefined,
      memberCount: group.members.length,
    } as GroupWithMembers;
  }

  async createGroup(
    createGroupDto: CreateGroupRequest,
    userId: string,
  ): Promise<Group> {
    const group = await this.prisma.group.create({
      data: {
        name: createGroupDto.name,
        description: createGroupDto.description,
        createdBy: userId,
        members: {
          create: {
            userId,
            role: 'owner',
          },
        },
      },
    });

    // Add additional members if provided
    if (createGroupDto.memberIds && createGroupDto.memberIds.length > 0) {
      await this.prisma.groupMember.createMany({
        data: createGroupDto.memberIds.map((memberId) => ({
          groupId: group.id,
          userId: memberId,
          role: 'member',
        })),
        skipDuplicates: true,
      });
    }

    return {
      ...group,
      description: group.description ?? undefined,
    } as Group;
  }
}

