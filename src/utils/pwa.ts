
export const isIOS = (): boolean => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
};

export const isStandalone = (): boolean => {
    return ('standalone' in window.navigator) && (window.navigator as any).standalone;
};
