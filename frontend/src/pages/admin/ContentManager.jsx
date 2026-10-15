import { useState, useEffect } from 'react';
import { contentService } from '../../services/api';
import useAdminAction from '../../hooks/useAdminAction';
import useUnsavedChangesGuard from '../../hooks/useUnsavedChangesGuard';
import EditableFieldset from '../../components/admin/EditableFieldset';
import { Save, Eye, EyeOff, Layout, Image as ImageIcon, Sparkles, Edit } from 'lucide-react';
import ImageUpload from '../../components/admin/ImageUpload';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import Button from '../../components/Button';
import { useContent } from '../../context/ContentContext';
import { notifyError } from '../../utils/feedback';

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'zh', label: 'Mandarin (中文)' },
    { code: 'ms', label: 'Malay (BM)' },
    { code: 'luo', label: 'Luo' }
];

const TIME_OPTIONS = [
    '12:00 AM', '12:30 AM', '1:00 AM', '1:30 AM', '2:00 AM', '2:30 AM', '3:00 AM', '3:30 AM', '4:00 AM', '4:30 AM', '5:00 AM', '5:30 AM', '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM'
];

const SECTIONS = [
    {
        key: 'home_hero',
        label: 'Home Hero',
        fields: [
            { key: 'subtitle', label: 'Top Label (e.g. We\'re Getting Married)', type: 'text' },
            { key: 'location', label: 'Location Text (e.g. Nairobi)', type: 'text' }
            // Wedding date and venue are configured centrally on Settings › Wedding Details.
        ]
    },
    {
        key: 'countdown',
        label: 'Countdown Timer',
        fields: [
            // The countdown date comes from Settings › Wedding Details (wedding_date).
            { key: 'title', label: 'Section Title', type: 'text' },
            { key: 'subtitle', label: 'Subtitle', type: 'text' }
        ]
    },
    {
        key: 'our_story',
        label: 'Our Story',
        fields: [
            { key: 'title', label: 'Section Title', type: 'text' },
            { key: 'content', label: 'Story Text (Part 1)', type: 'textarea' },
            { key: 'content_2', label: 'Story Text (Part 2)', type: 'textarea' },
            { key: 'bride_image', label: 'Bride Image', type: 'image' },
            { key: 'groom_image', label: 'Groom Image', type: 'image' },
            { key: 'quote', label: 'Love Quote', type: 'text' }
            // Bride & groom names come from Settings › Wedding Details.
        ]
    },
    {
        key: 'events',
        label: 'Wedding Timeline (Home)',
        fields: [
            { key: 'title', label: 'Main Section Title', type: 'text' },
            { key: 'description', label: 'Intro Text/Subtitle', type: 'textarea' },
            
            // Event 1
            { key: 'h1', label: 'First Event (e.g. Ceremony)', type: 'header' },
            { key: 'event_1_time', label: 'Time Request', type: 'time_range' },
            { key: 'event_1_title', label: 'Event Title', type: 'text' },
            { key: 'event_1_location', label: 'Location', type: 'text' },
            { key: 'event_1_map_link', label: 'Map Link (Google Maps URL)', type: 'text' },
            { key: 'event_1_description', label: 'Description', type: 'textarea' },

            // Event 2
            { key: 'h2', label: 'Second Event (e.g. Cocktail)', type: 'header' },
            { key: 'event_2_time', label: 'Time Request', type: 'time_range' },
            { key: 'event_2_title', label: 'Event Title', type: 'text' },
            { key: 'event_2_location', label: 'Location', type: 'text' },
            { key: 'event_2_map_link', label: 'Map Link (Google Maps URL)', type: 'text' },
            { key: 'event_2_description', label: 'Description', type: 'textarea' },

            // Event 3
            { key: 'h3', label: 'Third Event (e.g. Reception)', type: 'header' },
            { key: 'event_3_time', label: 'Time Request', type: 'time_range' },
            { key: 'event_3_title', label: 'Event Title', type: 'text' },
            { key: 'event_3_location', label: 'Location', type: 'text' },
            { key: 'event_3_map_link', label: 'Map Link (Google Maps URL)', type: 'text' },
            { key: 'event_3_description', label: 'Description', type: 'textarea' }
        ]
    },
    {
        key: 'gallery',
        label: 'Gallery',
        fields: [
            { key: 'title', label: 'Section Title', type: 'text' }
        ]
    },
    {
        key: 'rsvp',
        label: 'RSVP',
        fields: [
            { key: 'title', label: 'Section Title (CTA)', type: 'text' },
            { key: 'deadline_text', label: 'Deadline Text', type: 'text' },
            { key: 'description', label: 'Instructions', type: 'textarea' },
            { key: 'background_image', label: 'Background Image', type: 'image' }
        ]
    },
    {
        key: 'gifts',
        label: 'Gift Registry',
        fields: [
            { key: 'title', label: 'Section Title', type: 'text' },
            { key: 'description', label: 'Message', type: 'textarea' }
        ]
    },
    {
        key: 'programme_page',
        label: 'Events Page (Full)',
        fields: [
            { key: 'title', label: 'Page Title', type: 'text' },
            { key: 'description', label: 'Subtitle/Description', type: 'textarea' }
            // Wedding date and venue are configured centrally on Settings › Wedding Details.
        ]
    },
    {
        key: 'songs_page',
        label: 'Song Requests Page',
        fields: [
            { key: 'title', label: 'Page Title', type: 'text' },
            { key: 'description', label: 'Subtitle/Description', type: 'textarea' }
        ]
    },
    {
        key: 'guestbook_page',
        label: 'Guestbook Page',
        fields: [
            { key: 'title', label: 'Page Title', type: 'text' },
            { key: 'description', label: 'Subtitle/Description', type: 'textarea' }
        ]
    },
    {
        key: 'faqs',
        label: 'FAQ Page',
        fields: [
            { key: 'title', label: 'Page Title', type: 'text' },
            { key: 'description', label: 'Subtitle/Description', type: 'textarea' }
        ]
    },
    {
        key: 'contact',
        label: 'Contact Page',
        fields: [
            { key: 'title', label: 'Page Title', type: 'text' },
            { key: 'description', label: 'Subtitle/Description', type: 'textarea' }
        ]
    },
    {
        key: 'footer',
        label: 'Footer',
        fields: [
            // Couple names come from Settings › Wedding Details.
            { key: 'message', label: 'Closing Message', type: 'text' },
            { key: 'contact_email', label: 'Contact Email', type: 'text' },
            { key: 'hashtag', label: 'Wedding Hashtag', type: 'text' }
        ]
    }
];

