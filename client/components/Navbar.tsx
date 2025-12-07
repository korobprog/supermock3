'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut, PlusCircle, LayoutDashboard, Shield, Menu, X } from 'lucide-react';
import api from '@/lib/api';
import { ModeToggle } from '@/components/mode-toggle';

export default function Navbar() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    const fetchUser = async () => {
        try {
            const response = await api.get('/auth/profile');
            setUser(response.data);
        } catch (err) {
            // Если запрос не удался, возможно токен невалиден
            setUser(null);
        }
    };

    const checkAuth = () => {
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);

        // Если есть токен, получаем информацию о пользователе
        if (token) {
            fetchUser();
        } else {
            setUser(null);
        }
    };

    useEffect(() => {
        // Проверяем при монтировании
        checkAuth();

        // Слушаем изменения localStorage (для обновления при логине/логауте в других вкладках)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'token') {
                checkAuth();
            }
        };

        // Слушаем кастомное событие для обновления при логине/логауте в той же вкладке
        const handleAuthChange = () => {
            checkAuth();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('auth-change', handleAuthChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('auth-change', handleAuthChange);
        };
    }, []);

    // Проверяем при изменении пути (на случай, если пользователь залогинился и перешел на другую страницу)
    useEffect(() => {
        checkAuth();
    }, [pathname]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setIsLoggedIn(false);
        // Отправляем событие для обновления
        window.dispatchEvent(new Event('auth-change'));
        window.location.href = '/auth';
    };

    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl" onClick={() => setMobileMenuOpen(false)}>
                    <span className="text-primary">Super</span>mock
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-4">
                    {isLoggedIn ? (
                        <>
                            <Link href="/dashboard">
                                <Button variant="ghost" size="sm" className="gap-2">
                                    <LayoutDashboard className="w-4 h-4" />
                                    Dashboard
                                </Button>
                            </Link>
                            <Link href="/create-card">
                                <Button variant="ghost" size="sm" className="gap-2">
                                    <PlusCircle className="w-4 h-4" />
                                    Create Card
                                </Button>
                            </Link>
                            <Link href="/subscription">
                                <Button variant="default" size="sm" className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white border-0">
                                    Upgrade
                                </Button>
                            </Link>
                            {user?.role === 'admin' && (
                                <Link href="/admin">
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Shield className="w-4 h-4" />
                                        Admin
                                    </Button>
                                </Link>
                            )}
                            <ModeToggle />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user?.avatar} alt="@user" />
                                            <AvatarFallback>
                                                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {user?.name || user?.email?.split('@')[0] || 'User'}
                                            </p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {user?.email || 'user@example.com'}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard" className="cursor-pointer">
                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                            <span>Dashboard</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/profile" className="cursor-pointer">
                                            <User className="mr-2 h-4 w-4" />
                                            <span>Profile</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    {user?.role === 'admin' && (
                                        <DropdownMenuItem asChild>
                                            <Link href="/admin" className="cursor-pointer">
                                                <Shield className="mr-2 h-4 w-4" />
                                                <span>Admin Panel</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <div className="flex gap-2">
                            <Link href="/auth">
                                <Button variant="ghost">Login</Button>
                            </Link>
                            <Link href="/auth">
                                <Button>Get Started</Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <div className="flex md:hidden items-center gap-2">
                    {isLoggedIn && <ModeToggle />}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t bg-background">
                    <div className="container py-4 space-y-2">
                        {isLoggedIn ? (
                            <>
                                <Link
                                    href="/dashboard"
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <LayoutDashboard className="w-5 h-5" />
                                    <span className="font-medium">Dashboard</span>
                                </Link>
                                <Link
                                    href="/create-card"
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <PlusCircle className="w-5 h-5" />
                                    <span className="font-medium">Create Card</span>
                                </Link>
                                <Link
                                    href="/subscription"
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-600 text-white hover:from-yellow-600 hover:to-amber-700 transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <span className="font-medium">Upgrade</span>
                                </Link>
                                {user?.role === 'admin' && (
                                    <Link
                                        href="/admin"
                                        className="flex items-center gap-3 px-4 py-3 rounded-lg border hover:bg-accent transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Shield className="w-5 h-5" />
                                        <span className="font-medium">Admin</span>
                                    </Link>
                                )}
                                <Link
                                    href="/profile"
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <User className="w-5 h-5" />
                                    <span className="font-medium">Profile</span>
                                </Link>
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user?.avatar} alt="@user" />
                                        <AvatarFallback>
                                            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <p className="text-sm font-medium">
                                            {user?.name || user?.email?.split('@')[0] || 'User'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {user?.email || 'user@example.com'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setMobileMenuOpen(false);
                                    }}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors text-red-600 w-full text-left"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span className="font-medium">Log out</span>
                                </button>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <Link
                                    href="/auth"
                                    className="flex items-center justify-center px-4 py-3 rounded-lg hover:bg-accent transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <span className="font-medium">Login</span>
                                </Link>
                                <Link
                                    href="/auth"
                                    className="flex items-center justify-center px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <span className="font-medium">Get Started</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
