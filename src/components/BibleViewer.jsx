import React, { useState, useEffect } from 'react';
import { Maximize2, Volume2, ChevronRight, Settings2 } from 'lucide-react';

export default function BibleViewer() {
  const [bibleData, setBibleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userSettings, setUserSettings] = useState({
    versions: ['ESV', 'KJV', 'RVR', 'Notes'],
    currentBook: 'Genesis',
    currentChapter: 1,
    currentVerse: 1,
    endVerse: 1,
    notes: {},
    fontSize: 'medium',
    backgroundColor: 'gray',
    speechRate: 0.9
  });
  const [currentNotes, setCurrentNotes] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [fullscreenWindow, setFullscreenWindow] = useState(null);

  //added to fix bugs loading site from github pages 12/26/25
const BASE_URL = import.meta.env.BASE_URL || '/';


  // Font size options
  const fontSizes = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl'
  };

  // Background color options
  const bgColors = {
    gray: 'bg-gray-50',
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    amber: 'bg-amber-50',
    white: 'bg-white'
  };

  useEffect(() => {
    loadBibleData();
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('bibleViewerSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setUserSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const persistSettings = (settings) => {
    try {
      localStorage.setItem('bibleViewerSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const loadBibleData = async () => {
    const fileNames = {
      "ESV": { file: "ESV.json", name: "English Standard Version" },
      "GNT": { file: "GNT.json", name: "Greek New Testament" },
      "KJV": { file: "KJV.json", name: "King James Version" },
      "RVR": { file: "RVR.json", name: "Reina Valera 1909" }
    };
    
    const result = {};
    
    try {
      await Promise.all(Object.entries(fileNames).map(async ([key, fileInfo]) => {
        try {
          const response = await fetch(`${BASE_URL}${fileInfo.file}`);
          if (!response.ok) throw new Error(`Failed to fetch ${fileInfo.file}`);
          const data = await response.json();
          
          let books;
          if (data.Genesis || data.Matthew || data.Exodus) {
            books = data;
          } else {
            const rootKey = Object.keys(data)[0];
            const rootData = data[rootKey] || data;
            books = rootData.books || rootData;
          }
          
          result[key] = {
            name: data.name || (data[Object.keys(data)[0]]?.name) || fileInfo.name,
            books,
            _loadError: null
          };
        } catch (error) {
          console.error(`Error loading ${fileInfo.file}:`, error);
          result[key] = { name: fileInfo.name, books: {}, _loadError: error.message };
        }
      }));
      
      setBibleData(result);
    } catch (error) {
      console.error('Failed to load Bible data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVerseText = (versionData, book, chapter, verseNum) => {
    const chapterData = versionData?.books?.[book]?.[chapter] || versionData?.books?.[book]?.[String(chapter)];
    if (!chapterData) return null;
    return chapterData[String(verseNum)] || chapterData[verseNum] || null;
  };

  const getVerseCount = (versionData, book, chapter) => {
    const chapterData = versionData?.books?.[book]?.[chapter] || versionData?.books?.[book]?.[String(chapter)];
    if (!chapterData) return 0;
    
    if (Array.isArray(chapterData)) {
      return chapterData.length;
    } else if (typeof chapterData === 'object') {
      const verseKeys = Object.keys(chapterData).filter(k => !isNaN(k));
      return verseKeys.length > 0 ? Math.max(...verseKeys.map(Number)) : 0;
    }
    return 0;
  };

  const getChapterCount = (versionData, book) => {
    const bookData = versionData?.books?.[book];
    if (!bookData) return 0;
    
    if (Array.isArray(bookData)) {
      return bookData.length;
    } else if (typeof bookData === 'object') {
      const chapterKeys = Object.keys(bookData).filter(k => !isNaN(k));
      return chapterKeys.length > 0 ? Math.max(...chapterKeys.map(Number)) : 0;
    }
    return 0;
  };

  const getNotesKey = () => {
    return `${userSettings.currentBook}_${userSettings.currentChapter}_${userSettings.currentVerse}`;
  };

  useEffect(() => {
    const key = `${userSettings.currentBook}_${userSettings.currentChapter}_${userSettings.currentVerse}`;
    setCurrentNotes(userSettings.notes?.[key] || '');
  }, [userSettings.currentBook, userSettings.currentChapter, userSettings.currentVerse, userSettings.notes]);

  const saveNotes = (text) => {
    const key = getNotesKey();
    const newSettings = {
      ...userSettings,
      notes: { ...userSettings.notes, [key]: text }
    };
    setUserSettings(newSettings);
    persistSettings(newSettings);
  };

  const handleNavigationChange = (field, value) => {
    // Handle numeric inputs - ensure they're valid numbers >= 1
    if (field === 'currentVerse' || field === 'endVerse' || field === 'currentChapter') {
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue < 1) {
        // If invalid, keep current value (don't update)
        return;
      }
      value = numValue;
    }
    
    let newSettings = { ...userSettings, [field]: value };
    
    // Auto-adjust end verse if it's less than begin verse
    if (field === 'currentVerse' && value > userSettings.endVerse) {
      newSettings.endVerse = value;
    }
    
    // Validate end verse against chapter max
    if (field === 'endVerse' || field === 'currentVerse' || field === 'currentChapter' || field === 'currentBook') {
      const firstVersionKey = Object.keys(bibleData).find(k => bibleData[k]?.books);
      if (firstVersionKey) {
        const versionData = bibleData[firstVersionKey];
        const maxVerses = getVerseCount(versionData, newSettings.currentBook, newSettings.currentChapter);
        
        // If end verse is too high, set it to max
        if (newSettings.endVerse > maxVerses && maxVerses > 0) {
          newSettings.endVerse = maxVerses;
        }
        
        // If begin verse is too high, set both to max
        if (newSettings.currentVerse > maxVerses && maxVerses > 0) {
          newSettings.currentVerse = maxVerses;
          newSettings.endVerse = maxVerses;
        }
      }
    }
    
    setUserSettings(newSettings);
    persistSettings(newSettings);
  };

  // Next verse button handler
  const handleNextVerse = () => {
    const firstVersionKey = Object.keys(bibleData).find(k => bibleData[k]?.books);
    if (!firstVersionKey) return;
    
    const versionData = bibleData[firstVersionKey];
    const maxVerses = getVerseCount(versionData, userSettings.currentBook, userSettings.currentChapter);
    const maxChapters = getChapterCount(versionData, userSettings.currentBook);
    
    let newVerse = userSettings.endVerse + 1;
    let newChapter = userSettings.currentChapter;
    
    // If we're at the last verse of the chapter
    if (newVerse > maxVerses) {
      // Move to next chapter
      if (newChapter < maxChapters) {
        newChapter += 1;
        newVerse = 1;
      } else {
        // At last chapter, can't advance further
        return;
      }
    }
    
    const newSettings = {
      ...userSettings,
      currentVerse: newVerse,
      endVerse: newVerse,
      currentChapter: newChapter
    };
    
    setUserSettings(newSettings);
    persistSettings(newSettings);
  };

  // Check if next verse button should be disabled
  const isNextVerseDisabled = () => {
    const firstVersionKey = Object.keys(bibleData).find(k => bibleData[k]?.books);
    if (!firstVersionKey) return true;
    
    const versionData = bibleData[firstVersionKey];
    const maxVerses = getVerseCount(versionData, userSettings.currentBook, userSettings.currentChapter);
    const maxChapters = getChapterCount(versionData, userSettings.currentBook);
    
    return userSettings.endVerse >= maxVerses && userSettings.currentChapter >= maxChapters;
  };

// Try to find a reasonable voice, but never block speech if none found
const getVoiceForLang = (langCode) => {
  if (!('speechSynthesis' in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. Exact language match (e.g. en-GB, es-ES, el-GR)
  let voice = voices.find(v => v.lang === langCode);
  if (voice) return voice;

  // 2. Same language family (e.g. en-*, es-*, el-*)
  const base = langCode.split('-')[0];
  voice = voices.find(v => v.lang && v.lang.startsWith(base));
  return voice || null; // fall back to browser default if null
};

const speakText = (text, lang = 'en') => {
  if (!('speechSynthesis' in window)) {
    alert('Text-to-speech is not supported in your browser.');
    return;
  }

  // Decide language code
  let langCode = 'en-GB';
  if (lang === 'es') langCode = 'es-ES';
  if (lang === 'el') langCode = 'el-GR';

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Create utterance
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;

  // Optional: try to pick a voice for this language
  const voice = getVoiceForLang(langCode);
  if (voice) {
    utterance.voice = voice;
  }

  utterance.rate = userSettings.speechRate;
  window.speechSynthesis.speak(utterance);
};



// ---- logging voices (outside speakText) ----
const logAvailableVoices = () => {
  const synth = window.speechSynthesis;
  const voices = synth.getVoices();
  console.log('Available voices:', voices);
  voices.forEach((v, i) => {
    console.log(`${i}: name="${v.name}", lang="${v.lang}", default=${v.default}`);
  });
};

// Call once on startup (or when user opens the speech settings)
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  if (window.speechSynthesis.getVoices().length > 0) {
    logAvailableVoices();
  } else {
    window.speechSynthesis.onvoiceschanged = logAvailableVoices;
  }
}


  const exportNotes = () => {
    try {
      const dataStr = JSON.stringify(userSettings.notes, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bible-notes-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert('Notes exported successfully!');
    } catch (error) {
      console.error('Error exporting notes:', error);
      alert('Failed to export notes.');
    }
  };

  const importNotes = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedNotes = JSON.parse(e.target.result);
        if (typeof importedNotes === 'object' && importedNotes !== null) {
          const newSettings = {
            ...userSettings,
            notes: { ...userSettings.notes, ...importedNotes }
          };
          setUserSettings(newSettings);
          persistSettings(newSettings);
          alert(`Notes imported successfully! ${Object.keys(importedNotes).length} note(s) imported.`);
        } else {
          alert('Invalid notes file format.');
        }
      } catch (error) {
        console.error('Error importing notes:', error);
        alert('Failed to import notes.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const saveSettings = (newVersions) => {
    const newSettings = { ...userSettings, versions: newVersions };
    setUserSettings(newSettings);
    persistSettings(newSettings);
    setShowSettings(false);
  };

  const toggleFullscreen = (windowIndex) => {
    if (fullscreenWindow === windowIndex) {
      setFullscreenWindow(null);
    } else {
      setFullscreenWindow(windowIndex);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg font-semibold">Loading Bible data...</div>
      </div>
    );
  }

  if (!bibleData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-600">Failed to load Bible data</div>
      </div>
    );
  }

  const bookNames = bibleData.ESV?.books ? Object.keys(bibleData.ESV.books) : [];
  const visibleWindows = userSettings.versions.filter((v, i) => v !== 'none' && (fullscreenWindow === null || fullscreenWindow === i)).length;

  return (
    <div className={`p-8 min-h-screen ${bgColors[userSettings.backgroundColor]}`}>
      <header className={`bg-white rounded-2xl shadow-lg p-6 mb-8 ${fullscreenWindow !== null ? 'hidden' : ''}`}>
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <h1 className="text-3xl font-bold text-gray-800">Bible Viewer</h1>
          
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex flex-col items-center">
              <label className="text-sm font-semibold text-gray-700 mb-1">BOOK</label>
              <select
                value={userSettings.currentBook}
                onChange={(e) => handleNavigationChange('currentBook', e.target.value)}
                className="bg-gray-100 rounded-lg p-2.5 h-[42px]"
              >
                {bookNames.map(book => (
                  <option key={book} value={book}>{book}</option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col items-center">
              <label className="text-sm font-semibold text-gray-700 mb-1">CHAPTER</label>
              <input
                type="number"
                min="1"
                value={userSettings.currentChapter || 1}
                onChange={(e) => handleNavigationChange('currentChapter', e.target.value)}
                className="w-24 bg-gray-100 rounded-lg p-2.5 text-center h-[42px]"
              />
            </div>
            
            <div className="flex flex-col items-center">
              <label className="text-sm font-semibold text-gray-700 mb-1">START VERSE</label>
              <input
                type="number"
                min="1"
                value={userSettings.currentVerse || 1}
                onChange={(e) => handleNavigationChange('currentVerse', e.target.value)}
                className="w-24 bg-gray-100 rounded-lg p-2.5 text-center h-[42px]"
              />
            </div>
            
            <div className="flex flex-col items-center">
              <label className="text-sm font-semibold text-gray-700 mb-1">END VERSE</label>
              <input
                type="number"
                min="1"
                value={userSettings.endVerse || 1}
                onChange={(e) => handleNavigationChange('endVerse', e.target.value)}
                className="w-24 bg-gray-100 rounded-lg p-2.5 text-center h-[42px]"
              />
            </div>
            
            <button
              onClick={handleNextVerse}
              disabled={isNextVerseDisabled()}
              className="bg-indigo-500 text-white rounded-lg px-4 py-2.5 font-semibold hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed mt-6 flex items-center gap-2"
              title="Next verse"
            >
              <ChevronRight size={20} />
              Next
            </button>
            
            <button
              onClick={() => setShowSettings(true)}
              className="bg-blue-500 text-white rounded-lg px-6 py-2.5 font-semibold hover:bg-blue-600 mt-6 flex items-center gap-2"
            >
              <Settings2 size={18} />
              Settings
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={exportNotes}
              className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-green-700"
            >
              Export Notes
            </button>
            <label className="bg-purple-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-purple-700 cursor-pointer">
              Import Notes
              <input
                type="file"
                accept=".json"
                onChange={importNotes}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </header>

      <main className={`grid gap-8 ${
        fullscreenWindow !== null ? 'h-[calc(100vh-2rem)]' : 'h-[calc(100vh-12rem)]'
      } ${
        fullscreenWindow !== null ? 'grid-cols-1' :
        visibleWindows === 1 ? 'grid-cols-1' :
        visibleWindows === 2 ? 'grid-cols-1 md:grid-cols-2' :
        visibleWindows === 3 ? 'grid-cols-1 md:grid-cols-2' :
        'grid-cols-1 md:grid-cols-2'
      }`}>
        {userSettings.versions.map((versionKey, i) => {
          if (versionKey === 'none') return null;
          if (fullscreenWindow !== null && fullscreenWindow !== i) return null;

          const isNotes = i === 3 || versionKey === 'Notes';
          const versionData = bibleData[versionKey];
          
          // Determine language for text-to-speech
          let lang = 'en';
          if (versionKey === 'RVR') lang = 'es';
          if (versionKey === 'GNT') lang = 'el';

          // Build verse text
          let verseText = '';
          if (!isNotes) {
            for (let v = userSettings.currentVerse; v <= userSettings.endVerse; v++) {
              const vt = getVerseText(versionData, userSettings.currentBook, userSettings.currentChapter, v);
              if (vt) {
                verseText += `${v}. ${vt}\n\n`;
              }
            }
          }

          return (
            <div
              key={i}
              className={`verse-window bg-white rounded-xl shadow-lg overflow-hidden flex flex-col ${
                visibleWindows === 3 && i === 2 ? 'md:col-span-2' : ''
              }`}
            >
              <div className={`p-4 ${isNotes ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'} font-semibold flex justify-between items-center`}>
                <div>
                  {isNotes ? (
                    <span>Notes - {userSettings.currentBook} {userSettings.currentChapter}:{userSettings.currentVerse}</span>
                  ) : (
                    <span>{versionData?.name} - {userSettings.currentBook} {userSettings.currentChapter}:{userSettings.currentVerse}{userSettings.currentVerse !== userSettings.endVerse ? `-${userSettings.endVerse}` : ''}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!isNotes && (
                    <button
                      onClick={() => speakText(verseText, lang)}
                      className="hover:bg-white hover:bg-opacity-20 p-2 rounded"
                      title="Read aloud"
                    >
                      <Volume2 size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => toggleFullscreen(i)}
                    className="hover:bg-white hover:bg-opacity-20 p-2 rounded"
                    title="Toggle fullscreen"
                  >
                    <Maximize2 size={18} />
                  </button>
                </div>
              </div>
              
              <div className={`flex-1 overflow-y-auto p-6 ${fontSizes[userSettings.fontSize]}`}>
                {isNotes ? (
                  <textarea
                    value={currentNotes}
                    onChange={(e) => {
                      setCurrentNotes(e.target.value);
                      saveNotes(e.target.value);
                    }}
                    className="w-full h-full border-none resize-none focus:outline-none"
                    placeholder="Type your notes here... (Notes are saved locally)"
                  />
                ) : (
                  <div className="whitespace-pre-line leading-relaxed select-text">
                    {verseText || "Verse not found in this version"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </main>

      {showSettings && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-8 w-11/12 md:w-1/2 lg:w-1/3 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-6">Settings</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Window Versions</h3>
                <div className="space-y-3">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i}>
                      <label className="block mb-1 font-medium">
                        Window {i + 1}:
                        <select
                          value={userSettings.versions[i]}
                          onChange={(e) => {
                            const newVersions = [...userSettings.versions];
                            newVersions[i] = e.target.value;
                            setUserSettings({ ...userSettings, versions: newVersions });
                          }}
                          className="ml-2 bg-gray-100 rounded p-2"
                        >
                          <option value="none">None</option>
                          {i === 3 && <option value="Notes">Notes</option>}
                          {i !== 3 && Object.keys(bibleData).map(key => (
                            <option key={key} value={key}>{bibleData[key].name}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Font Size</h3>
                <select
                  value={userSettings.fontSize}
                  onChange={(e) => {
                    const newSettings = { ...userSettings, fontSize: e.target.value };
                    setUserSettings(newSettings);
                    persistSettings(newSettings);
                  }}
                  className="w-full bg-gray-100 rounded p-2"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="xlarge">Extra Large</option>
                </select>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Background Color</h3>
                <div className="grid grid-cols-5 gap-2">
                  {Object.keys(bgColors).map(color => (
                    <button
                      key={color}
                      onClick={() => {
                        const newSettings = { ...userSettings, backgroundColor: color };
                        setUserSettings(newSettings);
                        persistSettings(newSettings);
                      }}
                      className={`h-12 rounded-lg border-2 ${bgColors[color]} ${
                        userSettings.backgroundColor === color ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300'
                      }`}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Speech Speed</h3>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={userSettings.speechRate}
                    onChange={(e) => {
                      const newSettings = { ...userSettings, speechRate: parseFloat(e.target.value) };
                      setUserSettings(newSettings);
                      persistSettings(newSettings);
                    }}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-12">{userSettings.speechRate.toFixed(1)}x</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Adjust how fast verses are read aloud (0.5 = slow, 1.5 = fast)</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="bg-gray-300 px-6 py-2.5 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => saveSettings(userSettings.versions)}
                className="bg-green-500 text-white px-6 py-2.5 rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="text-center text-gray-600 text-sm mt-8 pb-4 space-y-1">
        <p className="font-semibold">📝 Notes are stored locally in your browser. Please export regularly for backup.</p>
        <p>For personal study purposes only. Not affiliated with any religious organization.</p>
        <p className="text-gray-500 text-xs mt-2">Bible Viewer © 2025</p>
      </footer>
    </div>
  );
}
