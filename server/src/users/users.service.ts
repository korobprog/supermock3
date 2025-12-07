import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async create(createUserDto: CreateUserDto): Promise<User> {
        const user = this.usersRepository.create(createUserDto);
        return this.usersRepository.save(user);
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email }, select: ['id', 'email', 'password', 'name', 'status', 'role', 'points'] });
    }

    async findOne(id: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id } });
    }

    async findAll(): Promise<User[]> {
        return this.usersRepository.find({
            select: ['id', 'email', 'name', 'avatar', 'status', 'role', 'points', 'subscriptionExpiresAt', 'createdAt', 'updatedAt'],
        });
    }

    async updatePoints(userId: string, points: number): Promise<User> {
        const user = await this.findOne(userId);
        if (!user) {
            throw new Error('User not found');
        }
        user.points = points;
        return this.usersRepository.save(user);
    }
}
