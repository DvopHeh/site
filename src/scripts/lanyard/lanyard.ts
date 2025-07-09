// lanyard.ts
import type { PresenceData } from '../../types/interfaces';

export const fetchPresence = async (): Promise<PresenceData | null> => {
    try {
        const response = await fetch('https://api.lanyard.rest/v1/users/410475909125242901');
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const { data }: { data: PresenceData } = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        return null;
    }
};