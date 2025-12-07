import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserStatus {
    FREE = 'free',
    PREMIUM = 'premium',
}

export enum UserRole {
    USER = 'user',
    ADMIN = 'admin',
}

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ select: false }) // Don't return password by default
    password: string;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    avatar: string;

    @Column('simple-json', { nullable: true, select: false })
    contacts: {
        telegram?: string;
        whatsapp?: string;
        discord?: string;
    };

    @Column('simple-array', { nullable: true })
    professions: string[];

    @Column('simple-array', { nullable: true })
    skills: string[];

    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.FREE,
    })
    status: UserStatus;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.USER,
    })
    role: UserRole;

    @Column({ default: 0 })
    points: number;

    @Column({ type: 'timestamp', nullable: true })
    subscriptionExpiresAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
