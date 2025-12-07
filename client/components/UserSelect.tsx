'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
    id: string;
    email: string;
    name?: string;
}

interface UserSelectProps {
    users: User[];
    value: string;
    onChange: (userId: string) => void;
    label?: string;
    id?: string;
    placeholder?: string;
}

export default function UserSelect({ 
    users, 
    value, 
    onChange, 
    label,
    id = 'userId',
    placeholder = 'Search user...'
}: UserSelectProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Фильтруем пользователей по поисковому запросу
    const filteredUsers = users.filter(user => {
        const query = searchQuery.toLowerCase();
        const email = user.email?.toLowerCase() || '';
        const name = user.name?.toLowerCase() || '';
        return email.includes(query) || name.includes(query);
    });

    // Получаем выбранного пользователя
    const selectedUser = users.find(u => u.id === value);

    // Закрываем меню при клике вне компонента
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Фокусируемся на инпуте при открытии
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Обработка клавиши Escape
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen]);

    const handleSelect = (userId: string) => {
        onChange(userId);
        setIsOpen(false);
        setSearchQuery('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setSearchQuery('');
    };

    return (
        <div className="space-y-2">
            {label && <Label htmlFor={id}>{label}</Label>}
            <div ref={containerRef} className="relative">
                {/* Триггер - показывает выбранного пользователя или placeholder */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm",
                        "ring-offset-background placeholder:text-muted-foreground",
                        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "hover:bg-accent"
                    )}
                >
                    <span className={cn("truncate", !selectedUser && "text-muted-foreground")}>
                        {selectedUser 
                            ? `${selectedUser.email}${selectedUser.name ? ` (${selectedUser.name})` : ''}`
                            : placeholder
                        }
                    </span>
                    <div className="flex items-center gap-1">
                        {selectedUser && (
                            <X 
                                className="h-4 w-4 text-muted-foreground hover:text-foreground"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClear(e);
                                }}
                            />
                        )}
                        <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", isOpen && "rotate-180")} />
                    </div>
                </button>

                {/* Выпадающее меню с поиском */}
                {isOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
                        {/* Поле поиска */}
                        <div className="p-2 border-b">
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Search by email or name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>

                        {/* Список пользователей */}
                        <div className="max-h-60 overflow-auto">
                            {filteredUsers.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                                    {searchQuery ? 'No users found' : 'No users available'}
                                </div>
                            ) : (
                                filteredUsers.map((user) => (
                                    <button
                                        key={user.id}
                                        type="button"
                                        onClick={() => handleSelect(user.id)}
                                        className={cn(
                                            "w-full px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground",
                                            "focus:bg-accent focus:text-accent-foreground",
                                            "transition-colors",
                                            value === user.id && "bg-accent"
                                        )}
                                    >
                                        <div className="font-medium">{user.email}</div>
                                        {user.name && (
                                            <div className="text-xs text-muted-foreground">{user.name}</div>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

