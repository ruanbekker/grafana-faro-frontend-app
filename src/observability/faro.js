import { initializeFaro, getWebInstrumentations } from '@grafana/faro-web-sdk';

let faroInstance = null;
let eventCount = 0;
let errorCount = 0;

// Function to update UI counters
const updateCounters = () => {
    const eventsEl = document.getElementById('events-count');
    const errorsEl = document.getElementById('errors-count');
    if (eventsEl) eventsEl.textContent = eventCount;
    if (errorsEl) errorsEl.textContent = errorCount;
};

// Initialize Faro
export const initializeObservability = () => {
    const statusEl = document.getElementById('faro-status');
    
    try {
        if (statusEl) {
            statusEl.textContent = 'Initializing...';
            statusEl.className = 'initializing';
        }

        faroInstance = initializeFaro({
      url: 'http://faro.127.0.0.1.nip.io/collect',
            app: {
                name: 'faro-test-app',
                version: '1.0.0',
                environment: 'test'
            },
            instrumentations: [
                ...getWebInstrumentations({
                    captureConsole: true,
                    captureConsoleDisabledLevels: [],
                }),
            ],
            // Set user context
            user: {
                id: 'test-user-' + Math.random().toString(36).substr(2, 9),
                attributes: {
                    testSession: 'true',
                    startTime: new Date().toISOString(),
                }
            },
            // Global attributes for all events
            globalAttributes: {
                testApp: 'true',
                browser: navigator.userAgent,
                url: window.location.href,
            },
            // Hook to count events
            beforeSend: (event) => {
                eventCount++;
                updateCounters();

                if (event.meta && event.meta.user && event.meta.user.attributes) {
                    for (const [key, value] of Object.entries(event.meta.user.attributes)) {
                        if (typeof value !== 'string') {
                            event.meta.user.attributes[key] = String(value);
                        }
                    }
                }

                if (event.meta && event.meta.globalAttributes) {
                    for (const [key, value] of Object.entries(event.meta.globalAttributes)) {
                        if (typeof value !== 'string') {
                            event.meta.globalAttributes[key] = String(value);
                        }
                    }
                }
                
                // Log what we're sending for debugging
                console.log('📤 Sending to Faro:', {
                    type: event.type || 'unknown',
                    timestamp: new Date().toISOString(),
                    event: event
                });
                
                return event;
            }
        });

        if (statusEl) {
            statusEl.textContent = 'Connected';
            statusEl.className = '';
        }

        console.log('✅ Faro initialized successfully');
        
        // Send initial event
        faroInstance.api.pushEvent('app-initialized', {
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        });

        return faroInstance;
        
    } catch (error) {
        console.error('❌ Failed to initialize Faro:', error);
        
        if (statusEl) {
            statusEl.textContent = 'Connection Failed';
            statusEl.className = 'error';
        }
        
        // Return mock API so app doesn't break
        return {
            api: {
                pushLog: (...args) => console.log('Mock pushLog:', ...args),
                pushError: (...args) => { 
                    errorCount++;
                    updateCounters();
                    console.log('Mock pushError:', ...args);
                },
                pushEvent: (...args) => {
                    eventCount++;
                    updateCounters();
                    console.log('Mock pushEvent:', ...args);
                },
                setUser: (...args) => console.log('Mock setUser:', ...args),
            }
        };
    }
};

// Export the instance
export const getFaro = () => faroInstance;

// Helper functions for easy logging
export const logEvent = (eventName, attributes = {}) => {
    if (faroInstance) {
        faroInstance.api.pushEvent(eventName, {
            ...attributes,
            timestamp: Date.now(),
        });
    }
};

export const logError = (error, context = {}) => {
    if (faroInstance) {
        errorCount++;
        updateCounters();
        faroInstance.api.pushError(error, context);
    }
};

export const logInfo = (message, attributes = {}) => {
    if (faroInstance) {
        faroInstance.api.pushLog([message], {
            level: 'info',
            timestamp: Date.now(),
            ...attributes,
        });
    }
};

export const setUser = (userInfo) => {
    if (faroInstance) {
        // Ensure all attributes are strings
        const sanitizedUserInfo = {
            ...userInfo,
            attributes: {}
        };
        
        if (userInfo.attributes) {
            for (const [key, value] of Object.entries(userInfo.attributes)) {
                sanitizedUserInfo.attributes[key] = String(value);
            }
        }
        
        faroInstance.api.setUser(sanitizedUserInfo);
        logEvent('user-context-updated', sanitizedUserInfo.attributes);
    }
};
