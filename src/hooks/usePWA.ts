import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Workbox } from 'workbox-window';

export function usePWA() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
    const [wb, setWb] = useState<Workbox | null>(null);

    // Function to handle the actual update
    const handleUpdate = useCallback(async () => {
        // Set flag to show success message after reload
        localStorage.setItem('pwa-update-pending', 'true');

        if (waitingWorker) {
            console.log('[PWA] Sending SKIP_WAITING to waiting worker');
            waitingWorker.postMessage({ type: 'SKIP_WAITING' });

            // Wait a bit for the SW to activate, then reload
            setTimeout(() => {
                console.log('[PWA] Reloading page after update');
                window.location.reload();
            }, 500);
        } else if (wb) {
            // Fallback for workbox instance if we have it
            wb.messageSkipWaiting();
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } else if (registration && registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            setTimeout(() => {
                window.location.reload();
            }, 500);
        }
    }, [waitingWorker, registration, wb]);

    // Check for update success flag on mount
    useEffect(() => {
        const updatePending = localStorage.getItem('pwa-update-pending');
        if (updatePending === 'true') {
            localStorage.removeItem('pwa-update-pending');
            // Show success toast
            toast.success('✨ App atualizado com sucesso!', {
                duration: 5000,
                icon: '🎉',
            });
        }
    }, []);

    const [releaseNote, setReleaseNote] = useState<any>(null);

    useEffect(() => {
        // Fetch version.json for release notes
        fetch('/version.json')
            .then(res => res.json())
            .then(data => {
                if (data.releases && data.releases.length > 0) {
                    setReleaseNote(data.releases[0]);
                }
            })
            .catch(console.error);

        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {

            // Initialize Workbox (simplifies some listeners)
            // But since we are using injectManifest and manual sw.js, we should be careful.
            // However, configured plugins in vite.config used injectManifest, so we can still use workbox-window
            // to interact with it if the SW uses workbox-sw (which we didn't explicitly import in our SW, we wrote native code for most parts).
            // But workbox-window is useful for the client side.

            // Let's use native API primarily as our SW is native-ish, but check if we should leverage workbox-window for the user code.
            // The user code in prompt used 'updatefound' manually.

            const loadSW = async () => {
                const { Workbox } = await import('workbox-window');
                const wbInstance = new Workbox('/sw.js');
                setWb(wbInstance);

                wbInstance.addEventListener('waiting', (event) => {
                    console.log('[PWA] New update waiting');
                    setUpdateAvailable(true);
                    setWaitingWorker(event.sw || null);
                });

                // DO NOT add 'controlling' listener here - it causes automatic reloads
                // The reload will happen manually when user clicks "Update Now"

                const reg = await wbInstance.register();
                setRegistration(reg || null);

                // Check for updates every 5 minutes (only in production)
                // In development, Vite constantly rebuilds the SW, causing false positives
                const isDevelopment = import.meta.env.DEV;

                if (!isDevelopment) {
                    setInterval(async () => {
                        console.log('[PWA] Checking for updates (5m interval)...');
                        try {
                            await wbInstance.update();
                        } catch (e) {
                            // ignore update errors (offline etc)
                            console.debug('[PWA] Update check failed', e);
                        }
                    }, 5 * 60 * 1000);
                }

                // Also check immediately on load if there's one waiting
                // But skip this in development to avoid false positives
                if (reg && reg.waiting && !isDevelopment) {
                    setUpdateAvailable(true);
                    setWaitingWorker(reg.waiting);
                }
            };

            loadSW();

            // DO NOT add controllerchange listener - it causes infinite reload loops
            // The reload will be triggered manually by handleUpdate after user confirmation
        }
    }, []);

    return {
        updateAvailable,
        needRefresh: updateAvailable, // Alias for legacy support if needed, but updated components use updateAvailable
        handleUpdate,
        updateServiceWorker: handleUpdate, // Alias for legacy support
        registration,
        releaseNote
    };
}
