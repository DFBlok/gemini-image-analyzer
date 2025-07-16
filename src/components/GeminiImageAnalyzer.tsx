import React, { useRef, useState } from 'react';

const GeminiImageAnalyzer = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [modelContent, setModalContent] = useState<string | null>(null); 

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // peview image
  const [image, setImage] = useState<File | null>(null);


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(file); /// <--- store the image file
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

        const toggelMenu = () => setMenuOpen(!menuOpen);

        const openModal = (type:string) =>{
          const contentMap: {[key: string]: string} ={
            how: "📸 Upload or take a photo → 🔍 Gemini analyzes it → 🔊 Read or listen to the result.",
            feedback: "💬 We'd love your feedback! Send it to: duwayneblok01@gmail.com",
            new : "🆕 What's New:\n- Added speech controls\n- Improved image analysis speed\n- Image Preview",
            about: "ℹ️ Gemini Image Analyzer v1.0\nBuilt with React + Google Gemini API"
          };
          setModalContent(contentMap[type]);
          setMenuOpen(false);
        };

        const closeModel = () => setModalContent(null);


  

  return (
    <div style={{ maxWidth: '90%', margin: '2rem auto', textAlign: 'center', padding: '1rem', width: '600px' }}>
      {/**Top Bar */}
      <div className='header'>
        <h1>Gemini Image Analyzer</h1>
        <button onClick={toggelMenu} style={{ fontSize: '1.5rem', background: 'none', border: 'none' }}>
          ☰
        </button>
      </div>

      {/**Menu */}
      {menuOpen && (
        <div style={{ position: 'absolute', top: 60, right: 20, background: '#fff', border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', width: 'calc(100vw - 40px)', maxWidth: '300px', zIndex: 10, }}>
          <button onClick={() => openModal('how')} style={{ display: 'block', marginBottom: '0.5rem' }}>ℹ️ How it works</button>
          <button onClick={() => openModal('feedback')} style={{ display: 'block', marginBottom: '0.5rem' }}>📝 Feedback</button>
          <button onClick={() => openModal('new')} style={{ display: 'block', marginBottom: '0.5rem' }}>🆕 What's new</button>
          <button onClick={() => openModal('about')} style={{ display: 'block' }}>ℹ️ About</button>
        </div>
      )}    

      {/**Modal */}
      {modelContent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '8px', maxWidth: '500px', width: '100%' }}>
            <h2>Information</h2>
            <p>{modelContent}</p>
            <button onClick={closeModel} style={{ marginTop: '1rem' }}>Close</button>
          </div>
        </div>
      )}

      {/**Title */}
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', marginBottom: '1rem'}}>
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
      </div>


        {/**Upload button */}
        <button onClick={() => uploadInputRef.current?.click()} style={{ margin: '0.5rem' }}>
            📁 Upload Image
        </button>
        <button onClick={() => cameraInputRef.current?.click()} style={{ marginRight: '1rem', padding: '0.5rem 1rem' }}>
            📸 Take Photo
        </button>

      {/* PREVIEW SECTION*/}
      {image && (
        <div style={{ marginTop: '1rem' }}>
        <h4>Preview</h4>
          <img
            src={URL.createObjectURL(image)}
            alt="Uploaded"
            style={{ maxWidth: '100%', borderRadius: '8px' }}
        />
      </div>
)}
      

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
