import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// We fetch a google font so the text renders correctly without falling back to blank boxes.
async function getFont() {
  const res = await fetch('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&display=swap');
  const css = await res.text();
  const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/);
  if (resource) {
    const fontRes = await fetch(resource[1]);
    if (fontRes.ok) {
      return fontRes.arrayBuffer();
    }
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Fallback text if none provided
    const text = searchParams.get('text') || '食物アレルギーについて教えてくれませんか？';
    
    // Try to get font
    const fontData = await getFont();

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F8F6F2',
            padding: '60px',
            fontFamily: '"Noto Sans JP"',
          }}
        >
          {/* Decorative Background Mesh / Waves */}
          <div
            style={{
              position: 'absolute',
              top: '-10%',
              left: '-10%',
              width: '500px',
              height: '500px',
              backgroundColor: '#1A8F6E',
              opacity: 0.1,
              borderRadius: '50%',
              filter: 'blur(100px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-20%',
              right: '-10%',
              width: '600px',
              height: '600px',
              backgroundColor: '#E87461',
              opacity: 0.1,
              borderRadius: '50%',
              filter: 'blur(100px)',
            }}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: 'white',
              borderRadius: '40px',
              padding: '60px',
              boxShadow: '0 20px 40px rgba(28, 25, 23, 0.05)',
              width: '100%',
              maxWidth: '1000px',
              position: 'relative',
              border: '2px solid #E7E5E0',
            }}
          >
            {/* Cute Badge */}
            <div
              style={{
                position: 'absolute',
                top: '-30px',
                backgroundColor: '#E87461',
                color: 'white',
                padding: '12px 32px',
                borderRadius: '9999px',
                fontSize: '32px',
                fontWeight: 'bold',
                boxShadow: '0 8px 16px rgba(232, 116, 97, 0.2)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              教えて！みんなのヒント
            </div>

            {/* Text Content */}
            <div
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#1C1917',
                marginTop: '40px',
                marginBottom: '50px',
                textAlign: 'center',
                lineHeight: 1.5,
                maxHeight: '220px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
              }}
            >
              「{text}」
            </div>

            {/* Platform Branding */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#F5F3EF',
                padding: '20px 40px',
                borderRadius: '24px',
                width: '100%',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#1A8F6E',
                  borderRadius: '16px',
                  marginRight: '24px',
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.2 13L1 11L5 7M21.8 13L23 11L19 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 21.5C12 21.5 5 18 5 11C5 7.13401 8.13401 4 12 4C15.866 4 19 7.13401 19 11C19 18 12 21.5 12 21.5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1C1917' }}>あんしんキッズ</span>
                <span style={{ fontSize: '18px', color: '#908A82', marginTop: '4px' }}>アレルギーを持つ親の実体験コミュニティ</span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: fontData ? [
          {
            name: 'Noto Sans JP',
            data: fontData,
            style: 'normal',
            weight: 700,
          },
        ] : undefined,
      }
    );
  } catch (e: any) {
    console.error(`OG image generation failed: ${e.message}`);
    return new Response('Failed to generate image', { status: 500 });
  }
}
