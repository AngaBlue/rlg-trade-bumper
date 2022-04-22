export interface CustomEventMap {
    rlgTradeBumper: CustomEvent<{
        csrf: string;
        trades: string[];
    }>;
}

declare global {
    interface Document {
        addEventListener<K extends keyof CustomEventMap>(type: K, listener: (this: Document, ev: CustomEventMap[K]) => void): void;
    }
}

export {};
