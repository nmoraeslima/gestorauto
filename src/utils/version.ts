export const APP_VERSION = '1.0.3';

export const checkForUpdates = async (): Promise<boolean> => {
    try {
        const response = await fetch(`/version.json?t=${Date.now()}`);
        if (!response.ok) return false;

        const data = await response.json();
        return data.version !== APP_VERSION;
    } catch (error) {
        console.error('Error checking for updates:', error);
        return false;
    }
};
