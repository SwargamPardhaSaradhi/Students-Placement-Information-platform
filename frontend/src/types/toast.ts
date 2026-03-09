export interface Toast {
    id: string;
    type: 'loading' | 'success' | 'error';
    title: string;
    message: string;
    duration?: number;
}

export type ToastInput = Omit<Toast, 'id'> & { id?: string };
