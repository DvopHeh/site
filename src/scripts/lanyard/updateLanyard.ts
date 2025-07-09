// updateLanyard.ts
import { fetchPresence } from './lanyard';
import { displayPresence } from './presence';
import { displayUser } from './user';

const updatePresence = async (): Promise<void> => {
    const lanyardData = await fetchPresence();
    displayPresence(lanyardData);
};

const updateUser = async (): Promise<void> => {
    const lanyardData = await fetchPresence();
    displayUser(lanyardData);
};

updateUser();
updatePresence();

setInterval(updatePresence, 1000);
setInterval(updateUser, 10000);