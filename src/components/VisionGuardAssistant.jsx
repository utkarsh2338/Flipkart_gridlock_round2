import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, X, Bot, Loader2 } from 'lucide-react';

// ─── MV Act reference table ───
const LAW_DB = {
  helmet:        { section: 'Sec 129', act: 'MV Act', fine: '₹500',         keywords: ['helmet', 'headgear', 'no helmet'] },
  seatbelt:      { section: 'Sec 194B', act: 'MV Act', fine: '₹1,000',      keywords: ['seatbelt', 'seat belt', 'belt'] },
  triple_riding: { section: 'Sec 128', act: 'MV Act', fine: '₹1,000',       keywords: ['triple', 'riding', 'pillion', 'overloading'] },
  red_light:     { section: 'Sec 119', act: 'MV Act', fine: '₹1,000',       keywords: ['red light', 'signal', 'red-light'] },
  wrong_side:    { section: 'Sec 119', act: 'MV Act', fine: '₹500–₹1,000',  keywords: ['wrong side', 'wrong-side', 'wrong way', 'opposite'] },
  stop_line:     { section: 'Sec 119', act: 'MV Act', fine: '₹500',         keywords: ['stop line', 'stop-line', 'zebra'] },
  illegal_parking:{ section: 'Sec 122', act: 'MV Act', fine: '₹500',        keywords: ['parking', 'parked', 'no-parking'] },
  speeding:      { section: 'Sec 112', act: 'MV Act', fine: '₹1,000–₹2,000',keywords: ['speed', 'speeding', 'overspeeding'] },
};

// ─── Aggregation helpers ───
const countBy = (arr, fn) => {
  const m = {};
  arr.forEach(v => { const k = fn(v) || 'Unknown'; m[k] = (m[k] || 0) + 1; });
  return m;
};
const sorted = obj => Object.entries(obj).sort((a, b) => b[1] - a[1]);
const top = obj => { let b = ['N/A', 0]; Object.entries(obj).forEach(([k, v]) => { if (v > b[1]) b = [k, v]; }); return b; };
const pct = (n, total) => total > 0 ? ((n / total) * 100).toFixed(1) : '0';

// ─── NLU: extract violation topic from user text ───
function extractTopic(q) {
  const lower = q.toLowerCase();
  for (const [key, law] of Object.entries(LAW_DB)) {
    if (law.keywords.some(kw => lower.includes(kw))) return key;
  }
  return null;
}

// ─── NLU: detect user intent ───
function detectIntent(q) {
  const lower = q.toLowerCase();
  // Order matters — more specific patterns first
  if (/which\s+(zone|camera|area|location|place)|where\s+(is|are|do|should)|hotspot|patrol|deploy|most.*at/i.test(lower)) return 'zone';
  if (/how\s+many|total|count|number\s+of|quantity/i.test(lower)) return 'count';
  if (/most\s+(common|frequent)|ranking|rank|top\s+\d|highest|distribution|breakdown|percentage/i.test(lower)) return 'ranking';
  if (/cite|law|legal|section|act\b|penalty|penal|punish|rule\s+for|what\s+(is|are)\s+the\s+(fine|rule|law|penalty)/i.test(lower)) return 'law';
  if (/summar|report|shift|overview|brief|status|dashboard/i.test(lower)) return 'summary';
  if (/fine\b|amount|cost|fee|charg|how\s+much/i.test(lower)) return 'fine';
  if (/vehicle|car|truck|bike|auto|two.?wheeler|bus|suv|motorcycle/i.test(lower)) return 'vehicle';
  if (/sever|critical|danger|risk|urgent|priority|high\s+risk/i.test(lower)) return 'severity';
  if (/plate|registration|license|vehicle\s+number|ka\s?\d|repeat|offender/i.test(lower)) return 'plate';
  if (/camera|cam-?\d|cam\b/i.test(lower)) return 'camera';
  if (/time|hour|when|today|yesterday|week|morning|evening|night|afternoon|peak/i.test(lower)) return 'time';
  if (/paid|pending|challan|dismissed|unpaid|status/i.test(lower)) return 'status';
  if (/compare|vs|versus|difference|between/i.test(lower)) return 'compare';
  if (/hello|hi\b|hey|help|what can you/i.test(lower)) return 'greet';
  if (/thank/i.test(lower)) return 'thanks';
  return 'general';
}

