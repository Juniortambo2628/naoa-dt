import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { contentService } from '../services/api';
import './../echo'; // Ensure Echo is initialized

const ContentContext = createContext();

export const useContent = () => {
    const context = useContext(ContentContext);
    if (!context) {
        throw new Error('useContent must be used within a ContentProvider');
    }
    return context;
};

export const ContentProvider = ({ children }) => {
    const [contents, setContents] = useState({});
    const [loading, setLoading] = useState(true);

    const fetchContents = useCallback(async () => {
        try {
            const res = await api.get('/content');
            setContents(res.data || {});
        } catch (err) {
            console.error('Failed to fetch content:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchContents();

        // Listen for real-time updates
        if (window.Echo) {
            console.log('Listening for content updates...');
            window.Echo.channel('content-updates')
                .listen('.content.updated', (e) => {
                    console.log('Content update received:', e.content);
                    setContents(prev => ({
                        ...prev,
                        [e.content.section_key]: e.content
                    }));
                });

            return () => {
                window.Echo.leave('content-updates');
            };
        }
    }, [fetchContents]);

    const getContent = useCallback((section, field, lang = 'en', fallback = '') => {
        const sectionData = contents[section];
        if (!sectionData || !sectionData.content) return fallback;
        
        const val = sectionData.content[field];
        if (!val) return fallback;
        
        if (typeof val === 'object') {
            return val[lang] || val['en'] || fallback;
        }
        return val;
    }, [contents]);

    const isVisible = useCallback((section) => {
        if (!section) return true;
        const sectionData = contents[section];
        return !sectionData || sectionData.is_visible !== false;
    }, [contents]);

    const updateLocalContent = useCallback((key, data) => {
        setContents(prev => ({
            ...prev,
            [key]: {
                ...(prev[key] || { section_key: key, content: {} }),
                ...data
            }
        }));
    }, []);

    return (
        <ContentContext.Provider value={{ 
            contents, 
            loading, 
            refreshContent: fetchContents,
            updateLocalContent,
            getContent,
            isVisible
        }}>
            {children}
        </ContentContext.Provider>
    );
};
