'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { User, Mail, Calendar, Award, Edit2, Save, X } from 'lucide-react';
import { format } from 'date-fns';

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { register, handleSubmit, setValue, watch } = useForm();

    const fetchProfile = async () => {
        try {
            const response = await api.get('/auth/profile');
            setUser(response.data);
            // Заполняем форму данными пользователя
            setValue('name', response.data.name || '');
            setValue('professions', response.data.professions?.join(', ') || '');
            setValue('skills', response.data.skills?.join(', ') || '');
            setValue('telegram', response.data.contacts?.telegram || '');
            setValue('whatsapp', response.data.contacts?.whatsapp || '');
            setValue('discord', response.data.contacts?.discord || '');
        } catch (err: any) {
            if (err.response?.status === 401) {
                router.push('/auth');
            } else {
                toast.error('Failed to load profile');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const onSubmit = async (data: any) => {
        try {
            const updateData = {
                name: data.name,
                professions: data.professions ? data.professions.split(',').map((p: string) => p.trim()).filter(Boolean) : [],
                skills: data.skills ? data.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
                contacts: {
                    telegram: data.telegram || undefined,
                    whatsapp: data.whatsapp || undefined,
                    discord: data.discord || undefined,
                },
            };

            // TODO: Добавить эндпоинт для обновления профиля на сервере
            // await api.patch('/users/profile', updateData);
            toast.success('Profile updated successfully!');
            setIsEditing(false);
            fetchProfile();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-10">
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="container mx-auto py-10 space-y-8 max-w-4xl">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Profile</h1>
                {!isEditing && (
                    <Button onClick={() => setIsEditing(true)} variant="outline">
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Profile
                    </Button>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Profile Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>Your personal information and account details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback className="text-lg">
                                    {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="text-xl font-semibold">{user.name || 'No name'}</h2>
                                <p className="text-muted-foreground flex items-center gap-1">
                                    <Mail className="w-4 h-4" />
                                    {user.email}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Status</span>
                                <Badge variant={user.status === 'premium' ? 'default' : 'secondary'}>
                                    {user.status === 'premium' ? 'Premium' : 'Free'}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Award className="w-4 h-4" />
                                    Points
                                </span>
                                <span className="font-semibold">{user.points || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Member since
                                </span>
                                <span className="text-sm">
                                    {user.createdAt ? format(new Date(user.createdAt), 'MMM yyyy') : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Edit Form Card */}
                {isEditing ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Edit Profile</CardTitle>
                            <CardDescription>Update your profile information</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        {...register('name')}
                                        placeholder="Your name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="professions">Professions</Label>
                                    <Input
                                        id="professions"
                                        {...register('professions')}
                                        placeholder="e.g. Frontend Developer, Backend Developer"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="skills">Skills</Label>
                                    <Textarea
                                        id="skills"
                                        {...register('skills')}
                                        placeholder="e.g. React, TypeScript, Node.js"
                                        className="min-h-[80px]"
                                    />
                                </div>

                                <div className="space-y-4 pt-4 border-t">
                                    <h3 className="font-semibold text-sm">Contact Information</h3>
                                    <div className="space-y-2">
                                        <Label htmlFor="telegram">Telegram</Label>
                                        <Input
                                            id="telegram"
                                            {...register('telegram')}
                                            placeholder="@username"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="whatsapp">WhatsApp</Label>
                                        <Input
                                            id="whatsapp"
                                            {...register('whatsapp')}
                                            placeholder="+1234567890"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="discord">Discord</Label>
                                        <Input
                                            id="discord"
                                            {...register('discord')}
                                            placeholder="username#1234"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <Button type="submit" className="flex-1">
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setIsEditing(false);
                                            fetchProfile();
                                        }}
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Additional Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {user.professions && user.professions.length > 0 && (
                                <div>
                                    <Label className="text-sm text-muted-foreground">Professions</Label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {user.professions.map((prof: string, idx: number) => (
                                            <Badge key={idx} variant="outline">{prof}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {user.skills && user.skills.length > 0 && (
                                <div>
                                    <Label className="text-sm text-muted-foreground">Skills</Label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {user.skills.map((skill: string, idx: number) => (
                                            <Badge key={idx} variant="secondary">{skill}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {user.contacts && Object.keys(user.contacts).length > 0 && (
                                <div>
                                    <Label className="text-sm text-muted-foreground">Contact Information</Label>
                                    <div className="space-y-2 mt-2">
                                        {user.contacts.telegram && (
                                            <div className="text-sm">
                                                <span className="text-muted-foreground">Telegram: </span>
                                                <span>{user.contacts.telegram}</span>
                                            </div>
                                        )}
                                        {user.contacts.whatsapp && (
                                            <div className="text-sm">
                                                <span className="text-muted-foreground">WhatsApp: </span>
                                                <span>{user.contacts.whatsapp}</span>
                                            </div>
                                        )}
                                        {user.contacts.discord && (
                                            <div className="text-sm">
                                                <span className="text-muted-foreground">Discord: </span>
                                                <span>{user.contacts.discord}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {(!user.professions || user.professions.length === 0) &&
                                (!user.skills || user.skills.length === 0) &&
                                (!user.contacts || Object.keys(user.contacts).length === 0) && (
                                    <p className="text-sm text-muted-foreground">No additional information provided.</p>
                                )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

