import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from '../users/users.service';

@Controller('matches')
@UseGuards(AuthGuard('jwt'))
export class MatchesController {
    constructor(
        private readonly matchesService: MatchesService,
        private readonly usersService: UsersService,
    ) { }

    @Post()
    async create(@Body() createMatchDto: CreateMatchDto, @Request() req: any) {
        // Load full User entity from database
        const user = await this.usersService.findOne(req.user.userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return this.matchesService.create(createMatchDto, user);
    }

    @Get()
    findAll(@Request() req: any) {
        return this.matchesService.findAllForUser(req.user.userId);
    }

    @Patch(':id/confirm')
    confirm(@Param('id') id: string, @Request() req: any) {
        return this.matchesService.confirm(id, req.user.userId);
    }

    @Patch(':id/cancel')
    cancel(@Param('id') id: string, @Request() req: any) {
        return this.matchesService.cancel(id, req.user.userId);
    }
}
