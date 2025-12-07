'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import UserSelect from '@/components/UserSelect';

interface User {
    id: string;
    email: string;
    name: string;
    status: string;
    role: string;
    points: number;
    createdAt: string;
}

interface Transaction {
    id: string;
    userId: string;
    amount: number;
    type: string;
    description: string;
    createdAt: string;
    user?: User;
}

interface PurchaseRequest {
    id: string;
    userId: string;
    amount: number;
    description: string;
    status: string;
    adminNotes?: string;
    createdAt: string;
    updatedAt: string;
    user?: User;
    processedBy?: User;
}

export default function AdminPage() {
    const [user, setUser] = useState<any>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [addPointsDialog, setAddPointsDialog] = useState(false);
    const [deductPointsDialog, setDeductPointsDialog] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [pointsAmount, setPointsAmount] = useState('');
    const [pointsDescription, setPointsDescription] = useState('');
    const [adminNotes, setAdminNotes] = useState('');

    const fetchProfile = async () => {
        try {
            const res = await api.get('/auth/profile');
            setUser(res.data);
            if (res.data.role !== 'admin') {
                toast.error('Access denied. Admin only.');
                window.location.href = '/dashboard';
            }
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 403) {
                toast.error('Access denied. Admin only.');
                window.location.href = '/dashboard';
            }
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users/admin/all');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load users');
        }
    };

    const fetchTransactions = async () => {
        try {
            const res = await api.get('/payments/admin/transactions');
            setTransactions(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load transactions');
        }
    };

    const fetchPurchaseRequests = async () => {
        try {
            const res = await api.get('/payments/admin/purchase-requests');
            setPurchaseRequests(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load purchase requests');
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await fetchProfile();
            await fetchUsers();
            await fetchTransactions();
            await fetchPurchaseRequests();
            setLoading(false);
        };
        loadData();
    }, []);

    const handleAddPoints = async () => {
        if (!selectedUserId || !pointsAmount) {
            toast.error('Please fill all fields');
            return;
        }
        try {
            await api.post('/payments/admin/add-points', {
                userId: selectedUserId,
                amount: Number(pointsAmount),
                description: pointsDescription || 'Admin adjustment',
            });
            toast.success(`Successfully added ${pointsAmount} points!`);
            setAddPointsDialog(false);
            setSelectedUserId('');
            setPointsAmount('');
            setPointsDescription('');
            await fetchUsers();
            await fetchTransactions();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to add points');
        }
    };

    const handleDeductPoints = async () => {
        if (!selectedUserId || !pointsAmount) {
            toast.error('Please fill all fields');
            return;
        }
        try {
            await api.post('/payments/admin/deduct-points', {
                userId: selectedUserId,
                amount: Number(pointsAmount),
                description: pointsDescription || 'Admin adjustment',
            });
            toast.success(`Successfully deducted ${pointsAmount} points!`);
            setDeductPointsDialog(false);
            setSelectedUserId('');
            setPointsAmount('');
            setPointsDescription('');
            await fetchUsers();
            await fetchTransactions();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to deduct points');
        }
    };

    const handleApproveRequest = async (requestId: string) => {
        try {
            await api.post(`/payments/admin/purchase-requests/${requestId}/approve`, {
                adminNotes: adminNotes || undefined,
            });
            toast.success('Purchase request approved!');
            setAdminNotes('');
            await fetchPurchaseRequests();
            await fetchUsers();
            await fetchTransactions();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to approve request');
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        try {
            await api.post(`/payments/admin/purchase-requests/${requestId}/reject`, {
                adminNotes: adminNotes || undefined,
            });
            toast.success('Purchase request rejected');
            setAdminNotes('');
            await fetchPurchaseRequests();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to reject request');
        }
    };

    if (loading) return <div className="container mx-auto py-10">Loading...</div>;
    if (!user || user.role !== 'admin') return null;

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold">Admin Panel</h1>
                <p className="text-xl text-muted-foreground">Manage users and currency</p>
            </div>

            <Tabs defaultValue="users" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="requests">Purchase Requests</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-4">
                    <div className="flex gap-4 mb-4">
                        <Dialog open={addPointsDialog} onOpenChange={setAddPointsDialog}>
                            <DialogTrigger asChild>
                                <Button>Add Points</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Points to User</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <UserSelect
                                        users={users}
                                        value={selectedUserId}
                                        onChange={setSelectedUserId}
                                        label="User Email"
                                        id="userId"
                                        placeholder="Select user..."
                                    />
                                    <div>
                                        <Label htmlFor="amount">Amount</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            value={pointsAmount}
                                            onChange={(e) => setPointsAmount(e.target.value)}
                                            placeholder="Enter amount"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="description">Description (optional)</Label>
                                        <Textarea
                                            id="description"
                                            value={pointsDescription}
                                            onChange={(e) => setPointsDescription(e.target.value)}
                                            placeholder="Enter description"
                                        />
                                    </div>
                                    <Button onClick={handleAddPoints} className="w-full">Add Points</Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={deductPointsDialog} onOpenChange={setDeductPointsDialog}>
                            <DialogTrigger asChild>
                                <Button variant="destructive">Deduct Points</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Deduct Points from User</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <UserSelect
                                        users={users}
                                        value={selectedUserId}
                                        onChange={setSelectedUserId}
                                        label="User Email"
                                        id="userId-deduct"
                                        placeholder="Select user..."
                                    />
                                    <div>
                                        <Label htmlFor="amount-deduct">Amount</Label>
                                        <Input
                                            id="amount-deduct"
                                            type="number"
                                            value={pointsAmount}
                                            onChange={(e) => setPointsAmount(e.target.value)}
                                            placeholder="Enter amount"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="description-deduct">Description (optional)</Label>
                                        <Textarea
                                            id="description-deduct"
                                            value={pointsDescription}
                                            onChange={(e) => setPointsDescription(e.target.value)}
                                            placeholder="Enter description"
                                        />
                                    </div>
                                    <Button onClick={handleDeductPoints} variant="destructive" className="w-full">Deduct Points</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid gap-4">
                        {users.map((u) => (
                            <Card key={u.id}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle>{u.name || 'No name'}</CardTitle>
                                            <CardDescription>{u.email}</CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                                                {u.role}
                                            </Badge>
                                            <Badge variant={u.status === 'premium' ? 'default' : 'outline'}>
                                                {u.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Points</p>
                                            <p className="text-2xl font-bold">{u.points}</p>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Joined: {new Date(u.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="requests" className="space-y-4">
                    <div className="grid gap-4">
                        {purchaseRequests.filter(r => r.status === 'pending').length === 0 && purchaseRequests.length > 0 ? (
                            <Card>
                                <CardContent className="pt-6 text-center text-muted-foreground">
                                    No pending purchase requests
                                </CardContent>
                            </Card>
                        ) : purchaseRequests.length === 0 ? (
                            <Card>
                                <CardContent className="pt-6 text-center text-muted-foreground">
                                    No purchase requests yet
                                </CardContent>
                            </Card>
                        ) : (
                            purchaseRequests.map((request) => (
                                <Card key={request.id}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle>{request.amount} Points</CardTitle>
                                                <CardDescription>
                                                    {request.user?.email || request.userId}
                                                    {request.user?.name && ` (${request.user.name})`}
                                                </CardDescription>
                                            </div>
                                            <Badge
                                                variant={
                                                    request.status === 'pending' ? 'outline' :
                                                    request.status === 'approved' ? 'default' : 'destructive'
                                                }
                                            >
                                                {request.status}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <p className="text-sm">
                                                <span className="font-semibold">Description:</span> {request.description || 'No description'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Created: {new Date(request.createdAt).toLocaleString()}
                                            </p>
                                            {request.adminNotes && (
                                                <p className="text-sm">
                                                    <span className="font-semibold">Admin Notes:</span> {request.adminNotes}
                                                </p>
                                            )}
                                            {request.processedBy && (
                                                <p className="text-xs text-muted-foreground">
                                                    Processed by: {request.processedBy.email}
                                                </p>
                                            )}
                                            {request.status === 'pending' && (
                                                <div className="flex gap-2 mt-4">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                size="sm"
                                                                variant="default"
                                                                onClick={() => setAdminNotes('')}
                                                            >
                                                                Approve
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Approve Purchase Request</DialogTitle>
                                                            </DialogHeader>
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <Label>Admin Notes (optional)</Label>
                                                                    <Textarea
                                                                        value={adminNotes}
                                                                        onChange={(e) => setAdminNotes(e.target.value)}
                                                                        placeholder="Enter notes..."
                                                                    />
                                                                </div>
                                                                <Button
                                                                    onClick={() => handleApproveRequest(request.id)}
                                                                    className="w-full"
                                                                >
                                                                    Approve Request
                                                                </Button>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => setAdminNotes('')}
                                                            >
                                                                Reject
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Reject Purchase Request</DialogTitle>
                                                            </DialogHeader>
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <Label>Admin Notes (optional)</Label>
                                                                    <Textarea
                                                                        value={adminNotes}
                                                                        onChange={(e) => setAdminNotes(e.target.value)}
                                                                        placeholder="Enter reason for rejection..."
                                                                    />
                                                                </div>
                                                                <Button
                                                                    onClick={() => handleRejectRequest(request.id)}
                                                                    variant="destructive"
                                                                    className="w-full"
                                                                >
                                                                    Reject Request
                                                                </Button>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4">
                    <div className="grid gap-4">
                        {transactions.map((t) => (
                            <Card key={t.id}>
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">
                                                {t.user?.email || t.userId}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {t.description || 'No description'}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(t.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <Badge
                                                variant={t.amount > 0 ? 'default' : 'destructive'}
                                            >
                                                {t.amount > 0 ? '+' : ''}{t.amount}
                                            </Badge>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {t.type}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

