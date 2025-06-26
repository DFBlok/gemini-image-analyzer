import React, { useState } from 'react';

/* type ResultType = any | { error: string } | null; */

const ImageAnalyzer = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (e:React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResult(null);
    setError(null);
   

    const apiKey = import.meta.env.VITE_VOICE_ACCESS_KEY;

   try{
    const response = await fetch(
      'https://api-inference.huggingface.co/models/google/vit-base-patch16-224',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: file,
      }
    );

    const text = await response.text();

    try{
      const data = JSON.parse(text);
      setResult(data);
    }catch (err) {
      setError('Failed to parse response' );
      console.error('Parsing error: ',text );
    }
  } catch (err: any) {
    setError('Request Failed');
    console.error(err );
  }
  setLoading(false);
  };

 /*   }
      const response = await fetch(
      'https://api-inference.huggingface.co/models/google/vit-base-patch16-224',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: file,
      }
    );

    const text = await response.text();


    /* const data = await response.json();
    setResult(data);
    setLoading(false); */




    return (
    <div style={{ maxWidth: 600, margin: '2rem auto', textAlign: 'center' }}>
      <h1>🖼️ Image Caption Generator</h1>
      <input type="file" accept="image/*" onChange={handleImageUpload} />

      {loading && <p>🔍 Analyzing image...</p>}
      {error && <p style={{ color: 'red' }}>❌ {error}</p>}
      {result && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Caption:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}; 

export default ImageAnalyzer;
