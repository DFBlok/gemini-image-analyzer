import React, { useRef, useState } from 'react';

const GeminiImageAnalyzer = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResult(null);
    setError(null);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    try {
      // Convert image file to base64
      const toBase64 = (file: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1]; // strip `data:image/...;base64,`
            resolve(base64);
          };
          reader.onerror = reject;
        });

      const base64Image = await toBase64(file);

      const payload = {
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: file.type,
                  data: base64Image,
                },
              },
              {
                text: "What does this image show?",
              },
            ],
          },
        ]
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok) {
        /* setResult(data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini'); */
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        setResult(text);
      } else {
        setError(data.error?.message || 'Gemini API error');
      }
    } catch (err: any) {
      setError("Image analysis failed");
      console.error(err);
    }

    setLoading(false);


  };
    //readaloud function
    const handleReadAloud = () => {
        if (!result) return;

        //stop any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(result);
        utteranceRef.current = utterance;

        utterance.onend = () => {
            setIsSpeaking(false);
            setIsPaused(false);
        }

        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
        setIsPaused(false);
    }

        const handlePause = () => {
            window.speechSynthesis.pause();
            setIsPaused(true);
        }

        const handleResume = () => {
            window.speechSynthesis.resume();
            setIsPaused(false);
        }

        const handleStop = () => {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            setIsPaused(false);
        }
  

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', textAlign: 'center' }}>
      <h1>🧠 Gemini Image Analyzer</h1>
        {/**File upload */}
        <input 
            type='file'
            accept='image/*'
            onChange={handleImageUpload}
            ref={uploadInputRef}
            style={{ display: 'none' }}
        />
        {/**Camera capture */}
        <input 
            type='file'
            accept='image/*'
            capture='environment'
            onChange={handleImageUpload}
            ref={cameraInputRef}
            style={{ display: 'none' }}
        />

        {/**Upload button */}
        <button onClick={() => uploadInputRef.current?.click()} style={{ margin: '0.5rem' }}>
            📁 Upload Image
        </button>
        <button onClick={() => cameraInputRef.current?.click()} style={{ marginRight: '1rem', padding: '0.5rem 1rem' }}>
            📸 Take Photo
        </button>

      {/* <input type="file" accept="image/*" onChange={handleImageUpload} /> */}

      {loading && <p>🔍 Analyzing image with Gemini...</p>}
      {error && <p style={{ color: 'red' }}>❌ {error}</p>}
      {result && (
        
        <div style={{ marginTop: '1rem' }}>
          <h3>Gemini's Response:</h3>
          <p>{result}</p>

          {/**Speech controls */}
          <div style={{marginTop: '1rem'}}>
            {!isSpeaking && (
                <button onClick={handleReadAloud} style={{marginTop: '1rem', padding: '0.5rem 1rem'}}>
                🔊 Read Aloud
                </button>                
            )}
            
            {isSpeaking && !isPaused && (
                <button onClick={handlePause} style={{ marginRight: '0.5rem' }}>
                ⏸️ Pause
              </button>
            )}

            {isSpeaking && isPaused && (
                <button onClick={handleResume} style={{ marginRight: '0.5rem' }}>
                ▶️ Resume
              </button>  
            )}

            {isSpeaking && (
                <button onClick={handleStop} style={{ marginRight: '0.5rem' }}>
                ⏹️ Stop
              </button>

            )}
          </div>

          {/* <pre>{JSON.stringify(result, null, 2)}</pre> */}
        </div>
      )}
    </div>
  );
};

export default GeminiImageAnalyzer;
