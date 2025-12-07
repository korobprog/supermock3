import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Card } from '../../cards/entities/card.entity';

export enum MatchStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    COMPLETED = 'completed',
    REJECTED = 'rejected',
    CANCELLED = 'cancelled',
}

@Entity()
export class Match {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Card)
    @JoinColumn({ name: 'cardId' })
    card: Card;

    @Column()
    cardId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'requesterId' })
    requester: User;

    @Column()
    requesterId: string;

    @Column({
        type: 'enum',
        enum: MatchStatus,
        default: MatchStatus.PENDING,
    })
    status: MatchStatus;

    @Column({ nullable: true })
    rating: number;

    @Column({ nullable: true })
    feedback: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
