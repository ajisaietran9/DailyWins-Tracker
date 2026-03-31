
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";

import {
    SparklesIcon,
    DumbbellIcon,
    LotusIcon,
    BrainIcon,
    TargetIcon,
    CheckCircleIconSolid,
    TrophyIcon,
    FireIcon,
    CalendarIcon,
    UserCircleIcon,
    PlusIcon,
    TrashIcon,
    XMarkIcon,
    CheckCircleIcon,
    ChartBarIcon,
    PencilIcon,
    LightBulbIcon,
    ArrowRightIcon,
    SendIcon,
    CheckBadgeIcon,
    StopCircleIcon,
    MicrophoneIcon,
    BookOpenIcon,
    FaceSmileIcon,
    FaceHappyIcon,
    FaceMehIcon,
    FaceSadIcon,
    FaceFrownIcon,
    MoonIcon,
    SunIcon,
    GlassWaterIcon,
    WalkIcon,
    JournalIcon,
    MoonBedIcon,
    ArrowPathIcon,
    EllipsisVerticalIcon,
    MinusIcon,
    CrownIcon,
    HeartIcon,
    GoogleIcon,
    ShieldCheckIcon,
    LightningBoltIcon,
    CogIcon,
    AcademicCapIcon,
    ClockIcon,
    BriefcaseIcon,
    PhotoIcon,
    ChevronDownIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    BellIcon,
    EnvelopeIcon,
    SearchIcon,
    MedalIcon,
    CalendarStarIcon,
    QuestionMarkCircleIcon,
    BookmarkIcon
} from './components/icons';

// --- Interfaces ---

interface IdentityTask {
    id: string;
    text: string;
    type: 'boolean' | 'measurable';
    completed: boolean;
    target?: number;
    current?: number;
    unit?: string;
    icon?: string; 
}

interface Identity {
    id: string;
    name: string;
    description: string;
    quote: string;
    author: string;
    identityTasks: { [key: string]: IdentityTask[] }; // tasks per identity ID
    dailyProgress: { [date: string]: number };
    theme?: {
        gradient: string;
        accentColor: string;
        icon: string;
    };
    visionBoardUrl?: string;
    backgroundUrl?: string;
}

interface User {
    name: string;
}

interface Goal {
    id: string;
    title: string;
    category: 'Health' | 'Business' | 'Personal' | 'Financial';
    motivation?: string; // "The Why"
    progress: number;
    milestones: { text: string; completed: boolean }[];
    aiSuggested?: boolean;
}

interface DailyWin {
    id: string;
    category: 'physical' | 'mental' | 'spiritual';
    text: string;
    completed: boolean;
}

interface DailyData {
    date: string;
    wins: DailyWin[];
    reflection: string;
    mood: number; // 1-5
    questionAnswer: string;
    question: string;
}

interface UserData {
    theme: 'light' | 'dark';
    isOnboardingComplete?: boolean;
    identity: Identity; // The currently ACTIVE identity
    unlockedIdentityIds: string[]; // IDs of DEFAULT_IDENTITIES that the user has added
    goals: Goal[];
    history: DailyData[];
    todayDraft?: DailyData; // Persist today's unsaved progress
    streak: number;
    totalWins: number;
    customIdentities: Identity[]; // User created identities
    achievements: string[];
    currentTitle?: string;
    dailyAffirmation?: { text: string; date: string };
}

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: any;
    condition: (data: UserData) => boolean;
    titleReward?: string;
}

interface PresetHabit {
    text: string;
    type: 'boolean' | 'measurable';
    target?: number;
    unit?: string;
    icon: string;
    identityIds: string[]; // Relates habit to identities
}

interface PresetGoal {
    title: string;
    category: Goal['category'];
    icon: string;
}

// --- Constants & Config ---

const PRESET_GOALS: PresetGoal[] = [
    // Health
    { title: 'Run a Half Marathon', category: 'Health', icon: 'walk' },
    { title: 'Reach Target Weight', category: 'Health', icon: 'fire' },
    { title: 'Master the Handstand', category: 'Health', icon: 'lightning' },
    { title: '30 Days Clean Eating', category: 'Health', icon: 'shield' },
    { title: 'Zero Sugar for a Month', category: 'Health', icon: 'glass' },
    // Business
    { title: 'Launch Side Project', category: 'Business', icon: 'lightning' },
    { title: 'Scale to $1k MRR', category: 'Business', icon: 'chart' },
    { title: 'Read 12 Industry Books', category: 'Business', icon: 'book' },
    { title: 'Obtain Professional Cert', category: 'Business', icon: 'academic' },
    { title: 'Network with 50 Leads', category: 'Business', icon: 'briefcase' },
    // Financial
    { title: 'Save $10k Emergency Fund', category: 'Financial', icon: 'shield' },
    { title: 'Pay Off Credit Debt', category: 'Financial', icon: 'fire' },
    { title: 'Invest $1k in Index Funds', category: 'Financial', icon: 'chart' },
    { title: 'Max Out Retirement Plan', category: 'Financial', icon: 'crown' },
    { title: 'Zero Spending Week', category: 'Financial', icon: 'moon' },
    // Personal
    { title: 'Learn to Cook 10 Meals', category: 'Personal', icon: 'star' },
    { title: 'Read 50 Books a Year', category: 'Personal', icon: 'book' },
    { title: 'Travel to Japan', category: 'Personal', icon: 'sun' },
    { title: 'Start a Home Garden', category: 'Personal', icon: 'leaf' },
    { title: 'Learn a New Language', category: 'Personal', icon: 'microphone' },
];

const THEMES = {
    orange: { gradient: 'from-orange-500 to-amber-500', accentColor: 'text-orange-500', shadow: 'shadow-orange-500/20' },
    blue: { gradient: 'from-blue-500 to-cyan-500', accentColor: 'text-blue-500', shadow: 'shadow-blue-500/20' },
    green: { gradient: 'from-emerald-500 to-teal-500', accentColor: 'text-emerald-500', shadow: 'shadow-emerald-500/20' },
    purple: { gradient: 'from-violet-500 to-purple-500', accentColor: 'text-purple-500', shadow: 'shadow-purple-500/20' },
    red: { gradient: 'from-red-500 to-rose-500', accentColor: 'text-red-500', shadow: 'shadow-red-500/20' },
    slate: { gradient: 'from-slate-700 to-slate-900', accentColor: 'text-slate-500', shadow: 'shadow-slate-500/20' },
    pink: { gradient: 'from-pink-500 to-fuchsia-500', accentColor: 'text-pink-500', shadow: 'shadow-pink-500/20' },
};

const PRESET_HABITS: PresetHabit[] = [
    // Athlete
    { text: 'Strength Training', type: 'boolean', icon: 'dumbbell', identityIds: ['athlete'] },
    { text: 'Drink 3L Water', type: 'measurable', target: 3, unit: 'L', icon: 'glass', identityIds: ['athlete'] },
    { text: '10,000 Steps', type: 'measurable', target: 10000, unit: 'steps', icon: 'walk', identityIds: ['athlete'] },
    { text: 'Evening Stretching', type: 'boolean', icon: 'lotus', identityIds: ['athlete'] },
    { text: 'Hit Protein Goal', type: 'measurable', target: 150, unit: 'g', icon: 'lightning', identityIds: ['athlete'] },
    { text: '8 Hours Sleep', type: 'boolean', icon: 'bed', identityIds: ['athlete'] },
    { text: 'Joint Mobility Drill', type: 'boolean', icon: 'gear', identityIds: ['athlete'] },
    { text: 'Zone 2 Cardio (30m)', type: 'boolean', icon: 'heart', identityIds: ['athlete'] },
    { text: 'Post-Workout Cold Bath', type: 'boolean', icon: 'water', identityIds: ['athlete'] },
    { text: 'Healthy Meal Prep', type: 'boolean', icon: 'shield', identityIds: ['athlete'] },

    // Creator
    { text: 'Deep Work Session', type: 'measurable', target: 90, unit: 'min', icon: 'target', identityIds: ['creator'] },
    { text: 'Daily Sketching', type: 'boolean', icon: 'pencil', identityIds: ['creator'] },
    { text: 'Write 500 Words', type: 'measurable', target: 500, unit: 'words', icon: 'journal', identityIds: ['creator'] },
    { text: 'Curate Inspiration', type: 'boolean', icon: 'lightbulb', identityIds: ['creator'] },
    { text: 'Capture 3 New Ideas', type: 'measurable', target: 3, unit: 'ideas', icon: 'brain', identityIds: ['creator'] },
    { text: 'Master a Design Tool', type: 'boolean', icon: 'gear', identityIds: ['creator'] },
    { text: 'Share Work Online', type: 'boolean', icon: 'photo', identityIds: ['creator'] },
    { text: 'Read Industry Blog', type: 'boolean', icon: 'academic', identityIds: ['creator'] },
    { text: 'Clean Workspace', type: 'boolean', icon: 'star', identityIds: ['creator'] },
    { text: 'Update Portfolio', type: 'boolean', icon: 'pencil', identityIds: ['creator'] },

    // Scholar
    { text: 'Read 30 Pages', type: 'measurable', target: 30, unit: 'pg', icon: 'book', identityIds: ['scholar'] },
    { text: 'Learn 5 New Words', type: 'measurable', target: 5, unit: 'words', icon: 'academic', identityIds: ['scholar'] },
    { text: 'Active Recall Session', type: 'boolean', icon: 'lightning', identityIds: ['scholar'] },
    { text: 'Deep Research Block', type: 'boolean', icon: 'search', identityIds: ['scholar'] },
    { text: 'Watch Educational Video', type: 'boolean', icon: 'academic', identityIds: ['scholar'] },
    { text: 'Solve 5 Logic Puzzles', type: 'measurable', target: 5, unit: 'puzzles', icon: 'brain', identityIds: ['scholar'] },
    { text: 'Journal New Insights', type: 'boolean', icon: 'journal', identityIds: ['scholar'] },
    { text: 'Review Last Lecture', type: 'boolean', icon: 'pencil', identityIds: ['scholar'] },
    { text: 'Language App Practice', type: 'boolean', icon: 'microphone', identityIds: ['scholar'] },
    { text: 'Organize Study Notes', type: 'boolean', icon: 'gear', identityIds: ['scholar'] },

    // Sage
    { text: 'Mindful Meditation', type: 'measurable', target: 20, unit: 'min', icon: 'moon', identityIds: ['sage'] },
    { text: 'Gratitude Journal', type: 'boolean', icon: 'journal', identityIds: ['sage'] },
    { text: 'Deep Breathing Drills', type: 'boolean', icon: 'lotus', identityIds: ['sage'] },
    { text: 'Solo Nature Walk', type: 'boolean', icon: 'sun', identityIds: ['sage'] },
    { text: 'Mindful Morning Tea', type: 'boolean', icon: 'lotus', identityIds: ['sage'] },
    { text: '1 Hour Digital Detox', type: 'boolean', icon: 'shield', identityIds: ['sage'] },
    { text: 'Present Moment Check', type: 'boolean', icon: 'heart', identityIds: ['sage'] },
    { text: 'Morning Affirmations', type: 'boolean', icon: 'sun', identityIds: ['sage'] },
    { text: 'Read Sacred Text', type: 'boolean', icon: 'book', identityIds: ['sage'] },
    { text: 'Compassion Practice', type: 'boolean', icon: 'heart', identityIds: ['sage'] },

    // Leader
    { text: 'Plan Daily Strategy', type: 'boolean', icon: 'target', identityIds: ['leader'] },
    { text: 'Pitch/Presentation Prep', type: 'boolean', icon: 'microphone', identityIds: ['leader'] },
    { text: 'Strategic Networking', type: 'measurable', target: 2, unit: 'ppl', icon: 'briefcase', identityIds: ['leader'] },
    { text: 'Mentorship Session', type: 'boolean', icon: 'academic', identityIds: ['leader'] },
    { text: 'Inbox Zero Pursuit', type: 'boolean', icon: 'envelope', identityIds: ['leader'] },
    { text: 'Decision Review', type: 'boolean', icon: 'pencil', identityIds: ['leader'] },
    { text: 'Market Research Block', type: 'boolean', icon: 'search', identityIds: ['leader'] },
    { text: 'Team Appreciation', type: 'boolean', icon: 'heart', identityIds: ['leader'] },
    { text: 'Review Long-Term Goals', type: 'boolean', icon: 'medal', identityIds: ['leader'] },
    { text: 'Clear Backlog Tasks', type: 'boolean', icon: 'briefcase', identityIds: ['leader'] },

    // Iron
    { text: 'Ice Cold Shower', type: 'boolean', icon: 'water', identityIds: ['iron'] },
    { text: 'Zero Social Media', type: 'boolean', icon: 'shield', identityIds: ['iron'] },
    { text: 'Wake up at 5:00 AM', type: 'boolean', icon: 'sun', identityIds: ['iron'] },
    { text: '16 Hour Fasting', type: 'boolean', icon: 'clock', identityIds: ['iron'] },
    { text: 'Hardest Task First', type: 'boolean', icon: 'fire', identityIds: ['iron'] },
    { text: 'No Complaints Today', type: 'boolean', icon: 'shield', identityIds: ['iron'] },
    { text: 'Minimalist Purge (1 item)', type: 'boolean', icon: 'gear', identityIds: ['iron'] },
    { text: 'Rigid Daily Schedule', type: 'boolean', icon: 'target', identityIds: ['iron'] },
    { text: 'Stoic Evening Review', type: 'boolean', icon: 'journal', identityIds: ['iron'] },
    { text: 'Zero Added Sugars', type: 'boolean', icon: 'shield', identityIds: ['iron'] },
];

