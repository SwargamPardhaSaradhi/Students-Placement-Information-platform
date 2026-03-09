import { useState, useEffect, useRef } from 'react';
import { X, MessageSquareText } from 'lucide-react';
import AIChat from '../pages/AIChat';
import { useChat } from '../context/ChatContext';
import { useToast } from '../context/ToastContext';

export default function FloatingAIButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const { messages } = useChat();
    const { showToast } = useToast();
    const [hasUnreadReply, setHasUnreadReply] = useState(false);
    const lastCheckedMessageId = useRef<string | null>(null);

    // Watch for new AI messages when chat is closed
    useEffect(() => {
        if (messages.length === 0) return;

        const latestMessage = messages[messages.length - 1];

        // Check if it's a new completed assistant message
        if (
            latestMessage &&
            latestMessage.role === 'assistant' &&
            latestMessage.status === 'complete' &&
            latestMessage.id !== lastCheckedMessageId.current
        ) {
            lastCheckedMessageId.current = latestMessage.id;

            // Only show toast if chat is closed
            if (!isOpen) {
                setHasUnreadReply(true);
                showToast({
                    type: 'success',
                    title: '🤖 AI Assistant Replied',
                    message: latestMessage.content.slice(0, 100) + (latestMessage.content.length > 100 ? '...' : ''),
                    duration: 6000
                });
            }
        }
    }, [messages, isOpen, showToast]);

    // Clear unread status when chat is opened
    const handleOpenChat = () => {
        setIsOpen(true);
        setHasUnreadReply(false);
    };

    return (
        <>
            {/* Floating Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={handleOpenChat}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    // Professional Dark Mode Styling
                    className="group relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 bg-gray-900 hover:bg-black border border-gray-700/50 hover:border-gray-600 hover:scale-110 active:scale-95 ease-out"
                >
                    {/* Subtle Glow effect */}
                    <div className={`absolute inset-0 rounded-full blur-lg opacity-40 transition-opacity duration-300 bg-gray-600 ${isHovered ? 'opacity-60' : 'opacity-20'}`}></div>

                    {/* Clean Professional Chat Icon */}
                    <div className="relative z-10">
                        <MessageSquareText className="h-6 w-6 text-gray-100" strokeWidth={2.5} />
                    </div>

                    {/* Label - Professional Slide-out */}
                    <div className={`absolute right-16 px-3 py-1.5 bg-gray-900 text-gray-200 text-sm font-medium rounded-lg shadow-xl border border-gray-700 whitespace-nowrap opacity-0 translate-x-4 transition-all duration-300 pointer-events-none ${isHovered ? 'opacity-100 translate-x-0' : ''}`}>
                        AI Chat
                    </div>

                    {/* Notification Dot - Professional Red Ring */}
                    {hasUnreadReply && (
                        <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-gray-900"></span>
                        </span>
                    )}
                </button>
            </div>

            {/* Fullscreen AI Chat Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[60] animate-fade-in">
                    {/* Close Button - Professional */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-5 right-5 z-10 p-2.5 rounded-full bg-black/60 hover:bg-black text-white/90 hover:text-white backdrop-blur-md border border-white/10 transition-all duration-200 hover:scale-110"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    {/* AI Chat Component */}
                    <AIChat />
                </div>
            )}
        </>
    );
}
