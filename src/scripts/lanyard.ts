// lanyard.ts
import type { LanyardData } from './interfaces.ts';

export const fetchPresence = async (): Promise<LanyardData | null> => {
    try {
        const response = await fetch('https://api.lanyard.rest/v1/users/410475909125242901');
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const { data }: { data: LanyardData } = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        return null;
    }
};