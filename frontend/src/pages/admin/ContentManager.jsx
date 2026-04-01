import { useState, useEffect } from 'react';
import { contentService } from '../../services/api';
import { Save, ChevronDown, ChevronRight, Layout, Image as ImageIcon, Globe, Languages, Sparkles, Loader2 } from 'lucide-react';
import ImageUpload from '../../components/admin/ImageUpload';
import AdminPageHero from '../../components/admin/AdminPageHero';

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'zh', label: 'Mandarin (中文)' },
    { code: 'ms', label: 'Malay (BM)' },
    { code: 'luo', label: 'Luo' }
];

const SECTIONS = [
    {
        key: 'home_hero',
        label: 'Home Hero',
        fields: [
            { key: 'subtitle', label: 'Top Label (e.g. We\'re Getting Married)', type: 'text' },
            { key: 'date_text', label: 'Wedding Date (e.g. Saturday, June 15th, 2025)', type: 'text' },
            { key: 'location', label: 'Location Text (e.g. Nairobi)', type: 'text' },
            { key: 'venue', label: 'Venue (e.g. Rosewood Manor)', type: 'text' }
        ]
    },
    {
        key: 'countdown',
        label: 'Countdown Timer',
        fields: [
            { key: 'wedding_date', label: 'Wedding Date & Time (YYYY-MM-DDTHH:MM)', type: 'text' },
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
            { key: 'bride_name', label: 'Bride Name', type: 'text' },
            { key: 'groom_name', label: 'Groom Name', type: 'text' },
            { key: 'quote', label: 'Love Quote', type: 'text' },
            { key: 'date', label: 'Meaningful Date', type: 'text' }
        ]
    },
    {
        key: 'events',
        label: 'Wedding Day Timeline (Home Page)',
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
        label: 'Wedding Programme Page',
        fields: [
            { key: 'title', label: 'Page Title', type: 'text' },
            { key: 'description', label: 'Subtitle/Description', type: 'textarea' },
            { key: 'date', label: 'Wedding Date', type: 'text' },
            { key: 'venue', label: 'Venue', type: 'text' }
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
        key: 'footer',
        label: 'Footer',
        fields: [
            { key: 'couple_names', label: 'Couple Names (e.g. Dinah & Tze Ren)', type: 'text' },
            { key: 'message', label: 'Closing Message', type: 'text' },
            { key: 'contact_email', label: 'Contact Email', type: 'text' },
            { key: 'hashtag', label: 'Wedding Hashtag', type: 'text' },
            { key: 'location', label: 'Copyright Location (e.g. Nairobi)', type: 'text' }
        ]
    }
];

const TIME_OPTIONS = [];
for (let i = 0; i < 24; i++) {
  const hour = i === 0 || i === 12 ? 12 : i % 12;
  const ampm = i < 12 ? 'AM' : 'PM';
  TIME_OPTIONS.push(`${hour}:00 ${ampm}`);
  TIME_OPTIONS.push(`${hour}:30 ${ampm}`);
}

export default function ContentManager() {
  const [contents, setContents] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState('home_hero');
  const [saving, setSaving] = useState(null);
  const [activeLang, setActiveLang] = useState('en');
  const [translating, setTranslating] = useState(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
        const res = await contentService.getAll();
        setContents(res.data || {});
    } catch (err) {
        console.error(err);
    }
    setLoading(false);
  };

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

  const handleTranslate = async (sectionKey, fieldKey) => {
      const sectionContent = contents[sectionKey]?.content || {};
      const sourceText = typeof sectionContent[fieldKey] === 'string' 
          ? sectionContent[fieldKey] 
          : sectionContent[fieldKey]?.['en'];

      if (!sourceText) {
          alert('Please enter English text first.');
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
          alert('Translation failed. Please try again.');
      }
      setTranslating(null);
  };

  const handleSave = async (sectionKey) => {
      setSaving(sectionKey);
      try {
          const sectionData = contents[sectionKey];
          await contentService.update(sectionKey, {
              content: sectionData.content,
              is_visible: sectionData.is_visible ?? true
          });
          setTimeout(() => setSaving(null), 1000);
      } catch (err) {
          alert('Failed to save.');
          setSaving(null);
      }
  };

  if (loading) return <div className="p-8 text-center text-stone-500">Loading content...</div>;

  return (
    <div className="space-y-6">
       <AdminPageHero
            title="Content Management"
            description="Customize text, images, and sections of your website"
            breadcrumb={[
                { label: 'Dashboard', path: '/admin/dashboard' },
                { label: 'Content' },
            ]}
            icon={<Layout className="w-5 h-5 text-[#A67B5B]" />}
            actions={
                <div className="flex bg-white rounded-lg p-1 shadow-sm border border-stone-200">
                    {LANGUAGES.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => setActiveLang(lang.code)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                activeLang === lang.code 
                                    ? 'bg-[#A67B5B] text-white shadow-md' 
                                    : 'text-stone-500 hover:bg-stone-50'
                            }`}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>
            }
       />

       <div className="space-y-4">
           {SECTIONS.map(section => {
               const isExpanded = expandedSection === section.key;
               const sectionData = contents[section.key] || { content: {} };
               const isSaving = saving === section.key;

               return (
                   <div key={section.key} className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
                       <button 
                            onClick={() => setExpandedSection(isExpanded ? null : section.key)}
                            className={`w-full flex items-center justify-between p-4 transition-colors text-left ${isExpanded ? 'bg-stone-50' : 'hover:bg-stone-50'}`}
                       >
                           <span className="font-medium text-stone-700 flex items-center gap-2">
                                {section.label}
                                {sectionData.content && Object.keys(sectionData.content).length > 0 && (
                                    <span className="w-2 h-2 rounded-full bg-green-400" title="Has content"></span>
                                )}
                           </span>
                           {isExpanded ? <ChevronDown className="w-5 h-5 text-stone-400" /> : <ChevronRight className="w-5 h-5 text-stone-400" />}
                       </button>

                        {isExpanded && (
                            <div className="p-6 border-t border-stone-100 space-y-6 animate-in slide-in-from-top-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                        <button 
                                                            onClick={() => handleTranslate(section.key, field.key)}
                                                            disabled={translating?.section === section.key && translating?.field === field.key}
                                                            className="text-xs flex items-center gap-1 text-[#A67B5B] hover:text-[#8B6A4E] disabled:opacity-50"
                                                            title="Auto-translate to all other languages"
                                                        >
                                                            {translating?.section === section.key && translating?.field === field.key ? (
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                            ) : (
                                                                <Sparkles className="w-3 h-3" />
                                                            )}
                                                            Auto-Translate
                                                        </button>
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

                                <div className="flex justify-between items-center pt-4 border-t border-stone-50">
                                     <div className="flex items-center gap-2">
                                         <label className="text-sm text-stone-600 flex items-center gap-2 cursor-pointer select-none">
                                            <input 
                                                type="checkbox" 
                                                checked={sectionData.is_visible ?? true}
                                                onChange={e => {
                                                    const newContents = {
                                                        ...contents,
                                                        [section.key]: { ...sectionData, is_visible: e.target.checked }
                                                    };
                                                    setContents(newContents);
                                                }}
                                                className="rounded text-[#A67B5B] focus:ring-[#A67B5B]"
                                            />
                                            Visible on site
                                         </label>
                                     </div>
                                
                                     <button 
                                        onClick={() => handleSave(section.key)}
                                        disabled={isSaving}
                                        className={`btn-primary flex items-center gap-2 min-w-[120px] justify-center ${isSaving ? 'opacity-80' : ''}`}
                                     >
                                         {isSaving ? (
                                             <>Saving...</>
                                         ) : (
                                             <><Save className="w-4 h-4" /> Save Changes</>
                                         )}
                                     </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
     </div>
   );
}
