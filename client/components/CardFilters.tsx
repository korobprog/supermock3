'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Search, Calendar, Filter } from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';

interface CardFiltersProps {
  cards: any[];
  onFilterChange: (filteredCards: any[]) => void;
}

export default function CardFilters({ cards, onFilterChange }: CardFiltersProps) {
  const [professionSearch, setProfessionSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const dateFromRef = useRef<HTMLInputElement>(null);
  const dateToRef = useRef<HTMLInputElement>(null);

  // Получаем все уникальные навыки из карточек
  const allSkills = useMemo(() => {
    const skillsSet = new Set<string>();
    cards.forEach(card => {
      if (card.skills && Array.isArray(card.skills)) {
        card.skills.forEach((skill: string) => skillsSet.add(skill));
      }
    });
    return Array.from(skillsSet).sort();
  }, [cards]);

  // Применяем фильтры
  useEffect(() => {
    let filtered = [...cards];

    // Фильтр по профессии
    if (professionSearch.trim()) {
      const searchLower = professionSearch.toLowerCase().trim();
      filtered = filtered.filter(card =>
        card.profession?.toLowerCase().includes(searchLower)
      );
    }

    // Фильтр по дате
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(card => {
        const cardDate = new Date(card.datetime);
        return cardDate >= fromDate;
      });
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // Включаем весь день
      filtered = filtered.filter(card => {
        const cardDate = new Date(card.datetime);
        return cardDate <= toDate;
      });
    }

    // Фильтр по навыкам
    if (selectedSkills.length > 0) {
      filtered = filtered.filter(card => {
        if (!card.skills || !Array.isArray(card.skills)) return false;
        return selectedSkills.some(skill =>
          card.skills.some((cardSkill: string) =>
            cardSkill.toLowerCase().includes(skill.toLowerCase())
          )
        );
      });
    }

    onFilterChange(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professionSearch, dateFrom, dateTo, selectedSkills, cards]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const clearFilters = () => {
    setProfessionSearch('');
    setDateFrom('');
    setDateTo('');
    setSelectedSkills([]);
  };

  const hasActiveFilters = professionSearch || dateFrom || dateTo || selectedSkills.length > 0;

  const handleDateClick = (e: React.MouseEvent<HTMLInputElement>, ref: React.RefObject<HTMLInputElement>) => {
    // Открываем календарь при клике
    if (ref.current) {
      // Используем setTimeout чтобы не конфликтовать с встроенным поведением браузера
      setTimeout(() => {
        if (ref.current && 'showPicker' in ref.current) {
          try {
            (ref.current as any).showPicker();
          } catch (error) {
            // Если showPicker не поддерживается, просто фокусируем поле
            // Браузер сам откроет календарь при фокусе на input type="date"
            ref.current.focus();
          }
        } else if (ref.current) {
          ref.current.focus();
        }
      }, 0);
    }
  };

  const handleDateFocus = (ref: React.RefObject<HTMLInputElement>) => {
    // Открываем календарь при фокусе
    if (ref.current && 'showPicker' in ref.current) {
      try {
        (ref.current as any).showPicker();
      } catch (error) {
        // Если showPicker не поддерживается, браузер сам откроет календарь
      }
    }
  };

  return (
    <div className="space-y-6 mb-8 p-6 bg-muted/50 rounded-lg border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Filters</h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8"
          >
            <X className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Поиск по профессии */}
        <div className="space-y-2">
          <Label htmlFor="profession-search" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Profession
          </Label>
          <Input
            id="profession-search"
            placeholder="Search by profession..."
            value={professionSearch}
            onChange={(e) => setProfessionSearch(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Фильтр по дате (от) */}
        <div className="space-y-2">
          <Label htmlFor="date-from" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Date From
          </Label>
          <Input
            ref={dateFromRef}
            id="date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            onClick={(e) => handleDateClick(e, dateFromRef)}
            onFocus={() => handleDateFocus(dateFromRef)}
            className="w-full cursor-pointer"
          />
        </div>

        {/* Фильтр по дате (до) */}
        <div className="space-y-2">
          <Label htmlFor="date-to" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Date To
          </Label>
          <Input
            ref={dateToRef}
            id="date-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            onClick={(e) => handleDateClick(e, dateToRef)}
            onFocus={() => handleDateFocus(dateToRef)}
            className="w-full cursor-pointer"
          />
        </div>
      </div>

      {/* Фильтр по навыкам */}
      <div className="space-y-2">
        <Label>Technologies / Skills</Label>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-md bg-background">
          {allSkills.length > 0 ? (
            allSkills.map((skill) => (
              <Badge
                key={skill}
                variant={selectedSkills.includes(skill) ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/80 transition-colors"
                onClick={() => toggleSkill(skill)}
              >
                {skill}
                {selectedSkills.includes(skill) && (
                  <X className="w-3 h-3 ml-1" />
                )}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">No skills available</span>
          )}
        </div>
        {selectedSkills.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-muted-foreground">Selected:</span>
            <div className="flex flex-wrap gap-1">
              {selectedSkills.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

