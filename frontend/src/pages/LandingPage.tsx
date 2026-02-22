import React from 'react';
import { Link } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { 
    EyeIcon, 
    ServerStackIcon, 
    ChartBarSquareIcon, 
    LockClosedIcon,
    DevicePhoneMobileIcon,
    ShieldCheckIcon,
    FaceSmileIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';
// Assuming you have these standard components from your project
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { LogoIcon } from '../components/icons'; 

// --- Animation Variants ---
const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.2 }
    }
};

const LandingPage: React.FC = () => {
    return (
        // Forcing dark theme for Landing Page to maintain the premium aesthetic.
        <div className="dark min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
            
            {/* --- NAVBAR (FLOATING) --- */}
            <nav className="fixed top-0 left-0 right-0 z-50 py-6 px-8 flex justify-between items-center backdrop-blur-sm bg-zinc-950/30 border-b border-white/5">
                <div className="flex items-center gap-3 text-emerald-400">
                    <LogoIcon className="h-10 w-10" />
                    <span className="text-xl font-bold tracking-tight text-white hidden sm:block">FaceFive</span>
                </div>
                <div className="flex items-center gap-6">
                    <ThemeSwitcher />
                    <div className="h-6 w-px bg-zinc-800"></div> {/* Divider */}
                    <Link to="/login" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                        Log In
                    </Link>
                    <Link 
                        to="/register" 
                        className="group flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-zinc-950 text-sm font-bold rounded-full 
                                   hover:bg-emerald-400 transition-all duration-300 ease-out hover:scale-105 active:scale-95"
                    >
                        Sign Up 
                        <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <header className="relative h-screen flex items-center justify-center overflow-hidden">
                {/* 3D Abstract Background Image */}
                <div 
                    className="absolute inset-0 z-0 opacity-50 bg-cover bg-center scale-105 animate-subtle-zoom"
                    style={{ 
                        backgroundImage: "url('https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&q=80&w=3200')" 
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/90 via-zinc-950/50 to-zinc-950 z-10" />

                <div className="relative z-20 container mx-auto px-6 text-center mt-16">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="inline-block mb-6 px-4 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50 backdrop-blur-md"
                    >
                        <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">
                            v2.0 Now Live with Passive Liveness
                        </span>
                    </motion.div>

                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="text-5xl md:text-8xl font-extralight tracking-tighter text-white mb-8 leading-tight"
                    >
                        Attendance, <br />
                        <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
                            Reimagined.
                        </span>
                    </motion.h1>

                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.8 }}
                        className="max-w-xl mx-auto text-xl text-zinc-400 font-light leading-relaxed mb-10"
                    >
                        Seamless, secure, and contactless tracking powered by next-gen computer vision. Zero hardware required.
                    </motion.p>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 1 }}
                        className="flex flex-col sm:flex-row justify-center items-center gap-4"
                    >
                        <Link 
                            to="/take-attendance"
                            className="px-8 py-4 bg-white text-zinc-950 font-bold rounded-full hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            Try Demo Live
                            <EyeIcon className="w-5 h-5" />
                        </Link>
                        <a 
                            href="#features"
                            className="px-8 py-4 text-zinc-300 font-medium rounded-full border-2 border-zinc-800 hover:border-zinc-600 hover:text-white transition-all"
                        >
                            Explore Features
                        </a>
                    </motion.div>
                </div>
            </header>

            {/* --- INTRODUCTION --- */}
            <section className="py-32 container mx-auto px-6 max-w-4xl text-center">
                <motion.div
                    variants={fadeInUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                >
                    <h2 className="text-3xl md:text-5xl font-light mb-8 leading-tight">
                        Forget scanners. <br/> 
                        <span className="text-white font-normal">Your face is the key.</span>
                    </h2>
                    <p className="text-lg text-zinc-500 leading-relaxed">
                        Traditional systems are slow, unhygienic, and easy to fool. 
                        FaceFive uses a real-time AI pipeline to ensure attendance is not only instant 
                        but virtually spoof-proof, leveraging military-grade anti-spoofing technology right in your browser.
                    </p>
                </motion.div>
            </section>

            {/* --- THE PIPELINE (VISUAL) --- */}
            <section className="py-32 bg-zinc-900/30 border-y border-white/5">
                <div className="container mx-auto px-6">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center mb-24"
                    >
                        <h2 className="text-emerald-500 text-xs font-bold tracking-[0.3em] uppercase mb-4">The Technology</h2>
                        <h3 className="text-4xl font-light text-white">Intelligent 3-Stage Verification</h3>
                    </motion.div>

                    <motion.div 
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8"
                    >
                        <PipelineCard 
                            step="01"
                            title="Liveness Check"
                            description="A custom CNN analyzes micro-textures and depth cues in milliseconds to block photos and screens."
                            icon={<ShieldCheckIcon className="w-8 h-8" />}
                            color="emerald"
                        />
                        <PipelineCard 
                            step="02"
                            title="Precision Mapping"
                            description="MediaPipe locates 468 facial landmarks to generate a unique, encrypted 128D biometric template."
                            icon={<FaceSmileIcon className="w-8 h-8" />}
                            color="blue"
                        />
                        <PipelineCard 
                            step="03"
                            title="Instant Match"
                            description="The live template is compared against your secure database using high-speed Euclidean distance vectors."
                            icon={<ServerStackIcon className="w-8 h-8" />}
                            color="purple"
                        />
                    </motion.div>
                </div>
            </section>

            {/* --- IMMERSIVE FEATURE SHOWCASE --- */}
            <section id="features" className="py-32 container mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    {/* Left: Text Content */}
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl md:text-5xl font-light mb-12 leading-tight">
                            Power-packed <br/>
                            <span className="font-bold text-white">Administration.</span>
                        </h2>
                        
                        <div className="space-y-8">
                             <FeatureRow 
                                icon={<LockClosedIcon className="w-6 h-6 text-emerald-400" />}
                                title="Smart Manual Override"
                                description="Admins can correct records, and the AI intelligently 'locks' them to prevent future automated overwrites."
                            />
                            <FeatureRow 
                                icon={<ChartBarSquareIcon className="w-6 h-6 text-blue-400" />}
                                title="Granular Analytics"
                                description="Deep dive with department-wise breakdowns and automatic 'frequent late-comer' identification."
                            />
                            <FeatureRow 
                                icon={<DevicePhoneMobileIcon className="w-6 h-6 text-purple-400" />}
                                title="Verified Onboarding"
                                description="Twilio-powered SMS OTP ensures every registered user is legitimate from day one."
                            />
                        </div>
                    </motion.div>

                    {/* Right: Visual (Dashboard Preview) */}
                    <motion.div
                         initial={{ opacity: 0, x: 50, scale: 0.95 }}
                         whileInView={{ opacity: 1, x: 0, scale: 1 }}
                         viewport={{ once: true }}
                         className="relative"
                    >
                        <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 blur-3xl -z-10 rounded-[3rem] opacity-30" />
                        <img 
                            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2940" 
                            alt="Dashboard Analytics Preview" 
                            className="rounded-3xl shadow-2xl border border-white/10 relative z-10"
                        />
                        {/* Floating badge example */}
                        <div className="absolute -bottom-6 -left-6 bg-zinc-800 p-4 rounded-2xl shadow-xl border border-zinc-700 flex items-center gap-3 z-20">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-sm font-bold text-white">System Active</span>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- TECH STACK --- */}
            <section className="py-32 bg-zinc-950">
                <div className="container mx-auto px-6 max-w-5xl">
                     <motion.div 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-zinc-500 text-sm uppercase tracking-[0.2em] font-bold mb-2">Under the Hood</h2>
                        <p className="text-2xl font-light text-white">Modern Technology Stack</p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-zinc-400">
                        <StackColumn title="The Brain (Backend)">
                            <StackItem name="Python" detail="Core Logic & AI Integration" />
                            <StackItem name="FastAPI" detail="High-Performance REST API" />
                            <StackItem name="MongoDB" detail="NoSQL Data & Vector Storage" />
                            <StackItem name="Passlib & JOSE" detail="JWT Security & Hashing" />
                        </StackColumn>
                         <StackColumn title="The Eyes (AI & CV)">
                            <StackItem name="TensorFlow / Keras" detail="CNN Liveness Model" />
                            <StackItem name="MediaPipe" detail="Ultra-fast Face Detection" />
                            <StackItem name="face_recognition" detail="dlib-based Embeddings" />
                            <StackItem name="OpenCV & NumPy" detail="Image Processing & Math" />
                        </StackColumn>
                        <StackColumn title="The Face (Frontend)">
                            <StackItem name="React 18" detail="Component-based UI" />
                            <StackItem name="TypeScript" detail="Type Safety & Robustness" />
                            <StackItem name="Tailwind CSS" detail="Responsive Design System" />
                            <StackItem name="Recharts" detail="Interactive Data Viz" />
                        </StackColumn>
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="py-12 border-t border-white/5 text-center">
                <LogoIcon className="h-8 w-8 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500 text-sm">© {new Date().getFullYear()} FaceFive Engine. Crafted for security.</p>
            </footer>
        </div>
    );
};

