"use client"
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs'
import { Sparkles } from 'lucide-react';
import React from 'react'
import CreateNewBoardDialog from './CreateNewDialog';

function WelcomeBanner() {
    const { user } = useUser();

    return (
        <div>
            <div className="p-10 border rounded-xl bg-linear-to-r from-blue-200 to-purple-200">
                <h2 className="text-2xl font-bold">Welcome Back, {user?.fullName}👋</h2>
                <p className="mt-2">Turn your ideas into diagrams, notes and visuals on an
                    infinite canvas.</p>

                <div className="flex items-center gap-2 mt-5">
                     <CreateNewBoardDialog />
                    <Button variant="outline" size="lg" className = "gap-2 bg-white/70"  >
                        <Sparkles className = "h-4 w-4 text-violet-600" /> Ask AI
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default WelcomeBanner;