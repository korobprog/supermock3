import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum CardStatus {
    OPEN = 'open',
    MATCHED = 'matched',
    COMPLETED = 'completed',
}

@Entity()
export class Card {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    profession: string;

    @Column('simple-array')
    skills: string[];

    @Column({ type: 'timestamp' })
    datetime: Date;

    @Column({
        type: 'enum',
        enum: CardStatus,
        default: CardStatus.OPEN,
    })
    status: CardStatus;

    @ManyToOne(() => User, (user) => user.id)
    @JoinColumn({ name: 'ownerId' })
    owner: User;

    @Column()
    ownerId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
