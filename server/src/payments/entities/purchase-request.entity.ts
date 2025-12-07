import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum PurchaseRequestStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

@Entity()
export class PurchaseRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @Column()
    amount: number;

    @Column({ nullable: true })
    description: string;

    @Column({
        type: 'enum',
        enum: PurchaseRequestStatus,
        default: PurchaseRequestStatus.PENDING,
    })
    status: PurchaseRequestStatus;

    @Column({ nullable: true })
    adminNotes: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'processedBy' })
    processedBy: User;

    @Column({ nullable: true })
    processedById: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