// ─── Build the conversational response ───
function buildResponse(query, data) {
  const intent = detectIntent(query);
  const topic = extractTopic(query);
  const totalCount = data.length;

  // Helpers scoped to this call
  const topicName = topic
    ? (topic.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
    : null;
  const topicFilter = (list) => {
    if (!topic) return list;
    return list.filter(v => {
      const name = (v.type?.name || v.type?.id || '').toLowerCase();
      const id = (v.type?.id || '').toLowerCase();
      return name.includes(topic.replace(/_/g, ' ')) || name.includes(topic) || id === topic;
    });
  };
  const filtered = topicFilter(data);
  const fc = filtered.length;

  if (totalCount === 0) {
    return "I don't have any violation data to work with yet. Head over to the Dashboard and upload an image or enable the Live Demo — once violations are detected, they'll appear in the Archive and I can help you analyze them.";
  }

  switch (intent) {

    case 'greet':
      return `Hey there, Officer! 👋 I'm VisionGuard AI — your traffic data analyst. I currently have access to **${totalCount}** violation records from the archive. Feel free to ask me anything — zone hotspots, violation breakdowns, MV Act references, shift reports, or even look up a specific license plate.`;

    case 'thanks':
      return "You're welcome! Let me know if there's anything else you'd like to explore in the data. Stay safe out there! 🚔";

    case 'zone': {
      const dataset = topic ? filtered : data;
      const label = topic ? `${topicName} violations` : 'all violations';
      if (dataset.length === 0) return `I couldn't find any ${label} in the archive to analyze by zone.`;
      const cams = countBy(dataset, v => v.cameraId);
      const ranked = sorted(cams).slice(0, 5);
      const [topCam, topCount] = ranked[0];
      let r = `Looking at ${label} across the archive (${dataset.length} records)...\n\n`;
      r += `🔴 **${topCam}** is the biggest hotspot with **${topCount}** incidents (${pct(topCount, dataset.length)}% of ${label}).\n\n`;
      if (ranked.length > 1) {
        r += `Here's the full camera ranking:\n`;
        ranked.forEach(([cam, c], i) => { r += `${i + 1}. ${cam} — ${c} cases\n`; });
        r += '\n';
      }
      r += `I'd recommend prioritizing patrol deployment around ${topCam.split(' ').slice(1).join(' ') || topCam}.`;
      return r;
    }

    case 'count': {
      if (topic) {
        return `There are **${fc}** ${topicName} violation${fc !== 1 ? 's' : ''} in the archive out of **${totalCount}** total records — that's about **${pct(fc, totalCount)}%** of all violations.`;
      }
      const types = countBy(data, v => v.type?.name);
      const rows = sorted(types).map(([t, c]) => `• ${t}: **${c}** (${pct(c, totalCount)}%)`).join('\n');
      return `Here's the complete count from the archive (**${totalCount}** records):\n\n${rows}`;
    }

    case 'ranking': {
      const types = countBy(data, v => v.type?.name);
      const ranked = sorted(types);
      const [topType, topC] = ranked[0] || ['N/A', 0];
      let r = `Here's the violation ranking from the archive (${totalCount} total records):\n\n`;
      ranked.forEach(([t, c], i) => { r += `${i + 1}. **${t}** — ${c} cases (${pct(c, totalCount)}%)\n`; });
      r += `\n**${topType}** leads with ${topC} detections. `;
      if (ranked.length >= 2) {
        r += `It's ${ranked[0][1] - ranked[1][1]} cases ahead of ${ranked[1][0]}.`;
      }
      return r;
    }

    case 'law': {
      if (topic && LAW_DB[topic]) {
        const law = LAW_DB[topic];
        return `Sure, here's the legal reference for ${topicName}:\n\n⚖️ **${law.section}** of the ${law.act}\n💰 Fine: **${law.fine}**\n\nIn the current archive, there are **${fc}** such violations recorded.`;
      }
      let r = `Here's the MV Act fine schedule for all violations VisionGuard monitors:\n\n`;
      r += `| Violation | Section | Fine |\n|---|---|---|\n`;
      Object.values(LAW_DB).forEach(law => {
        const name = law.keywords[0].replace(/\b\w/g, c => c.toUpperCase());
        r += `| ${name} | ${law.section} | ${law.fine} |\n`;
      });
      return r;
    }

    case 'summary': {
      const types = countBy(data, v => v.type?.name);
      const vehicles = countBy(data, v => v.vehicleType);
      const cams = countBy(data, v => v.cameraId);
      const statuses = countBy(data, v => v.status);
      const sevs = countBy(data, v => v.severity);
      const [topViol] = top(types);
      const [topVeh] = top(vehicles);
      const [topCam] = top(cams);

      let r = `📊 **VisionGuard Archive Summary**\n\n`;
      r += `• **Total Records:** ${totalCount}\n`;
      r += `• **Top Violation:** ${topViol} (${types[topViol]} cases)\n`;
      r += `• **Top Vehicle Type:** ${topVeh} (${vehicles[topVeh]} cases)\n`;
      r += `• **Busiest Camera:** ${topCam} (${cams[topCam]} detections)\n`;
      if (sevs.high) r += `• **High Severity:** ${sevs.high} cases\n`;
      r += `\n**Status Breakdown:**\n`;
      Object.entries(statuses).forEach(([s, c]) => { r += `• ${s}: ${c}\n`; });
      r += `\nPending cases should be prioritized for e-Challan issuance.`;
      return r;
    }

    case 'fine': {
      if (topic && LAW_DB[topic]) {
        const law = LAW_DB[topic];
        return `The fine for ${topicName} is **${law.fine}** under **${law.section}** of the ${law.act}. There are ${fc} such violations in the archive right now.`;
      }
      let r = `Here are the current fine amounts:\n\n`;
      Object.values(LAW_DB).forEach(law => {
        const name = law.keywords[0].replace(/\b\w/g, c => c.toUpperCase());
        r += `• ${name} (${law.section}): **${law.fine}**\n`;
      });
      return r;
    }

    case 'vehicle': {
      const vehicles = countBy(data, v => v.vehicleType);
      const ranked = sorted(vehicles);
      let r = `Vehicle breakdown across **${totalCount}** archive records:\n\n`;
      ranked.forEach(([vt, c]) => { r += `• **${vt}:** ${c} violation${c !== 1 ? 's' : ''} (${pct(c, totalCount)}%)\n`; });
      return r;
    }

    case 'severity': {
      const sevs = countBy(data, v => v.severity || 'unknown');
      const ranked = sorted(sevs);
      const highCount = (sevs.high || 0) + (sevs.critical || 0);
      let r = `Severity distribution from ${totalCount} archive records:\n\n`;
      ranked.forEach(([s, c]) => { r += `• **${s.charAt(0).toUpperCase() + s.slice(1)}:** ${c} cases (${pct(c, totalCount)}%)\n`; });
      if (highCount > 0) {
        r += `\n🚨 **${highCount}** high/critical cases — these should be actioned first.`;
      }
      return r;
    }

    case 'plate': {
      const q = query.toLowerCase();
      // Try to extract a plate pattern
      const plateMatch = q.match(/[a-z]{2}\s?\d{1,2}\s?[a-z]{1,3}\s?\d{1,4}/i);
      if (plateMatch) {
        const search = plateMatch[0].replace(/\s/g, '').toUpperCase();
        const matches = data.filter(v => (v.licensePlate || '').replace(/\s/g, '').toUpperCase().includes(search));
        if (matches.length > 0) {
          let r = `Found **${matches.length}** record${matches.length !== 1 ? 's' : ''} matching plate "**${search}**":\n\n`;
          matches.slice(0, 6).forEach((v, i) => {
            const time = v.timestamp ? new Date(v.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A';
            r += `${i + 1}. **${v.type?.name || 'Unknown'}** at ${v.cameraId || 'N/A'} — ${time} [${v.status || 'Pending'}]\n`;
          });
          return r;
        }
        return `No violations found for plate "${search}" in the archive.`;
      }
      // Show repeat offenders
      const plates = countBy(data, v => v.licensePlate);
      const repeats = sorted(plates).filter(([_, c]) => c > 1);
      if (repeats.length > 0) {
        let r = `🔁 **Repeat Offenders** in the archive:\n\n`;
        repeats.slice(0, 8).forEach(([plate, c]) => { r += `• **${plate}** — ${c} violations\n`; });
        r += `\nThese vehicles should be flagged for enhanced monitoring.`;
        return r;
      }
      return `No repeat offenders detected in the current archive — all ${totalCount} violations are from unique plates.`;
    }

    case 'camera': {
      const cams = countBy(data, v => v.cameraId);
      const ranked = sorted(cams);
      let r = `Camera activity across **${totalCount}** archive records:\n\n`;
      ranked.forEach(([cam, c], i) => { r += `${i + 1}. **${cam}** — ${c} detections\n`; });
      return r;
    }

    case 'time': {
      const hours = countBy(data, v => {
        const h = v.timestamp ? new Date(v.timestamp).getHours() : -1;
        if (h < 0) return 'Unknown';
        if (h < 6) return '🌙 Night (12am–6am)';
        if (h < 12) return '🌅 Morning (6am–12pm)';
        if (h < 18) return '☀️ Afternoon (12pm–6pm)';
        return '🌆 Evening (6pm–12am)';
      });
      const ranked = sorted(hours);
      const [peakTime, peakCount] = ranked[0] || ['N/A', 0];
      let r = `Time-of-day analysis from the archive:\n\n`;
      ranked.forEach(([t, c]) => { r += `• ${t}: **${c}** violations\n`; });
      r += `\n📌 Peak violation period: **${peakTime}** with ${peakCount} incidents.`;
      return r;
    }

    case 'status': {
      const statuses = countBy(data, v => v.status || 'Unknown');
      const ranked = sorted(statuses);
      const pending = statuses['Pending'] || 0;
      let r = `Challan status breakdown for ${totalCount} archive records:\n\n`;
      ranked.forEach(([s, c]) => { r += `• **${s}:** ${c} (${pct(c, totalCount)}%)\n`; });
      if (pending > 0) {
        r += `\n⚠️ **${pending}** violations are still pending — these need challans to be issued.`;
      }
      return r;
    }

    case 'compare': {
      const types = countBy(data, v => v.type?.name);
      const ranked = sorted(types);
      if (ranked.length < 2) return `There isn't enough variety in the data to make a comparison. Only "${ranked[0]?.[0] || 'N/A'}" has been detected.`;
      let r = `Comparison of all violation types (${totalCount} records):\n\n`;
      r += `| Violation | Count | Share |\n|---|---|---|\n`;
      ranked.forEach(([t, c]) => { r += `| ${t} | ${c} | ${pct(c, totalCount)}% |\n`; });
      r += `\n**${ranked[0][0]}** is ${ranked[0][1] - ranked[ranked.length - 1][1]} cases ahead of **${ranked[ranked.length - 1][0]}** (the least common).`;
      return r;
    }

    default: {
      // Topic mentioned but no specific intent
      if (topic && fc > 0) {
        const cams = countBy(filtered, v => v.cameraId);
        const [topCam, topCount] = top(cams);
        const statuses = countBy(filtered, v => v.status);
        const law = LAW_DB[topic];
        let r = `Here's what I see for **${topicName}** violations in the archive:\n\n`;
        r += `• **${fc}** cases out of ${totalCount} total (${pct(fc, totalCount)}%)\n`;
        r += `• Hotspot: ${topCam} (${topCount} incidents)\n`;
        if (law) r += `• Law: ${law.section}, fine ${law.fine}\n`;
        if (statuses.Pending) r += `• ${statuses.Pending} still pending challan\n`;
        r += `\nAsk me something specific like "Which zone has the most ${topicName} violations?" or "How many ${topicName} violations are pending?"`;
        return r;
      }
      if (topic && fc === 0) {
        return `I don't see any ${topicName} violations in the archive data. The ${totalCount} records contain other violation types — ask me "What's the most common violation?" to see what's there.`;
      }

      // Truly generic — give a smart overview
      const types = countBy(data, v => v.type?.name);
      const topTypes = sorted(types).slice(0, 3);
      let r = `I have **${totalCount}** violation records from the archive. Here's a quick snapshot:\n\n`;
      r += `Top violations: ${topTypes.map(([t, c]) => `${t} (${c})`).join(', ')}\n\n`;
      r += `Some things you can ask me:\n`;
      r += `• "Which zone has the most helmet violations?"\n`;
      r += `• "How many red light violations are there?"\n`;
      r += `• "Show me repeat offenders"\n`;
      r += `• "Give me a shift summary"\n`;
      r += `• "What are the peak violation hours?"\n`;
      r += `• "Cite the law for triple riding"`;
      return r;
    }
  }
}


export default function VisionGuardAssistant({ violations, archiveData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello, Officer. I\'m VisionGuard AI — your traffic enforcement assistant. I have access to all your archived violation records. Ask me anything — zone hotspots, violation patterns, law citations, or shift summaries.'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Merge archive + live violations, deduplicate by id
  const allData = useMemo(() => {
    const map = new Map();
    (archiveData || []).forEach(v => map.set(v.id, v));
    (violations || []).forEach(v => map.set(v.id, v));
    return Array.from(map.values());
  }, [archiveData, violations]);

  // Quick action chips
  const quickActions = [
    'Which violation is most common?',
    'Which zone needs patrol now?',
    'Cite the law for helmet violation',
    'Generate shift summary'
  ];

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    if (!textToSend || !textToSend.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend
    };

    setMessages(prev => [...prev, userMessage]);
    setInputVal('');
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VISIONGUARD_API_KEY;
      if (!apiKey) throw new Error('no-key');

      // Build Gemini request with archive data summary
      const dataSummary = (() => {
        if (allData.length === 0) return 'No violation data available.';
        const types = countBy(allData, v => v.type?.name);
        const cams = countBy(allData, v => v.cameraId);
        const vehicles = countBy(allData, v => v.vehicleType);
        const statuses = countBy(allData, v => v.status);
        return `Total: ${allData.length} violations. Types: ${JSON.stringify(types)}. Cameras: ${JSON.stringify(cams)}. Vehicles: ${JSON.stringify(vehicles)}. Statuses: ${JSON.stringify(statuses)}. Sample records: ${JSON.stringify(allData.slice(0, 5).map(v => ({type: v.type?.name, plate: v.licensePlate, camera: v.cameraId, severity: v.severity, status: v.status, time: v.timestamp})))}`;
      })();

      const systemPrompt = `You are VisionGuard AI, an expert traffic enforcement assistant for Bengaluru Traffic Police. You have access to the following violation archive data:\n${dataSummary}\n\nHelp officers understand violation patterns, cite relevant Motor Vehicles Act sections (Sec 129 for helmet ₹500, Sec 119 for red light ₹1000, Sec 128 for triple riding ₹1000, Sec 112 for speeding, Sec 194B for seatbelt ₹1000, Sec 122 for parking), suggest patrol deployment, and answer questions about traffic enforcement. Be concise, professional, and data-driven.`;

      const contents = [
        ...messages
          .filter(m => m.id !== 'welcome')
          .map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          })),
        { role: 'user', parts: [{ text: textToSend }] }
      ];

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: { parts: [{ text: systemPrompt }] }
          })
        }
      );

      if (!response.ok) throw new Error(`API ${response.status}`);

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!aiText) throw new Error('empty-response');

      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: aiText
      }]);
    } catch (err) {
      // Gemini unavailable — use local NLU engine with archive data
      console.warn('Using local assistant engine:', err.message);

      // Small delay for natural feel
      await new Promise(r => setTimeout(r, 600 + Math.random() * 400));

      const responseText = buildResponse(textToSend, allData);

      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: responseText
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="assistant-widget assistant-premium" style={{ zIndex: 1000 }}>
      {/* Floating Chat Panel */}
      <div className={`assistant-panel glass-card-premium ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="assistant-header">
          <div className="flex items-center gap-2">
            <span className="assistant-avatar">🤖</span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white tracking-wide">VisionGuard Assistant</span>
              <span className="text-[9px] text-success-green font-mono flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-success-green animate-pulse" />
                {allData.length} records loaded
              </span>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="assistant-close-btn"
            aria-label="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages list */}
        <div className="assistant-messages-container">
          {messages.map(msg => (
            <div 
              key={msg.id} 
              className={`assistant-msg-row ${msg.sender === 'user' ? 'user-row' : 'assistant-row'}`}
            >
              {msg.sender === 'assistant' && msg.id !== 'welcome' && (
                <span className="assistant-bubble-avatar">🤖</span>
              )}
              <div className={`assistant-msg-bubble ${msg.sender === 'user' ? 'user-bubble' : 'assistant-bubble'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="assistant-msg-row assistant-row">
              <span className="assistant-bubble-avatar">🤖</span>
              <div className="assistant-msg-bubble assistant-bubble typing">
                <Loader2 className="w-3.5 h-3.5 text-cyan-accent animate-spin" />
                <span>Analyzing data...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick actions & input footer */}
        <div className="assistant-footer">
          {/* Quick action chips */}
          <div className="assistant-chips-container scroll-hidden">
            {quickActions.map(action => (
              <button
                key={action}
                onClick={() => handleSend(action)}
                disabled={isLoading}
                className="assistant-chip-btn"
              >
                {action}
              </button>
            ))}
          </div>

          {/* Form Input */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputVal);
            }}
            className="assistant-input-form"
          >
            <input
              type="text"
              placeholder="Ask about traffic violations..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              disabled={isLoading}
              className="assistant-text-input"
            />
            <button 
              type="submit" 
              disabled={!inputVal.trim() || isLoading}
              className="assistant-send-btn"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Floating Action Button (FAB) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`assistant-fab ${isOpen ? 'active' : ''}`}
        aria-label="Open VisionGuard AI Assistant"
        id="visionguard-assistant-fab"
      >
        <span className="fab-icon">🤖</span>
      </button>
    </div>
  );
}
