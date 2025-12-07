import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../users/entities/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
    constructor(private usersService: UsersService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.userId) {
            throw new ForbiddenException('User not authenticated');
        }

        const dbUser = await this.usersService.findOne(user.userId);
        
        if (!dbUser || dbUser.role !== UserRole.ADMIN) {
            throw new ForbiddenException('Admin access required');
        }

        return true;
    }
}

