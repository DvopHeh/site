import { fetchPresence } from './lanyard';
import { displayUser } from './user';


const updateUser = async (): Promise<void> => {
    const lanyardData = await fetchPresence();
    displayUser(lanyardData);
};

updateUser();

setInterval(updateUser, 10000);