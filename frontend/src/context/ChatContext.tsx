import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TableData, Message } from '../types';

interface ChatContextType {
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    input: string;
    setInput: (input: string) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    activeTableData: TableData | null;
    setActiveTableData: (data: TableData | null) => void;
    isTablePanelOpen: boolean;
    setIsTablePanelOpen: (open: boolean) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeTableData, setActiveTableData] = useState<TableData | null>(null);
    const [isTablePanelOpen, setIsTablePanelOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <ChatContext.Provider
            value={{
                messages,
                setMessages,
                input,
                setInput,
                isLoading,
                setIsLoading,
                activeTableData,
                setActiveTableData,
                isTablePanelOpen,
                setIsTablePanelOpen,
                searchTerm,
                setSearchTerm,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}