const THEME_PRESETS = [
    { id: 'fire', name: 'Fire', ...THEMES.orange, icon: 'fire' },
    { id: 'ocean', name: 'Ocean', ...THEMES.blue, icon: 'water' },
    { id: 'forest', name: 'Forest', ...THEMES.green, icon: 'leaf' },
    { id: 'royal', name: 'Royal', ...THEMES.purple, icon: 'crown' },
    { id: 'midnight', name: 'Midnight', ...THEMES.slate, icon: 'moon' },
    { id: 'love', name: 'Passion', ...THEMES.red, icon: 'heart' },
];

const TASK_ICONS: { [key: string]: any } = {
    dumbbell: DumbbellIcon,
    book: BookOpenIcon,
    lotus: LotusIcon,
    glass: GlassWaterIcon,
    walk: WalkIcon,
    journal: JournalIcon,
    bed: MoonBedIcon,
    target: TargetIcon,
    check: CheckCircleIcon,
    star: SparklesIcon,
    pencil: PencilIcon,
    fire: FireIcon,
    water: GlassWaterIcon,
    leaf: LotusIcon,
    crown: CrownIcon,
    moon: MoonIcon,
    heart: HeartIcon,
    sun: SunIcon,
    microphone: MicrophoneIcon,
    shield: ShieldCheckIcon,
    lightning: LightningBoltIcon,
    gear: CogIcon,
    academic: AcademicCapIcon,
    clock: ClockIcon,
    briefcase: BriefcaseIcon,
    search: SearchIcon,
    medal: MedalIcon,
    photo: PhotoIcon,
    envelope: EnvelopeIcon,
    chart: ChartBarIcon
};

const DEFAULT_IDENTITIES: Identity[] = [
    {
        id: 'athlete',
        name: 'The Athlete',
        description: 'Focus on physical health, strength, and endurance.',
        quote: "The only bad workout is the one that didn't happen.",
        author: "Unknown",
        theme: { gradient: THEMES.orange.gradient, accentColor: THEMES.orange.accentColor, icon: 'dumbbell' },
        identityTasks: {
            athlete: [
                { id: '1', text: 'Drink 3L of Water', type: 'measurable', completed: false, target: 3, current: 0, unit: 'L', icon: 'glass' },
                { id: '2', text: '45min Workout', type: 'boolean', completed: false, icon: 'dumbbell' },
                { id: '3', text: '10k Steps', type: 'measurable', completed: false, target: 10000, current: 0, unit: 'steps', icon: 'walk' },
                { id: '4', text: 'Stretching Routine', type: 'boolean', completed: false, icon: 'lotus' },
            ]
        },
        dailyProgress: {}
    },
    {
        id: 'creator',
        name: 'The Creator',
        description: 'Focus on artistic expression, building, and innovation.',
        quote: "Creativity is intelligence having fun.",
        author: "Albert Einstein",
        theme: { gradient: THEMES.purple.gradient, accentColor: THEMES.purple.accentColor, icon: 'pencil' },
        identityTasks: {
            creator: [
                { id: 'c1', text: 'Deep Work Session', type: 'boolean', completed: false, icon: 'target' },
                { id: 'c2', text: 'Read Industry News', type: 'boolean', completed: false, icon: 'book' },
                { id: 'c3', text: 'Write 500 Words', type: 'measurable', completed: false, target: 500, current: 0, unit: 'words', icon: 'journal' },
            ]
        },
        dailyProgress: {}
    },
    {
        id: 'scholar',
        name: 'The Scholar',
        description: 'Focus on learning, reading, and expanding knowledge.',
        quote: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
        author: "Mahatma Gandhi",
        theme: { gradient: THEMES.blue.gradient, accentColor: THEMES.blue.accentColor, icon: 'book' },
        identityTasks: {
            scholar: [
                { id: 's1', text: 'Read 20 Pages', type: 'measurable', completed: false, target: 20, current: 0, unit: 'pg', icon: 'book' },
                { id: 's2', text: 'Learn New Skill', type: 'boolean', completed: false, icon: 'brain' },
            ]
        },
        dailyProgress: {}
    },
     {
        id: 'sage',
        name: 'The Sage',
        description: 'Focus on inner peace, mindfulness and balance.',
        quote: "Peace comes from within. Do not seek it without.",
        author: "Buddha",
        theme: { gradient: THEMES.green.gradient, accentColor: THEMES.green.accentColor, icon: 'lotus' },
        identityTasks: {
            sage: [
                { id: 'sa1', text: 'Meditate', type: 'boolean', completed: false, icon: 'lotus' },
                { id: 'sa2', text: 'Gratitude Journal', type: 'boolean', completed: false, icon: 'journal' },
            ]
        },
        dailyProgress: {}
    },
    {
        id: 'leader',
        name: 'The Leader',
        description: 'Focus on confidence, action, and impact.',
        quote: "Leadership is action, not position.",
        author: "Donald McGannon",
        theme: { gradient: THEMES.red.gradient, accentColor: THEMES.red.accentColor, icon: 'crown' },
        identityTasks: {
            leader: [
                { id: 'l1', text: 'Plan the Day', type: 'boolean', completed: false, icon: 'target' },
                { id: 'l2', text: 'Speak with Intent', type: 'boolean', completed: false, icon: 'microphone' },
            ]
        },
        dailyProgress: {}
    },
    {
        id: 'iron',
        name: 'The Iron',
        description: 'Focus on discipline, consistency, and resilience.',
        quote: "Discipline equals freedom.",
        author: "Jocko Willink",
        theme: { gradient: THEMES.slate.gradient, accentColor: THEMES.slate.accentColor, icon: 'fire' },
        identityTasks: {
            iron: [
                { id: 'i1', text: 'Cold Shower', type: 'boolean', completed: false, icon: 'water' },
                { id: 'i2', text: 'Wake up at 5AM', type: 'boolean', completed: false, icon: 'sun' },
            ]
        },
        dailyProgress: {}
    },
];

const INITIAL_USER: User = { name: 'Friend' };

const INITIAL_USER_DATA: UserData = {
    theme: 'dark',
    isOnboardingComplete: false,
    identity: DEFAULT_IDENTITIES[0],
    unlockedIdentityIds: ['athlete'], 
    goals: [],
    history: [],
    streak: 0,
    totalWins: 0,
    customIdentities: [],
    achievements: [],
    currentTitle: 'Novice'
};

const MASTER_ACHIEVEMENTS: Achievement[] = [
    {
        id: 'first_win',
        title: 'First Step',
        description: 'Completed your first daily win.',
        icon: CheckCircleIcon,
        condition: (d) => d.totalWins >= 1,
        titleReward: 'Novice'
    },
    {
        id: 'streak_3',
        title: 'On Fire',
        description: 'Reached a 3-day streak.',
        icon: FireIcon,
        condition: (d) => d.streak >= 3,
        titleReward: 'Spark'
    },
    {
        id: 'streak_7',
        title: 'Unstoppable',
        description: 'Reached a 7-day streak.',
        icon: TrophyIcon,
        condition: (d) => d.streak >= 7,
        titleReward: 'Relentless'
    },
    {
        id: 'streak_14',
        title: 'Iron Will',
        description: 'Reached a 14-day streak.',
        icon: ShieldCheckIcon,
        condition: (d) => d.streak >= 14,
        titleReward: 'Disciplined'
    },
    {
        id: 'streak_30',
        title: 'Legendary',
        description: 'Reached a 30-day streak.',
        icon: CrownIcon,
        condition: (d) => d.streak >= 30,
        titleReward: 'Legend'
    },
    {
        id: 'goal_setter',
        title: 'Dreamer',
        description: 'Created your first goal.',
        icon: TargetIcon,
        condition: (d) => d.goals.length > 0
    },
    {
        id: 'goal_crusher',
        title: 'Goal Crusher',
        description: 'Completed your first goal.',
        icon: CheckBadgeIcon,
        condition: (d) => d.goals.some(g => g.progress === 100),
        titleReward: 'Crusher'
    },
    {
        id: 'identity_architect',
        title: 'Architect',
        description: 'Created a custom identity.',
        icon: UserCircleIcon,
        condition: (d) => d.customIdentities.length > 0,
        titleReward: 'Creator'
    },
    {
        id: 'habit_master',
        title: 'Habit Master',
        description: 'Completed 50 total wins.',
        icon: StarIcon,
        condition: (d) => d.totalWins >= 50,
        titleReward: 'Master'
    },
    {
        id: 'centurion',
        title: 'Centurion',
        description: 'Completed 100 total wins.',
        icon: MedalIcon,
        condition: (d) => d.totalWins >= 100,
        titleReward: 'Centurion'
    },
    {
        id: 'perfect_day',
        title: 'Perfect Day',
        description: 'Completed all 3 wins in a single day.',
        icon: LightningBoltIcon,
        condition: (d) => d.history.some(day => day.wins.every(w => w.completed))
    }
];

// Fallback if StarIcon missing
function StarIcon(props: any) { return <SparklesIcon {...props} /> }

// --- Helper Components ---

