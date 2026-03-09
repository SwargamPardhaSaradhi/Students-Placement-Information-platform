import { useEffect, useRef } from 'react';

interface AnimatedGradientOrbsProps {
    state: 'idle' | 'username' | 'password' | 'auth' | 'error';
}

export default function AnimatedGradientOrbs({ state }: AnimatedGradientOrbsProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Add interactive mouse tracking
        const handleMouseMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
            const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;

            container.style.setProperty('--mouse-x', `${x}px`);
            container.style.setProperty('--mouse-y', `${y}px`);
        };

        container.addEventListener('mousemove', handleMouseMove);
        return () => container.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Determine colors and animation based on state
    const getStateConfig = () => {
        switch (state) {
            case 'username':
                return {
                    primary: 'from-blue-500 to-cyan-400',
                    secondary: 'from-sky-400 to-blue-500',
                    accent: 'from-cyan-300 to-blue-400',
                    glow: 'rgba(59, 130, 246, 0.4)',
                    scale: 1.1,
                };
            case 'password':
                return {
                    primary: 'from-purple-500 to-pink-400',
                    secondary: 'from-violet-400 to-purple-500',
                    accent: 'from-fuchsia-300 to-purple-400',
                    glow: 'rgba(147, 51, 234, 0.4)',
                    scale: 1.15,
                };
            case 'auth':
                return {
                    primary: 'from-green-500 to-emerald-400',
                    secondary: 'from-teal-400 to-green-500',
                    accent: 'from-emerald-300 to-green-400',
                    glow: 'rgba(16, 185, 129, 0.5)',
                    scale: 1.2,
                };
            case 'error':
                return {
                    primary: 'from-red-500 to-orange-400',
                    secondary: 'from-rose-400 to-red-500',
                    accent: 'from-orange-300 to-red-400',
                    glow: 'rgba(239, 68, 68, 0.4)',
                    scale: 0.9,
                };
            default:
                return {
                    primary: 'from-cyan-500 to-blue-400',
                    secondary: 'from-blue-400 to-cyan-500',
                    accent: 'from-sky-300 to-cyan-400',
                    glow: 'rgba(6, 182, 212, 0.3)',
                    scale: 1,
                };
        }
    };

    const config = getStateConfig();

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full flex items-center justify-center perspective-1000"
            style={{
                '--mouse-x': '0px',
                '--mouse-y': '0px',
            } as React.CSSProperties}
        >
            {/* Main Orb Container */}
            < div className="relative w-96 h-96" >

                {/* Primary Orb */}
                < div
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gradient-to-br ${config.primary} opacity-80 blur-2xl transition-all duration-1000 ease-out animate-float`}
                    style={{
                        transform: `translate(-50%, -50%) scale(${config.scale}) translateX(var(--mouse-x)) translateY(var(--mouse-y))`,
                        boxShadow: `0 0 80px 40px ${config.glow}`,
                        animation: state === 'auth' ? 'spin 3s linear infinite, float 4s ease-in-out infinite' : 'float 6s ease-in-out infinite',
                    }}
                />

                {/* Secondary Orb */}
                <div
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-gradient-to-tl ${config.secondary} opacity-70 blur-xl transition-all duration-1000 ease-out`}
                    style={{
                        transform: `translate(-50%, -50%) scale(${config.scale * 0.8}) translateX(calc(var(--mouse-x) * -0.5)) translateY(calc(var(--mouse-y) * -0.5))`,
                        boxShadow: `0 0 60px 30px ${config.glow}`,
                        animation: 'float-reverse 8s ease-in-out infinite',
                    }}
                />

                {/* Accent Orb */}
                <div
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-to-br ${config.accent} opacity-60 blur-lg transition-all duration-1000 ease-out`}
                    style={{
                        transform: `translate(-50%, -50%) scale(${config.scale * 1.2}) translateX(calc(var(--mouse-x) * 0.8)) translateY(calc(var(--mouse-y) * 0.8))`,
                        boxShadow: `0 0 40px 20px ${config.glow}`,
                        animation: 'float 5s ease-in-out infinite',
                        animationDelay: '1s',
                    }}
                />

                {/* Glass Overlay for Depth */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div
                        className="w-72 h-72 rounded-full border border-white/10 backdrop-blur-sm transition-all duration-700"
                        style={{
                            background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
                            transform: `scale(${config.scale})`,
                        }}
                    >
                        {/* Inner glass circle */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-white/10"></div>
                    </div>
                </div>

                {/* Particle Effects for Auth State */}
                {
                    state === 'auth' && (
                        <>
                            {[...Array(8)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute top-1/2 left-1/2 w-2 h-2 bg-green-400 rounded-full"
                                    style={{
                                        transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-120px)`,
                                        animation: `particle-burst 1.5s ease-out infinite`,
                                        animationDelay: `${i * 0.1}s`,
                                        boxShadow: '0 0 10px rgba(16, 185, 129, 0.8)',
                                    }}
                                />
                            ))}
                        </>
                    )
                }

                {/* Error state shake effect */}
                {
                    state === 'error' && (
                        <div className="absolute inset-0 animate-shake">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-1 h-16 bg-gradient-to-b from-red-500/60 to-transparent"
                                    style={{
                                        top: '50%',
                                        left: '50%',
                                        transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-100px)`,
                                        animation: 'fade-pulse 1s ease-in-out infinite',
                                        animationDelay: `${i * 0.15}s`,
                                    }}
                                />
                            ))}
                        </div>
                    )
                }

                {/* Password state - lock rings */}
                {
                    state === 'password' && (
                        <>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full border-2 border-purple-400/30 animate-ping" style={{ animationDuration: '2s' }} />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border-2 border-purple-400/40 animate-ping" style={{ animationDuration: '2.5s' }} />
                        </>
                    )
                }

                {/* Username state - scan line */}
                {
                    state === 'username' && (
                        <div className="absolute left-1/2 w-0.5 h-full bg-gradient-to-b from-transparent via-blue-400 to-transparent -translate-x-1/2 animate-scan-vertical" style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)' }} />
                    )
                }
            </div >

            {/* Ambient Background Glow */}
            < div
                className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-gradient-to-t ${config.primary} opacity-20 blur-3xl transition-all duration-1000`}
                style={{
                    transform: `translateX(-50%) scale(${config.scale})`,
                }}
            />
        </div >
    );
}
