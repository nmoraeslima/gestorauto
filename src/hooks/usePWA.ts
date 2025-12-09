import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export function usePWA() {
    const [needRefresh, setNeedRefresh] = useState(false);
    const [offlineReady, setOfflineReady] = useState(false);
    const [releaseNote, setReleaseNote] = useState<any>(null);
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            // Register event listeners
            navigator.serviceWorker.ready.then((reg) => {
                setRegistration(reg);

                // Function to check for release notes
                const checkReleaseNotes = async () => {
                    try {
                        const response = await fetch('/release.json');
                        if (response.ok) {
                            const data = await response.json();
                            setReleaseNote(data);
                        }
                    } catch (error) {
                        console.error('Error fetching release notes:', error);
                    }
                };

                // Initial check
                if (reg.waiting) {
                    setNeedRefresh(true);
                    checkReleaseNotes();
                }

                // Listen for updates
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed') {
                                if (navigator.serviceWorker.controller) {
                                    setNeedRefresh(true);
                                    toast.success('Nova atualização disponível!');
                                    checkReleaseNotes();
                                } else {
                                    setOfflineReady(true);
                                }
                            }
                        });
                    }
                });
            });
        }
    }, []);

    const updateServiceWorker = async (active: boolean = true) => {
        if (active && registration && registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            setNeedRefresh(false);
            window.location.reload();
        } else if (!active && registration) {
            // Manual check for updates
            console.log('Checking for updates manually...');
            try {
                // If an update is found, the 'updatefound' event will fire, setting needRefresh to true.
                // We can't easily await the result of "found" vs "not found" from update() directly
                // because it resolves void.
                // However, we can use a slight delay or check state.

                await registration.update();

                // We'll give a short delay to let the event loop process any found updates
                setTimeout(() => {
                    if (registration.waiting) {
                        // Already handled by effect/state
                        setNeedRefresh(true);
                    } else {
                        // Manually fetch release notes even if no update, just to be safe or maybe user clicked button
                        // But strictly if no update, we show "up to date"
                        toast.success('Você já está na versão mais recente!');
                    }
                }, 500);

            } catch (error) {
                console.error('Error checking for updates:', error);
                toast.error('Erro ao verificar atualizações');
            }
        }
    };

    return {
        needRefresh,
        offlineReady,
        updateServiceWorker,
        registration,
        releaseNote
    };
}
