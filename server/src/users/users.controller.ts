import { Controller, Post, Body, Get, UseGuards, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get()
    findAll() {
        // This is just a placeholder, we might not want to expose all users
        return [];
    }

    // Admin endpoints
    @UseGuards(AuthGuard('jwt'), AdminGuard)
    @Get('admin/all')
    getAllUsers() {
        return this.usersService.findAll();
    }

    @UseGuards(AuthGuard('jwt'), AdminGuard)
    @Get('admin/:id')
    getUserById(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }
}
