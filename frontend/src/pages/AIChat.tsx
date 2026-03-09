import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Send, ChevronDown, ChevronUp, Sparkles, Brain, Database, CheckCircle, XCircle, Loader2, Bot, User, Download, Search, Minimize2 } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { Message, ThinkingStep, TableData } from '../types';
import { FixedSizeList } from 'react-window';
import { api } from '../lib/api';  // Import API client for JWT-authenticated requests

// Event types from the API
type EventType = 'iteration' | 'ai_decision' | 'function_start' | 'function_result' | 'huge_data_init' | 'huge_data_row' | 'final' | 'error';

interface BaseEvent {
    type: EventType;
    iteration?: number;
}

interface IterationEvent extends BaseEvent {
    type: 'iteration';
    decision?: string;
    action?: string;
    message: string;
}

interface AIDecisionEvent extends BaseEvent {
    type: 'ai_decision';
    decision: string;
    reason: string;
}

interface FunctionStartEvent extends BaseEvent {
    type: 'function_start';
    function: string;
    params: unknown;
}

interface FunctionResultEvent extends BaseEvent {
    type: 'function_result';
    function: string;
    success: boolean;
    message: string;
    count?: number;
}

interface HugeDataInitEvent extends BaseEvent {
    type: 'huge_data_init';
    huge_data: boolean;
    headers: string[];
    count: number;
    ai_summary: string;
}

interface HugeDataRowEvent extends BaseEvent {
    type: 'huge_data_row';
    row: unknown;
    index: number;
}

interface FinalEvent extends BaseEvent {
    type: 'final';
    final: boolean;
    response: string;
    iterations: number;
}

interface ErrorEvent extends BaseEvent {
    type: 'error';
    error: boolean;
    message: string;
}

type StreamEvent = IterationEvent | AIDecisionEvent | FunctionStartEvent | FunctionResultEvent | HugeDataInitEvent | HugeDataRowEvent | FinalEvent | ErrorEvent;

// Sample questions for users to try
const sampleQuestions = [
    {
        text: "Get all students",
        description: "View complete student database",
        icon: <User className="h-4 w-4 text-white stroke-white" strokeWidth={2} />,
        gradient: "from-blue-500 to-cyan-600"
    },
    {
        text: "Show me placement statistics",
        description: "Overall placement data",
        icon: <Database className="h-4 w-4 text-white stroke-white" strokeWidth={2} />,
        gradient: "from-purple-500 to-pink-600"
    },
    {
        text: "How many students are placed?",
        description: "Get placement count",
        icon: <CheckCircle className="h-4 w-4 text-white stroke-white" strokeWidth={2} />,
        gradient: "from-green-500 to-emerald-600"
    },
    {
        text: "List all companies",
        description: "View recruiting companies",
        icon: <Brain className="h-4 w-4 text-white stroke-white" strokeWidth={2} />,
        gradient: "from-orange-500 to-red-600"
    }
];

