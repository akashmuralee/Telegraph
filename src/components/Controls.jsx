import { RestartIcon } from './Icons';

export function Controls({ onRestart }) {
  return (
    <div className="flex justify-center">
      <button
        onClick={onRestart}
        className="bg-transparent border border-line rounded-full text-ink-2 text-[11px] tracking-[0.1em] lowercase inline-flex items-center gap-2 transition-colors duration-150 hover:border-line-2 hover:text-ink active:bg-surface-2"
        style={{ padding: '9px 18px' }}
      >
        <RestartIcon className="w-[13px] h-[13px]" />
        new test
      </button>
    </div>
  );
}
