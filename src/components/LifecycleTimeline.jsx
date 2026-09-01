const STAGES = ['survey', 'design', 'deployment', 'commissioning', 'operating'];
const LABELS = {
  survey: 'Survey',
  design: 'Design',
  deployment: 'Deployment',
  commissioning: 'Commissioning',
  operating: 'Operating',
};

function buildNodes(stage, dates = {}) {
  const curIdx = STAGES.indexOf(stage);
  return STAGES.map((s, i) => {
    const state = i < curIdx ? 'past' : i === curIdx ? 'current' : 'upcoming';
    let circleBg = '#FFFFFF', circleFg = '#78908A', circleBorder = '#D7E4E1', labelColor = '#78908A', mark = i + 1;
    if (state === 'past') { circleBg = '#1F6E72'; circleFg = '#FFFFFF'; circleBorder = '#1F6E72'; labelColor = '#12201F'; mark = '✓'; }
    if (state === 'current') { circleBg = '#E4F0EF'; circleFg = '#12484B'; circleBorder = '#1F6E72'; labelColor = '#12201F'; }
    return {
      label: LABELS[s], mark, circleBg, circleFg, circleBorder, labelColor,
      date: dates[s] || (state === 'upcoming' ? '—' : ''),
      hasLine: i < STAGES.length - 1,
      lineColor: i < curIdx ? '#1F6E72' : '#D7E4E1',
    };
  });
}

export default function LifecycleTimeline({ stage = 'operating', variant = 'full', dates }) {
  const nodes = buildNodes(stage, dates);

  if (variant === 'compact') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
        {nodes.map((node, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div
              title={node.label}
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                flex: 'none',
                background: node.circleBg,
                border: `2px solid ${node.circleBorder}`,
              }}
            />
            {node.hasLine && (
              <div style={{ flex: 1, height: 2, background: node.lineColor, minWidth: 6 }} />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%', padding: '20px 8px' }}>
      {nodes.map((node, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i === nodes.length - 1 ? 0 : 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 96 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                background: node.circleBg,
                color: node.circleFg,
                border: `2px solid ${node.circleBorder}`,
              }}
            >
              {node.mark}
            </div>
            <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: node.labelColor }}>{node.label}</div>
            <div style={{ marginTop: 2, fontSize: 11, color: '#52685F', fontFamily: 'SF Mono, Consolas, monospace' }}>
              {node.date}
            </div>
          </div>
          {node.hasLine && (
            <div style={{ flex: 1, height: 2, background: node.lineColor, margin: '0 4px 34px', minWidth: 24 }} />
          )}
        </div>
      ))}
    </div>
  );
}