// --- SUB-COMPONENTS ---

const PipelineCard = ({ step, title, description, icon, color }: any) => {
    const colorClasses: any = {
        emerald: "group-hover:border-emerald-500/50 group-hover:shadow-emerald-500/20",
        blue: "group-hover:border-blue-500/50 group-hover:shadow-blue-500/20",
        purple: "group-hover:border-purple-500/50 group-hover:shadow-purple-500/20",
    };
    const textClasses: any = {
        emerald: "text-emerald-400",
        blue: "text-blue-400",
        purple: "text-purple-400",
    };

    return (
        <motion.div 
            variants={fadeInUp}
            className={`p-8 rounded-3xl bg-zinc-950 border border-zinc-800 relative group transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${colorClasses[color]}`}
        >
            <span className={`absolute top-8 right-8 text-4xl font-black opacity-10 ${textClasses[color]}`}>{step}</span>
            <div className={`w-14 h-14 mb-6 rounded-2xl bg-zinc-900 flex items-center justify-center ${textClasses[color]}`}>
                {icon}
            </div>
            <h4 className="text-2xl font-bold text-white mb-4">{title}</h4>
            <p className="text-zinc-400 leading-relaxed">{description}</p>
        </motion.div>
    );
};

const FeatureRow = ({ icon, title, description }: any) => (
    <div className="flex items-start gap-5">
        <div className="mt-1 p-2 rounded-lg bg-zinc-900/50 border border-zinc-800">
            {icon}
        </div>
        <div>
            <h3 className="text-xl font-medium text-zinc-200 mb-2">{title}</h3>
            <p className="text-zinc-500 leading-relaxed">{description}</p>
        </div>
    </div>
);

// Re-using these for the tech stack section
const StackColumn: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
    >
        <h3 className="text-emerald-400 font-medium mb-6 border-b border-zinc-800 pb-2">{title}</h3>
        <ul className="space-y-4">
            {children}
        </ul>
    </motion.div>
);

const StackItem: React.FC<{ name: string; detail: string }> = ({ name, detail }) => (
    <li className="flex flex-col">
        <span className="text-zinc-200 font-medium">{name}</span>
        <span className="text-xs text-zinc-500">{detail}</span>
    </li>
);

export default LandingPage;