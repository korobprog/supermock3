'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Card from '@/components/Card';
import CardFilters from '@/components/CardFilters';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function Home() {
  const [cards, setCards] = useState<any[]>([]);
  const [filteredCards, setFilteredCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/profile');
          setIsAuthenticated(true);
          setCurrentUserId(res.data.id);
        } catch (err) {
          setIsAuthenticated(false);
          setCurrentUserId(undefined);
          localStorage.removeItem('token');
        }
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await api.get('/cards');
        setCards(response.data);
        setFilteredCards(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isAuthenticated && (
        <section className="py-20 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-8"
          >
            <Image
              src="/hero-image.png"
              alt="Technical Interview"
              width={800}
              height={600}
              className="rounded-lg shadow-2xl"
              priority
            />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-extrabold tracking-tight lg:text-6xl"
          >
            Master Your <span className="text-primary">Tech Interview</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Join the community of developers practicing peer-to-peer mock interviews. Level up your skills today.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center gap-4"
          >
            <Link href="/auth">
              <Button size="lg" className="text-lg px-8">Get Started</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="text-lg px-8">Dashboard</Button>
            </Link>
          </motion.div>
        </section>
      )}

      <section className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Available Interviews</h2>
            {!loading && (
              <p className="text-muted-foreground mt-1">
                {filteredCards.length} of {cards.length} interview{cards.length !== 1 ? 's' : ''} available
              </p>
            )}
          </div>
          <Link href="/create-card">
            <Button>Create New Card</Button>
          </Link>
        </div>

        {!loading && cards.length > 0 && (
          <CardFilters cards={cards} onFilterChange={setFilteredCards} />
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filteredCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card card={card} currentUserId={currentUserId} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {cards.length === 0
                ? 'No interviews available at the moment.'
                : 'No interviews match your filters. Try adjusting your search criteria.'}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
