import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Lock, User, AlertCircle, Sparkles, CheckCircle, ArrowLeft } from 'lucide-react';
import RobotGuardian from '../components/RobotGuardian';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [focusedField, setFocusedField] = useState<'username' | 'password' | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const { login, isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    // Redirect if already authenticated (but not if we just logged in successfully - let the success animation play)
    useEffect(() => {
        if (!authLoading && isAuthenticated && !success) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, authLoading, navigate, success]);

    // Mouse tracking
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 2;
            const y = (e.clientY / window.innerHeight - 0.5) * 2;
            setMousePosition({ x, y });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Track typing in username field
    useEffect(() => {
        if (username.length > 0 && focusedField === 'username') {
            setIsTyping(true);
            const timeout = setTimeout(() => setIsTyping(false), 500);
            return () => clearTimeout(timeout);
        } else {
            setIsTyping(false);
        }
    }, [username, focusedField]);

    // Auto-reset error state after 2.5 seconds to return robot to normal (smooth transition)
    useEffect(() => {
        if (error) {
            const timeout = setTimeout(() => {
                setError('');
            }, 2500);  // 2.5 seconds for proper feedback but quick recovery
            return () => clearTimeout(timeout);
        }
    }, [error]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setLoading(true);

        try {
            await login(username, password);
            setLoading(false); // Stop loading to show success state
            setSuccess(true);
            // Show success animation for 2 seconds before navigating
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } catch (err: unknown) {
            setError((err as Error).message || 'Login failed. Please check your credentials.');
            setLoading(false);
        }
    };

    // Determine constellation state - only green when actually successful
    const getConstellationState = (): 'idle' | 'username' | 'password' | 'auth' | 'error' => {
        if (error) return 'error';
        if (success) return 'auth';  // Only green when authentication succeeded
        if (focusedField === 'password') return 'password';
        if (focusedField === 'username') return 'username';
        return 'idle';  // Stay neutral during loading
    };

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-950 dark:via-gray-900 dark:to-black relative">
            {/* Back Button */}
            <button
                onClick={() => navigate('/')}
                className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white/10 lg:bg-white/10 backdrop-blur-md border border-black/10 dark:border-white/20 lg:border-white/20 rounded-full text-white text-always-white hover:bg-slate-800 dark:hover:bg-white/20 lg:hover:bg-white/20 transition-all duration-300 hover:scale-105 group"
            >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Back to Home</span>
            </button>
            {/* Left Side - 3D Constellation */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12 text-always-white"
                style={{
                    background: 'linear-gradient(135deg, #020617 0%, #172554 50%, #000000 100%)'
                }}
            >
                {/* Animated Circuit Background */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                        animation: 'gridMove 25s linear infinite'
                    }}></div>
                </div>

                {/* Energy Particles */}
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full opacity-30"
                        style={{
                            width: `${2 + Math.random() * 3}px`,
                            height: `${2 + Math.random() * 3}px`,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            background: `radial-gradient(circle, ${Math.random() > 0.5 ? 'rgb(6,182,212)' : 'rgb(14,165,233)'} 0%, transparent 70%)`,
                            animation: `float ${8 + Math.random() * 12}s ease-in-out infinite`,
                            animationDelay: `${Math.random() * 8}s`,
                            filter: 'blur(1px)'
                        }}
                    />
                ))}

                {/* Constellation Container */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full">
                    <div
                        className="relative transition-all duration-500 ease-out animate-constellation-float"
                        style={{
                            transform: `rotateY(${mousePosition.x * 5}deg) rotateX(${-mousePosition.y * 5}deg)`,
                            transformStyle: 'preserve-3d',
                            perspective: '1200px'
                        }}
                    >
                        <RobotGuardian
                            state={getConstellationState()}
                            isTyping={isTyping}
                            isLoading={loading}
                        />
                    </div>

                    {/* Status Text */}
                    <div className="mt-12 text-center transition-all duration-700">
                        <h2 className="text-4xl font-bold mb-3 drop-shadow-lg transition-all duration-500">
                            <span className={`bg-gradient-to-r ${error ? 'from-red-400 via-red-300 to-red-400' :
                                loading ? 'from-emerald-400 via-green-300 to-emerald-400' :
                                    success ? 'from-green-400 via-emerald-300 to-green-400' :
                                        focusedField === 'password' ? 'from-purple-400 via-purple-300 to-purple-400' :
                                            focusedField === 'username' ? 'from-blue-400 via-sky-300 to-blue-400' :
                                                'from-cyan-400 via-sky-300 to-cyan-400'
                                } bg-clip-text text-transparent`}>
                                {loading ? 'Authenticating...' :
                                    success ? 'Access Granted' :
                                        error ? 'Access Denied' :
                                            'Secure Portal'}
                            </span>
                        </h2>
                        <p className={`${error ? 'text-red-300/80' :
                            loading ? 'text-emerald-300/80' :
                                success ? 'text-green-300/80' :
                                    focusedField === 'password' ? 'text-purple-300/80' :
                                        focusedField === 'username' ? 'text-blue-300/80' :
                                            'text-cyan-300/80'
                            } text-lg transition-all duration-500 text-always-white`}>
                            {focusedField === 'username' && (
                                <span className="animate-fade-in">▸ Identity verification</span>
                            )}
                            {focusedField === 'password' && (
                                <span className="animate-fade-in">▸ Security check active</span>
                            )}
                            {!focusedField && !loading && !error && !success && (
                                <span className="animate-fade-in">▸ System ready</span>
                            )}
                            {loading && (
                                <span className="animate-fade-in">▸ Verifying credentials</span>
                            )}
                            {success && (
                                <span className="animate-fade-in">▸ Welcome back</span>
                            )}
                            {error && (
                                <span className="animate-fade-in">▸ Authentication failed</span>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-gray-950">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 rounded-2xl shadow-lg mb-6 animate-scale-in border border-gray-700/50">
                            <Lock className="h-10 w-10 text-cyan-400" />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 dark:from-gray-200 dark:via-white dark:to-gray-200 bg-clip-text text-transparent mb-2">
                            Secure Access
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">Enter your credentials to continue</p>
                    </div>

                    {/* Login Card */}
                    <div className="bg-white dark:bg-gray-900/50 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-800 animate-slide-in-right backdrop-blur-xl">
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 animate-fade-in">
                                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Username
                                </label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-all duration-300 group-focus-within:text-cyan-400" />
                                    <input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        onFocus={() => setFocusedField('username')}
                                        onBlur={() => setFocusedField(null)}
                                        placeholder="Enter your username"
                                        required
                                        autoComplete="username"
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 transition-all duration-300"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Password
                                </label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-all duration-300 group-focus-within:text-cyan-400" />
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        placeholder="Enter your password"
                                        required
                                        autoComplete="current-password"
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 transition-all duration-300"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || success}
                                className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-500 shadow-lg hover:shadow-2xl hover:scale-[1.02] disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2 relative overflow-hidden group text-always-white ${success
                                    ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-500 text-white'
                                    : error
                                        ? 'bg-gradient-to-r from-red-500 via-rose-500 to-red-500 text-white'
                                        : 'bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 dark:from-cyan-500 dark:via-cyan-400 dark:to-cyan-500 hover:from-gray-900 hover:via-black hover:to-gray-900 dark:hover:from-cyan-400 dark:hover:via-cyan-300 dark:hover:to-cyan-400 text-white hover:shadow-cyan-400/20'
                                    } ${error ? 'disabled:opacity-100' : 'disabled:opacity-50'}`}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                {success ? (
                                    <>
                                        <CheckCircle className="h-5 w-5 animate-scale-in" />
                                        <span>Success!</span>
                                    </>
                                ) : loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                        <span>Authenticating...</span>
                                    </>
                                ) : error ? (
                                    <>
                                        <AlertCircle className="h-5 w-5" />
                                        <span>Try Again</span>
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="h-5 w-5" />
                                        <span>Secure Sign In</span>
                                        <Sparkles className="h-4 w-4 ml-1" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Mobile Hint */}
                    <div className="lg:hidden mt-6 text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            💡 View on desktop for the full constellation experience
                        </p>
                    </div>
                </div>
            </div>

        </div >
    );
}
