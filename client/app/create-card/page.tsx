'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import DateTimePicker from '@/components/DateTimePicker';

export default function CreateCardPage() {
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();
    const router = useRouter();
    const [skills, setSkills] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState('');
    const [minDateTime, setMinDateTime] = useState('');

    // Устанавливаем минимальную дату/время (текущее время, округленное до ближайших 15 минут)
    useEffect(() => {
        const now = new Date();
        // Округляем до ближайших 15 минут вверх
        const minutes = now.getMinutes();
        const roundedMinutes = Math.ceil(minutes / 15) * 15;
        
        // Если округление привело к 60 минутам, переходим на следующий час
        if (roundedMinutes >= 60) {
            now.setHours(now.getHours() + 1);
            now.setMinutes(0);
        } else {
            now.setMinutes(roundedMinutes);
        }
        now.setSeconds(0);
        now.setMilliseconds(0);
        
        // Форматируем для datetime-local input (YYYY-MM-DDTHH:mm)
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        setMinDateTime(`${year}-${month}-${day}T${hours}:${mins}`);
    }, []);

    const datetimeValue = watch('datetime');

    const addSkill = () => {
        const trimmed = skillInput.trim();
        if (trimmed && !skills.includes(trimmed)) {
            const newSkills = [...skills, trimmed];
            setSkills(newSkills);
            setValue('skills', newSkills.join(','));
            setSkillInput('');
        }
    };

    const removeSkill = (skillToRemove: string) => {
        const newSkills = skills.filter(skill => skill !== skillToRemove);
        setSkills(newSkills);
        setValue('skills', newSkills.join(','));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSkill();
        }
    };

    const validateDateTime = (value: string) => {
        if (!value) return 'Date and time are required';
        
        const selectedDate = new Date(value);
        const now = new Date();
        
        if (selectedDate <= now) {
            return 'Please select a future date and time';
        }
        
        // Проверяем, что время кратно 15 минутам
        const minutes = selectedDate.getMinutes();
        if (minutes % 15 !== 0) {
            return 'Time must be in 15-minute intervals (e.g., 10:00, 10:15, 10:30, 10:45)';
        }
        
        return true;
    };

    const onSubmit = async (data: any) => {
        // Дополнительная валидация перед отправкой
        const validation = validateDateTime(data.datetime);
        if (validation !== true) {
            toast.error(validation);
            return;
        }

        try {
            const payload = {
                ...data,
                skills: skills,
            };
            await api.post('/cards', payload);
            toast.success('Interview card created successfully!');
            router.push('/');
        } catch (err) {
            console.error(err);
            toast.error('Failed to create card');
        }
    };

    return (
        <div className="container mx-auto max-w-2xl py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Create Interview Card</CardTitle>
                    <CardDescription>
                        Post a new interview availability to find a peer.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="profession">Profession</Label>
                            <Input
                                id="profession"
                                placeholder="e.g. Frontend Developer"
                                {...register('profession', { required: true })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="skills">Skills</Label>
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <Input
                                        id="skills"
                                        placeholder="e.g. React, TypeScript, Node.js"
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                    />
                                    <Button
                                        type="button"
                                        onClick={addSkill}
                                        variant="outline"
                                    >
                                        Add
                                    </Button>
                                </div>
                                {skills.length > 0 && (
                                    <div className="flex flex-wrap gap-2 p-3 min-h-[60px] border rounded-md bg-muted/50">
                                        {skills.map((skill) => (
                                            <Badge
                                                key={skill}
                                                variant="secondary"
                                                className="flex items-center gap-1 px-2 py-1"
                                            >
                                                {skill}
                                                <button
                                                    type="button"
                                                    onClick={() => removeSkill(skill)}
                                                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                                {skills.length === 0 && (
                                    <div className="text-sm text-muted-foreground p-3 min-h-[60px] border rounded-md bg-muted/50 flex items-center">
                                        No skills added yet. Type a skill and press Enter or click Add.
                                    </div>
                                )}
                            </div>
                            <input
                                type="hidden"
                                {...register('skills', { 
                                    required: skills.length > 0,
                                    validate: () => skills.length > 0 || 'At least one skill is required'
                                })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="datetime">Date & Time</Label>
                            <DateTimePicker
                                value={datetimeValue}
                                onChange={(value) => {
                                    setValue('datetime', value);
                                }}
                                minDateTime={minDateTime}
                                error={errors.datetime?.message as string}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                ⚠️ Time must be in 15-minute intervals (e.g., 10:00, 10:15, 10:30, 10:45)
                            </p>
                            <input
                                type="hidden"
                                {...register('datetime', { 
                                    required: 'Date and time are required',
                                    validate: validateDateTime
                                })}
                            />
                        </div>

                        <Button type="submit" className="w-full">Create Card</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
