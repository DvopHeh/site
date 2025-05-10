// utils.ts
export const extractImageUrl = (url: string, application_id?: string): string => {
    if (!url) return '/images/default.png';

    try {
        if (url.startsWith('mp:external/')) {
            return `https://media.discordapp.net/external/${url.replace('mp:external/', '')}`;
        } else if (url.startsWith("spotify:")) {
            return url.replace("spotify:", "https://i.scdn.co/image/");
        } else if (application_id) {
            return `https://cdn.discordapp.com/app-assets/${application_id}/${url}.png`;
        }
        return url;
    } catch (error) {
        console.error("Error extracting image URL:", error);
        return '/images/default.png'; // Return placeholder if an error occurs
    }
};

export const getStatusColor = (status: string): string => {
    switch (status) {
        case 'online':
            return 'var(--color-status-online)';
        case 'idle':
            return 'var(--color-status-idle)';
        case 'dnd':
            return 'var(--color-status-dnd)';
        default:
            return 'var(--color-status-offline)';
    }
};