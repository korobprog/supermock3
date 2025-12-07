import { format } from 'date-fns';
import { Card as ShadcnCard, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CalendarIcon, CheckCircle2, Clock, XCircle, Handshake, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';

interface CardProps {
    card: {
        id: string;
        profession: string;
        skills: string[];
        datetime: string;
        owner: {
            id?: string;
            name: string;
            avatar?: string;
        };
        ownerId?: string;
    };
    currentUserId?: string;
}

interface Match {
    id: string;
    cardId: string;
    requesterId: string;
    status: 'pending' | 'confirmed' | 'cancelled';
}

const FREE_PLAN_MATCH_LIMIT = 3;

export default function Card({ card, currentUserId }: CardProps) {
    const [match, setMatch] = useState<Match | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingMatch, setIsCheckingMatch] = useState(true);
    const [showMutualMatchDialog, setShowMutualMatchDialog] = useState(false);
    const [userCards, setUserCards] = useState<any[]>([]);
    const [userInfo, setUserInfo] = useState<{ status?: string; matchCount?: number } | null>(null);

    const isOwnCard = currentUserId && (card.ownerId === currentUserId || card.owner?.id === currentUserId);

    // Проверяем существующие матчи при загрузке
    useEffect(() => {
        const checkExistingMatch = async () => {
            if (!currentUserId || isOwnCard) {
                setIsCheckingMatch(false);
                return;
            }

            try {
                const [matchesRes, cardsRes, profileRes] = await Promise.all([
                    api.get('/matches'),
                    api.get('/cards').catch(() => ({ data: [] })), // Получаем карточки пользователя для взаимного матчинга
                    api.get('/auth/profile').catch(() => ({ data: null })) // Получаем информацию о пользователе
                ]);
                const userMatches = matchesRes.data as Match[];
                const existingMatch = userMatches.find(
                    (m: Match) => m.cardId === card.id
                );
                setMatch(existingMatch || null);
                
                // Фильтруем только открытые карточки пользователя
                const openUserCards = cardsRes.data.filter((c: any) => 
                    c.ownerId === currentUserId && c.status === 'open'
                );
                setUserCards(openUserCards);
                
                // Сохраняем информацию о пользователе и считаем матчи
                if (profileRes.data) {
                    const userMatchCount = userMatches.filter(m => m.requesterId === currentUserId).length;
                    setUserInfo({
                        status: profileRes.data.status || 'free',
                        matchCount: userMatchCount
                    });
                }
            } catch (err) {
                // Если не авторизован или ошибка, просто не показываем статус
                setMatch(null);
            } finally {
                setIsCheckingMatch(false);
            }
        };

        checkExistingMatch();
    }, [currentUserId, card.id, isOwnCard]);

    const handleRequestMatch = () => {
        if (match || !currentUserId) return;
        
        // Проверяем лимит для Free пользователей
        if (userInfo?.status === 'free' && userInfo.matchCount !== undefined && userInfo.matchCount >= FREE_PLAN_MATCH_LIMIT) {
            toast.error(
                `Free plan limit reached. You can create up to ${FREE_PLAN_MATCH_LIMIT} matches. Upgrade to Pro for unlimited matches.`,
                {
                    action: {
                        label: 'Upgrade',
                        onClick: () => window.location.href = '/subscription'
                    },
                    duration: 5000
                }
            );
            return;
        }
        
        setShowMutualMatchDialog(true);
    };

    const handleConfirmMutualMatch = async () => {
        if (!currentUserId) return;

        setIsLoading(true);
        setShowMutualMatchDialog(false);
        
        try {
            await api.post('/matches', { cardId: card.id });
            // Обновляем состояние матча
            setMatch({
                id: '', // ID будет получен с сервера, но для UI это не критично
                cardId: card.id,
                requesterId: currentUserId,
                status: 'pending',
            });
            toast.success('Match request sent successfully! Remember: this is a mutual match - you should also be ready to conduct an interview for this person.');
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to send request';
            console.error('Error creating match:', err.response?.data);
            
            // Если ошибка "уже отправлен", обновляем состояние
            if (errorMessage.includes('already sent') || errorMessage.includes('Match request already sent')) {
                setMatch({
                    id: '',
                    cardId: card.id,
                    requesterId: currentUserId,
                    status: 'pending',
                });
                toast.info('Match request already sent');
            } else if (errorMessage.includes('limit reached') || errorMessage.includes('Free plan limit')) {
                // Ошибка лимита - показываем с предложением апгрейда
                toast.error(errorMessage, {
                    action: {
                        label: 'Upgrade to Pro',
                        onClick: () => window.location.href = '/subscription'
                    },
                    duration: 6000
                });
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const getMatchButton = () => {
        if (isOwnCard) {
            return (
                <Button size="sm" variant="outline" disabled>
                    Your Card
                </Button>
            );
        }

        if (isCheckingMatch) {
            return (
                <Button size="sm" disabled>
                    Loading...
                </Button>
            );
        }

        if (match) {
            switch (match.status) {
                case 'pending':
                    return (
                        <Button size="sm" variant="outline" disabled className="gap-1">
                            <Clock className="w-3 h-3" />
                            Pending
                        </Button>
                    );
                case 'confirmed':
                    return (
                        <Button size="sm" variant="default" disabled className="gap-1 bg-green-600 hover:bg-green-600">
                            <CheckCircle2 className="w-3 h-3" />
                            Confirmed
                        </Button>
                    );
                case 'cancelled':
                    return (
                        <Button size="sm" variant="outline" disabled className="gap-1">
                            <XCircle className="w-3 h-3" />
                            Cancelled
                        </Button>
                    );
                default:
                    return (
                        <Button size="sm" onClick={handleRequestMatch} disabled={isLoading}>
                            {isLoading ? 'Sending...' : 'Request Match'}
                        </Button>
                    );
            }
        }

        return (
            <>
                <Button size="sm" onClick={handleRequestMatch} disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Request Match'}
                </Button>
                <Dialog open={showMutualMatchDialog} onOpenChange={setShowMutualMatchDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Handshake className="w-5 h-5" />
                                Mutual Matching Agreement
                            </DialogTitle>
                            <DialogDescription>
                                Before requesting this match, please understand our mutual matching principle.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="bg-muted p-4 rounded-lg space-y-2">
                                <p className="font-semibold">What is Mutual Matching?</p>
                                <p className="text-sm text-muted-foreground">
                                    When you request a match with <span className="font-medium">{card.owner.name}</span>, 
                                    you are agreeing to participate in a <strong>mutual interview exchange</strong>.
                                </p>
                                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                    <li>You will interview {card.owner.name} for their <strong>{card.profession}</strong> position</li>
                                    <li>{card.owner.name} will also interview you (if you have an open card)</li>
                                    <li>Both parties benefit from practice and feedback</li>
                                </ul>
                            </div>
                            {userCards.length === 0 && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg">
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                        <strong>Note:</strong> You don't have any open interview cards. 
                                        Consider creating one so others can also request matches with you!
                                    </p>
                                </div>
                            )}
                            {userCards.length > 0 && (
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded-lg">
                                    <p className="text-sm text-green-800 dark:text-green-200">
                                        <strong>Great!</strong> You have {userCards.length} open card{userCards.length > 1 ? 's' : ''} available for mutual matching.
                                    </p>
                                </div>
                            )}
                            {userInfo?.status === 'free' && userInfo.matchCount !== undefined && (
                                <div className={`border p-3 rounded-lg flex items-start gap-2 ${
                                    userInfo.matchCount >= FREE_PLAN_MATCH_LIMIT
                                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                        : userInfo.matchCount >= FREE_PLAN_MATCH_LIMIT - 1
                                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                }`}>
                                    <AlertCircle className={`w-5 h-5 mt-0.5 ${
                                        userInfo.matchCount >= FREE_PLAN_MATCH_LIMIT
                                            ? 'text-red-600 dark:text-red-400'
                                            : userInfo.matchCount >= FREE_PLAN_MATCH_LIMIT - 1
                                            ? 'text-yellow-600 dark:text-yellow-400'
                                            : 'text-blue-600 dark:text-blue-400'
                                    }`} />
                                    <div className="flex-1">
                                        <p className={`text-sm font-semibold ${
                                            userInfo.matchCount >= FREE_PLAN_MATCH_LIMIT
                                                ? 'text-red-800 dark:text-red-200'
                                                : userInfo.matchCount >= FREE_PLAN_MATCH_LIMIT - 1
                                                ? 'text-yellow-800 dark:text-yellow-200'
                                                : 'text-blue-800 dark:text-blue-200'
                                        }`}>
                                            {userInfo.matchCount >= FREE_PLAN_MATCH_LIMIT
                                                ? `You've reached the Free plan limit (${FREE_PLAN_MATCH_LIMIT} matches)`
                                                : `You have ${FREE_PLAN_MATCH_LIMIT - userInfo.matchCount} match${FREE_PLAN_MATCH_LIMIT - userInfo.matchCount > 1 ? 'es' : ''} remaining on Free plan`
                                            }
                                        </p>
                                        {userInfo.matchCount >= FREE_PLAN_MATCH_LIMIT && (
                                            <Link href="/subscription" className="text-sm text-red-600 dark:text-red-400 hover:underline mt-1 inline-block">
                                                Upgrade to Pro for unlimited matches →
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowMutualMatchDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleConfirmMutualMatch} disabled={isLoading}>
                                {isLoading ? 'Sending...' : 'I Agree - Request Match'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        );
    };

    return (
        <ShadcnCard className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-bold text-primary">{card.profession}</CardTitle>
                    <Badge variant="secondary" className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {format(new Date(card.datetime), 'MMM d, HH:mm')}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    {card.skills.map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                        </Badge>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center pt-4 border-t">
                <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                        <AvatarImage src={card.owner.avatar} />
                        <AvatarFallback>{card.owner.name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-muted-foreground">{card.owner.name || 'Unknown'}</span>
                </div>
                {getMatchButton()}
            </CardFooter>
        </ShadcnCard>
    );
}
