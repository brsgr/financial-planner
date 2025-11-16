import config from "../config.json";

export default function ProjectionTable({
  yearOptions,
  returnRateOptions,
  calculateBalance,
  selectedCell,
  onCellClick,
}) {
  return (
    <div className="overflow-x-auto">
      <h3 className="text-sm text-terminal-amber mb-2">
        [PROJECTION_MATRIX]
      </h3>
      <p className="text-xs text-terminal-text/50 mb-4">
        balance by years(cols) × return_rate(rows) - click cell to visualize
      </p>
      <table className="min-w-full border-collapse border border-terminal-border">
        <thead>
          <tr className="bg-terminal-bg">
            <th className="border border-terminal-border px-3 py-2 text-left text-xs text-terminal-amber">
              RATE%
            </th>
            {yearOptions.map((year) => (
              <th
                key={year}
                className="border border-terminal-border px-3 py-2 text-center text-xs text-terminal-amber"
              >
                {year}Y
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {returnRateOptions.map((rate) => (
            <tr key={rate}>
              <td className="border border-terminal-border px-3 py-2 text-xs text-terminal-text/80">
                {rate}%
              </td>
              {yearOptions.map((year) => {
                const balance = calculateBalance(year, rate);
                let textColor = "text-terminal-text";
                if (balance > config.colorThresholds.green) {
                  textColor = "text-terminal-green";
                } else if (balance > config.colorThresholds.yellow) {
                  textColor = "text-terminal-amber";
                }
                const isSelected =
                  selectedCell &&
                  selectedCell.years === year &&
                  selectedCell.returnRate === rate;
                return (
                  <td
                    key={`${rate}-${year}`}
                    className={`border border-terminal-border px-3 py-2 text-center text-xs ${textColor} cursor-pointer hover:bg-terminal-bg transition-colors ${isSelected ? "bg-terminal-bg ring-1 ring-terminal-amber" : ""}`}
                    onClick={() => onCellClick(year, rate)}
                    title="Click to visualize"
                  >
                    ${(balance / 1000000).toFixed(2)}M
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
