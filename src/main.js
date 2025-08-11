import { initializeObservability, logEvent, logError, logInfo, setUser } from './observability/faro.js';

// Initialize Faro when page loads
let faro;
document.addEventListener('DOMContentLoaded', () => {
    faro = initializeObservability();
    setupEventListeners();
});

const setupEventListeners = () => {
    // Console logging tests
    document.getElementById('log-info')?.addEventListener('click', () => {
        console.log('ℹ️ This is an info message from the test app');
        logInfo('Manual info log triggered');
    });

    document.getElementById('log-warn')?.addEventListener('click', () => {
        console.warn('⚠️ This is a warning message from the test app');
    });

    document.getElementById('log-error')?.addEventListener('click', () => {
        console.error('❌ This is an error message from the test app');
    });

    document.getElementById('log-debug')?.addEventListener('click', () => {
        console.debug('🐛 This is a debug message from the test app');
    });

    // Custom events
    document.getElementById('custom-event')?.addEventListener('click', () => {
        logEvent('custom-button-clicked', {
            buttonId: 'custom-event',
            page: 'test-page',
            sessionTime: Date.now() - performance.now(),
        });
    });

    document.getElementById('user-action')?.addEventListener('click', () => {
        logEvent('user-action-performed', {
            action: 'button-click',
            element: 'user-action-button',
            coordinates: { x: Math.random() * 100, y: Math.random() * 100 },
        });
    });

    document.getElementById('page-view')?.addEventListener('click', () => {
        logEvent('page-view-tracked', {
            page: '/test-page',
            referrer: document.referrer,
            timestamp: Date.now(),
        });
    });

    // Error testing
    document.getElementById('throw-error')?.addEventListener('click', () => {
        try {
            throw new Error('This is a test error thrown intentionally');
        } catch (error) {
            logError(error, { 
                context: 'error-testing',
                userTriggered: true 
            });
        }
    });

    document.getElementById('promise-error')?.addEventListener('click', () => {
        Promise.reject(new Error('This is a test promise rejection'))
            .catch(error => {
                logError(error, { 
                    context: 'promise-rejection-test',
                    userTriggered: true 
                });
            });
    });

    document.getElementById('network-error')?.addEventListener('click', async () => {
        try {
            const response = await fetch('https://httpstat.us/500');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            logError(error, { 
                context: 'network-error-simulation',
                url: 'https://httpstat.us/500' 
            });
        }
    });

    // Performance testing
    document.getElementById('slow-operation')?.addEventListener('click', () => {
        const start = performance.now();
        logEvent('slow-operation-started');
        
        // Simulate slow operation
        setTimeout(() => {
            const duration = performance.now() - start;
            logEvent('slow-operation-completed', {
                duration: duration,
                type: 'setTimeout-simulation'
            });
        }, 2000);
    });

    document.getElementById('api-call')?.addEventListener('click', async () => {
        const start = performance.now();
        logEvent('api-call-started', { endpoint: '/api/test' });
        
        try {
            const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
            const data = await response.json();
            const duration = performance.now() - start;
            
            logEvent('api-call-completed', {
                endpoint: '/api/test',
                duration: duration,
                status: response.status,
                dataSize: JSON.stringify(data).length
            });
        } catch (error) {
            logError(error, { context: 'api-call-failed' });
        }
    });

    document.getElementById('navigation')?.addEventListener('click', () => {
        logEvent('navigation-simulated', {
            from: window.location.pathname,
            to: '/simulated-page',
            method: 'programmatic'
        });
        
        // Simulate URL change without actual navigation
        history.pushState({}, '', '/simulated-page');
        setTimeout(() => {
            history.pushState({}, '', '/');
        }, 1000);
    });

    // User context
    document.getElementById('set-user')?.addEventListener('click', () => {
        const userId = document.getElementById('user-id')?.value || 'anonymous';
        const userEmail = document.getElementById('user-email')?.value || '';
        
        setUser({
            id: userId,
            email: userEmail,
            attributes: {
                updatedAt: new Date().toISOString(),
                sessionId: 'session-' + Math.random().toString(36).substr(2, 9),
                testUser: true
            }
        });
    });

    // Form testing
    document.getElementById('test-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        logEvent('form-submitted', {
            formId: 'test-form',
            fields: Object.keys(data),
            hasData: Object.values(data).some(v => v.length > 0)
        });
        
        // Simulate form processing
        setTimeout(() => {
            logEvent('form-processed', {
                formId: 'test-form',
                success: true,
                processingTime: 500
            });
        }, 500);
    });

    // Track input changes
    document.getElementById('test-input')?.addEventListener('input', (e) => {
        if (e.target.value.length > 0 && e.target.value.length % 5 === 0) {
            logEvent('input-milestone', {
                inputId: 'test-input',
                length: e.target.value.length
            });
        }
    });
};

// Track page visibility changes
document.addEventListener('visibilitychange', () => {
    logEvent('page-visibility-changed', {
        visible: !document.hidden,
        timestamp: Date.now()
    });
});

// Track window focus/blur
window.addEventListener('focus', () => {
    logEvent('window-focused');
});

window.addEventListener('blur', () => {
    logEvent('window-blurred');
});

// Track errors globally
window.addEventListener('error', (event) => {
    logError(event.error, {
        context: 'global-error-handler',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});

window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason, {
        context: 'unhandled-promise-rejection'
    });
});
