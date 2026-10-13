import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { getWeddingInfo } from '../utils/weddingInfo';
import { getEcho } from '../echo';

const ContentContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useContent = () => {
    const context = useContext(ContentContext);
    if (!context) {
        throw new Error('useContent must be used within a ContentProvider');
    }
    return context;
};

export const ContentProvider = ({ children }) => {
    const [contents, setContents] = useState({});
    const [settings, setSettings] = useState({});
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

    // Public settings carry the centralized wedding details (date, names, venue).
    const fetchSettings = useCallback(async () => {
        try {
            const res = await api.get('/public/settings');
            setSettings(res.data || {});
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        }
    }, []);

    useEffect(() => {
        fetchContents();
        fetchSettings();

        // Poll for content/settings changes; switch to live updates (Echo)
        // instead if broadcasting is configured and loads.
        let cancelled = false;
        let echo = null;
        let interval = setInterval(() => {
            fetchContents();
            fetchSettings();
        }, 30000);

        getEcho().then((instance) => {
            if (cancelled || !instance) return;
            echo = instance;
            clearInterval(interval);
            interval = null;
            echo.channel('content-updates')
                .listen('.content.updated', (e) => {
                    setContents(prev => ({
                        ...prev,
                        [e.content.section_key]: e.content
                    }));
                });
        });

        return () => {
            cancelled = true;
            if (interval) clearInterval(interval);
            echo?.leave('content-updates');
        };
    }, [fetchContents, fetchSettings]);

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
        // If data is missing, it's invisible (backend filters out invisible items for public users)
        if (!sectionData) return false;
        
        // Explicitly check for false or 0 to handle various DB representation
        return sectionData.is_visible !== false && sectionData.is_visible !== 0;
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

    // Centralized wedding details (Settings-first, Content Manager fallback).
    const weddingInfo = useMemo(() => getWeddingInfo(settings, contents), [settings, contents]);

    return (
        <ContentContext.Provider value={{
            contents,
            settings,
            weddingInfo,
            loading,
            refreshContent: fetchContents,
            refreshSettings: fetchSettings,
            updateLocalContent,
            getContent,
            isVisible
        }}>
            {children}
        </ContentContext.Provider>
    );
};