const Confetti = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex justify-center z-[100]">
        <div className="animate-pulse text-6xl mt-20">🎉</div>
        <div className="absolute top-10 left-1/4 animate-bounce text-4xl" style={{animationDelay: '0.2s'}}>✨</div>
        <div className="absolute top-20 right-1/4 animate-bounce text-4xl" style={{animationDelay: '0.5s'}}>🎊</div>
    </div>
);

const AchievementUnlockedModal = ({ achievement, onClose }: { achievement: Achievement, onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-slide-in-down">
            <div className="glass-card p-4 pr-8 rounded-2xl flex items-center gap-4 border-2 border-amber-400/50 shadow-[0_0_30px_rgba(251,191,36,0.3)] bg-slate-900/90 backdrop-blur-xl">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-300 to-orange-500 flex items-center justify-center text-white shadow-lg animate-badge-bounce">
                    <achievement.icon className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="text-amber-400 font-bold text-xs uppercase tracking-wider mb-0.5">Achievement Unlocked!</h4>
                    <p className="text-white font-bold text-lg">{achievement.title}</p>
                </div>
            </div>
            <Confetti />
        </div>
    );
};

const IdentityBackground = ({ backgroundUrl }: { backgroundUrl?: string }) => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-10]">
        {/* Base Gradient Layer */}
        <div className="absolute inset-0 bg-slate-50/50 dark:bg-slate-950/50" />

        {backgroundUrl && (
            <div className="absolute inset-0 z-0 opacity-20 dark:opacity-30">
                <img src={backgroundUrl} alt="Background" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white dark:via-black/50 dark:to-black" />
            </div>
        )}

        {/* Ethereal Floating Orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-violet-400/10 dark:bg-violet-900/10 blur-[120px] animate-float-ethereal" />
        <div className="absolute bottom-[-10%] left-[-20%] w-[600px] h-[600px] rounded-full bg-blue-400/10 dark:bg-blue-900/10 blur-[100px] animate-float-ethereal" style={{ animationDelay: '3s' }} />
        
        {/* Symbolic Illustration: Curves representing growth and progress */}
        {!backgroundUrl && (
            <svg className="absolute inset-0 w-full h-full opacity-30 dark:opacity-20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                 {/* Smooth Ascending Curves */}
                 <path d="M0 100 Q 25 60 100 20" stroke="url(#growthGrad)" strokeWidth="0.2" fill="none" />
                 <path d="M0 100 Q 40 70 100 40" stroke="url(#growthGrad)" strokeWidth="0.15" fill="none" />
                 <path d="M0 100 Q 60 80 100 60" stroke="url(#growthGrad)" strokeWidth="0.1" fill="none" />
                 
                 {/* Expanding Ripples representing impact (Top Right) */}
                 <circle cx="100" cy="0" r="20" stroke="url(#rippleGrad)" strokeWidth="0.1" fill="none" />
                 <circle cx="100" cy="0" r="35" stroke="url(#rippleGrad)" strokeWidth="0.08" fill="none" />
                 <circle cx="100" cy="0" r="50" stroke="url(#rippleGrad)" strokeWidth="0.05" fill="none" />

                 <defs>
                    <linearGradient id="growthGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="currentColor" className="text-slate-400" stopOpacity="0" />
                        <stop offset="50%" stopColor="currentColor" className="text-violet-400" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="currentColor" className="text-slate-400" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="rippleGrad" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="currentColor" className="text-blue-400" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="currentColor" className="text-slate-400" stopOpacity="0" />
                    </linearGradient>
                 </defs>
            </svg>
        )}
    </div>
);

const AIImageGenerator = ({ ai, onSave, label, currentImage }: { ai: GoogleGenAI, onSave: (url: string) => void, label: string, currentImage?: string }) => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsGenerating(true);
        setError(null);
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [{ text: prompt }],
                },
            });

            let imageUrl = null;
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                    break;
                }
            }

            if (imageUrl) {
                setGeneratedImage(imageUrl);
            } else {
                setError("No image was generated. Try a different prompt.");
            }
        } catch (err) {
            console.error("Image generation failed:", err);
            setError("Failed to generate image. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-4 p-6 rounded-3xl bg-white/50 dark:bg-slate-900/40 border border-white/50 dark:border-white/5 backdrop-blur-2xl shadow-xl">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{label}</h3>
                {currentImage && !generatedImage && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">Active</span>
                )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
                <input 
                    type="text" 
                    value={prompt} 
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your vision (e.g., 'A futuristic athlete in a neon city')..."
                    className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-violet-500 outline-none transition-all text-sm"
                />
                <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold disabled:opacity-50 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                    {isGenerating ? (
                        <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            <span>Generating...</span>
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="w-4 h-4" />
                            <span>Generate</span>
                        </>
                    )}
                </button>
            </div>
            
            {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {currentImage && (
                    <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current {label}</p>
                        <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/20 shadow-inner group">
                            <img src={currentImage} alt="Current" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-xs font-bold">Current Active</span>
                            </div>
                        </div>
                    </div>
                )}
                
                {generatedImage && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <p className="text-xs font-bold text-violet-500 uppercase tracking-wider">New Generation</p>
                        <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-violet-500 shadow-2xl">
                            <img src={generatedImage} alt="Generated" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <button 
                            onClick={() => { onSave(generatedImage); setGeneratedImage(null); setPrompt(''); }}
                            className="w-full py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl font-bold shadow-lg hover:shadow-violet-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                        >
                            Set as {label}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const GlobalAmbientBackground = ({ backgroundUrl }: { backgroundUrl?: string }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-20] overflow-hidden">
       {backgroundUrl && (
            <div className="absolute inset-0 z-0 opacity-10 dark:opacity-20 transition-opacity duration-1000">
                <img src={backgroundUrl} alt="Background" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white dark:via-black/50 dark:to-black" />
            </div>
       )}
       <div className="absolute top-[10%] left-[20%] w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDuration: '8s' }}></div>
       <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-teal-600/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDuration: '10s', animationDelay: '1s' }}></div>
       <div className="absolute top-[40%] right-[30%] w-64 h-64 bg-amber-500/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDuration: '12s', animationDelay: '2s' }}></div>
    </div>
  );
};

// --- Modals ---