const PAGES = [
    { id: 'home', label: 'Home Page', sections: ['home_hero', 'countdown', 'our_story', 'events', 'gallery', 'rsvp', 'gifts', 'footer'] },
    { id: 'programme', label: 'Events Page', sections: ['programme_page'] },
    { id: 'songs', label: 'Song Requests', sections: ['songs_page'] },
    { id: 'guestbook', label: 'Guestbook', sections: ['guestbook_page'] },
    { id: 'faqs', label: 'FAQs', sections: ['faqs'] },
    { id: 'contact', label: 'Contact', sections: ['contact'] }
];

export default function ContentManager() {
  const { contents: globalContents, loading, updateLocalContent } = useContent();
  const [contents, setContents] = useState({});
  // One section at a time; the side panel lists every section, grouped by page.
  const [activeKey, setActiveKey] = useState('home_hero');
  const [activeLang, setActiveLang] = useState('en');
  const [translating, setTranslating] = useState(null);

  useEffect(() => {
    if (globalContents && Object.keys(globalContents).length > 0) {
        setContents(globalContents);
    }
  }, [globalContents]);

  const handleUpdate = async (sectionKey, field, value) => {
      const currentSection = contents[sectionKey] || { content: {} };
      const currentContent = currentSection.content || {};
      
      let newContentValue;

      // Check if field is multi-lingual
      const fieldConfig = SECTIONS.find(s => s.key === sectionKey)?.fields.find(f => f.key === field);
      const isMultiLang = fieldConfig?.type === 'text' || fieldConfig?.type === 'textarea';

      if (isMultiLang) {
          const existingValue = typeof currentContent[field] === 'string' 
              ? { en: currentContent[field] } 
              : (currentContent[field] || {});

          newContentValue = {
              ...existingValue,
              [activeLang]: value
          };
      } else {
          newContentValue = value;
      }

      const newContents = {
          ...contents,
          [sectionKey]: {
              ...currentSection,
              content: {
                  ...currentContent,
                  [field]: newContentValue
              }
          }
      };
      setContents(newContents);
  };

  const saveVisibility = useAdminAction(
      (sectionKey, content, visible) => contentService.update(sectionKey, { content, is_visible: visible }),
      {
          success: (_, sectionKey, __, visible) => `${sectionKey.replace('_', ' ')} is now ${visible ? 'enabled' : 'disabled'}`,
          error: 'Failed to update visibility',
          // Revert on failure
          onError: (_, sectionKey, __, visible) => updateLocalContent(sectionKey, { is_visible: !visible }),
      },
  );

  const handleToggleVisibility = (sectionKey) => {
      const currentSection = contents[sectionKey] || { content: {}, is_visible: true };
      const newVisibility = currentSection.is_visible === false; // Toggle it
      
      // Update context state immediately
      updateLocalContent(sectionKey, { is_visible: newVisibility });
      
      // Also update local draft state
      setContents(prev => ({
          ...prev,
          [sectionKey]: {
              ...(prev[sectionKey] || { content: {} }),
              is_visible: newVisibility
          }
      }));
      
      // Auto-save visibility change
      saveVisibility.run(sectionKey, currentSection.content, newVisibility);
  };

  const handleTranslate = async (sectionKey, fieldKey) => {
      const sectionContent = contents[sectionKey]?.content || {};
      const sourceText = typeof sectionContent[fieldKey] === 'string' 
          ? sectionContent[fieldKey] 
          : sectionContent[fieldKey]?.['en'];

      if (!sourceText) {
          notifyError('Please enter English text first.');
          return;
      }

      setTranslating({ section: sectionKey, field: fieldKey });
      
      try {
          const updates = {};
          const targets = LANGUAGES.filter(l => l.code !== 'en');
          
          await Promise.all(targets.map(async (lang) => {
              const res = await contentService.translate(sourceText, lang.code);
              updates[lang.code] = res.data.translation;
          }));

          const currentFieldData = typeof sectionContent[fieldKey] === 'object' ? sectionContent[fieldKey] : { en: sourceText };
          
          const newContents = {
              ...contents,
              [sectionKey]: {
                  ...contents[sectionKey],
                  content: {
                      ...sectionContent,
                      [fieldKey]: {
                          ...currentFieldData,
                          ...updates
                      }
                  }
              }
          };
          setContents(newContents);
      } catch (err) {
          console.error(err);
          notifyError('Translation failed. Please try again.');
      }
      setTranslating(null);
  };

  const saveSection = useAdminAction((sectionKey) => {
      const sectionData = contents[sectionKey];
      return contentService.update(sectionKey, {
          content: sectionData.content,
          is_visible: sectionData.is_visible ?? true,
      });
  }, {
      success: (_, sectionKey) => `${SECTIONS.find(s => s.key === sectionKey)?.label || 'Section'} saved`,
      error: 'Failed to save.',
      // The site's copy now matches the draft (clears the unsaved dot).
      onSuccess: (_, sectionKey) => updateLocalContent(sectionKey, { content: contents[sectionKey]?.content }),
  });
  const handleSave = saveSection.run;

  // Unsaved edits: the draft differs from what the site currently has.
  const isDirty = (key) => JSON.stringify(contents[key]?.content ?? {}) !== JSON.stringify(globalContents?.[key]?.content ?? {});
  useUnsavedChangesGuard(SECTIONS.some((section) => isDirty(section.key)));

  if (loading) return <div className="p-8 text-center text-stone-500">Loading content...</div>;

  const section = SECTIONS.find(s => s.key === activeKey) || SECTIONS[0];
  const page = PAGES.find(p => p.sections.includes(section.key));
  const sectionData = contents[section.key] || { content: {} };
  const sectionVisible = sectionData.is_visible !== false;
  const panelItems = PAGES.flatMap(p => p.sections.map(key => {
      const def = SECTIONS.find(s => s.key === key);
      const hidden = contents[key]?.is_visible === false;
      return def && {
          id: key,
          label: def.label,
          group: p.label,
          muted: hidden,
          description: hidden ? 'Hidden on the site' : undefined,
          dot: isDirty(key),
      };
  })).filter(Boolean);

  return (
    <>
    <AdminPageLayout
      actions={[
        {
          id: 'save-section',
          label: saveSection.isPending(section.key) ? 'Saving...' : 'Save',
          icon: Save,
          variant: 'secondary',
          onClick: () => handleSave(section.key),
          disabled: !isDirty(section.key) || saveSection.isPending(section.key),
        },
        {
          id: 'toggle-visibility',
          label: sectionVisible ? 'Hide on site' : 'Show on site',
          icon: sectionVisible ? EyeOff : Eye,
          onClick: () => handleToggleVisibility(section.key),
          disabled: saveVisibility.isPending(section.key),
        },
      ]}
      panel={{
        id: 'cms',
        title: 'Page Sections',
        icon: Layout,
        subtitle: 'Pick a section to edit. Dots mark unsaved edits.',
        items: panelItems,
        activeId: section.key,
        onChange: setActiveKey,
      }}
      hero={
        <AdminPageHero
          title="CMS - Content Management"
          description={`Editing: ${page?.label} › ${section.label}`}
          breadcrumb="CMS"
          icon={<Edit className="w-5 h-5 text-[#A67B5B]" />}
        />
      }
      filters={{
        groups: [{
          id: 'language',
          label: 'Language',
          options: LANGUAGES.map(lang => ({ id: lang.code, label: lang.label })),
          value: activeLang,
          onChange: setActiveLang,
        }],
      }}
    >
       <div className="bg-white rounded-xl shadow-sm border border-stone-100">
           <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2">
               <h2 className="font-medium text-stone-800">{section.label}</h2>
               {!sectionVisible && (
                   <span className="px-2 py-0.5 rounded-full bg-stone-100 text-[11px] font-medium text-stone-500">Hidden on the site</span>
               )}
               {isDirty(section.key) && <span className="ml-auto text-xs text-amber-700">Unsaved changes</span>}
           </div>
           <div className="p-5">
                                <EditableFieldset>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {section.fields.map(field => {
                                        if (field.type === 'header') {
                                            return (
                                                <div key={field.key} className="col-span-1 md:col-span-2 pt-4 pb-2 border-b border-stone-100 mb-2">
                                                    <h3 className="font-medium text-[#A67B5B] flex items-center gap-2">
                                                        <Sparkles className="w-4 h-4" />
                                                        {field.label}
                                                    </h3>
                                                </div>
                                            );
                                        }

                                        const isMultiLang = field.type === 'text' || field.type === 'textarea';
                                        
                                        const getValue = () => {
                                            const val = sectionData.content?.[field.key];
                                            if (field.type === 'image' || field.type === 'time_range') return val;
                                            if (typeof val === 'string') return activeLang === 'en' ? val : '';
                                            return val?.[activeLang] || '';
                                        };
                                        const value = getValue();

                                        if (field.type === 'time_range') {
                                            const parts = (typeof value === 'string' ? value : '').split(' - ');
                                            const start = parts[0] || '';
                                            const end = parts[1] || '';

                                            return (
                                                <div key={field.key} className="col-span-1 md:col-span-2">
                                                    <label className="block text-sm font-medium text-stone-700 mb-1">
                                                        {field.label}
                                                    </label>
                                                    <div className="flex items-center gap-4">
                                                        <select 
                                                            value={start}
                                                            onChange={(e) => {
                                                                const newStart = e.target.value;
                                                                const newValue = end ? `${newStart} - ${end}` : newStart;
                                                                handleUpdate(section.key, field.key, newValue);
                                                            }}
                                                            className="flex-1 p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-[#A67B5B]/20 outline-none"
                                                        >
                                                            <option value="">Start Time (e.g. 2:00 PM)</option>
                                                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                        <span className="text-stone-400">to</span>
                                                        <select 
                                                            value={end}
                                                            onChange={(e) => {
                                                                const newEnd = e.target.value;
                                                                const newValue = start ? `${start} - ${newEnd}` : newEnd;
                                                                handleUpdate(section.key, field.key, newValue);
                                                            }}
                                                            className="flex-1 p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-[#A67B5B]/20 outline-none"
                                                        >
                                                            <option value="">End Time (Optional)</option>
                                                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={field.key} className={field.type === 'textarea' || field.type === 'image' ? 'col-span-1 md:col-span-2' : 'col-span-1'}>
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <label className="text-sm font-medium text-stone-600 flex items-center gap-2">
                                                        {field.label}
                                                        {field.type === 'image' && <ImageIcon className="w-3 h-3 text-stone-400" />}
                                                        {isMultiLang && (
                                                            <span className="text-xs font-normal text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                                                                {LANGUAGES.find(l => l.code === activeLang)?.label}
                                                            </span>
                                                        )}
                                                    </label>
                                                    
                                                    {isMultiLang && activeLang === 'en' && (
                                                        <Button edit
                                                            size="sm"
                                                            icon={Sparkles}
                                                            onClick={() => handleTranslate(section.key, field.key)}
                                                            loading={translating?.section === section.key && translating?.field === field.key}
                                                            title="Auto-translate to all other languages"
                                                        >
                                                            Auto-Translate
                                                        </Button>
                                                    )}
                                                </div>
                                                
                                                {field.type === 'textarea' ? (
                                                    <textarea 
                                                        className="w-full p-3 border border-stone-200 rounded-lg text-sm min-h-[120px] focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B] outline-none transition-all"
                                                        value={getValue()}
                                                        onChange={e => handleUpdate(section.key, field.key, e.target.value)}
                                                        placeholder={`Enter ${field.label.toLowerCase()} in ${LANGUAGES.find(l => l.code === activeLang)?.label}...`}
                                                    />
                                                ) : field.type === 'image' ? (
                                                    <ImageUpload 
                                                        currentImage={sectionData.content?.[field.key]}
                                                        onUpload={(url) => handleUpdate(section.key, field.key, url)}
                                                    />
                                                ) : (
                                                    <input 
                                                        type="text"
                                                        className="w-full p-3 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B] outline-none transition-all"
                                                        value={getValue()}
                                                        onChange={e => handleUpdate(section.key, field.key, e.target.value)}
                                                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                </EditableFieldset>

           </div>
       </div>

    </AdminPageLayout>
    </>
  );
}
