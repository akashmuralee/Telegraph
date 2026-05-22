import { GearIcon } from './Icons';

function StatPill({ value, label }) {
  return (
    <div className="flex items-baseline gap-1.5 bg-surface border border-line rounded-full px-3 py-1">
      <span className="text-[15px] font-medium text-accent leading-none min-w-[14px] text-right">
        {value}
      </span>
      <span className="text-[10px] tracking-[0.12em] text-ink-3 uppercase">{label}</span>
    </div>
  );
}

export function Header({ wpm, accuracy, settingsOpen, onToggleSettings }) {
  return (
    <header className="flex justify-between items-center mb-5">
      <span className="font-sans font-medium text-[12px] tracking-[0.22em] uppercase text-ink-3">
        Monkey Morse
      </span>
      <div className="flex items-center gap-2">
        <StatPill value={wpm} label="wpm" />
        <StatPill value={accuracy} label="acc" />
        <button
          onClick={onToggleSettings}
          aria-label="Settings"
          aria-expanded={settingsOpen}
          className={[
            'w-[30px] h-[30px] rounded-full border flex items-center justify-center',
            'transition-colors duration-150',
            settingsOpen
              ? 'border-accent text-accent bg-accent-dim'
              : 'border-line text-ink-3 hover:border-line-2 hover:text-ink-2',
          ].join(' ')}
        >
          <GearIcon className="w-[14px] h-[14px]" />
        </button>
      </div>
    </header>
  );
}
