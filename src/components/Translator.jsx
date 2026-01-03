import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, ArrowLeftRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function Translator() {
  const location = useLocation();
  const incomingText = location.state?.text || '';
  const incomingSourceLangKey = location.state?.sourceLang || 'es'; // 'es' or 'en'

  const initialDirection = incomingSourceLangKey === 'en' ? 'en-es' : 'es-en';
  const [direction, setDirection] = useState(initialDirection);

  const [sourceText, setSourceText] = useState(
    incomingText || '' // no hard-coded default sentence
  );
  const [translations, setTranslations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const translateText = async () => {
    setLoading(true);
    setError(null);
    setTranslations(null);

    const isSpanishToEnglish = direction === 'es-en';
    const sourceLangCode = isSpanishToEnglish ? 'es' : 'en';
    const targetLangCode = isSpanishToEnglish ? 'en' : 'es';

    try {
      const words = sourceText.trim().split(/\s+/);
      const translatedWords = [];

      for (const word of words) {
        try {
          const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLangCode}&tl=${targetLangCode}&dt=t&q=${encodeURIComponent(
            word
          )}`;

          const response = await fetch(url);
          const data = await response.json();

          const translation = data[0][0][0];

          translatedWords.push({
            word,
            primary: translation,
            alternates: []
          });
        } catch (err) {
          console.error(`Error translating "${word}":`, err);
          translatedWords.push({
            word,
            primary: word,
            alternates: []
          });
        }
      }

      setTranslations(translatedWords);
    } catch (err) {
      setError(
        'Failed to translate. Please try again. Error: ' + err.message
      );
      console.error('Translation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const switchDirection = () => {
    setDirection(prev => (prev === 'es-en' ? 'en-es' : 'es-en'));
    setTranslations(null);
    setError(null);
    // Do NOT change sourceText here
  };

  const isSpanishToEnglish = direction === 'es-en';
  const sourceLang = isSpanishToEnglish ? 'Spanish' : 'English';
  const targetLang = isSpanishToEnglish ? 'English' : 'Spanish';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">
          Bidirectional Bible Verse Translator
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Translate word-by-word between Spanish and English
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* LEFT COLUMN: input */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-700">
                {sourceLang} Verse
              </h2>
              <button
                onClick={switchDirection}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Switch translation direction"
              >
                <ArrowLeftRight size={16} />
                Switch
              </button>
            </div>

            <textarea
              value={sourceText}
              onChange={e => setSourceText(e.target.value)}
              className="w-full h-40 p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none text-lg"
              placeholder={`Enter ${sourceLang} Bible verse here...`}
            />

            <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
              <span>{sourceText.trim().length} characters</span>
              <button
                type="button"
                onClick={() => {
                  setSourceText('');
                  setTranslations(null);
                  setError(null);
                }}
                className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
              >
                Clear
              </button>
            </div>

            <button
              onClick={translateText}
              disabled={loading || !sourceText.trim()}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Translating...
                </>
              ) : (
                `Translate to ${targetLang}`
              )}
            </button>
          </div>

          {/* RIGHT COLUMN: results */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Word-by-Word {targetLang}
            </h2>

            <div className="h-40 overflow-y-auto border-2 border-gray-200 rounded-lg p-4">
              {!translations && !loading && !error && (
                <p className="text-gray-400 italic">
                  Click "Translate" to see word-by-word translations
                </p>
              )}

              {error && <p className="text-red-600">{error}</p>}

              {translations && (
                <div className="space-y-3">
                  {translations.map((item, index) => (
                    <div
                      key={index}
                      className="border-b border-gray-100 pb-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <span className="font-semibold text-gray-700">
                            {item.word}
                          </span>
                          <span className="mx-2 text-gray-400">→</span>
                          <span className="text-blue-600">
                            {item.primary}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-3">
            💡 How This Works
          </h3>
          <div className="space-y-2 text-gray-600">
            <p>
              <strong>Bidirectional Translation:</strong> Switch between
              Spanish→English and English→Spanish with one click
            </p>
            <p>
              <strong>Free Translation:</strong> Uses Google Translate&apos;s free
              API - no cost, no API key needed
            </p>
            <p>
              <strong>Word-by-Word:</strong> Each word is translated individually
              to help with language learning
            </p>
            <p>
              <strong>Real-time Processing:</strong> Translations are generated
              on-demand for any text you enter
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

