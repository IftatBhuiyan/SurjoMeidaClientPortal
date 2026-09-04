import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title') || 'Private Client Vault';
    const client = searchParams.get('client') || 'Private VIP Client';
    const shootType = searchParams.get('type') || 'Fine Art Photography & Film';
    const photoCount = searchParams.get('count') || '12';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#0c0b0a',
            backgroundImage: 'radial-gradient(circle at top right, rgba(200, 142, 62, 0.15), transparent 60%)',
            padding: '50px 70px',
            border: '8px solid #2d261e',
            boxSizing: 'border-box',
          }}
        >
          {/* Top Brand Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              borderBottom: '1px solid #2d261e',
              paddingBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#c88e3e',
                  boxShadow: '0 0 12px #c88e3e',
                }}
              />
              <span
                style={{
                  fontSize: 18,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: '#c88e3e',
                  fontWeight: 600,
                  fontFamily: 'sans-serif',
                }}
              >
                SURJO MEDIA STUDIO
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                backgroundColor: 'rgba(200, 142, 62, 0.12)',
                border: '1px solid rgba(200, 142, 62, 0.3)',
                color: '#f7f3ec',
                fontSize: 13,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                fontFamily: 'sans-serif',
              }}
            >
              🔒 Private Encrypted Vault
            </div>
          </div>

          {/* Middle Editorial Title Block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '20px 0' }}>
            <div
              style={{
                fontSize: 18,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#a39886',
                fontFamily: 'sans-serif',
              }}
            >
              {client} • {shootType}
            </div>
            <div
              style={{
                fontSize: 52,
                color: '#f7f3ec',
                lineHeight: 1.15,
                fontWeight: 300,
                letterSpacing: '-0.02em',
                fontFamily: 'serif',
                maxWidth: '960px',
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 18,
                color: '#c88e3e',
                fontFamily: 'sans-serif',
                marginTop: '4px',
              }}
            >
              Master Resolution Archive • {photoCount} Curated Proofs
            </div>
          </div>

          {/* Bottom Security / Resolution Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              paddingTop: '20px',
              borderTop: '1px solid #2d261e',
              color: '#70665a',
              fontSize: 14,
              fontFamily: 'sans-serif',
            }}
          >
            <span style={{ color: '#a39886' }}>
              Two-Factor Passkey Protected (PIN & Security Password Required)
            </span>
            <span style={{ color: '#c88e3e' }}>
              Original Lossless Sensor RAW & 4K Masters
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    return new Response(`Failed to generate the image: ${e}`, {
      status: 500,
    });
  }
}
