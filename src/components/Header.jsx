import { GearIcon, HelpIcon } from './Icons';
import { MonkeyMorseLogo } from './MonkeyMorseLogo';

export function Header({ onOpenTour, settingsOpen, onToggleSettings }) {
  return (
    <header className="flex justify-between items-center mb-5">
      <span className="flex items-center gap-2.5">
        <MonkeyMorseLogo size={38} />
        <span className="font-sans font-medium text-[15px] tracking-[0.18em] uppercase text-ink-3">
          Monkey Morse
        </span>
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenTour}
          aria-label="Show tour"
          title="Show tour"
          className="w-[30px] h-[30px] rounded-full border border-line text-ink-3 hover:border-line-2 hover:text-ink-2 flex items-center justify-center transition-colors duration-150"
        >
          <HelpIcon className="w-[14px] h-[14px]" />
        </button>
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
