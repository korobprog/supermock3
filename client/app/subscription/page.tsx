'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PurchaseRequest {
    id: string;
    amount: number;
    description: string;
    status: string;
    adminNotes?: string;
    createdAt: string;
    updatedAt: string;
}

export default function SubscriptionPage() {
    const [user, setUser] = useState<any>(null);
    const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/auth/profile');
            setUser(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchPurchaseRequests = async () => {
        try {
            console.log('Fetching purchase requests from:', api.defaults.baseURL + '/payments/purchase-requests');
            const res = await api.get('/payments/purchase-requests');
            setPurchaseRequests(res.data);
        } catch (err: any) {
            console.error('Error fetching purchase requests:', err);
            console.error('Response status:', err.response?.status);
            console.error('Response data:', err.response?.data);
            // If 404 or 401, set empty array (user might not be logged in or no requests yet)
            if (err.response?.status === 404 || err.response?.status === 401) {
                setPurchaseRequests([]);
            }
        }
    };

    useEffect(() => {
        fetchProfile();
        fetchPurchaseRequests();
    }, []);

    const handleRequestPoints = async (amount: number, description?: string) => {
        try {
            await api.post('/payments/purchase-request', { amount, description });
            toast.success(`Purchase request for ${amount} points submitted! Admin will review it.`);
            fetchPurchaseRequests();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to submit request');
        }
    };

    const handleDeleteRequest = async (requestId: string) => {
        if (!confirm('Are you sure you want to delete this request?')) {
            return;
        }
        try {
            await api.delete(`/payments/purchase-requests/${requestId}`);
            toast.success('Purchase request deleted successfully');
            fetchPurchaseRequests();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete request');
        }
    };

    if (!user) return <div>Loading...</div>;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="h-4 w-4 text-yellow-500" />;
            case 'approved':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'rejected':
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return null;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline" className="text-yellow-600">Pending</Badge>;
            case 'approved':
                return <Badge variant="default" className="bg-green-500">Approved</Badge>;
            case 'rejected':
                return <Badge variant="destructive">Rejected</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold">Upgrade Your Experience</h1>
                <p className="text-xl text-muted-foreground">Get more matches and unlock premium features.</p>
                <div className="flex justify-center items-center gap-4">
                    <span className="text-lg">Current Balance:</span>
                    <Badge variant="secondary" className="text-lg px-4 py-1">{user.points || 0} Points</Badge>
                </div>
            </div>

            <Tabs defaultValue="plans" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="plans">Plans</TabsTrigger>
                    <TabsTrigger value="requests">My Requests</TabsTrigger>
                </TabsList>

                <TabsContent value="plans">
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {/* Free Plan */}
                <Card>
                    <CardHeader>
                        <CardTitle>Free</CardTitle>
                        <CardDescription>For casual practice</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="text-3xl font-bold">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                        <ul className="space-y-2 pt-4">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 3 Matches</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Basic Profile</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full" disabled>Current Plan</Button>
                    </CardFooter>
                </Card>

                {/* Points Pack */}
                <Card className="border-primary relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-bl-lg">POPULAR</div>
                    <CardHeader>
                        <CardTitle>Points Pack</CardTitle>
                        <CardDescription>Pay as you go</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="text-3xl font-bold">$2<span className="text-sm font-normal text-muted-foreground">/week</span></div>
                        <ul className="space-y-2 pt-4">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 100 Points</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> ~10 Matches</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> No Expiration</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={() => handleRequestPoints(100, 'Points Pack - 100 points')}>Request 100 Points</Button>
                    </CardFooter>
                </Card>

                {/* Premium Plan */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pro</CardTitle>
                        <CardDescription>For serious candidates</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="text-3xl font-bold">$6<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                        <ul className="space-y-2 pt-4">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Unlimited Matches</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Priority Support</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Advanced Analytics</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" variant="secondary" onClick={() => toast.info('Subscriptions coming soon!')}>Subscribe</Button>
                    </CardFooter>
                </Card>
                    </div>
                </TabsContent>

                <TabsContent value="requests" className="space-y-4">
                    <div className="max-w-4xl mx-auto">
                        {purchaseRequests.length === 0 ? (
                            <Card>
                                <CardContent className="pt-6 text-center text-muted-foreground">
                                    No purchase requests yet
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {purchaseRequests.map((request) => (
                                    <Card key={request.id}>
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="flex items-center gap-2">
                                                        {getStatusIcon(request.status)}
                                                        {request.amount} Points
                                                    </CardTitle>
                                                    <CardDescription>
                                                        {request.description || 'No description'}
                                                    </CardDescription>
                                                </div>
                                                {getStatusBadge(request.status)}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                <div className="text-sm text-muted-foreground">
                                                    Created: {new Date(request.createdAt).toLocaleString()}
                                                </div>
                                                {request.adminNotes && (
                                                    <div className="text-sm">
                                                        <span className="font-semibold">Admin Notes:</span> {request.adminNotes}
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                        {request.status === 'pending' && (
                                            <CardFooter>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDeleteRequest(request.id)}
                                                    className="w-full"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete Request
                                                </Button>
                                            </CardFooter>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
