import { Controller, Get, Post, Delete, Body, UseGuards, Request, BadRequestException, Param } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('payments')
@UseGuards(AuthGuard('jwt'))
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Get('transactions')
    getTransactions(@Request() req: any) {
        return this.paymentsService.getTransactions(req.user.userId);
    }

    // TODO: Add endpoint for buying points (mock)
    @Post('buy-points')
    async buyPoints(@Request() req: any, @Body('amount') amount: number) {
        if (!amount || amount <= 0) {
            throw new BadRequestException('Amount must be a positive number');
        }
        return this.paymentsService.addPoints(req.user.userId, amount, 'Purchase');
    }

    // Admin endpoints
    @UseGuards(AdminGuard)
    @Get('admin/transactions')
    getAllTransactions() {
        return this.paymentsService.getAllTransactions();
    }

    @UseGuards(AdminGuard)
    @Get('admin/transactions/:userId')
    getTransactionsByUserId(@Param('userId') userId: string) {
        return this.paymentsService.getTransactionsByUserId(userId);
    }

    @UseGuards(AdminGuard)
    @Post('admin/add-points')
    async addPointsToUser(
        @Body('userId') userId: string,
        @Body('amount') amount: number,
        @Body('description') description?: string,
    ) {
        if (!userId) {
            throw new BadRequestException('UserId is required');
        }
        if (!amount || amount <= 0) {
            throw new BadRequestException('Amount must be a positive number');
        }
        return this.paymentsService.addPoints(userId, amount, description || 'Admin adjustment');
    }

    @UseGuards(AdminGuard)
    @Post('admin/deduct-points')
    async deductPointsFromUser(
        @Body('userId') userId: string,
        @Body('amount') amount: number,
        @Body('description') description?: string,
    ) {
        if (!userId) {
            throw new BadRequestException('UserId is required');
        }
        if (!amount || amount <= 0) {
            throw new BadRequestException('Amount must be a positive number');
        }
        return this.paymentsService.deductPoints(userId, amount, description || 'Admin adjustment');
    }

    // Purchase Request endpoints (must be before admin routes)
    @Get('purchase-requests')
    getPurchaseRequests(@Request() req: any) {
        return this.paymentsService.getPurchaseRequests(req.user.userId);
    }

    @Delete('purchase-requests/:id')
    async deletePurchaseRequest(@Param('id') id: string, @Request() req: any) {
        await this.paymentsService.deletePurchaseRequest(id, req.user.userId);
        return { message: 'Purchase request deleted successfully' };
    }

    @Post('purchase-request')
    async createPurchaseRequest(
        @Request() req: any,
        @Body('amount') amount: number,
        @Body('description') description?: string,
    ) {
        return this.paymentsService.createPurchaseRequest(req.user.userId, amount, description);
    }

    // Admin endpoints for purchase requests
    @UseGuards(AdminGuard)
    @Get('admin/purchase-requests')
    getAllPurchaseRequests() {
        return this.paymentsService.getAllPurchaseRequests();
    }

    @UseGuards(AdminGuard)
    @Post('admin/purchase-requests/:id/approve')
    async approvePurchaseRequest(
        @Param('id') id: string,
        @Request() req: any,
        @Body('adminNotes') adminNotes?: string,
    ) {
        return this.paymentsService.approvePurchaseRequest(id, req.user.userId, adminNotes);
    }

    @UseGuards(AdminGuard)
    @Post('admin/purchase-requests/:id/reject')
    async rejectPurchaseRequest(
        @Param('id') id: string,
        @Request() req: any,
        @Body('adminNotes') adminNotes?: string,
    ) {
        return this.paymentsService.rejectPurchaseRequest(id, req.user.userId, adminNotes);
    }
}
