'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Calendar, User, Briefcase } from 'lucide-react';

export default function Dashboard() {
    const [user, setUser] = useState<any>(null);
    const [matches, setMatches] = useState<any[]>([]);
    const router = useRouter();

    const fetchData = async () => {
        try {
            const [profileRes, matchesRes] = await Promise.all([
                api.get('/auth/profile'),
                api.get('/matches')
            ]);
            setUser(profileRes.data);
            setMatches(matchesRes.data);
        } catch (err) {
            router.push('/auth');
        }
    };

    useEffect(() => {
        fetchData();
    }, [router]);

    const handleConfirmMatch = async (matchId: string) => {
        try {
            await api.patch(`/matches/${matchId}/confirm`);
            toast.success('Match confirmed!');
            // Refresh matches
            const matchesRes = await api.get('/matches');
            setMatches(matchesRes.data);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to confirm match');
        }
    };

    const handleCancelMatch = async (matchId: string) => {
        if (!confirm('Are you sure you want to cancel this match?')) {
            return;
        }
        try {
            await api.patch(`/matches/${matchId}/cancel`);
            toast.success('Match cancelled!');
            // Refresh matches
            const matchesRes = await api.get('/matches');
            setMatches(matchesRes.data);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to cancel match');
        }
    };

    if (!user) return <div>Loading...</div>;

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-3xl font-bold">{user.name}</h1>
                    <p className="text-muted-foreground">{user.email}</p>
                    <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{user.status || 'Free Plan'}</Badge>
                        <Badge variant="secondary">{user.points || 0} Points</Badge>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="matches" className="w-full">
                <TabsList>
                    <TabsTrigger value="matches">My Matches</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="matches" className="space-y-4">
                    <h2 className="text-xl font-semibold mt-4">Match Requests</h2>
                    {(() => {
                        const activeMatches = matches.filter(m => m.status !== 'cancelled' && m.status !== 'completed');
                        return activeMatches.length === 0 ? (
                            <p className="text-muted-foreground">No active matches found.</p>
                        ) : (
                            <div className="grid gap-4">
                                {activeMatches.map((match) => (
                                    <Card key={match.id}>
                                    <CardHeader>
                                        <CardTitle className="flex justify-between items-center">
                                            <span>Match for {match.card.profession}</span>
                                            <Badge>{match.status}</Badge>
                                        </CardTitle>
                                        <CardDescription>
                                            Requested by {match.requester.name} on {new Date(match.createdAt).toLocaleDateString()}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {match.status === 'confirmed' && (
                                                <div className="bg-muted p-3 rounded-md text-sm">
                                                    <p className="font-semibold mb-1">Contact Info:</p>
                                                    {match.requesterId === user.id ? (
                                                        // User is requester, show owner contacts
                                                        match.card.owner.contacts ? (
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {Object.entries(match.card.owner.contacts).map(([platform, handle]) => (
                                                                    <div key={platform}>
                                                                        <span className="capitalize text-muted-foreground">{platform}: </span>
                                                                        <span>{handle as string}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : <p>No contacts shared.</p>
                                                    ) : (
                                                        // User is owner, show requester contacts
                                                        match.requester.contacts ? (
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {Object.entries(match.requester.contacts).map(([platform, handle]) => (
                                                                    <div key={platform}>
                                                                        <span className="capitalize text-muted-foreground">{platform}: </span>
                                                                        <span>{handle as string}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : <p>No contacts shared.</p>
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex justify-end gap-2">
                                                {match.status === 'pending' && match.card.ownerId === user.id && (
                                                    <>
                                                        <Button onClick={() => handleConfirmMatch(match.id)}>Confirm Match</Button>
                                                        <Button variant="destructive" onClick={() => handleCancelMatch(match.id)}>Cancel</Button>
                                                    </>
                                                )}
                                                {match.status === 'pending' && match.requesterId === user.id && (
                                                    <Button variant="destructive" onClick={() => handleCancelMatch(match.id)}>Cancel Match</Button>
                                                )}
                                                {match.status === 'confirmed' && (
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="outline">Rate & Review</Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Rate Interview</DialogTitle>
                                                                <DialogDescription>
                                                                    How was your experience? Please provide a rating and feedback.
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <form onSubmit={(e) => {
                                                                e.preventDefault();
                                                                const formData = new FormData(e.currentTarget);
                                                                const rating = Number(formData.get('rating'));
                                                                const feedback = formData.get('feedback') as string;
                                                                api.patch(`/matches/${match.id}`, { rating, feedback })
                                                                    .then(() => {
                                                                        toast.success('Rating submitted');
                                                                        fetchData(); // Refresh data
                                                                    })
                                                                    .catch(() => toast.error('Failed to submit rating'));
                                                            }}>
                                                                <div className="grid gap-4 py-4">
                                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                                        <Label htmlFor="rating" className="text-right">Rating</Label>
                                                                        <Input id="rating" name="rating" type="number" min="1" max="5" required className="col-span-3" />
                                                                    </div>
                                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                                        <Label htmlFor="feedback" className="text-right">Feedback</Label>
                                                                        <Textarea id="feedback" name="feedback" className="col-span-3" />
                                                                    </div>
                                                                </div>
                                                                <DialogFooter>
                                                                    <Button type="submit">Submit</Button>
                                                                </DialogFooter>
                                                            </form>
                                                        </DialogContent>
                                                    </Dialog>
                                                )}
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline">View Details</Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                                        <DialogHeader>
                                                            <DialogTitle>Match Details</DialogTitle>
                                                            <DialogDescription>
                                                                Detailed information about this interview match
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-6 py-4">
                                                            {/* Card Information */}
                                                            <div className="space-y-3">
                                                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                                                    <Briefcase className="w-5 h-5" />
                                                                    Interview Card
                                                                </h3>
                                                                <div className="bg-muted p-4 rounded-lg space-y-2">
                                                                    <div>
                                                                        <span className="text-sm text-muted-foreground">Profession: </span>
                                                                        <span className="font-medium">{match.card.profession}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-sm text-muted-foreground">Date & Time: </span>
                                                                        <span className="font-medium flex items-center gap-1">
                                                                            <Calendar className="w-4 h-4" />
                                                                            {format(new Date(match.card.datetime), 'PPP p')}
                                                                        </span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-sm text-muted-foreground">Skills: </span>
                                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                                            {match.card.skills?.map((skill: string) => (
                                                                                <Badge key={skill} variant="outline" className="text-xs">
                                                                                    {skill}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Participants */}
                                                            <div className="space-y-3">
                                                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                                                    <User className="w-5 h-5" />
                                                                    Participants
                                                                </h3>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    {/* Card Owner */}
                                                                    <div className="bg-muted p-4 rounded-lg">
                                                                        <div className="flex items-center gap-3 mb-2">
                                                                            <Avatar>
                                                                                <AvatarImage src={match.card.owner?.avatar} />
                                                                                <AvatarFallback>{match.card.owner?.name?.[0] || 'O'}</AvatarFallback>
                                                                            </Avatar>
                                                                            <div>
                                                                                <p className="font-medium">Card Owner</p>
                                                                                <p className="text-sm text-muted-foreground">{match.card.owner?.name || 'Unknown'}</p>
                                                                            </div>
                                                                        </div>
                                                                        {match.status === 'confirmed' && match.card.owner?.contacts && (
                                                                            <div className="mt-3 pt-3 border-t space-y-1">
                                                                                <p className="text-xs font-semibold text-muted-foreground mb-1">Contacts:</p>
                                                                                {Object.entries(match.card.owner.contacts).map(([platform, handle]) => (
                                                                                    <div key={platform} className="text-sm">
                                                                                        <span className="capitalize text-muted-foreground">{platform}: </span>
                                                                                        <span>{handle as string}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Requester */}
                                                                    <div className="bg-muted p-4 rounded-lg">
                                                                        <div className="flex items-center gap-3 mb-2">
                                                                            <Avatar>
                                                                                <AvatarImage src={match.requester?.avatar} />
                                                                                <AvatarFallback>{match.requester?.name?.[0] || 'R'}</AvatarFallback>
                                                                            </Avatar>
                                                                            <div>
                                                                                <p className="font-medium">Requester</p>
                                                                                <p className="text-sm text-muted-foreground">{match.requester?.name || 'Unknown'}</p>
                                                                            </div>
                                                                        </div>
                                                                        {match.status === 'confirmed' && match.requester?.contacts && (
                                                                            <div className="mt-3 pt-3 border-t space-y-1">
                                                                                <p className="text-xs font-semibold text-muted-foreground mb-1">Contacts:</p>
                                                                                {Object.entries(match.requester.contacts).map(([platform, handle]) => (
                                                                                    <div key={platform} className="text-sm">
                                                                                        <span className="capitalize text-muted-foreground">{platform}: </span>
                                                                                        <span>{handle as string}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Match Status & Info */}
                                                            <div className="space-y-3">
                                                                <h3 className="font-semibold text-lg">Match Information</h3>
                                                                <div className="bg-muted p-4 rounded-lg space-y-2">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-sm text-muted-foreground">Status:</span>
                                                                        <Badge variant={match.status === 'confirmed' ? 'default' : match.status === 'pending' ? 'secondary' : 'outline'}>
                                                                            {match.status}
                                                                        </Badge>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-sm text-muted-foreground">Requested on: </span>
                                                                        <span className="text-sm">{format(new Date(match.createdAt), 'PPP p')}</span>
                                                                    </div>
                                                                    {match.updatedAt && match.updatedAt !== match.createdAt && (
                                                                        <div>
                                                                            <span className="text-sm text-muted-foreground">Last updated: </span>
                                                                            <span className="text-sm">{format(new Date(match.updatedAt), 'PPP p')}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Rating & Feedback */}
                                                            {match.rating && (
                                                                <div className="space-y-3">
                                                                    <h3 className="font-semibold text-lg">Review</h3>
                                                                    <div className="bg-muted p-4 rounded-lg space-y-2">
                                                                        <div>
                                                                            <span className="text-sm text-muted-foreground">Rating: </span>
                                                                            <span className="font-medium">{match.rating}/5</span>
                                                                        </div>
                                                                        {match.feedback && (
                                                                            <div>
                                                                                <span className="text-sm text-muted-foreground">Feedback: </span>
                                                                                <p className="text-sm mt-1">{match.feedback}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </div>
                                    </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )
                    })()}
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                    <h2 className="text-xl font-semibold mt-4">History</h2>
                    {(() => {
                        const historyMatches = matches.filter(m => m.status === 'cancelled' || m.status === 'completed');
                        return historyMatches.length === 0 ? (
                            <p className="text-muted-foreground py-4">No interview history yet.</p>
                        ) : (
                            <div className="grid gap-4">
                                {historyMatches.map((match) => (
                                    <Card key={match.id}>
                                        <CardHeader>
                                            <CardTitle className="flex justify-between items-center">
                                                <span>Match for {match.card.profession}</span>
                                                <Badge variant={match.status === 'cancelled' ? 'destructive' : 'secondary'}>
                                                    {match.status}
                                                </Badge>
                                            </CardTitle>
                                            <CardDescription>
                                                {match.requesterId === user.id 
                                                    ? `You requested this match`
                                                    : `Requested by ${match.requester.name}`
                                                } on {new Date(match.createdAt).toLocaleDateString()}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {match.status === 'completed' && match.rating && (
                                                    <div className="bg-muted p-3 rounded-md text-sm">
                                                        <p className="font-semibold mb-1">Rating: {match.rating}/5</p>
                                                        {match.feedback && (
                                                            <p className="text-muted-foreground">{match.feedback}</p>
                                                        )}
                                                    </div>
                                                )}
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline">View Details</Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                                        <DialogHeader>
                                                            <DialogTitle>Match Details</DialogTitle>
                                                            <DialogDescription>
                                                                Detailed information about this interview match
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-6 py-4">
                                                            <div className="space-y-3">
                                                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                                                    <Briefcase className="w-5 h-5" />
                                                                    Interview Card
                                                                </h3>
                                                                <div className="bg-muted p-4 rounded-lg space-y-2">
                                                                    <div>
                                                                        <span className="text-sm text-muted-foreground">Profession: </span>
                                                                        <span className="font-medium">{match.card.profession}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-sm text-muted-foreground">Date & Time: </span>
                                                                        <span className="font-medium flex items-center gap-1">
                                                                            <Calendar className="w-4 h-4" />
                                                                            {format(new Date(match.card.datetime), 'PPP p')}
                                                                        </span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-sm text-muted-foreground">Skills: </span>
                                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                                            {match.card.skills?.map((skill: string) => (
                                                                                <Badge key={skill} variant="outline" className="text-xs">
                                                                                    {skill}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                                                    <User className="w-5 h-5" />
                                                                    Participants
                                                                </h3>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div className="bg-muted p-4 rounded-lg">
                                                                        <div className="flex items-center gap-3 mb-2">
                                                                            <Avatar>
                                                                                <AvatarImage src={match.card.owner?.avatar} />
                                                                                <AvatarFallback>{match.card.owner?.name?.[0] || 'O'}</AvatarFallback>
                                                                            </Avatar>
                                                                            <div>
                                                                                <p className="font-medium">Card Owner</p>
                                                                                <p className="text-sm text-muted-foreground">{match.card.owner?.name || 'Unknown'}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="bg-muted p-4 rounded-lg">
                                                                        <div className="flex items-center gap-3 mb-2">
                                                                            <Avatar>
                                                                                <AvatarImage src={match.requester?.avatar} />
                                                                                <AvatarFallback>{match.requester?.name?.[0] || 'R'}</AvatarFallback>
                                                                            </Avatar>
                                                                            <div>
                                                                                <p className="font-medium">Requester</p>
                                                                                <p className="text-sm text-muted-foreground">{match.requester?.name || 'Unknown'}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <h3 className="font-semibold text-lg">Match Information</h3>
                                                                <div className="bg-muted p-4 rounded-lg space-y-2">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-sm text-muted-foreground">Status:</span>
                                                                        <Badge variant={match.status === 'cancelled' ? 'destructive' : 'secondary'}>
                                                                            {match.status}
                                                                        </Badge>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-sm text-muted-foreground">Requested on: </span>
                                                                        <span className="text-sm">{format(new Date(match.createdAt), 'PPP p')}</span>
                                                                    </div>
                                                                    {match.updatedAt && match.updatedAt !== match.createdAt && (
                                                                        <div>
                                                                            <span className="text-sm text-muted-foreground">Last updated: </span>
                                                                            <span className="text-sm">{format(new Date(match.updatedAt), 'PPP p')}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {match.rating && (
                                                                <div className="space-y-3">
                                                                    <h3 className="font-semibold text-lg">Review</h3>
                                                                    <div className="bg-muted p-4 rounded-lg space-y-2">
                                                                        <div>
                                                                            <span className="text-sm text-muted-foreground">Rating: </span>
                                                                            <span className="font-medium">{match.rating}/5</span>
                                                                        </div>
                                                                        {match.feedback && (
                                                                            <div>
                                                                                <span className="text-sm text-muted-foreground">Feedback: </span>
                                                                                <p className="text-sm mt-1">{match.feedback}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        );
                    })()}
                </TabsContent>

                <TabsContent value="settings">
                    <p className="text-muted-foreground py-4">Account settings coming soon.</p>
                </TabsContent>
            </Tabs>
        </div>
    );
}