export default function AIChat() {
    const {
        messages, setMessages,
        input, setInput,
        isLoading, setIsLoading,
        activeTableData, setActiveTableData,
        isTablePanelOpen, setIsTablePanelOpen,
        searchTerm, setSearchTerm
    } = useChat();

    // Local state for auto-scroll management needs to be careful not to conflict
    // keeping refs local is correct
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback((force = false, instant = false) => {
        if (force || !activeTableData) {
            messagesEndRef.current?.scrollIntoView({
                behavior: instant ? 'auto' : 'smooth',
                block: 'end'
            });
        }
    }, [activeTableData]);

    // Auto-scroll whenever messages change
    useEffect(() => {
        const lastMessage = messages[messages.length - 1];

        // Immediate scroll for user messages
        if (lastMessage && lastMessage.role === 'user') {
            setTimeout(() => scrollToBottom(true, true), 50);
        }
        // Smooth scroll for assistant responses
        else if (lastMessage && lastMessage.role === 'assistant') {
            setTimeout(() => scrollToBottom(true), 100);
        }
        // Default scroll for any message update
        else if (!activeTableData) {
            scrollToBottom();
        }
    }, [messages, activeTableData, scrollToBottom]);

    // Update active table data when messages change
    useEffect(() => {
        const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant' && m.tableData);
        if (lastAssistantMessage?.tableData) {
            setActiveTableData(lastAssistantMessage.tableData);
            // Don't auto-open here - let the huge_data_init event handle it
            setSearchTerm(''); // Reset search when new table arrives
        }
    }, [messages, setActiveTableData, setSearchTerm]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            thinkingSteps: [],
            status: 'complete',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Collapse table panel when new message is sent
        setIsTablePanelOpen(false);

        // Force immediate scroll to user's message
        setTimeout(() => scrollToBottom(true, true), 100);

        // Create assistant message placeholder
        const assistantMessageId = (Date.now() + 1).toString();
        const assistantMessage: Message = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            thinkingSteps: [],
            status: 'streaming',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);

        try {
            // Use API client method which sends JWT automatically
            const stream = await api.queryAI(userMessage.content);
            const reader = stream.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let tableData: TableData | null = null;


            // Collect all rows silently - no UI updates until final event
            const allRows: unknown[] = [];

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        break;
                    }

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const event: StreamEvent = JSON.parse(line.slice(6));

                                // Handle non-row events immediately
                                if (event.type !== 'huge_data_row') {
                                    setMessages(prev => prev.map(msg => {
                                        if (msg.id === assistantMessageId) {
                                            const updatedSteps = [...msg.thinkingSteps];
                                            let updatedContent = msg.content;
                                            let updatedTableData = msg.tableData;

                                            switch (event.type) {
                                                case 'iteration':
                                                    updatedSteps.push({
                                                        type: 'iteration',
                                                        title: `Iteration ${event.iteration}`,
                                                        content: event.message,
                                                        status: 'running',
                                                        iteration: event.iteration,
                                                    });
                                                    break;

                                                case 'ai_decision':
                                                    updatedSteps.push({
                                                        type: 'decision',
                                                        title: 'AI Decision',
                                                        content: `Decision: ${event.decision}\nReason: ${event.reason}`,
                                                        status: 'success',
                                                        iteration: event.iteration,
                                                    });
                                                    break;

                                                case 'function_start':
                                                    updatedSteps.push({
                                                        type: 'function',
                                                        title: `Executing: ${event.function}`,
                                                        content: `Parameters:\n${typeof event.params === 'object' ? JSON.stringify(event.params, null, 2) : String(event.params)}`,
                                                        status: 'running',
                                                        iteration: event.iteration,
                                                    });
                                                    break;

                                                case 'function_result': {
                                                    // Update the last function step
                                                    let lastFuncIndex = -1;
                                                    for (let i = updatedSteps.length - 1; i >= 0; i--) {
                                                        if (updatedSteps[i].type === 'function' && updatedSteps[i].status === 'running') {
                                                            lastFuncIndex = i;
                                                            break;
                                                        }
                                                    }
                                                    if (lastFuncIndex !== -1) {
                                                        updatedSteps[lastFuncIndex] = {
                                                            type: 'result',
                                                            title: `Result: ${event.function}`,
                                                            content: `${event.message}${event.count ? `\nCount: ${event.count}` : ''}`,
                                                            status: event.success ? 'success' : 'error',
                                                            iteration: event.iteration,
                                                        };
                                                    }
                                                    break;
                                                }

                                                case 'huge_data_init':
                                                    updatedTableData = {
                                                        headers: event.headers,
                                                        rows: [],
                                                        count: event.count,
                                                        aiSummary: event.ai_summary,
                                                    };
                                                    tableData = updatedTableData;
                                                    // Open the table panel when huge data actually arrives
                                                    setIsTablePanelOpen(true);
                                                    break;

                                                case 'final':
                                                    updatedContent = event.response;
                                                    // Add all collected rows to table at once when final event arrives
                                                    if (tableData && allRows.length > 0) {
                                                        tableData.rows = allRows;
                                                        updatedTableData = tableData;
                                                    }
                                                    return { ...msg, content: updatedContent, tableData: updatedTableData, status: 'complete' };

                                                case 'error':
                                                    updatedContent = `Error: ${event.message}`;
                                                    return { ...msg, content: updatedContent, status: 'error' };
                                            }

                                            return { ...msg, thinkingSteps: updatedSteps, tableData: updatedTableData };
                                        }
                                        return msg;
                                    }));
                                } else {
                                    // Silently collect rows without any UI updates
                                    if (event.type === 'huge_data_row') {
                                        allRows.push(event.row);
                                    }
                                }
                            } catch (error) {
                                console.error('Error parsing event:', error);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => prev.map(msg =>
                msg.id === assistantMessageId
                    ? { ...msg, content: 'Failed to get response from AI', status: 'error' }
                    : msg
            ));
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const hasActiveTable = activeTableData && activeTableData.rows.length > 0;

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 relative animate-fade-in">
            {/* Main Content Area */}
            <div className="flex-1 flex gap-4 min-h-0 relative p-4 md:p-6">
                {/* Chat Area */}
                <div
                    className={`flex flex-col transition-all duration-500 ease-in-out ${hasActiveTable && isTablePanelOpen ? 'w-[40%]' : 'w-full max-w-5xl mx-auto'
                        }`}
                >
                    {/* Messages Container */}
                    <div
                        ref={chatContainerRef}
                        className="flex-1 overflow-y-auto space-y-6 mb-4 pr-2 min-h-0 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                    >
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full px-4">
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                                    <Bot className="relative h-20 w-20 text-gray-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Start a Conversation</h2>
                                <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-8">
                                    Ask questions about placement data, student statistics, company information, and more!
                                </p>

                                {/* Sample Questions */}
                                <div className="w-full max-w-3xl">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-4 text-center">
                                        ✨ Try asking:
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {sampleQuestions.map((question, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setInput(question.text)}
                                                className="group backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-200/40 dark:border-gray-700/40 hover:border-gray-300/60 dark:hover:border-gray-600/60 transition-all duration-300 text-left hover:shadow-lg hover:scale-[1.02] animate-fade-in"
                                                style={{ animationDelay: `${index * 100}ms` }}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${question.gradient} flex items-center justify-center shadow-md transform `}>
                                                        {question.icon}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-gray-700 dark:group-hover:text-gray-100 transition-colors">
                                                            {question.text}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {question.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            messages.map((message) => (
                                <MessageBubble
                                    key={message.id}
                                    message={message}
                                    hasActiveTable={!!(hasActiveTable && isTablePanelOpen)}
                                />
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area - Centered with Extra Curves */}
                    <div className="flex justify-center flex-shrink-0 animate-fade-in">
                        <div className="backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 rounded-[2rem] p-3 border border-gray-200/30 dark:border-gray-700/30 shadow-2xl w-full max-w-2xl">
                            <div className="flex gap-2">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask anything..."
                                    rows={1}
                                    disabled={isLoading}
                                    className="flex-1 bg-gray-100/60 dark:bg-gray-900/60 border-2 border-gray-300/50 dark:border-gray-700/50 rounded-[1.5rem] px-5 py-3 text-gray-800 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-400/30 dark:focus:ring-gray-600/30 transition-all duration-300 resize-none disabled:opacity-50 text-sm"
                                    style={{ maxHeight: '100px', minHeight: '42px' }}
                                    onInput={(e) => {
                                        const target = e.target as HTMLTextAreaElement;
                                        target.style.height = 'auto';
                                        target.style.height = Math.min(target.scrollHeight, 100) + 'px';
                                    }}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!input.trim() || isLoading}
                                    className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-always-white rounded-[1.5rem] font-medium transition-all duration-300 shadow-lg hover:shadow-xl  disabled:cursor-not-allowed disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Send className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Panel - Fixed Right Sidebar */}
                {hasActiveTable && (
                    <div
                        className={`fixed right-4 md:right-8 top-[140px] bottom-[20px] transition-all duration-500 ease-in-out ${isTablePanelOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
                            }`}
                        style={{ width: '58%' }}
                    >
                        <TablePanel
                            tableData={activeTableData}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            onClose={() => setIsTablePanelOpen(false)}
                        />
                    </div>
                )}

                {/* Table Panel Toggle Button */}
                {hasActiveTable && !isTablePanelOpen && (
                    <button
                        onClick={() => setIsTablePanelOpen(true)}
                        className="fixed right-4 md:right-6 top-1/2 -translate-y-1/2 group animate-fade-in z-50"
                        title="Show table"
                    >
                        {/* Glow effect */}
                        <div className="absolute -inset-1 bg-gray-300 dark:bg-gray-700 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

                        {/* Button content */}
                        <div className="relative px-6 py-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 hover:from-gray-200 hover:via-gray-300 hover:to-gray-400 dark:hover:from-gray-600 dark:hover:via-gray-700 dark:hover:to-gray-800 text-gray-800 dark:text-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300  flex items-center gap-3">
                            <Database className="h-6 w-6 animate-pulse" />
                            <div className="flex flex-col items-start">
                                <span className="text-sm font-bold">Show Data</span>
                                <span className="text-xs opacity-90">{activeTableData?.count || 0} items</span>
                            </div>
                        </div>
                    </button>
                )}
            </div>
        </div >
    );
}

// Message Bubble Component with Typing Animation
function MessageBubble({ message, hasActiveTable }: { message: Message; hasActiveTable: boolean }) {
    const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);
    const [displayedContent, setDisplayedContent] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const isUser = message.role === 'user';

    // Typing effect for AI responses
    useEffect(() => {
        if (!isUser && message.content && message.status === 'complete') {
            setIsTyping(true);
            setDisplayedContent('');

            let index = 0;
            const typingSpeed = 10; // milliseconds per character (faster)

            const timer = setInterval(() => {
                if (index < message.content.length) {
                    setDisplayedContent(message.content.slice(0, index + 1));
                    index++;
                } else {
                    setIsTyping(false);
                    clearInterval(timer);
                }
            }, typingSpeed);

            return () => clearInterval(timer);
        } else if (!isUser) {
            setDisplayedContent(message.content);
        }
    }, [message.content, message.status, isUser]);

    return (
        <div className={`flex gap-4 ${isUser ? 'justify-end flex-row-reverse' : 'justify-start'} animate-fade-in`}>
            {/* Avatar */}
            <div className="flex-shrink-0">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transform transition-all duration-300 shadow-xl ${isUser
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/40'
                    : 'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 shadow-gray-300/40 dark:shadow-gray-700/40'
                    }`}>
                    {isUser ? (
                        <User className="h-6 w-6 text-white stroke-white" strokeWidth={2} />
                    ) : (
                        <Bot className="h-6 w-6 text-gray-800 dark:text-white" />
                    )}
                </div>
            </div>

            {/* Message Content */}
            <div className={`flex-1 max-w-[75%] ${isUser ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
                {/* User Message */}
                {isUser ? (
                    <div className="relative group">
                        {/* Glow effect */}
                        <div className="absolute -inset-1 bg-blue-300 dark:bg-gray-700 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                        <div className="relative backdrop-blur-xl bg-blue-500/60 dark:bg-gray-700/60 rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 border border-blue-400/30 dark:border-gray-600/30">
                            <p className="text-white font-medium">{message.content}</p>
                        </div>
                    </div>
                ) : (
                    /* Assistant Message */
                    <div className="space-y-3 max-w-[95%]">
                        {/* Thinking Section */}
                        {message.thinkingSteps.length > 0 && (
                            <div className="relative">
                                <button
                                    onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
                                    className="flex items-center gap-2 px-4 py-2 backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 group hover:shadow-lg"
                                >
                                    <Sparkles className={`h-4 w-4 transition-all duration-300 ${message.status === 'streaming' ? 'text-gray-400 animate-pulse' : 'text-gray-400 group-hover:rotate-12'}`} />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {message.status === 'streaming' ? 'Thinking...' : 'View thinking process'}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                        ({message.thinkingSteps.length} steps)
                                    </span>
                                    {isThinkingExpanded ? (
                                        <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400 ml-auto transition-transform duration-300" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400 ml-auto transition-transform duration-300" />
                                    )}
                                </button>

                                {isThinkingExpanded && (
                                    <div className="mt-3 backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-lg space-y-2 animate-fade-in max-h-60 overflow-y-auto scroll-smooth">
                                        {message.thinkingSteps.map((step, index) => (
                                            <ThinkingStepItem key={index} step={step} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* AI Response */}
                        {displayedContent && (
                            <div className={`backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 ${hasActiveTable ? 'max-w-full' : 'max-w-3xl'
                                }`}>
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <div
                                        className="text-gray-800 dark:text-gray-100 whitespace-pre-wrap"
                                        dangerouslySetInnerHTML={{ __html: formatMarkdown(displayedContent) }}
                                    />
                                    {isTyping && <span className="inline-block w-0.5 h-5 ml-1 bg-gray-400 animate-pulse"></span>}
                                </div>
                            </div>
                        )}


                        {/* Loading Indicator */}
                        {message.status === 'streaming' && !displayedContent && (
                            <div className="backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-xl max-w-3xl">
                                <div className="flex items-center gap-3">
                                    <Loader2 className="h-5 w-5 text-gray-500 dark:text-gray-400 animate-spin" />
                                    <span className="text-gray-700 dark:text-gray-300">Processing your request...</span>
                                </div>
                            </div>
                        )}

                        {/* Error State */}
                        {message.status === 'error' && (
                            <div className="glass-strong rounded-2xl p-6 border border-red-200 dark:border-red-700/50 shadow-xl bg-red-50/50 dark:bg-red-900/10 max-w-3xl">
                                <div className="flex items-center gap-3">
                                    <XCircle className="h-5 w-5 text-red-500" />
                                    <span className="text-red-600 dark:text-red-400">{message.content}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Timestamp */}
                <div className={`mt-2 text-xs text-gray-500 dark:text-gray-400 ${isUser ? 'text-right' : 'text-left'}`}>
                    {message.timestamp.toLocaleTimeString()}
                </div>
            </div>
        </div>
    );
}

// Table Panel Component - Virtualized for 10K+ rows
function TablePanel({ tableData, searchTerm, setSearchTerm, onClose }: {
    tableData: TableData;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onClose: () => void;
}) {
    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [cellModal, setCellModal] = useState<{ content: string; header: string } | null>(null);
    const listRef = useRef<FixedSizeList>(null);
    const headerScrollRef = useRef<HTMLDivElement>(null);

    // Debounce search to prevent lag while typing
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Memoize unique rows to avoid recalculation
    const uniqueRows = useMemo(() => {
        return tableData.rows.filter((row, index, self) => {
            const rowString = JSON.stringify(row);
            return index === self.findIndex(r => JSON.stringify(r) === rowString);
        });
    }, [tableData.rows]);

    // Memoize filtered rows based on debounced search
    const filteredRows = useMemo(() => {
        if (!debouncedSearch) return uniqueRows;
        return uniqueRows.filter(row =>
            typeof row === 'object' && row !== null && Object.values(row as Record<string, unknown>).some(val =>
                String(val).toLowerCase().includes(debouncedSearch.toLowerCase())
            )
        );
    }, [uniqueRows, debouncedSearch]);

    // Memoize sorted rows
    const sortedRows = useMemo(() => {
        if (!sortConfig) return filteredRows;

        const sorted = [...filteredRows].sort((a, b) => {
            const aVal = (a as Record<string, unknown>)[sortConfig.key];
            const bVal = (b as Record<string, unknown>)[sortConfig.key];

            // Handle null/undefined
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;

            // Compare values
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
            }

            const aStr = String(aVal).toLowerCase();
            const bStr = String(bVal).toLowerCase();

            if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [filteredRows, sortConfig]);

    // Handle column header click for sorting
    const handleSort = (header: string) => {
        setSortConfig(current => {
            if (current?.key === header) {
                return current.direction === 'asc'
                    ? { key: header, direction: 'desc' }
                    : null;
            }
            return { key: header, direction: 'asc' };
        });
    };

    // Memoized download handler
    const handleDownload = useCallback(() => {
        const headers = tableData.headers;
        const rows = sortedRows;

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            const values = headers.map(header => {
                const val = (row as Record<string, unknown>)[header];
                const strVal = val !== undefined ? String(val) : '';
                return strVal.includes(',') ? `"${strVal}"` : strVal;
            });
            csv += values.join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-results-${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }, [tableData.headers, sortedRows]);

    // Virtualized row renderer with clickable cells
    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const row = sortedRows[index];
        const isEven = index % 2 === 0;

        return (
            <div
                style={style}
                className={`flex transition-all duration-150 border-b border-gray-200/30 dark:border-gray-700/30 ${isEven ? 'bg-gray-50/40 dark:bg-gray-800/40' : 'bg-gray-50/20 dark:bg-gray-800/20'
                    } hover:bg-gray-100/60 dark:hover:bg-gray-700/60`}
            >
                {tableData.headers.map((header, cellIndex) => {
                    const cellValue = (row as Record<string, unknown>)[header];
                    const displayValue = cellValue !== undefined && cellValue !== null
                        ? typeof cellValue === 'object'
                            ? JSON.stringify(cellValue)
                            : String(cellValue)
                        : '-';
                    const isTruncated = displayValue.length > 30;

                    return (
                        <div
                            key={cellIndex}
                            className="px-4 py-3.5 text-sm text-gray-800 dark:text-gray-200 whitespace-nowrap overflow-hidden flex items-center gap-2 border-r border-gray-200/20 dark:border-gray-700/20 last:border-r-0"
                            style={{
                                width: `${Math.max(200, 100 / tableData.headers.length)}px`,
                                minWidth: `${Math.max(200, 100 / tableData.headers.length)}px`,
                                maxWidth: `${Math.max(200, 100 / tableData.headers.length)}px`
                            }}
                        >
                            <span className="truncate flex-1">{displayValue}</span>
                            {isTruncated && (
                                <button
                                    onClick={() => setCellModal({ content: displayValue, header })}
                                    className="flex-shrink-0 px-2 py-1 text-xs bg-blue-500/20 hover:bg-blue-500/40 text-blue-700 dark:text-blue-300 rounded transition-colors duration-200"
                                    title="Click to view full content"
                                >
                                    View
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 rounded-2xl p-5 border-2 border-gray-200/50 dark:border-gray-700/50 shadow-2xl animate-slide-in-right h-full flex flex-col">
            {/* Header */}
            <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center shadow-lg">
                            <Database className="h-5 w-5 text-gray-800 dark:text-gray-200" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                Data Results
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {tableData.aiSummary || (
                                    uniqueRows.length < tableData.rows.length
                                        ? `${uniqueRows.length} unique items (${tableData.rows.length - uniqueRows.length} duplicates removed)`
                                        : `${uniqueRows.length} items`
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownload}
                            className="p-2 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-all duration-300  text-green-600 dark:text-green-400"
                            title="Download as CSV"
                        >
                            <Download className="h-4 w-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-300 "
                            title="Minimize table"
                        >
                            <Minimize2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search in results..."
                        className="w-full pl-11 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800/50 border-2 border-gray-300 dark:border-gray-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                    />
                </div>
                {searchTerm && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-1">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                        Showing {sortedRows.length} of {uniqueRows.length} results
                    </p>
                )}
            </div>

            {/* Enhanced Sortable Table with Perfect Alignment */}
            <div className="flex-1 flex flex-col overflow-hidden rounded-xl border-2 border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
                {/* Sticky Header with Horizontal Scroll */}
                <div className="bg-gradient-to-r from-gray-100 via-gray-150 to-gray-200 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900 border-b-2 border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                    <div
                        ref={headerScrollRef}
                        className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    >
                        <div className="flex">
                            {tableData.headers.map((header, index) => {
                                const isSorted = sortConfig?.key === header;
                                const direction = sortConfig?.direction;
                                const columnWidth = Math.max(200, 100 / tableData.headers.length);

                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleSort(header)}
                                        className="px-4 py-3.5 text-left text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider whitespace-nowrap overflow-hidden text-ellipsis hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-all duration-200 flex items-center gap-2 group border-r border-gray-200/30 dark:border-gray-700/30 last:border-r-0"
                                        style={{
                                            width: `${columnWidth}px`,
                                            minWidth: `${columnWidth}px`,
                                            maxWidth: `${columnWidth}px`
                                        }}
                                        title={header}
                                    >
                                        <span className="group-hover:text-blue-400 transition-colors truncate flex-1">
                                            {header}
                                        </span>
                                        <span className="text-gray-500 group-hover:text-blue-400 flex-shrink-0">
                                            {isSorted ? (
                                                direction === 'asc' ? '↑' : '↓'
                                            ) : (
                                                <span className="opacity-30">↕</span>
                                            )}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Virtualized Rows */}
                <div
                    className="flex-1 overflow-auto bg-gray-50/50 dark:bg-gray-900/50 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    onScroll={(e) => {
                        // Sync header scroll with body scroll
                        if (headerScrollRef.current) {
                            headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
                        }
                    }}
                >
                    {sortedRows.length > 0 ? (
                        <FixedSizeList
                            ref={listRef}
                            height={600}
                            itemCount={sortedRows.length}
                            itemSize={52}
                            width={tableData.headers.length * Math.max(200, 100 / tableData.headers.length)}
                            overscanCount={10}
                        >
                            {Row}
                        </FixedSizeList>
                    ) : (
                        <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                            No results found for "{searchTerm}"
                        </div>
                    )}
                </div>
            </div>

            {/* Cell Content Modal */}
            {cellModal && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
                    onClick={() => setCellModal(null)}
                >
                    <div
                        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto shadow-2xl border-2 border-gray-300 dark:border-gray-700"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                {cellModal.header}
                            </h3>
                            <button
                                onClick={() => setCellModal(null)}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <XCircle className="h-5 w-5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" />
                            </button>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-300 dark:border-gray-700">
                            <pre className="text-sm text-gray-900 dark:text-gray-200 whitespace-pre-wrap break-words font-mono">
                                {cellModal.content}
                            </pre>
                        </div>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(cellModal.content);
                            }}
                            className="mt-4 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-700 dark:text-blue-300 rounded-lg transition-colors duration-200 flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Copy to Clipboard
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Thinking Step Item Component
function ThinkingStepItem({ step, compact = false }: { step: ThinkingStep; compact?: boolean }) {
    const getIcon = () => {
        const size = compact ? 'h-3 w-3' : 'h-4 w-4';
        switch (step.type) {
            case 'iteration':
                return <Sparkles className={`${size} text-blue-500`} />;
            case 'decision':
                return <Brain className={`${size} text-purple-500`} />;
            case 'function':
                return <Database className={`${size} text-cyan-500`} />;
            case 'result':
                return step.status === 'success'
                    ? <CheckCircle className={`${size} text-green-500`} />
                    : <XCircle className={`${size} text-red-500`} />;
            default:
                return <Loader2 className={`${size} text-gray-500 animate-spin`} />;
        }
    };

    const getStatusColor = () => {
        switch (step.status) {
            case 'success':
                return 'border-green-200 dark:border-green-700/50 bg-green-50/50 dark:bg-green-900/10';
            case 'error':
                return 'border-red-200 dark:border-red-700/50 bg-red-50/50 dark:bg-red-900/10';
            case 'running':
                return 'border-blue-200 dark:border-blue-700/50 bg-blue-50/50 dark:bg-blue-900/10';
            default:
                return 'border-gray-200 dark:border-gray-700/50';
        }
    };

    return (
        <div className={`${compact ? 'p-2' : 'p-3'} rounded-lg border ${getStatusColor()} transition-all duration-300 hover:shadow-md`}>
            <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                    {getIcon()}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 dark:text-white truncate`}>
                            {step.title}
                        </h4>
                        {step.status === 'running' && (
                            <Loader2 className={`${compact ? 'h-2 w-2' : 'h-3 w-3'} text-blue-500 animate-spin flex-shrink-0`} />
                        )}
                    </div>
                    <p className={`${compact ? 'text-xs' : 'text-xs'} text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono break-all`}>
                        {step.content}
                    </p>
                </div>
            </div>
        </div>
    );
}

// Simple markdown formatter for response text
function formatMarkdown(text: string): string {
    // Convert markdown bold **text** to HTML
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Convert markdown headers
    text = text.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>');
    text = text.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>');
    text = text.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>');

    // Convert checkmarks and bullets
    text = text.replace(/✅/g, '<span class="text-green-500">✅</span>');
    text = text.replace(/📊/g, '<span class="text-blue-500">📊</span>');
    text = text.replace(/📁/g, '<span class="text-yellow-500">📁</span>');

    // Convert line breaks to <br>
    text = text.replace(/\n/g, '<br>');

    return text;
}
