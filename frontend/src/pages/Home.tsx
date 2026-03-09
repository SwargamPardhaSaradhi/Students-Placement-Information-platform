import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Building2,
    GraduationCap,
    Award,
    Users,
    ArrowRight,
    TrendingUp,
    LogIn
} from 'lucide-react';

export default function Home() {
    const navigate = useNavigate();
    const { isAuthenticated, loading } = useAuth();

    // Redirect to dashboard if already logged in
    useEffect(() => {
        if (!loading && isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, loading, navigate]);
    const stats = [
        { icon: GraduationCap, label: 'Programs Offered', value: '15+' },
        { icon: Users, label: 'Faculty Members', value: '300+' },
        { icon: Building2, label: 'Academic Labs', value: '94+' },
        { icon: Award, label: 'NAAC Grade', value: 'A++' },
    ];



    const topRecruiters = [
        'Microsoft', 'IBM', 'TCS', 'Accenture', 'Cognizant',
        'Capgemini', 'Amazon', 'Deloitte', 'EPAM', 'Juspay'
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-950 font-sans selection:bg-blue-100 dark:selection:bg-blue-900">
            {/* Sticky Header */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-slate-200 dark:border-gray-800 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/30">
                                I
                            </div>
                            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 dark:from-white dark:via-blue-200 dark:to-slate-300">
                                IARE
                            </span>
                        </div>
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900 text-white text-always-white text-sm font-semibold rounded-full hover:shadow-lg  hover:scale-105 active:scale-95 transition-all duration-300"
                        >
                            <LogIn className="w-4 h-4" />
                            <span>Login Portal</span>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section with Floating Stats */}
            <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white dark:from-gray-900 dark:via-gray-950 dark:to-black opacity-70"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                        {/* Text Content */}
                        <div className="lg:w-1/2 text-center lg:text-left space-y-8 animate-fade-in-up">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wide">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                Top Engineering Institute
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] drop-shadow-sm">
                                Education for <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 animate-gradient-x pb-2">
                                    Liberation
                                </span>
                            </h1>

                            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                                A premier autonomous institution nurturing future leaders through industry-aligned education, innovation, and global excellence.
                            </p>

                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-always-white rounded-2xl font-semibold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                                >
                                    <span>Get Started</span>
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                                <div className="flex items-center gap-4 px-6 py-4 bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm">
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-gray-800 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                {String.fromCharCode(64 + i)}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                        <span className="font-bold text-slate-900 dark:text-white">1500+</span> Students Placed
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Visual with Floating Stats */}
                        <div className="lg:w-1/2 relative lg:h-[600px] w-full flex items-center justify-center perspective-1000">
                            {/* Main Logo Mockup */}
                            <div className="relative w-64 h-64 sm:w-80 sm:h-80 bg-white dark:bg-gray-900 rounded-full shadow-[0_0_100px_rgba(59,130,246,0.15)] dark:shadow-[0_0_100px_rgba(59,130,246,0.1)] flex items-center justify-center z-10 animate-float-slow border-8 border-slate-50 dark:border-gray-800">
                                <img
                                    src="/assets/iare-logo.jpg"
                                    alt="IARE Logo"
                                    className="w-48 h-48 sm:w-60 sm:h-60 rounded-full object-cover"
                                />
                                {/* Orbiting rings */}
                                <div className="absolute inset-0 rounded-full border border-blue-100 dark:border-blue-900/30 scale-125 animate-spin-slower"></div>
                                <div className="absolute inset-0 rounded-full border border-dashed border-cyan-100 dark:border-cyan-900/30 scale-150 animate-spin-reverse-slower"></div>
                            </div>

                            {/* Floating Placement Cards - "On top of image" */}
                            <div className="absolute top-0 right-0 sm:right-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-slate-100 dark:border-gray-700 animate-float-delayed-1 transform rotate-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Highest Package</div>
                                        <div className="text-xl font-bold text-slate-900 dark:text-white">₹50 LPA</div>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute bottom-10 left-0 sm:left-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-slate-100 dark:border-gray-700 animate-float-delayed-2 transform -rotate-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Top Recruiters</div>
                                        <div className="text-xl font-bold text-slate-900 dark:text-white">60+ Companies</div>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute top-1/2 -right-4 sm:-right-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-slate-100 dark:border-gray-700 animate-float-delayed-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">NAAC A++</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid - Cleaner Look */}
            <div className="bg-white dark:bg-gray-900 py-12 border-y border-slate-100 dark:border-gray-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/5 dark:to-transparent opacity-50"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center group hover:-translate-y-1 transition-transform duration-300">
                                <div className="inline-flex p-4 rounded-2xl bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-cyan-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-all shadow-sm group-hover:shadow-md mb-4">
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">{stat.value}</div>
                                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase text-xs">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Placement Section with Bottom Login */}
            <div className="py-24 bg-slate-50 dark:bg-gray-950">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12">Trusted by Global Innovators</h2>

                    <div className="flex flex-wrap justify-center gap-x-12 gap-y-8 mb-20 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                        {topRecruiters.map((company, index) => (
                            <span key={index} className="text-xl font-bold text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-default">
                                {company}
                            </span>
                        ))}
                    </div>

                    {/* Bottom CTA Card */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 dark:from-blue-900 dark:to-slate-900 rounded-3xl p-10 sm:p-16 shadow-2xl text-white text-always-white">
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>

                        <div className="relative z-10">
                            <div className="text-3xl sm:text-4xl font-bold mb-6" style={{ color: '#ffffff' }}>Ready to Explore Full Analytics?</div>
                            <div className="text-lg mb-10 max-w-2xl mx-auto" style={{ color: '#ffffff' }}>
                                Access detailed insights, year-wise trends, and comprehensive placement records.
                            </div>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 text-white text-always-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:bg-white/20  transition-all duration-300 group border border-white/20 backdrop-blur-md"
                            >
                                <LogIn className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                                <span>Login to Dashboard</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-white dark:bg-gray-900 py-8 border-t border-slate-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        © 2024 Institute of Aeronautical Engineering.
                    </p>
                    <div className="flex items-center gap-6">
                        <span className="text-xs font-medium px-2 py-1 bg-slate-100 dark:bg-gray-800 rounded text-slate-600 dark:text-slate-400">NIRF 151-200</span>
                        <span className="text-xs font-medium px-2 py-1 bg-slate-100 dark:bg-gray-800 rounded text-slate-600 dark:text-slate-400">NAAC A++</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
