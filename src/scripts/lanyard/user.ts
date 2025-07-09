import type { LanyardData, DiscordUser } from './interfaces';
import { getStatusColor } from './utils';

const generateNavbarHTML = ({ display_name = '', username }: DiscordUser): string => `
    <p style="margin: 4px auto; font-weight: 600; font-size: 20px;">
        <a
            href="https://discord.com/users/410475909125242901"
            target="_blank"
            style="color: var(--color-link); "
            >${display_name}
        </a>
        <br>
        <span style="color: var(--color-primary);">@${username}</span>
    </p>
`;

const updateAvatar = (avatarUrl: string, statusColor: string, avatarImg: HTMLImageElement) => {
    avatarImg.src = avatarUrl;
    avatarImg.alt = 'User Avatar';
    avatarImg.style.borderColor = statusColor
    avatarImg.loading = 'lazy';
};

const updateAvatarDecoration = (asset: string | undefined, avatarDecoImg: HTMLImageElement) => {
    if (asset) {
        avatarDecoImg.src = `https://cdn.discordapp.com/avatar-decoration-presets/${asset}.png`;
        avatarDecoImg.style.display = 'block';
        avatarDecoImg.loading = 'lazy';
    } else {
        avatarDecoImg.style.display = 'none';
    }
};

export const displayUser = (userData: LanyardData | null): void => {
    const navbar = document.querySelector('.dvop');
    if (!navbar) return;

    if (!userData) {
        navbar.innerHTML = '<p>Loading...</p>';
        return; // Exit if no data is available
    }

    const userInfo = navbar.querySelector('.userinfo');
    if (userInfo) {
        userInfo.innerHTML = generateNavbarHTML(userData.discord_user);
    }

    const avatarImg = document.getElementById('avatar') as HTMLImageElement | null;
    const avatarDecoImg = document.getElementById('avatar-deco') as HTMLImageElement | null;

    if (avatarImg && userData.discord_user.avatar) {
        const avatarUrl = `https://cdn.discordapp.com/avatars/${userData.discord_user.id}/${userData.discord_user.avatar}.png`;
        const statusColor = getStatusColor(userData.discord_status);
        updateAvatar(avatarUrl, statusColor, avatarImg);
    }

    if (avatarDecoImg) {
        const asset = userData.discord_user.avatar_decoration_data?.asset;
        updateAvatarDecoration(asset, avatarDecoImg);
    }
};