const AddTaskModal = ({ 
    isOpen, 
    onClose, 
    onSave, 
    initialTask,
    activeIdentity
}: { 
    isOpen: boolean, 
    onClose: () => void, 
    onSave: (task: IdentityTask) => void, 
    initialTask?: IdentityTask | null,
    activeIdentity: Identity
}) => {
    const [text, setText] = useState('');
    const [type, setType] = useState<'boolean' | 'measurable'>('boolean');
    const [target, setTarget] = useState(1);
    const [unit, setUnit] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('star');

    // Filter presets to only those relevant to the current identity
    const relevantPresets = useMemo(() => {
        return PRESET_HABITS.filter(preset => preset.identityIds.includes(activeIdentity.id));
    }, [activeIdentity.id]);

    useEffect(() => {
        if (initialTask) {
            setText(initialTask.text);
            setType(initialTask.type);
            setTarget(initialTask.target || 1);
            setUnit(initialTask.unit || '');
            setSelectedIcon(initialTask.icon || 'star');
        } else {
            setText('');
            setType('boolean');
            setTarget(1);
            setUnit('');
            setSelectedIcon('star');
        }
    }, [initialTask, isOpen]);

    if (!isOpen) return null;

    const handleSelectPreset = (preset: PresetHabit) => {
        setText(preset.text);
        setType(preset.type);
        setTarget(preset.target || 1);
        setUnit(preset.unit || '');
        setSelectedIcon(preset.icon);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: initialTask ? initialTask.id : Date.now().toString(),
            text,
            type,
            completed: initialTask ? initialTask.completed : false,
            target: type === 'measurable' ? target : undefined,
            current: (initialTask && initialTask.type === type) ? initialTask.current : (type === 'measurable' ? 0 : undefined),
            unit: type === 'measurable' ? unit : undefined,
            icon: selectedIcon
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-all duration-300">
            <div className="glass-card w-full max-w-5xl rounded-[2.5rem] animate-fade-in-up overflow-hidden flex flex-col max-h-[85vh] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border-white/20">
                {/* Header */}
                <div className="p-8 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-black/20">
                    <div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            {initialTask ? 'Edit Habit' : 'Cast Your Vote'}
                        </h3>
                        <p className="text-slate-500 font-medium mt-1">Identity: {activeIdentity.name}</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-all"><XMarkIcon className="w-8 h-8" /></button>
                </div>

                {/* Split Content */}
                <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                    
                    {/* Left: Library */}
                    <div className="lg:w-1/2 border-r border-slate-200 dark:border-white/10 bg-slate-50/40 dark:bg-black/10 overflow-y-auto p-8 space-y-6 no-scrollbar">
                        <div className="flex items-center gap-2">
                             <SparklesIcon className="w-5 h-5 text-violet-500" />
                             <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Identity Library</span>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {relevantPresets.length > 0 ? (
                                relevantPresets.map((preset, idx) => {
                                    const Icon = TASK_ICONS[preset.icon] || SparklesIcon;
                                    const isSelected = text === preset.text;
                                    return (
                                        <button 
                                            key={idx}
                                            onClick={() => handleSelectPreset(preset)}
                                            className={`text-left p-5 rounded-2xl border transition-all duration-300 flex items-center gap-4 group ${isSelected ? 'bg-violet-600 border-violet-600 shadow-xl shadow-violet-500/20' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 hover:border-violet-500/40 hover:bg-white dark:hover:bg-white/10'}`}
                                        >
                                            <div className={`p-3 rounded-xl transition-all duration-300 ${isSelected ? 'bg-white text-violet-600' : 'bg-violet-500/10 text-violet-500 group-hover:bg-violet-500 group-hover:text-white'}`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className={`font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{preset.text}</h4>
                                                <p className={`text-xs mt-0.5 ${isSelected ? 'text-violet-100' : 'text-slate-500'}`}>
                                                    {preset.type === 'boolean' ? 'One-time daily task' : `Track up to ${preset.target} ${preset.unit}`}
                                                </p>
                                            </div>
                                            <ArrowRightIcon className={`w-5 h-5 transition-all duration-300 ${isSelected ? 'text-white translate-x-1' : 'opacity-0 -translate-x-2 text-violet-500'}`} />
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="py-12 text-center">
                                    <p className="text-slate-500 font-medium italic">Custom identity journeys start with personal creation.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Custom Form */}
                    <div className="lg:w-1/2 overflow-y-auto p-10 bg-white dark:bg-slate-900/10 no-scrollbar">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="flex items-center gap-2">
                                 <PencilIcon className="w-5 h-5 text-violet-500" />
                                 <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Configure Habit</span>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Habit Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={text} 
                                        onChange={e => setText(e.target.value)} 
                                        className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-violet-500/20 outline-none text-xl font-bold" 
                                        placeholder="What will you achieve?" 
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Metric</label>
                                        <div className="flex p-1.5 bg-slate-100 dark:bg-white/5 rounded-[1.25rem] border border-slate-200 dark:border-white/5">
                                            <button type="button" onClick={() => setType('boolean')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${type === 'boolean' ? 'bg-white dark:bg-white/10 shadow-lg text-violet-500' : 'text-slate-400 hover:text-slate-600'}`}>Simple</button>
                                            <button type="button" onClick={() => setType('measurable')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${type === 'measurable' ? 'bg-white dark:bg-white/10 shadow-lg text-violet-500' : 'text-slate-400 hover:text-slate-600'}`}>Target</button>
                                        </div>
                                    </div>
                                    {type === 'measurable' && (
                                        <div className="animate-fade-in-up">
                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Goal</label>
                                                    <input type="number" min="1" value={target} onChange={e => setTarget(parseInt(e.target.value))} className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 outline-none font-bold" />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Unit</label>
                                                    <input type="text" value={unit} onChange={e => setUnit(e.target.value)} className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 outline-none font-bold" placeholder="L, g, pg" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Choose an Icon</label>
                                    <div className="grid grid-cols-6 md:grid-cols-7 gap-2 max-h-40 overflow-y-auto no-scrollbar border-y border-slate-100 dark:border-white/5 py-4">
                                        {Object.keys(TASK_ICONS).map(key => {
                                            const Icon = TASK_ICONS[key];
                                            return (
                                                <button 
                                                    key={key} 
                                                    type="button" 
                                                    onClick={() => setSelectedIcon(key)} 
                                                    className={`aspect-square rounded-xl border-2 flex items-center justify-center transition-all ${selectedIcon === key ? 'bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-500/30 scale-110' : 'border-slate-100 dark:border-white/5 text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:scale-105'}`}
                                                >
                                                    <Icon className="w-5 h-5" />
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] font-black text-xl hover:opacity-90 transition-all active:scale-[0.98] shadow-2xl mt-4">
                                {initialTask ? 'Save Changes' : 'Commit to Habit'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

const DeleteTaskModal = ({ isOpen, onClose, onConfirm, taskName }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, taskName: string }) => {
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter') onConfirm();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, onConfirm]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div 
                className="glass-card w-full max-sm p-8 rounded-3xl animate-scale-in border-l-4 border-red-500 shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Delete Habit?</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                    Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">"{taskName}"</span>? This will erase all daily progress for this specific habit.
                </p>
                <div className="flex gap-4 justify-end">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold transition-colors"
                    >
                        Keep It
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-xl shadow-red-500/20 transition-all hover:scale-105 active:scale-95"
                    >
                        Delete Forever
                    </button>
                </div>
            </div>
        </div>
    );
}

const AddIdentityModal = ({ 
    isOpen, 
    onClose, 
    onAddPreset, 
    onCreateCustom, 
    availablePresets 
}: { 
    isOpen: boolean, 
    onClose: () => void, 
    onAddPreset: (id: string) => void, 
    onCreateCustom: (identity: Identity) => void,
    availablePresets: Identity[] 
}) => {
    if(!isOpen) return null;
    const [view, setView] = useState<'presets' | 'custom'>('presets');
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [selectedPresetId, setSelectedPresetId] = useState(THEME_PRESETS[0].id);

    // If no presets available, switch to custom view by default
    useEffect(() => {
        if (availablePresets.length === 0 && view === 'presets') {
            setView('custom');
        }
    }, [availablePresets, view]);

    const handleCustomSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const preset = THEME_PRESETS.find(p => p.id === selectedPresetId) || THEME_PRESETS[0];
        const newIdentity: Identity = {
            id: `custom-${Date.now()}`,
            name,
            description: desc,
            quote: "Your custom journey begins today.",
            author: "You",
            dailyProgress: {},
            identityTasks: {}, // Will be initialized empty
            theme: {
                gradient: preset.gradient,
                accentColor: preset.accentColor,
                icon: preset.icon
            }
        };
        onCreateCustom(newIdentity);
        onClose();
        setName('');
        setDesc('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
            <div className="glass-card w-full max-w-3xl p-8 rounded-3xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
                 <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Add Identity</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Choose a path or create your own.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full"><XMarkIcon className="w-6 h-6" /></button>
                </div>

                {/* Toggle Tabs (Only if presets exist) */}
                {availablePresets.length > 0 && (
                    <div className="flex gap-4 mb-8 border-b border-slate-200 dark:border-white/10 pb-4">
                        <button 
                            onClick={() => setView('presets')}
                            className={`pb-2 text-lg font-bold transition-colors ${view === 'presets' ? 'text-violet-500 border-b-2 border-violet-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                        >
                            Discover
                        </button>
                        <button 
                            onClick={() => setView('custom')}
                            className={`pb-2 text-lg font-bold transition-colors ${view === 'custom' ? 'text-violet-500 border-b-2 border-violet-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                        >
                            Create Custom
                        </button>
                    </div>
                )}

                {view === 'presets' && availablePresets.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {availablePresets.map(preset => {
                            const theme = preset.theme || { ...THEMES.slate, icon: 'star' };
                            const Icon = TASK_ICONS[theme.icon] || SparklesIcon;
                            return (
                                <button 
                                    key={preset.id} 
                                    onClick={() => { onAddPreset(preset.id); onClose(); }}
                                    className="group text-left p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all hover:scale-[1.02] hover:shadow-xl hover:border-violet-500/30"
                                >
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white mb-4 shadow-lg`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{preset.name}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{preset.description}</p>
                                    <div className="mt-4 flex items-center gap-2 text-violet-500 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                        Add Identity <ArrowRightIcon className="w-4 h-4" />
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                ) : (
                    <form onSubmit={handleCustomSubmit} className="space-y-6">
                         <div>
                            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Identity Name</label>
                            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-violet-500 outline-none text-lg" placeholder="e.g. The Disciplined Leader" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Short Description</label>
                            <input type="text" required value={desc} onChange={e => setDesc(e.target.value)} className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 outline-none" placeholder="e.g. Focus on consistency and hard work." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-3 text-slate-700 dark:text-slate-300">Visual Theme</label>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                {THEME_PRESETS.map(preset => (
                                    <button 
                                        key={preset.id}
                                        type="button"
                                        onClick={() => setSelectedPresetId(preset.id)}
                                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedPresetId === preset.id ? 'border-violet-500 bg-violet-500/10' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${preset.gradient}`} />
                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{preset.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button type="submit" className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform shadow-lg">Create Identity</button>
                    </form>
                )}
            </div>
        </div>
    )
}

const AddGoalModal = ({ isOpen, onClose, onAdd, ai }: { isOpen: boolean, onClose: () => void, onAdd: (goal: Goal) => void, ai: GoogleGenAI }) => {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<Goal['category']>('Personal');
    const [motivation, setMotivation] = useState('');
    const [isThinking, setIsThinking] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setTitle('');
            setCategory('Personal');
            setMotivation('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSelectPreset = (preset: PresetGoal) => {
        setTitle(preset.title);
        setCategory(preset.category);
    };

    const handleSuggest = async () => {
        setIsThinking(true);
        try {
            const prompt = `Suggest a specific, high-impact SMART goal for someone focusing on their ${category} life. Return ONLY a JSON object: { "title": "A short, powerful title" }`;
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });
            const text = response.text;
            if (text) {
                const data = JSON.parse(text);
                setTitle(data.title);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsThinking(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({
            id: Date.now().toString(),
            title,
            category,
            motivation,
            progress: 0,
            milestones: []
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-all duration-300">
            <div className="glass-card w-full max-w-5xl rounded-[2.5rem] animate-fade-in-up overflow-hidden flex flex-col max-h-[85vh] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border-white/20">
                {/* Header */}
                <div className="p-8 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-black/20">
                    <div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Set Your Vision</h3>
                        <p className="text-slate-500 font-medium mt-1">What's the next peak you'll summit?</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-all"><XMarkIcon className="w-8 h-8" /></button>
                </div>

                {/* Split Content */}
                <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                    
                    {/* Left: Library */}
                    <div className="lg:w-1/2 border-r border-slate-200 dark:border-white/10 bg-slate-50/40 dark:bg-black/10 overflow-y-auto p-8 space-y-6 no-scrollbar">
                        <div className="flex items-center gap-2">
                             <TargetIcon className="w-5 h-5 text-violet-500" />
                             <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Goal Library</span>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {PRESET_GOALS.map((preset, idx) => {
                                const Icon = TASK_ICONS[preset.icon] || TargetIcon;
                                const isSelected = title === preset.title;
                                return (
                                    <button 
                                        key={idx}
                                        onClick={() => handleSelectPreset(preset)}
                                        className={`text-left p-5 rounded-2xl border transition-all duration-300 flex items-center gap-4 group ${isSelected ? 'bg-violet-600 border-violet-600 shadow-xl shadow-violet-500/20' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 hover:border-violet-500/40 hover:bg-white dark:hover:bg-white/10'}`}
                                    >
                                        <div className={`p-3 rounded-xl transition-all duration-300 ${isSelected ? 'bg-white text-violet-600' : 'bg-violet-500/10 text-violet-500 group-hover:bg-violet-500 group-hover:text-white'}`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className={`font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{preset.title}</h4>
                                            <p className={`text-xs mt-0.5 ${isSelected ? 'text-violet-100' : 'text-slate-500'}`}>{preset.category} Milestone</p>
                                        </div>
                                        <ArrowRightIcon className={`w-5 h-5 transition-all duration-300 ${isSelected ? 'text-white translate-x-1' : 'opacity-0 -translate-x-2 text-violet-500'}`} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Custom Form */}
                    <div className="lg:w-1/2 overflow-y-auto p-10 bg-white dark:bg-slate-900/10 no-scrollbar">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="flex items-center gap-2">
                                 <PencilIcon className="w-5 h-5 text-violet-500" />
                                 <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Custom Mission</span>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Focus Area</label>
                                    <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-white/5 rounded-[1.5rem] border border-slate-200 dark:border-white/5">
                                        {['Health', 'Business', 'Personal', 'Financial'].map((cat) => (
                                            <button 
                                                key={cat} 
                                                type="button" 
                                                onClick={() => setCategory(cat as any)} 
                                                className={`py-3 rounded-xl font-bold text-sm transition-all ${category === cat ? 'bg-white dark:bg-white/10 shadow-lg text-violet-600 scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Goal Title</label>
                                        <button 
                                            type="button" 
                                            onClick={handleSuggest} 
                                            disabled={isThinking} 
                                            className="text-xs font-black text-violet-600 hover:text-violet-500 flex items-center gap-1 transition-all group"
                                        >
                                            {isThinking ? <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" /> : <SparklesIcon className="w-3.5 h-3.5 group-hover:animate-pulse" />}
                                            Winnie's Help
                                        </button>
                                    </div>
                                    <textarea 
                                        required 
                                        rows={2}
                                        value={title} 
                                        onChange={e => setTitle(e.target.value)} 
                                        className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-violet-500/20 outline-none text-xl font-bold resize-none" 
                                        placeholder="Summarize your vision..." 
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">The "Why" (Motivation)</label>
                                    <textarea 
                                        rows={3}
                                        value={motivation} 
                                        onChange={e => setMotivation(e.target.value)} 
                                        className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-violet-500/20 outline-none text-base font-medium resize-none" 
                                        placeholder="Why does this matter to you? What will it feel like to achieve this?" 
                                    />
                                    <p className="text-[10px] text-slate-400 mt-2 italic">Emotional connection increases goal completion rates by up to 30%.</p>
                                </div>
                            </div>

                            <button type="submit" className="w-full py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] font-black text-xl hover:opacity-95 transition-all active:scale-[0.98] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)] dark:shadow-none mt-4">
                                Define Goal
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- View Components ---

const IdentityBuilderView = ({ 
    identity, 
    onUpdate, 
    myIdentities, // Only the user's unlocked identities
    allPresets, // All default presets (for adding)
    onSelectIdentity, 
    onCreateCustom,
    onAddPreset,
    ai,
}: { 
    identity: Identity, 
    onUpdate: (i: Identity) => void, 
    myIdentities: Identity[], 
    allPresets: Identity[],
    onSelectIdentity: (id: string) => void, 
    onCreateCustom: (i: Identity) => void,
    onAddPreset: (id: string) => void,
    ai: GoogleGenAI,
}) => {
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<{ id: string, name: string } | null>(null);
    const [editingTask, setEditingTask] = useState<IdentityTask | null>(null);

    // Filter out already added presets for the "Add" modal
    const availablePresets = useMemo(() => {
        const myIds = myIdentities.map(i => i.id);
        return allPresets.filter(p => !myIds.includes(p.id));
    }, [allPresets, myIdentities]);

    // Dynamic Theme Logic
    const currentTheme = useMemo(() => {
        // Use user's theme if exists, else match ID to default or fallback
        if (identity.theme) return identity.theme;
        const defaultId = DEFAULT_IDENTITIES.find(d => d.id === identity.id);
        return defaultId?.theme || { gradient: THEMES.slate.gradient, accentColor: THEMES.slate.accentColor, icon: 'star', shadow: 'shadow-slate-500/20' };
    }, [identity]);

    const tasks = (identity.identityTasks && identity.identityTasks[identity.id]) ? identity.identityTasks[identity.id] : [];

    const handleTaskToggle = (taskId: string) => {
        const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
        const updatedIdentity = {
            ...identity,
            identityTasks: {
                ...identity.identityTasks,
                [identity.id]: updatedTasks
            }
        };
        onUpdate(updatedIdentity);
    };

    const handleCounter = (taskId: string, delta: number) => {
        const updatedTasks = tasks.map(t => {
            if (t.id === taskId && t.type === 'measurable') {
                const newCurrent = Math.max(0, (t.current || 0) + delta);
                return { ...t, current: newCurrent, completed: newCurrent >= (t.target || 1) };
            }
            return t;
        });
        const updatedIdentity = { ...identity, identityTasks: { ...identity.identityTasks, [identity.id]: updatedTasks } };
        onUpdate(updatedIdentity);
    };

    const handleSaveTask = (task: IdentityTask) => {
        let updatedTasks;
        // Check if task exists (update) or is new (add)
        const exists = tasks.some(t => t.id === task.id);
        if (exists) {
            updatedTasks = tasks.map(t => t.id === task.id ? task : t);
        } else {
            updatedTasks = [...tasks, task];
        }
        onUpdate({ ...identity, identityTasks: { ...identity.identityTasks, [identity.id]: updatedTasks } });
        setEditingTask(null);
    };

    const confirmDeleteTask = () => {
        if (!taskToDelete) return;
        const updatedTasks = tasks.filter(t => t.id !== taskToDelete.id);
        onUpdate({ ...identity, identityTasks: { ...identity.identityTasks, [identity.id]: updatedTasks } });
        setTaskToDelete(null);
    };

    const progress = useMemo(() => {
        if (tasks.length === 0) return 0;
        return Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);
    }, [tasks]);

    return (
        <div className="relative min-h-full pb-20">
             <IdentityBackground backgroundUrl={identity.backgroundUrl} />
             <div className="relative z-10 max-w-5xl mx-auto space-y-8 animate-fade-in-up p-4">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10 border border-white/10 backdrop-blur-md mb-4 ${currentTheme.accentColor}`}>
                            <span className="relative flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentTheme.accentColor.replace('text-', 'bg-')}`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${currentTheme.accentColor.replace('text-', 'bg-')}`}></span>
                            </span>
                            <span className="text-xs font-bold uppercase tracking-wider">Active Identity</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
                            I am <span className={`text-transparent bg-clip-text bg-gradient-to-r ${currentTheme.gradient}`}>{identity.name}</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed font-medium">{identity.description}</p>
                    </div>
                    
                    {/* Identity Selector */}
                    <div className="flex gap-4 overflow-x-auto p-4 max-w-full no-scrollbar">
                        {myIdentities.map(id => {
                            const isActive = id.id === identity.id;
                            const theme = id.theme || DEFAULT_IDENTITIES.find(d => d.id === id.id)?.theme || { ...THEMES.slate, icon: 'star' };
                            const IconComponent = TASK_ICONS[theme.icon] || SparklesIcon;
                            
                            return (
                                <button
                                    key={id.id}
                                    onClick={() => onSelectIdentity(id.id)}
                                    className={`relative group flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${isActive ? 'scale-110 shadow-2xl ring-2 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-900 ring-slate-400 dark:ring-slate-500' : 'hover:scale-105'}`}
                                >
                                    {/* Gradient Background - Stronger opacity for active */}
                                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${theme.gradient} ${isActive ? 'opacity-100' : 'opacity-10 group-hover:opacity-100'} transition-all duration-300`}></div>
                                    
                                    {/* Glow for active state */}
                                    {isActive && <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${theme.gradient} blur-lg opacity-40`}></div>}

                                    {/* Icon rendering logic */}
                                    <div className={`relative z-10 font-bold ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'} transition-colors duration-300`}>
                                        <IconComponent className="w-8 h-8" />
                                    </div>
                                </button>
                            );
                        })}
                        <button onClick={() => setIsCreateModalOpen(true)} className="flex-shrink-0 w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <PlusIcon className="w-8 h-8" />
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="glass-card p-1 rounded-full relative overflow-hidden">
                    <div className={`h-2 rounded-full bg-gradient-to-r ${currentTheme.gradient} transition-all duration-1000 ease-out`} style={{ width: `${progress}%` }}></div>
                </div>

                {/* Tasks Grid */}
                <div>
                     <div className="flex justify-between items-center mb-8">
                        <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Today's Habits</h2>
                        <button onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold hover:opacity-90 transition-opacity shadow-lg">
                            <PlusIcon className="w-4 h-4" /> <span>Add Habit</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tasks.map(task => {
                             const Icon = task.icon && TASK_ICONS[task.icon] ? TASK_ICONS[task.icon] : SparklesIcon;
                             const shadowClass = (currentTheme as any).shadow || 'shadow-violet-500/20';

                             return (
                                <div key={task.id} className={`group relative p-6 rounded-3xl bg-white/90 dark:bg-slate-900/40 border border-white/50 dark:border-white/5 backdrop-blur-2xl shadow-lg hover:shadow-2xl hover:bg-white/95 dark:hover:bg-slate-800/50 ${shadowClass} hover:-translate-y-1 transition-all duration-500 ease-out overflow-hidden`}>
                                    
                                    {/* Immersive Gradient Background (Hover Tint) */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${currentTheme.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none`}></div>
                                    
                                    {/* Gradient Border/Edge Accent (Bottom Strip) */}
                                    <div className={`absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r ${currentTheme.gradient} opacity-50 group-hover:opacity-100 transition-opacity duration-500`}></div>

                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                                        <button 
                                            onClick={() => { setEditingTask(task); setIsTaskModalOpen(true); }}
                                            className="p-2 text-slate-400 hover:text-violet-500 bg-white/50 dark:bg-black/20 rounded-xl backdrop-blur-md transition-all hover:scale-110"
                                            title="Edit Habit"
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => setTaskToDelete({ id: task.id, name: task.text })}
                                            className="p-2 text-slate-400 hover:text-red-500 bg-white/50 dark:bg-black/20 rounded-xl backdrop-blur-md transition-all hover:scale-110"
                                            title="Delete Habit"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-start gap-5 relative z-10">
                                        <div className={`p-4 rounded-2xl bg-gradient-to-br ${currentTheme.gradient} text-white shadow-xl shadow-slate-900/10`}>
                                            <Icon className="w-7 h-7" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`text-2xl font-bold mb-2 leading-tight transition-all duration-500 ${task.completed ? 'text-slate-400 line-through decoration-2 decoration-slate-400/30' : 'text-slate-900 dark:text-slate-100'}`}>{task.text}</h3>
                                            <p className="text-base text-slate-700 dark:text-slate-400 mb-6 font-medium leading-relaxed opacity-90">Daily Goal</p>
                                            
                                            {task.type === 'boolean' ? (
                                                <button 
                                                    onClick={() => handleTaskToggle(task.id)}
                                                    className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) active:scale-95 ${task.completed ? 'bg-green-500 text-white shadow-xl shadow-green-500/30 scale-[1.02]' : 'bg-slate-100/80 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'}`}
                                                >
                                                    {task.completed ? <><CheckCircleIconSolid className="w-6 h-6 animate-check-pop" /> Complete</> : 'Mark Complete'}
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => handleCounter(task.id, -1)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100/80 dark:bg-white/10 text-slate-600 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20 transition-colors active:scale-90 duration-200">
                                                        <MinusIcon className="w-5 h-5" />
                                                    </button>
                                                    <div className="flex-1 h-12 flex items-center justify-center bg-slate-50/50 dark:bg-black/20 rounded-2xl border border-slate-200/50 dark:border-white/5">
                                                        <span className="font-mono font-bold text-xl text-slate-900 dark:text-white">{task.current} <span className="text-sm text-slate-400 font-sans mx-1">/</span> {task.target} <span className="text-xs text-slate-400 font-sans ml-1">{task.unit}</span></span>
                                                    </div>
                                                     <button onClick={() => handleCounter(task.id, 1)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-all active:scale-90 duration-200 shadow-lg">
                                                        <PlusIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                             )
                        })}
                    </div>
                </div>

                {/* Details Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                     <div className="glass-card p-8 rounded-3xl">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Why this matters</h3>
                        <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                            Embodying the identity of {identity.name} isn't just about the tasks; it's about casting a vote for the person you wish to become. Every checkmark is proof of your commitment.
                        </p>
                    </div>
                     <div className="glass-card p-8 rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-white/5 dark:to-white/0 border border-white/10 flex flex-col justify-center">
                        <blockquote className="text-2xl font-serif italic text-slate-800 dark:text-slate-200 mb-4 leading-relaxed">"{identity.quote}"</blockquote>
                        <cite className="text-slate-500 dark:text-slate-400 font-bold not-italic">— {identity.author}</cite>
                    </div>
                </div>

                {/* AI Vision & Background Section */}
                <div className="space-y-8 mt-12">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Identity Vision</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Use AI to visualize your future self and customize your space.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <AIImageGenerator 
                                ai={ai} 
                                label="Vision Board" 
                                currentImage={identity.visionBoardUrl}
                                onSave={(url) => onUpdate({ ...identity, visionBoardUrl: url })}
                            />
                            {identity.visionBoardUrl && (
                                <div className="glass-card p-6 rounded-3xl animate-in fade-in duration-700">
                                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Your Manifestation</h4>
                                    <img src={identity.visionBoardUrl} alt="Vision Board" className="w-full rounded-2xl shadow-2xl border border-white/10" referrerPolicy="no-referrer" />
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <AIImageGenerator 
                                ai={ai} 
                                label="Identity Background" 
                                currentImage={identity.backgroundUrl}
                                onSave={(url) => onUpdate({ ...identity, backgroundUrl: url })}
                            />
                            <div className="p-6 rounded-3xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                    <SparklesIcon className="w-5 h-5" />
                                    <p className="text-sm font-medium">The background will appear subtly behind your identity dashboard.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

             </div>
             <AddTaskModal 
                isOpen={isTaskModalOpen} 
                onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); }} 
                onSave={handleSaveTask}
                initialTask={editingTask}
                activeIdentity={identity}
             />
             <DeleteTaskModal isOpen={!!taskToDelete} onClose={() => setTaskToDelete(null)} onConfirm={confirmDeleteTask} taskName={taskToDelete?.name || ''} />
             
             {/* Use the new AddIdentityModal that handles both presets and custom */}
             <AddIdentityModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onCreateCustom={onCreateCustom}
                onAddPreset={onAddPreset}
                availablePresets={availablePresets} 
             />
        </div>
    );
};

const GoalAdvisorChatbot = ({ ai, onSuggestGoal }: { ai: GoogleGenAI, onSuggestGoal: (goal: Goal) => void }) => {
    const [messages, setMessages] = useState<{role: 'user'|'model', text: string, goalData?: any}[]>([
        { role: 'model', text: "Hi! I'm Winnie, your goal coach. Tell me what you want to achieve, and I'll help you make it specific and actionable." }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setIsTyping(true);

        try {
            const systemPrompt = "You are an expert goal setting coach. Help the user define SMART goals. If the user's intent is vague (e.g., 'get fit'), ask clarifying questions. If the user provides a clear goal, output a JSON object with the key 'suggested_goal' containing { title, category, milestones: [] } AND a short encouraging text message. If just chatting, just reply text.";
            
            const chat = ai.chats.create({
                model: 'gemini-3-flash-preview',
                config: { systemInstruction: systemPrompt }
            });
            
            // Build history
            const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
            
            const result = await chat.sendMessage({ message: userMsg });
            const responseText = result.text;
            
            // Try parse JSON
            let goalData = null;
            let displayMsg = responseText;

            try {
                // Heuristic to find JSON block if mixed with text
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    if (parsed.suggested_goal) {
                        goalData = parsed.suggested_goal;
                        // Clean text if possible or just use standard msg
                        displayMsg = "That sounds like a great plan. Here is a structured goal for you:";
                    }
                }
            } catch(e) {
                // ignore
            }

            setMessages(prev => [...prev, { role: 'model', text: displayMsg, goalData }]);

        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', text: "Sorry, I had trouble thinking about that. Try again?" }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] glass-card rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center text-white">
                        <SparklesIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">Winnie</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">AI Goal Coach</p>
                    </div>
                </div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl p-4 ${m.role === 'user' ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200'}`}>
                            <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                            {m.goalData && (
                                <div className="mt-4 p-3 bg-white/90 dark:bg-black/20 rounded-xl border border-white/10">
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">{m.goalData.title}</h4>
                                    <span className="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-white/20 text-slate-700 dark:text-slate-300">{m.goalData.category || 'Goal'}</span>
                                    <button 
                                        onClick={() => onSuggestGoal({...m.goalData, id: Date.now().toString(), progress: 0, milestones: m.goalData.milestones?.map((t:string) => ({text:t, completed:false})) || []})}
                                        className="mt-3 w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-bold hover:opacity-90"
                                    >
                                        Add to Goals
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isTyping && (
                     <div className="flex justify-start">
                        <div className="bg-slate-100 dark:bg-white/10 rounded-2xl p-4 flex gap-1">
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:'0.1s'}}></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:'0.2s'}}></span>
                        </div>
                    </div>
                )}
            </div>
            <div className="p-4 bg-white/50 dark:bg-black/20 border-t border-slate-200 dark:border-white/10">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        className="flex-1 p-3 rounded-xl bg-transparent border border-slate-300 dark:border-white/20 focus:border-violet-500 outline-none text-slate-900 dark:text-white placeholder-slate-500"
                        placeholder="Type a message..."
                    />
                    <button onClick={handleSend} disabled={!input.trim()} className="p-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50">
                        <SendIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const GoalsView = ({ goals, onAddGoal, ai }: { goals: Goal[], onAddGoal: (g: Goal) => void, ai: GoogleGenAI }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    return (
        <div className="space-y-8 animate-fade-in-up pb-20 p-4">
             <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Goals</h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">Design your future, one milestone at a time.</p>
                </div>
                <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-5 py-3 bg-violet-600 text-white rounded-full font-bold shadow-lg shadow-violet-500/30 hover:bg-violet-700 transition-colors">
                    <PlusIcon className="w-5 h-5" /> New Goal
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Goals List - Takes 3/5 width on large screens */}
                <div className="lg:col-span-3 space-y-6">
                    {goals.length === 0 ? (
                        <div className="glass-card p-12 rounded-3xl text-center">
                            <TargetIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No goals yet</h3>
                            <p className="text-slate-500 mt-2">Chat with Winnie or click "New Goal" to get started.</p>
                        </div>
                    ) : (
                        goals.map(goal => (
                            <div key={goal.id} className="glass-card p-8 rounded-3xl hover:border-violet-500/30 transition-all group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex-1">
                                        <span className="inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">{goal.category}</span>
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{goal.title}</h3>
                                    </div>
                                    <div className="radial-progress text-violet-500 text-xs font-bold shrink-0 ml-4" style={{"--value":goal.progress, "--size": "3.5rem"} as any}>
                                        {goal.progress}%
                                    </div>
                                </div>

                                {goal.motivation && (
                                    <div className="mb-6 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                                            <HeartIcon className="w-3 h-3 text-red-500/70" /> 
                                            The Why
                                        </h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 italic font-medium leading-relaxed">
                                            "{goal.motivation}"
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                                        <span>Progress</span>
                                        <span>{goal.progress}%</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-1000" style={{width: `${goal.progress}%`}}></div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Chatbot - Takes 2/5 width and sticky */}
                <div className="lg:col-span-2">
                    <div className="sticky top-6">
                        <GoalAdvisorChatbot ai={ai} onSuggestGoal={onAddGoal} />
                    </div>
                </div>
            </div>

            <AddGoalModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={onAddGoal} ai={ai} />
        </div>
    );
};

const JourneyView = ({ history }: { history: DailyData[] }) => {
    // Sort history by date desc
    const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up p-4 pb-20 w-full">
             <div className="text-center mb-10">
                <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">Your Journey</h2>
                <p className="text-lg text-slate-600 dark:text-slate-400">Every step counts. Look back at how far you've come.</p>
            </div>

            {sortedHistory.length === 0 ? (
                <div className="glass-card p-12 rounded-3xl text-center">
                    <CalendarIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">No history yet</h3>
                    <p className="text-slate-500 mt-2">Complete your daily wins and save them to see your journey.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {sortedHistory.map((day) => (
                        <div key={day.date} className="glass-card p-6 rounded-3xl relative overflow-hidden group hover:border-violet-500/30 transition-all">
                             <div className="flex flex-col md:flex-row gap-6">
                                {/* Date Column */}
                                <div className="md:w-32 flex-shrink-0 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                                    <span className="text-xs font-bold uppercase text-slate-500">{new Date(day.date).toLocaleString('default', { month: 'short' })}</span>
                                    <span className="text-3xl font-black text-slate-900 dark:text-white">{new Date(day.date).getDate()}</span>
                                    <span className="text-xs text-slate-400">{new Date(day.date).toLocaleString('default', { weekday: 'short' })}</span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 space-y-4">
                                    {/* Wins */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {day.wins.map((win) => (
                                            <div key={win.id} className={`p-3 rounded-xl border flex items-center gap-2 ${win.completed ? 'bg-green-500/10 border-green-500/20' : 'bg-slate-50 dark:bg-white/5 border-transparent'}`}>
                                                <div className={`w-2 h-2 rounded-full ${win.completed ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                                <span className={`text-sm font-medium ${win.completed ? 'text-green-700 dark:text-green-400' : 'text-slate-500'}`}>{win.text || 'No goal set'}</span>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Reflection & Mood */}
                                    {(day.reflection || day.mood) && (
                                        <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-start gap-4">
                                            {day.mood > 0 && (
                                                <div className="text-2xl" title={`Mood: ${day.mood}/5`}>
                                                    {['😢','😕','😐','🙂','🤩'][day.mood - 1]}
                                                </div>
                                            )}
                                            {day.reflection && (
                                                <p className="text-slate-600 dark:text-slate-300 text-sm italic line-clamp-2">"{day.reflection}"</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                             </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ProfileView = ({ userData, onRestartOnboarding, user, updateUserData }: { userData: UserData, onRestartOnboarding: () => void, user: User, updateUserData: (d: UserData) => void }) => {
    const unlockedTitles = useMemo(() => {
        const titles = MASTER_ACHIEVEMENTS
            .filter(ach => userData.achievements.includes(ach.id) && ach.titleReward)
            .map(ach => ach.titleReward as string);
        // Add default title if not already there
        if (!titles.includes('Novice')) titles.unshift('Novice');
        return Array.from(new Set(titles));
    }, [userData.achievements]);

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up p-4 pb-20">
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Profile & Stats</h2>
            
            {/* User Info */}
            <div className="glass-card p-8 rounded-3xl flex flex-col md:flex-row items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-violet-500/20">
                    {user.name.charAt(0)}
                </div>
                <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white">{user.name}</h3>
                        {userData.currentTitle && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-black uppercase tracking-widest border border-amber-500/20">
                                <CrownIcon className="w-3 h-3 mr-1" /> {userData.currentTitle}
                            </span>
                        )}
                    </div>
                    <p className="text-slate-500 font-medium">Focus: {userData.identity.name} • Member since {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                </div>
            </div>

            {/* Title Selector */}
            {unlockedTitles.length > 1 && (
                <div className="glass-card p-8 rounded-3xl">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <CheckBadgeIcon className="w-5 h-5 text-violet-500" /> Choose Your Title
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {unlockedTitles.map(title => (
                            <button
                                key={title}
                                onClick={() => updateUserData({ ...userData, currentTitle: title })}
                                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all border-2 ${userData.currentTitle === title ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-500/30 scale-105' : 'bg-slate-50 dark:bg-white/5 border-transparent text-slate-500 hover:border-violet-500/30'}`}
                            >
                                {title}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card p-6 rounded-2xl text-center">
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-amber-400 to-orange-500 mb-1">{userData.streak}</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Day Streak</div>
                </div>
                <div className="glass-card p-6 rounded-2xl text-center">
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-violet-400 to-fuchsia-500 mb-1">{userData.totalWins}</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Wins</div>
                </div>
                 <div className="glass-card p-6 rounded-2xl text-center">
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-emerald-400 to-teal-500 mb-1">{userData.achievements.length} / {MASTER_ACHIEVEMENTS.length}</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Achievements</div>
                </div>
                 <div className="glass-card p-6 rounded-2xl text-center">
                    <div className="text-4xl font-black text-slate-700 dark:text-slate-200 mb-1">12</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Level</div>
                </div>
            </div>

            {/* Achievements Section */}
            <div className="glass-card p-8 rounded-3xl">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                    <TrophyIcon className="w-6 h-6 text-amber-500" /> Achievements
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {MASTER_ACHIEVEMENTS.map(ach => {
                         const isUnlocked = userData.achievements.includes(ach.id);
                         return (
                             <div key={ach.id} className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${isUnlocked ? 'bg-amber-500/10 border-amber-500/20' : 'bg-slate-50 dark:bg-white/5 border-transparent opacity-50 grayscale'}`}>
                                 <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isUnlocked ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-200 dark:bg-white/10 text-slate-400'}`}>
                                     <ach.icon className="w-6 h-6" />
                                 </div>
                                 <div>
                                     <span className="block font-bold text-slate-900 dark:text-slate-200 text-sm">{ach.title}</span>
                                     <span className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{ach.description}</span>
                                 </div>
                             </div>
                         )
                     })}
                </div>
            </div>

            {/* Preferences */}
            <div className="glass-card p-8 rounded-3xl">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Preferences</h3>
                
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/5">
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">Dark Mode</h4>
                        <p className="text-sm text-slate-500">Switch between light and dark themes</p>
                    </div>
                    <button 
                        onClick={() => updateUserData({ ...userData, theme: userData.theme === 'dark' ? 'light' : 'dark' })} 
                        className={`w-12 h-6 rounded-full transition-all relative ${userData.theme === 'dark' ? 'bg-violet-600' : 'bg-slate-300 dark:bg-white/10'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${userData.theme === 'dark' ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>

                <div className="flex items-center justify-between p-4">
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">Onboarding</h4>
                        <p className="text-sm text-slate-500">Replay the welcome experience</p>
                    </div>
                    <button onClick={onRestartOnboarding} className="px-4 py-2 bg-slate-200 dark:bg-white/10 rounded-lg text-sm font-bold hover:bg-slate-300 dark:hover:bg-white/20">
                        Restart
                    </button>
                </div>
            </div>
        </div>
    )
}

const DailyAffirmationCard = ({ ai, currentAffirmation, onUpdateAffirmation }: { ai: GoogleGenAI, currentAffirmation?: { text: string, date: string }, onUpdateAffirmation: (text: string) => void }) => {
    const [isLoading, setIsLoading] = useState(false);
    const today = new Date().toISOString().split('T')[0];
    const isToday = currentAffirmation?.date === today;

    const fetchAffirmation = async () => {
        setIsLoading(true);
        try {
            const prompt = "Generate a short, powerful, single-sentence daily affirmation for personal growth, resilience, and intentional living. No hashtags, no extra text, just the affirmation.";
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });
            const text = response.text;
            if (text) {
                onUpdateAffirmation(text.trim());
            }
        } catch (error) {
            console.error("Failed to generate affirmation", error);
            onUpdateAffirmation("Today, I choose to focus on progress, not perfection.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isToday && !isLoading) {
            fetchAffirmation();
        }
    }, [isToday]);

    return (
        <div className="glass-card p-6 rounded-3xl border-l-4 border-violet-500 relative overflow-hidden group shadow-xl hover:shadow-2xl transition-all duration-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none group-hover:bg-violet-500/10 transition-all duration-500" />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-violet-500/10 rounded-lg text-violet-500">
                        <SparklesIcon className="w-5 h-5" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Daily Affirmation</h3>
                </div>
                <button 
                    onClick={fetchAffirmation} 
                    disabled={isLoading}
                    className="p-1.5 text-slate-400 hover:text-violet-500 hover:bg-violet-500/5 rounded-lg transition-all active:rotate-180 duration-500 disabled:opacity-50"
                    title="Refresh Affirmation"
                >
                    <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="relative z-10">
                {isLoading ? (
                    <div className="space-y-2 py-2">
                        <div className="h-4 bg-slate-200 dark:bg-white/5 rounded-full animate-pulse w-full"></div>
                        <div className="h-4 bg-slate-200 dark:bg-white/5 rounded-full animate-pulse w-3/4"></div>
                    </div>
                ) : (
                    <p className="text-xl md:text-2xl font-serif italic text-slate-800 dark:text-slate-100 leading-relaxed font-medium">
                        "{currentAffirmation?.text || "..."}"
                    </p>
                )}
            </div>
            
            <div className="absolute bottom-2 right-4 text-[8px] font-bold text-slate-300 dark:text-slate-600 tracking-tighter uppercase pointer-events-none">
                AI Inspired
            </div>
        </div>
    );
};

const DashboardPage = ({ userData, updateUserData, ai, user, onResetData }: { userData: UserData, updateUserData: (d: UserData) => void, ai: GoogleGenAI, user: User, onResetData: () => void }) => {
    const [view, setView] = useState<'today' | 'identity' | 'journey' | 'goals' | 'profile'>('today');
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    const todayStr = new Date().toISOString().split('T')[0];

    const MOODS = [
        { value: 1, icon: FaceFrownIcon, label: 'Rough', color: 'text-red-500' },
        { value: 2, icon: FaceSadIcon, label: 'Down', color: 'text-orange-500' },
        { value: 3, icon: FaceMehIcon, label: 'Okay', color: 'text-yellow-500' },
        { value: 4, icon: FaceSmileIcon, label: 'Good', color: 'text-lime-500' },
        { value: 5, icon: FaceHappyIcon, label: 'Great', color: 'text-green-500' },
    ];

    const visibleIdentities = useMemo(() => {
        const presets = DEFAULT_IDENTITIES.filter(id => userData.unlockedIdentityIds.includes(id.id));
        return [...presets, ...userData.customIdentities];
    }, [userData.unlockedIdentityIds, userData.customIdentities]);

    const todayData = useMemo(() => {
        if (userData.todayDraft && userData.todayDraft.date === todayStr) {
            return userData.todayDraft;
        }
        
        const savedToday = userData.history.find(d => d.date === todayStr);
        if (savedToday) return savedToday;

        return {
            date: todayStr,
            wins: [
                { id: `phys-${todayStr}`, category: 'physical', text: '', completed: false },
                { id: `men-${todayStr}`, category: 'mental', text: '', completed: false },
                { id: `spir-${todayStr}`, category: 'spiritual', text: '', completed: false }
            ] as DailyWin[],
            reflection: '',
            mood: 0,
            question: '',
            questionAnswer: ''
        };
    }, [userData.todayDraft, userData.history, todayStr]);

    const handleUpdateDay = (updatedDay: DailyData) => {
        updateUserData({ ...userData, todayDraft: updatedDay });
    };

    const handleWinUpdate = (index: number, updates: Partial<DailyWin>) => {
        const newWins = [...todayData.wins];
        newWins[index] = { ...newWins[index], ...updates };
        handleUpdateDay({ ...todayData, wins: newWins });
    };

    const handleSaveDay = () => {
        setIsSaving(true);
        
        const otherHistory = userData.history.filter(d => d.date !== todayStr);
        const newHistory = [...otherHistory, todayData];
        
        const completedWinsCount = todayData.wins.filter(w => w.completed).length;
        
        setTimeout(() => {
            updateUserData({ 
                ...userData, 
                history: newHistory,
                totalWins: userData.totalWins + completedWinsCount,
                todayDraft: todayData 
            });
            setIsSaving(false);
            setShowSuccessToast(true);
            
            // Trigger confetti for a "pop" effect
            const duration = 3000;
            setTimeout(() => setShowSuccessToast(false), duration);
        }, 1200); // Slightly longer for a smoother feel
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Morning';
        if (hour < 18) return 'Afternoon';
        return 'Evening';
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <header className="flex-shrink-0 h-16 flex items-center justify-between px-6 border-b border-slate-200/50 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-md z-40">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-tr from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center text-white font-bold">W</div>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-none">DailyWins</span>
                        {userData.currentTitle && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 mt-0.5">{userData.currentTitle}</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                     <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-white font-bold">
                         {userData.streak}🔥
                     </div>
                </div>
            </header>

            <AnimatePresence>
                {showSuccessToast && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.8 }}
                        className="fixed top-24 left-1/2 -translate-x-1/2 z-[60]"
                    >
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-4 rounded-2xl font-black shadow-[0_20px_50px_rgba(16,185,129,0.3)] flex items-center gap-3 border border-white/20">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                <CheckBadgeIcon className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm leading-none">Victory Logged!</span>
                                <span className="text-[10px] opacity-80 uppercase tracking-widest mt-1">Journey Updated</span>
                            </div>
                        </div>
                        <Confetti />
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="flex-1 overflow-y-auto relative">
                <GlobalAmbientBackground backgroundUrl={userData.identity.backgroundUrl} />
                
                {view === 'today' && (
                     <div className="max-w-2xl mx-auto p-6 space-y-8 animate-fade-in-up pb-32">
                        <div className="text-center py-10">
                            <h1 className="text-5xl font-black text-slate-900 dark:text-white mb-2">Good {getGreeting()}</h1>
                            <p className="text-xl text-slate-600 dark:text-slate-400">Ready to win the day, {user.name}?</p>
                        </div>

                        <div className="space-y-4">
                             {todayData.wins.map((win, i) => (
                                 <div 
                                    key={win.id} 
                                    className={`glass-card p-6 rounded-3xl flex items-center gap-4 group transition-all duration-500 ${win.completed ? 'bg-green-500/5 dark:bg-green-500/10 border-green-500/30 ring-4 ring-green-500/5 shadow-green-500/10' : 'hover:border-violet-500/30'}`}
                                 >
                                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all duration-500 bg-gradient-to-br ${win.completed ? 'from-green-400 to-emerald-600 shadow-lg scale-90 opacity-80' : i===0 ? 'from-amber-400 to-orange-500': i===1 ? 'from-emerald-400 to-teal-500' : 'from-violet-400 to-purple-500'}`}>
                                         {i===0 ? <DumbbellIcon className="w-6 h-6" /> : i===1 ? <BrainIcon className="w-6 h-6" /> : <LotusIcon className="w-6 h-6" />}
                                     </div>
                                     <div className="flex-1">
                                         <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{win.category} Win</h3>
                                         <input 
                                            type="text" 
                                            value={win.text || ''}
                                            onChange={(e) => handleWinUpdate(i, { text: e.target.value })}
                                            placeholder={`Type your ${win.category} goal...`} 
                                            className={`w-full bg-transparent border-b-2 border-slate-200 dark:border-white/10 focus:border-violet-500 outline-none text-lg font-medium text-slate-900 dark:text-white placeholder-slate-400 py-1 transition-all duration-500 ${win.completed ? 'line-through opacity-40 text-slate-500' : ''}`} 
                                         />
                                     </div>
                                     <div className="relative">
                                         {win.completed && <div className="absolute inset-0 rounded-full animate-completion-ring pointer-events-none" />}
                                         <button 
                                            onClick={() => handleWinUpdate(i, { completed: !win.completed })}
                                            className={`relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${win.completed ? 'bg-green-500 border-green-500 text-white scale-110 shadow-lg shadow-green-500/20' : 'border-slate-300 dark:border-white/20 group-hover:border-violet-500 hover:scale-105'}`}
                                         >
                                            {win.completed ? <CheckCircleIconSolid className="w-6 h-6 animate-check-pop" /> : <PlusIcon className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                         </button>
                                     </div>
                                 </div>
                             ))}
                        </div>

                        <DailyAffirmationCard 
                            ai={ai} 
                            currentAffirmation={userData.dailyAffirmation}
                            onUpdateAffirmation={(text) => updateUserData({...userData, dailyAffirmation: { text, date: todayStr }})}
                        />

                         <div className="glass-card p-8 rounded-3xl mt-8">
                             <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><JournalIcon className="w-5 h-5" /> Daily Reflection</h3>
                             </div>

                             <div className="mb-6">
                                <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 block">How are you feeling?</label>
                                <div className="flex justify-between gap-2">
                                    {MOODS.map((m) => (
                                        <button
                                            key={m.value}
                                            onClick={() => handleUpdateDay({...todayData, mood: m.value})}
                                            className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300 ${todayData.mood === m.value ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg scale-105' : 'bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400'}`}
                                        >
                                            <m.icon className={`w-8 h-8 ${todayData.mood === m.value ? 'text-current' : m.color}`} />
                                            <span className="text-xs font-bold">{m.label}</span>
                                        </button>
                                    ))}
                                </div>
                             </div>

                             <textarea 
                                value={todayData.reflection}
                                onChange={(e) => handleUpdateDay({...todayData, reflection: e.target.value})}
                                placeholder="How are you feeling today?" 
                                className="w-full h-32 bg-slate-50 dark:bg-black/20 rounded-xl p-4 resize-none outline-none focus:ring-2 focus:ring-violet-500/50 text-slate-700 dark:text-slate-300 placeholder-slate-400"
                             ></textarea>
                         </div>

                         <div className="pt-10 flex flex-col items-center">
                            <motion.button 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSaveDay}
                                disabled={isSaving}
                                className={`w-full max-w-sm py-5 px-8 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all shadow-2xl hover:shadow-violet-500/30 ${isSaving ? 'bg-slate-200 dark:bg-white/10 text-slate-400' : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'}`}
                            >
                                {isSaving ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Saving Journey...</span>
                                    </div>
                                ) : (
                                    <>
                                        <CheckBadgeIcon className="w-7 h-7" />
                                        Save My Wins
                                    </>
                                )}
                            </motion.button>
                            <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Ends the day and adds to journey</p>
                         </div>
                     </div>
                )}

                {view === 'journey' && (
                     <div className="max-w-3xl mx-auto p-6 space-y-6 animate-fade-in-up pb-20 flex flex-col items-center">
                        <JourneyView history={userData.history} />
                     </div>
                )}

                {view === 'identity' && (
                    <IdentityBuilderView 
                        identity={userData.identity} 
                        onUpdate={(i) => updateUserData({...userData, identity: i})} 
                        myIdentities={visibleIdentities}
                        allPresets={DEFAULT_IDENTITIES}
                        onSelectIdentity={(id) => {
                             const target = visibleIdentities.find(i => i.id === id);
                             if (target) updateUserData({...userData, identity: target});
                        }}
                        onCreateCustom={(i) => updateUserData({...userData, customIdentities: [...userData.customIdentities, i], identity: i})}
                        onAddPreset={(id) => {
                            if (userData.unlockedIdentityIds.includes(id)) return;
                            const newUnlocked = [...userData.unlockedIdentityIds, id];
                            const target = DEFAULT_IDENTITIES.find(d => d.id === id);
                            const updates: Partial<UserData> = { unlockedIdentityIds: newUnlocked };
                            if (target) updates.identity = target;
                            updateUserData({...userData, ...updates});
                        }}
                        ai={ai}
                    />
                )}

                {view === 'goals' && (
                    <GoalsView goals={userData.goals} onAddGoal={(g) => updateUserData({...userData, goals: [...userData.goals, g]})} ai={ai} />
                )}
                
                {view === 'profile' && (
                    <ProfileView 
                        userData={userData} 
                        onRestartOnboarding={onResetData} 
                        user={user}
                        updateUserData={updateUserData}
                    />
                )}
            </main>

            <nav className="flex-shrink-0 h-20 bg-white/80 dark:bg-black/40 backdrop-blur-xl border-t border-slate-200 dark:border-white/5 flex justify-around items-center px-2 z-50">
                {[
                    { id: 'today', icon: CheckCircleIcon, label: 'Today' },
                    { id: 'journey', icon: CalendarIcon, label: 'Journey' },
                    { id: 'identity', icon: UserCircleIcon, label: 'Identity' },
                    { id: 'goals', icon: TargetIcon, label: 'Goals' },
                    { id: 'profile', icon: TrophyIcon, label: 'Profile' },
                ].map(item => (
                    <button 
                        key={item.id}
                        onClick={() => setView(item.id as any)}
                        className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 ${view === item.id ? 'text-violet-500 bg-violet-500/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                    >
                        <item.icon className={`w-6 h-6 ${view === item.id ? 'fill-current' : ''}`} />
                        <span className="text-[10px] font-bold mt-1">{item.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
}

// --- Onboarding Flow (Restored) ---

const OnboardingFlow = ({ user, onComplete, updateUserData, onUpdateUser, currentIdentityId, currentTheme }: { user: User, onComplete: () => void, updateUserData: (u: Partial<UserData>) => void, onUpdateUser: (n: string) => void, currentIdentityId: string, currentTheme: 'light' | 'dark' }) => {
     const [step, setStep] = useState(1);
    const nextStep = () => setStep(s => s + 1);

    const handleIdentitySelect = (id: string) => {
        const fullId = DEFAULT_IDENTITIES.find(i => i.id === id);
        if (fullId) {
            updateUserData({ identity: fullId, unlockedIdentityIds: [id] });
        }
    };

    const handleThemeSelect = (theme: 'light' | 'dark') => {
        updateUserData({ theme });
        document.documentElement.className = theme;
    };

     const StepName = () => {
        const [nameInput, setNameInput] = useState(user.name === 'Friend' ? '' : user.name);
        return (
             <div className="text-center space-y-8 animate-fade-in-up">
                <div className="mx-auto w-24 h-24 bg-gradient-to-tr from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center shadow-2xl shadow-violet-500/30">
                    <SparklesIcon className="h-12 w-12 text-white" />
                </div>
                <div>
                    <h2 className="text-4xl font-bold text-slate-900 dark:text-white">Hi, I'm DailyWins.</h2>
                    <p className="mt-4 text-xl text-slate-600 dark:text-slate-300">What should I call you?</p>
                </div>
                <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="w-full max-w-xs mx-auto bg-transparent border-b-2 border-slate-300 dark:border-slate-600 focus:border-violet-500 text-3xl text-center font-bold text-slate-900 dark:text-white pb-2 focus:outline-none" placeholder="Your Name" autoFocus />
                <button onClick={() => { onUpdateUser(nameInput); nextStep(); }} disabled={!nameInput.trim()} className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold hover:scale-105 transition-transform disabled:opacity-50">Continue</button>
            </div>
        );
    };

     const StepTwo = () => (
        <div className="text-center space-y-8 animate-fade-in-up max-w-2xl">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">The Philosophy</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">Focus on 3 wins daily: Physical, Mental, Spiritual.</p>
            <div className="flex justify-center gap-4">
                 <div className="p-4 glass-card rounded-xl"><DumbbellIcon className="w-8 h-8 text-amber-500 mx-auto"/></div>
                 <div className="p-4 glass-card rounded-xl"><BrainIcon className="w-8 h-8 text-emerald-500 mx-auto"/></div>
                 <div className="p-4 glass-card rounded-xl"><LotusIcon className="w-8 h-8 text-violet-500 mx-auto"/></div>
            </div>
            <button onClick={nextStep} className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold">Got it</button>
        </div>
    );

    const StepThree = () => {
        const mainIdentities = DEFAULT_IDENTITIES.filter(id => ['athlete', 'creator', 'scholar', 'sage'].includes(id.id));

        return (
         <div className="text-center space-y-8 animate-fade-in-up max-w-4xl">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Choose Focus</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">Pick one identity to start with. You can add more later.</p>
            <div className="grid grid-cols-2 gap-4">
                {mainIdentities.map(id => (
                    <button key={id.id} onClick={() => handleIdentitySelect(id.id)} className={`p-4 rounded-xl border text-left transition-all ${currentIdentityId === id.id ? 'border-violet-500 bg-violet-500/10 scale-105' : 'border-slate-200 dark:border-white/10 hover:border-violet-500/50'}`}>
                        <h3 className="font-bold text-slate-900 dark:text-white">{id.name}</h3>
                    </button>
                ))}
            </div>
            <button onClick={nextStep} className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold">Continue</button>
        </div>
        );
    };

     const StepFour = () => (
        <div className="text-center space-y-8 animate-fade-in-up">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Theme</h2>
            <div className="flex justify-center gap-4">
                <button onClick={() => handleThemeSelect('light')} className={`p-6 rounded-2xl border-2 ${currentTheme === 'light' ? 'border-violet-500' : 'border-transparent bg-slate-100'}`}>Light</button>
                <button onClick={() => handleThemeSelect('dark')} className={`p-6 rounded-2xl border-2 ${currentTheme === 'dark' ? 'border-violet-500' : 'border-transparent bg-slate-800 text-white'}`}>Dark</button>
            </div>
            <button onClick={onComplete} className="px-8 py-3 bg-violet-600 text-white rounded-full font-bold">Finish</button>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
             {step === 1 && <StepName />}
             {step === 2 && <StepTwo />}
             {step === 3 && <StepThree />}
             {step === 4 && <StepFour />}
        </div>
    )
}

// --- Main App ---

export default function App() {
    const [user, setUser] = useState<User>(() => {
        const saved = localStorage.getItem('dailyWins_user');
        return saved ? JSON.parse(saved) : INITIAL_USER;
    });
    
    const [userData, setUserData] = useState<UserData>(() => {
        const saved = localStorage.getItem('dailyWins_data');
        return saved ? JSON.parse(saved) : INITIAL_USER_DATA;
    });
    
    const [newlyUnlockedAchievement, setNewlyUnlockedAchievement] = useState<Achievement | null>(null);

    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);

    useEffect(() => {
        localStorage.setItem('dailyWins_user', JSON.stringify(user));
    }, [user]);

    useEffect(() => {
        localStorage.setItem('dailyWins_data', JSON.stringify(userData));
    }, [userData]);

    useEffect(() => {
        document.documentElement.className = userData.theme;
    }, [userData.theme]);

    const handleUpdateUserData = (newData: UserData) => {
        const unlockedIds = [...newData.achievements];
        let achievementFound: Achievement | null = null;

        MASTER_ACHIEVEMENTS.forEach(ach => {
            if (!unlockedIds.includes(ach.id) && ach.condition(newData)) {
                unlockedIds.push(ach.id);
                achievementFound = ach;
            }
        });

        if (achievementFound) {
            setNewlyUnlockedAchievement(achievementFound);
            const updates: any = { achievements: unlockedIds };
            if (achievementFound.titleReward) {
                updates.currentTitle = achievementFound.titleReward;
            }
            setUserData({ ...newData, ...updates });
        } else {
            setUserData(newData);
        }
    };

    if (!userData.isOnboardingComplete) {
        return (
            <div className={userData.theme}>
                 <OnboardingFlow 
                    user={user}
                    onComplete={() => handleUpdateUserData({ ...userData, isOnboardingComplete: true })}
                    updateUserData={(updates) => handleUpdateUserData({ ...userData, ...updates })}
                    onUpdateUser={(name) => setUser({ ...user, name })}
                    currentIdentityId={userData.identity.id}
                    currentTheme={userData.theme}
                 />
            </div>
        )
    }

    return (
        <div className={userData.theme}>
            {newlyUnlockedAchievement && (
                <AchievementUnlockedModal 
                    achievement={newlyUnlockedAchievement} 
                    onClose={() => setNewlyUnlockedAchievement(null)} 
                />
            )}
            <DashboardPage 
                userData={userData} 
                updateUserData={handleUpdateUserData} 
                ai={ai} 
                user={user} 
                onResetData={() => {
                    // Reset everything for a brand new start
                    localStorage.removeItem('dailyWins_user');
                    localStorage.removeItem('dailyWins_data');
                    setUser(INITIAL_USER);
                    setUserData(INITIAL_USER_DATA);
                }}
            />
        </div>
    );
}
