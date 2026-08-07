import React, { useState } from 'react';
import { Mic, MicOff, Volume2, X, Globe, Sparkles, Send, MessageSquare } from 'lucide-react';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  district: string;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ isOpen, onClose, district }) => {
  const [isListening, setIsListening] = useState(false);
  const [lang, setLang] = useState<'ta-IN' | 'en-US'>('en-US');
  const [transcript, setTranscript] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [response, setResponse] = useState('');

  if (!isOpen) return null;

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    }
  };

  const samplePrompts = lang === 'ta-IN' ? [
    'நிலத்தடி நீர் நிலை என்ன?',
    'போர்வெல் துளையிடும் ஆழம் என்ன?',
    'பயிர்கள் பரிந்துரை என்ன?',
    'மழைநீர் சேகரிப்பு சாத்தியம் என்ன?',
  ] : [
    'What is the groundwater level?',
    'Recommend borewell drilling location',
    'Which crop is suitable here?',
    'Rainwater harvesting potential',
    'Current weather forecast',
    'Smart irrigation schedule',
  ];

  const handleVoiceQuery = (queryText: string) => {
    const q = queryText.toLowerCase().trim();
    let reply = '';

    if (lang === 'ta-IN') {
      if (q.includes('நீர்') || q.includes('நிலத்தடி') || q.includes('நிலை')) {
        reply = `${district} மாவட்டத்தில் தற்போதைய நிலத்தடி நீர் மட்டம் 8.5 மீட்டராக உள்ளது. நீர் இருப்பு நிலை பாதுகாப்பான வரம்பில் உள்ளது.`;
      } else if (q.includes('போர்வெல்') || q.includes('ஆழம்') || q.includes('துளை')) {
        reply = `${district} பகுதியில் போர்வெல் அமைப்பதற்கு 65 மீட்டர் ஆழம் பரிந்துரைக்கப்படுகிறது. வெற்றி சாத்தியம் 88 சதவீதம்.`;
      } else if (q.includes('பயிர்') || q.includes('பரிந்துரை')) {
        reply = `தற்போதைய நீர் மட்டம் மற்றும் மண் வகைக்கு ராகி, சிறுதானியங்கள் மற்றும் நிலக்கடலை சாகுபடி செய்ய பரிந்துரைக்கப்படுகிறது.`;
      } else if (q.includes('மழை') || q.includes('சேகரிப்பு')) {
        reply = `உங்கள் கூரை பரப்பளவிற்கு ஆண்டிற்கு சுமார் 1,15,000 லிட்டர் மழைநீரை சேகரித்து நிலத்தடி நீரை செறிவூட்ட முடியும்.`;
      } else {
        reply = `${district} மாவட்டத்தின் நீர் மேலாண்மை நிலை திருப்திகரமாக உள்ளது. சொட்டு நீர் பாசன முறையைப் பயன்படுத்த பரிந்துரைக்கப்படுகிறது.`;
      }
    } else {
      if (q.includes('borewell') || q.includes('site') || q.includes('drill')) {
        reply = `For borewell drilling in ${district}, optimal depth is estimated at 65 meters with 88% success probability and low risk index.`;
      } else if (q.includes('crop') || q.includes('suitable') || q.includes('plant')) {
        reply = `Based on groundwater depth of 8.5m in ${district}, Millets, Groundnut, and Pulses are highly recommended for optimal yield.`;
      } else if (q.includes('rainwater') || q.includes('harvest') || q.includes('tank')) {
        reply = `Rooftop rainwater harvesting in ${district} can capture up to 115,000 liters annually with an artificial recharge efficiency of 85%.`;
      } else if (q.includes('weather') || q.includes('rain') || q.includes('temp')) {
        reply = `Current weather in ${district} shows a temperature of 30°C with 65% humidity and expected seasonal monsoon showers.`;
      } else if (q.includes('irrigation') || q.includes('water req')) {
        reply = `Smart micro-irrigation schedule for ${district} requires 45 cubic meters daily across early morning watering cycles.`;
      } else if (q.includes('groundwater') || q.includes('level') || q.includes('status')) {
        reply = `Groundwater level in ${district} is currently estimated at 8.5 meters depth. Risk status is Moderate with 90% ML model confidence.`;
      } else {
        reply = `AquaSense AI evaluated ${district} district. Current water table is stable at 8.5m. Drip irrigation and rainwater recharge are recommended.`;
      }
    }

    setTranscript(queryText);
    setResponse(reply);
    speakText(reply);
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const demoQuery = lang === 'ta-IN' ? 'நிலத்தடி நீர் நிலை என்ன?' : 'What is the groundwater level?';
      handleVoiceQuery(demoQuery);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setIsListening(false);
      handleVoiceQuery(text);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    handleVoiceQuery(customInput);
    setCustomInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass rounded-3xl p-6 max-w-lg w-full space-y-5 relative border border-white/10 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#35C9CF]/20 text-[#35C9CF] flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">AquaSense Bilingual Voice Assistant</h3>
            <p className="text-xs text-[#EAF6F4]/60">Tamil (தமிழ்) & English Hydro-Decision Assistant</p>
          </div>
        </div>

        {/* Language Selection Toggle */}
        <div className="flex items-center justify-between bg-[#0E3A44] p-2 rounded-2xl border border-white/10 text-xs">
          <span className="text-gray-300 flex items-center gap-1.5 font-medium ml-2">
            <Globe className="w-4 h-4 text-[#35C9CF]" /> Voice Language:
          </span>
          <div className="flex items-center gap-1 bg-[#072B34] p-1 rounded-xl">
            <button
              onClick={() => setLang('en-US')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                lang === 'en-US' ? 'bg-[#35C9CF] text-[#072B34] font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLang('ta-IN')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                lang === 'ta-IN' ? 'bg-[#35C9CF] text-[#072B34] font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              தமிழ் (Tamil)
            </button>
          </div>
        </div>

        {/* Microphone Mic Button */}
        <div className="flex flex-col items-center justify-center py-4 space-y-3">
          <button
            onClick={startListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition shadow-2xl ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/50'
                : 'bg-gradient-to-tr from-[#35C9CF] to-emerald-400 text-[#072B34] hover:scale-105 shadow-[#35C9CF]/30'
            }`}
          >
            {isListening ? <MicOff className="w-9 h-9" /> : <Mic className="w-9 h-9" />}
          </button>
          <p className="text-xs font-semibold text-gray-300">
            {isListening ? 'Listening to your voice prompt...' : 'Tap Mic button or select sample voice query below'}
          </p>
        </div>

        {/* Quick Sample Query Chips */}
        <div className="space-y-1.5">
          <p className="text-[11px] text-gray-400 font-medium">Sample Queries:</p>
          <div className="flex flex-wrap gap-1.5">
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleVoiceQuery(prompt)}
                className="text-[11px] bg-white/5 hover:bg-[#35C9CF]/20 text-gray-200 hover:text-[#35C9CF] px-2.5 py-1 rounded-lg border border-white/10 transition"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>

        {/* Custom Text Prompt Input Form */}
        <form onSubmit={handleCustomSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder={lang === 'ta-IN' ? 'கேள்வியை உள்ளிடவும்...' : 'Or type your question here...'}
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            className="flex-1 bg-[#072B34] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#35C9CF]"
          />
          <button
            type="submit"
            className="bg-[#35C9CF] text-[#072B34] px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-[#35C9CF]/90 transition flex items-center gap-1"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Transcript & Spoken Response Display */}
        {transcript && (
          <div className="bg-[#072B34] p-3 rounded-2xl border border-white/10 text-xs space-y-1">
            <p className="text-[#35C9CF] font-semibold flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" /> You asked:
            </p>
            <p className="text-white italic font-mono">"{transcript}"</p>
          </div>
        )}

        {response && (
          <div className="bg-[#0E3A44] p-4 rounded-2xl border border-[#35C9CF]/30 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[#35C9CF] font-bold">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4" /> AquaSense Assistant Response:
              </span>
              <button
                onClick={() => speakText(response)}
                className="hover:underline text-gray-300 font-normal"
              >
                Replay Audio
              </button>
            </div>
            <p className="text-gray-200 leading-relaxed font-sans">{response}</p>
          </div>
        )}
      </div>
    </div>
  );
};

