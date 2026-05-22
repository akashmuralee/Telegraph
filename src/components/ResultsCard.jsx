function Cell({ value, label }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[30px] sm:text-[30px] text-accent font-normal leading-none">
        {value}
      </span>
      <span className="text-[10px] tracking-[0.16em] uppercase text-ink-3">{label}</span>
    </div>
  );
}

export function ResultsCard({ wpm, accuracy, elapsed, correctChars, totalChars }) {
  return (
    <div className="bg-surface border border-line rounded-[20px] p-6 mt-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Cell value={wpm} label="wpm" />
        <Cell
          value={
            <>
              {accuracy}
              <small className="text-[14px] text-ink-3">%</small>
            </>
          }
          label="accuracy"
        />
        <Cell
          value={
            <>
              {elapsed.toFixed(1)}
              <small className="text-[14px] text-ink-3">s</small>
            </>
          }
          label="time"
        />
        <Cell value={`${correctChars}/${totalChars}`} label="chars" />
      </div>
    </div>
  );
}
