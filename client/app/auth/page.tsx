'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AuthPage() {
    const router = useRouter();
    const [error, setError] = useState('');
    const { register: registerLogin, handleSubmit: handleSubmitLogin } = useForm();
    const { register: registerRegister, handleSubmit: handleSubmitRegister } = useForm();

    const onLogin = async (data: any) => {
        try {
            setError('');
            const response = await api.post('/auth/login', data);
            if (response.data.access_token) {
                localStorage.setItem('token', response.data.access_token);
                // Отправляем событие для обновления Navbar
                window.dispatchEvent(new Event('auth-change'));
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    const onRegister = async (data: any) => {
        try {
            setError('');
            const response = await api.post('/auth/register', data);
            if (response.data.access_token) {
                localStorage.setItem('token', response.data.access_token);
                // Отправляем событие для обновления Navbar
                window.dispatchEvent(new Event('auth-change'));
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-muted/50">
            <Tabs defaultValue="login" className="w-[400px]">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                    <Card>
                        <CardHeader>
                            <CardTitle>Login</CardTitle>
                            <CardDescription>
                                Enter your email below to login to your account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {error && <div className="text-destructive text-sm font-medium">{error}</div>}
                            <form onSubmit={handleSubmitLogin(onLogin)} className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" placeholder="m@example.com" {...registerLogin('email', { required: true })} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" type="password" {...registerLogin('password', { required: true })} />
                                </div>
                                <Button type="submit" className="w-full">Login</Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="register">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create an account</CardTitle>
                            <CardDescription>
                                Enter your details below to create your account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {error && <div className="text-destructive text-sm font-medium">{error}</div>}
                            <form onSubmit={handleSubmitRegister(onRegister)} className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="name">Name</Label>
                                    <Input id="name" placeholder="John Doe" {...registerRegister('name')} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" placeholder="m@example.com" {...registerRegister('email', { required: true })} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" type="password" {...registerRegister('password', { required: true, minLength: 6 })} />
                                </div>
                                <Button type="submit" className="w-full">Create Account</Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
