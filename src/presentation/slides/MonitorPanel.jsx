import MonitorColorStrip from './MonitorColorStrip';

const MODE_LIST = [
  { id: 'bw',        label: 'Black & White' },
  { id: 'c16',       label: '16' },
  { id: 'c256',      label: '256' },
  { id: 'thousands', label: 'Thousands' },
  { id: 'millions',  label: 'Millions' },
];

export default function MonitorPanel({ mode }) {
  return (
    <div className="flex flex-col items-center">
      {/* Retro Mac window */}
      <div style={{
        width: 500,
        border: '2px solid #000',
        background: '#fff',
        fontFamily: '"Geneva", "Lucida Grande", "Helvetica Neue", sans-serif',
        color: '#000',
        fontSize: 12,
      }}>
        {/* Title bar with pinstripes */}
        <div style={{
          borderBottom: '2px solid #000',
          padding: '3px 0',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: 13,
          background: `repeating-linear-gradient(
            to bottom,
            #fff 0px, #fff 1px,
            #000 1px, #000 2px
          )`,
          position: 'relative',
        }}>
          {/* Close box */}
          <div style={{
            position: 'absolute',
            left: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 12,
            height: 12,
            border: '1px solid #000',
            background: '#fff',
          }} />
          <span style={{ background: '#fff', padding: '0 12px', position: 'relative' }}>
            Monitors
          </span>
        </div>

        {/* Content */}
        <div style={{ padding: '12px 16px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span>Settings of selected monitor :</span>
            <span>v7.5.5</span>
          </div>

          {/* Controls row */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 10 }}>
            {/* Radio + list */}
            <div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{
                    display: 'inline-block', width: 12, height: 12,
                    border: '1px solid #000', borderRadius: '50%',
                  }} />
                  Grays :
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{
                    display: 'inline-block', width: 12, height: 12,
                    border: '1px solid #000', borderRadius: '50%',
                    background: 'radial-gradient(circle, #000 4px, transparent 4px)',
                  }} />
                  Colors :
                </span>
              </div>

              {/* Mode list */}
              <div style={{
                border: '1px solid #000',
                display: 'inline-flex',
                flexDirection: 'column',
                minWidth: 140,
              }}>
                {MODE_LIST.map(m => (
                  <div
                    key={m.id}
                    style={{
                      padding: '1px 8px',
                      fontSize: 13,
                      background: m.id === mode ? '#000' : '#fff',
                      color: m.id === mode ? '#fff' : '#000',
                      lineHeight: '18px',
                      cursor: 'default',
                    }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 20 }}>
              <MacButton label="Options..." />
              <MacButton label="Identify" />
            </div>
          </div>

          <div style={{ fontSize: 11, marginBottom: 10, color: '#333' }}>
            Changes take effect when Monitors is closed.
          </div>

          {/* Monitor preview area */}
          <div style={{
            border: '1px solid #000',
            minHeight: 180,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 0,
          }}>
            {/* Monitor icon */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MonitorIcon />
            </div>

            {/* Color strip */}
            <MonitorColorStrip mode={mode} height={32} duration={1500} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MacButton({ label }) {
  return (
    <div style={{
      border: '1px solid #000',
      borderRadius: 4,
      padding: '4px 20px',
      fontSize: 12,
      textAlign: 'center',
      background: '#fff',
      boxShadow: '1px 1px 0 #000',
      cursor: 'default',
    }}>
      {label}
    </div>
  );
}

function MonitorIcon() {
  return (
    <svg width="64" height="56" viewBox="0 0 64 56">
      {/* Monitor body */}
      <rect x="8" y="0" width="48" height="38" rx="2" fill="#fff" stroke="#000" strokeWidth="1.5" />
      {/* Screen */}
      <rect x="12" y="4" width="40" height="28" fill="#e8e8e8" stroke="#000" strokeWidth="1" />
      {/* Screen shine line */}
      <line x1="14" y1="6" x2="36" y2="6" stroke="#ccc" strokeWidth="0.5" />
      {/* Power light */}
      <circle cx="32" cy="35" r="1.5" fill="#000" />
      {/* Stand */}
      <rect x="24" y="38" width="16" height="4" fill="#fff" stroke="#000" strokeWidth="1" />
      {/* Base */}
      <rect x="18" y="42" width="28" height="6" rx="1" fill="#fff" stroke="#000" strokeWidth="1" />
      {/* Number label */}
      <rect x="36" y="42" width="10" height="6" rx="1" fill="#fff" stroke="#000" strokeWidth="1" />
      <text x="41" y="47.5" textAnchor="middle" fontSize="5" fontFamily="Geneva, sans-serif" fill="#000">1</text>
    </svg>
  );
}
