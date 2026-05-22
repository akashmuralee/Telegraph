import { SpeakerIcon, SpeakerMuteIcon } from './Icons';

const LENGTHS = [15, 25, 50, 100];

function SegGroup({ children }) {
  return (
    <div className="inline-flex gap-0.5 bg-surface border border-line rounded-full p-[3px]">
      {children}
    </div>
  );
}

function Seg({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-3 py-1.5 text-[11px] tracking-[0.06em] rounded-full lowercase',
        'transition-colors duration-150',
        active ? 'bg-accent-dim text-accent' : 'text-ink-3 hover:text-ink',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="w-1 h-1 rounded-full bg-line-2" aria-hidden />;
}

export function Toolbar({
  mode,
  onModeChange,
  wordCount,
  onWordCountChange,
  hint,
  onHintChange,
  muted,
  onMuteToggle,
}) {
  return (
    <div className="flex justify-center items-center gap-3 mb-7 flex-wrap">
      <SegGroup>
        <Seg active={mode === 'writing'} onClick={() => onModeChange('writing')}>
          writing
        </Seg>
        <Seg active={mode === 'reading'} onClick={() => onModeChange('reading')}>
          reading
        </Seg>
      </SegGroup>

      <Sep />

      <SegGroup>
        {LENGTHS.map((n) => (
          <Seg key={n} active={wordCount === n} onClick={() => onWordCountChange(n)}>
            {n}
          </Seg>
        ))}
      </SegGroup>

      {/* Reserve this slot in reading mode too, so the toolbar height
          doesn't shift when modes change. */}
      <div
        className="flex items-center gap-3"
        style={{
          visibility: mode === 'writing' ? 'visible' : 'hidden',
          pointerEvents: mode === 'writing' ? 'auto' : 'none',
        }}
        aria-hidden={mode !== 'writing'}
      >
        <Sep />
        <SegGroup>
          <Seg active={hint} onClick={() => onHintChange(true)}>
            show morse
          </Seg>
          <Seg active={!hint} onClick={() => onHintChange(false)}>
            hide
          </Seg>
        </SegGroup>
      </div>

      <Sep />

      <button
        onClick={onMuteToggle}
        aria-label={muted ? 'Unmute' : 'Mute'}
        title={muted ? 'Unmute' : 'Mute'}
        className={[
          'w-[30px] h-[30px] rounded-full border flex items-center justify-center',
          'transition-colors duration-150',
          muted
            ? 'border-line text-ink-3 hover:border-line-2 hover:text-ink-2'
            : 'border-accent text-accent',
        ].join(' ')}
      >
        {muted ? (
          <SpeakerMuteIcon className="w-[14px] h-[14px]" />
        ) : (
          <SpeakerIcon className="w-[14px] h-[14px]" />
        )}
      </button>
    </div>
  );
}
