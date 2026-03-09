import { useEffect, useState, useRef } from 'react';

interface RobotGuardianProps {
    state: 'idle' | 'username' | 'password' | 'auth' | 'error';
    isTyping?: boolean;
    isLoading?: boolean;
}

export default function RobotGuardian({ state, isTyping = false, isLoading = false }: RobotGuardianProps) {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [blinking, setBlinking] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Smooth mouse tracking (only when not in password state)
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current || state === 'password') return;
            const rect = containerRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const x = ((e.clientX - centerX) / rect.width) * 25;
            const y = ((e.clientY - centerY) / rect.height) * 25;

            setMousePos({
                x: Math.max(-12, Math.min(12, x)),
                y: Math.max(-8, Math.min(8, y))
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [state]);

    // Natural blinking (not during password or auth)
    useEffect(() => {
        if (state === 'password' || state === 'auth') return;

        const blinkInterval = setInterval(() => {
            setBlinking(true);
            setTimeout(() => setBlinking(false), 120);
        }, 2500 + Math.random() * 2500);

        return () => clearInterval(blinkInterval);
    }, [state]);

    // Simplified color scheme - only green for success, red for error
    const getColors = () => {
        if (state === 'auth') {
            return {
                primary: 'from-emerald-600 via-green-500 to-teal-500',
                eye: 'from-emerald-600 to-green-500',
                glow: 'rgba(16, 185, 129, 0.7)',
                antenna: 'from-emerald-500 to-teal-400',
            };
        } else if (state === 'error') {
            return {
                primary: 'from-red-600 via-rose-500 to-orange-500',
                eye: 'from-red-600 to-rose-500',
                glow: 'rgba(239, 68, 68, 0.6)',
                antenna: 'from-red-500 to-orange-400',
            };
        }

        // Default neutral gray for all other states
        return {
            primary: 'from-slate-600 via-gray-500 to-slate-500',
            eye: 'from-slate-700 to-gray-600',
            glow: 'rgba(71, 85, 105, 0.4)',
            antenna: 'from-slate-500 to-gray-400',
        };
    };

    const colors = getColors();

    // Eye state management
    const getEyeTransform = () => {
        // Password: eyes completely closed
        if (state === 'password') {
            return 'scaleY(0.05)';
        }
        // Blinking
        if (blinking) {
            return 'scaleY(0.08)';
        }
        // Normal tracking
        return `translate(${mousePos.x}px, ${mousePos.y}px)`;
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full flex items-center justify-center"
        >
            <div className="relative w-80 h-80 transition-all duration-700 ease-out" style={{
                filter: `drop-shadow(0 20px 40px ${colors.glow})`,
            }}>

                {/* Background ambient glow - adapts to light/dark mode */}
                <div className={`absolute inset-0 rounded-full blur-3xl scale-150 opacity-40 transition-all duration-700 ${state === 'auth'
                    ? 'bg-gradient-to-br from-emerald-400/30 to-teal-400/30'
                    : state === 'error'
                        ? 'bg-gradient-to-br from-red-400/30 to-orange-400/30'
                        : 'bg-gradient-to-br from-slate-400/20 to-gray-400/20'
                    }`} />

                {/* Main Robot Container */}
                <div className="relative">
                    {/* Antenna */}
                    <div className="absolute left-1/2 -translate-x-1/2 -top-20 flex flex-col items-center">
                        <div className="w-2 h-14 bg-gradient-to-t from-gray-400 via-gray-300 to-gray-400 rounded-full relative shadow-lg">
                            <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent rounded-full" />
                        </div>
                        <div
                            className={`w-7 h-7 bg-gradient-to-br ${colors.antenna} rounded-full relative shadow-2xl transition-all duration-700`}
                            style={{
                                boxShadow: `0 0 25px ${colors.glow}, inset 0 2px 8px rgba(255,255,255,0.3)`,
                                animation: state === 'auth' ? 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' : state === 'error' ? 'pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) 3' : 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                            }}
                        >
                            <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full opacity-70" />
                        </div>
                    </div>

                    {/* Main Face */}
                    <div
                        className={`relative w-72 h-72 mx-auto bg-gradient-to-br ${colors.primary} rounded-full shadow-2xl border-4 ${state === 'auth' ? 'border-emerald-400/30' : state === 'error' ? 'border-red-400/30' : 'border-slate-400/20'}`}
                        style={{
                            transform: state === 'error' ? 'scale(0.96)' : state === 'auth' ? 'scale(1.04)' : 'scale(1)',
                            animation: state === 'error' ? 'shake 0.5s ease-in-out' : 'none',
                            boxShadow: `0 25px 50px -12px ${colors.glow}, inset 0 2px 20px rgba(255,255,255,0.15)`,
                            transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                    >
                        {/* Inner shine layer */}
                        <div className="absolute inset-6 bg-gradient-to-br from-white/20 via-white/5 to-transparent rounded-full" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-full" />

                        {/* Eyes Container */}
                        <div className="absolute top-24 left-1/2 -translate-x-1/2 flex gap-14">
                            {/* Left Eye */}
                            <div className="relative w-20 h-20 bg-white rounded-full shadow-inner flex items-center justify-center" style={{
                                boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)',
                            }}>
                                <div
                                    className={`w-11 h-11 bg-gradient-to-br ${colors.eye} rounded-full transition-all duration-200 ease-out relative`}
                                    style={{
                                        transform: getEyeTransform(),
                                        boxShadow: `0 0 20px ${colors.glow}, inset 0 2px 6px rgba(0,0,0,0.3)`,
                                    }}
                                >
                                    {state !== 'password' && !blinking && (
                                        <>
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-gray-900 rounded-full" style={{
                                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                                            }}>
                                                <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full opacity-90" />
                                            </div>
                                            <div className="absolute inset-1 rounded-full border-2 border-white/30" />
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Right Eye */}
                            <div className="relative w-20 h-20 bg-white rounded-full shadow-inner flex items-center justify-center" style={{
                                boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)',
                            }}>
                                <div
                                    className={`w-11 h-11 bg-gradient-to-br ${colors.eye} rounded-full transition-all duration-200 ease-out relative`}
                                    style={{
                                        transform: getEyeTransform(),
                                        boxShadow: `0 0 20px ${colors.glow}, inset 0 2px 6px rgba(0,0,0,0.3)`,
                                    }}
                                >
                                    {state !== 'password' && !blinking && (
                                        <>
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-gray-900 rounded-full" style={{
                                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                                            }}>
                                                <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full opacity-90" />
                                            </div>
                                            <div className="absolute inset-1 rounded-full border-2 border-white/30" />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Mouth - Simple and clean */}
                        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 transition-all duration-500 flex items-center justify-center gap-1">
                            {state === 'auth' ? (
                                // Happy - gentle arc with small endpoints
                                <svg width="60" height="24" viewBox="0 0 60 24" className="drop-shadow-sm">
                                    <path
                                        d="M 8 8 Q 30 20, 52 8"
                                        stroke="rgba(255, 255, 255, 0.9)"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        fill="none"
                                    />
                                </svg>
                            ) : state === 'error' ? (
                                // Sad - inverted arc
                                <svg width="60" height="24" viewBox="0 0 60 24" className="drop-shadow-sm">
                                    <path
                                        d="M 8 16 Q 30 4, 52 16"
                                        stroke="rgba(255, 255, 255, 0.9)"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        fill="none"
                                    />
                                </svg>
                            ) : state === 'password' ? (
                                // Neutral closed - small line
                                <div className="w-12 h-1 bg-white/75 rounded-full" />
                            ) : state === 'username' ? (
                                // Slight smile - very gentle curve
                                <svg width="48" height="16" viewBox="0 0 48 16" className="drop-shadow-sm">
                                    <path
                                        d="M 6 6 Q 24 12, 42 6"
                                        stroke="rgba(255, 255, 255, 0.85)"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        fill="none"
                                    />
                                </svg>
                            ) : (
                                // Idle - simple dot or small oval
                                <div className="w-14 h-1 bg-white/70 rounded-full" />
                            )}
                        </div>

                        {/* Enhanced Loading spinner - INSIDE the robot */}
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center animate-fade-in">
                                <div className="relative">
                                    {/* Outer ring - slow spin with glow */}
                                    <div className="w-40 h-40 border-[5px] border-white/10 dark:border-white/10 border-t-emerald-400 dark:border-t-emerald-400 rounded-full animate-spin opacity-80"
                                        style={{
                                            animationDuration: '1.5s',
                                            filter: 'drop-shadow(0 0 8px rgba(52, 211, 153, 0.4))',
                                            animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                                        }}
                                    />

                                    {/* Middle ring - medium spin opposite direction */}
                                    <div className="absolute inset-5 border-[4px] border-white/10 dark:border-white/10 border-r-green-400 dark:border-r-green-400 rounded-full animate-spin"
                                        style={{
                                            animationDuration: '1s',
                                            animationDirection: 'reverse',
                                            filter: 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.3))',
                                            animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                                        }}
                                    />

                                    {/* Inner ring - fast spin with pulse */}
                                    <div className="absolute inset-10 border-[3px] border-white/10 dark:border-white/10 border-b-teal-400 dark:border-b-teal-400 rounded-full animate-spin"
                                        style={{
                                            animationDuration: '0.7s',
                                            filter: 'drop-shadow(0 0 4px rgba(20, 184, 166, 0.4))',
                                            animationTimingFunction: 'linear'
                                        }}
                                    />

                                    {/* Center pulse dot */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-3 h-3 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full animate-pulse"
                                            style={{
                                                filter: 'drop-shadow(0 0 6px rgba(52, 211, 153, 0.6))',
                                                animationDuration: '1.2s'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Success checkmark - INSIDE the robot (only when not loading) */}
                        {state === 'auth' && !isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center z-10 animate-scale-in">
                                <div className="relative">
                                    {/* Success glow background */}
                                    <div className="absolute inset-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-green-400/20 rounded-full blur-xl animate-pulse" />

                                    {/* Checkmark */}
                                    <svg
                                        className="relative w-28 h-28 text-white dark:text-white drop-shadow-2xl"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={3.5}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path
                                            d="M5 13l4 4L19 7"
                                            style={{
                                                strokeDasharray: 30,
                                                strokeDashoffset: 30,
                                                animation: 'draw-check 0.6s ease-out forwards',
                                                filter: 'drop-shadow(0 0 4px rgba(52, 211, 153, 0.8))'
                                            }}
                                        />
                                    </svg>
                                </div>
                            </div>
                        )}

                        {/* Error X */}
                        {state === 'error' && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-25">
                                <svg className="w-36 h-36 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Side Panels/Ears */}
                    <div className="absolute top-1/2 -left-8 -translate-y-1/2 w-10 h-16 bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400 rounded-l-2xl border-2 border-white/20 shadow-xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-l-2xl" />
                        <div className="absolute top-1/2 left-2 -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full shadow-inner" />
                    </div>
                    <div className="absolute top-1/2 -right-8 -translate-y-1/2 w-10 h-16 bg-gradient-to-l from-gray-400 via-gray-300 to-gray-400 rounded-r-2xl border-2 border-white/20 shadow-xl">
                        <div className="absolute inset-0 bg-gradient-to-bl from-white/30 to-transparent rounded-r-2xl" />
                        <div className="absolute top-1/2 right-2 -translate-y-1/2 w-4 h-4 bg-gradient-to-bl from-gray-600 to-gray-700 rounded-full shadow-inner" />
                    </div>
                </div>

                {/* Typing animation indicator (below robot when typing) */}
                {state === 'username' && isTyping && (
                    <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5 animate-fade-in-up">
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="w-2 h-2 bg-gradient-to-t from-cyan-400 to-blue-400 dark:from-cyan-400 dark:to-blue-400 rounded-full animate-bounce"
                                style={{
                                    animationDelay: `${i * 0.1}s`,
                                    animationDuration: '0.8s'
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Floating particles - fewer and subtler */}
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(state === 'auth' || state === 'error' ? 6 : 4)].map((_, i) => (
                        <div
                            key={i}
                            className={`absolute w-1.5 h-1.5 bg-gradient-to-br ${colors.antenna} rounded-full opacity-40`}
                            style={{
                                left: `${20 + i * 15}%`,
                                top: `${25 + Math.sin(i) * 25}%`,
                                animation: `float ${3 + i * 0.4}s ease-in-out infinite`,
                                animationDelay: `${i * 0.25}s`,
                                boxShadow: `0 0 6px ${colors.glow}`,
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
