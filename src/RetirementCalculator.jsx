import { useState } from "react";
import config from "./config.json";

export default function RetirementCalculator() {
  const [annualIncome, setAnnualIncome] = useState(
    config.defaults.annualIncome,
  );
  const [initialSavings, setInitialSavings] = useState(
    config.defaults.initialSavings,
  );
  const [savingsRate, setSavingsRate] = useState(config.defaults.savingsRate);

  // Define the ranges for the table
  const yearOptions = config.projections.yearOptions;
  const returnRateOptions = config.projections.returnRateOptions;

  const calculateBalance = (years, returnRate) => {
    let balance = initialSavings;
    const annualContribution = annualIncome * (savingsRate / 100);

    for (let year = 0; year < years; year++) {
      balance = balance * (1 + returnRate / 100) + annualContribution;
    }

    return Math.round(balance);
  };

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-text font-mono p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl text-terminal-amber mb-1">
          RETIREMENT_CALC.EXE
        </h1>
        <p className="text-sm text-terminal-text/60 mb-8">
          &gt; financial projection model v1.0
        </p>

        <div className="bg-terminal-bgLight border border-terminal-border p-6 mb-8">
          {/* Controls */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-xs text-terminal-text/80 mb-2">
                ANNUAL_INCOME:{" "}
                <span className="text-terminal-amber">
                  ${annualIncome.toLocaleString()}
                </span>
              </label>
              <input
                type="range"
                min={config.sliders.annualIncome.min}
                max={config.sliders.annualIncome.max}
                step={config.sliders.annualIncome.step}
                value={annualIncome}
                onChange={(e) => setAnnualIncome(Number(e.target.value))}
                className="w-full h-1 bg-terminal-border appearance-none cursor-pointer accent-terminal-amber"
              />
            </div>

            <div>
              <label className="block text-xs text-terminal-text/80 mb-2">
                SAVINGS_RATE:{" "}
                <span className="text-terminal-amber">{savingsRate}%</span>
              </label>
              <input
                type="range"
                min={config.sliders.savingsRate.min}
                max={config.sliders.savingsRate.max}
                step={config.sliders.savingsRate.step}
                value={savingsRate}
                onChange={(e) => setSavingsRate(Number(e.target.value))}
                className="w-full h-1 bg-terminal-border appearance-none cursor-pointer accent-terminal-amber"
              />
              <p className="text-xs text-terminal-text/50 mt-1">
                → ${(annualIncome * (savingsRate / 100)).toLocaleString()}/yr
              </p>
            </div>

            <div>
              <label className="block text-xs text-terminal-text/80 mb-2">
                INITIAL_BALANCE:{" "}
                <span className="text-terminal-amber">
                  ${initialSavings.toLocaleString()}
                </span>
              </label>
              <input
                type="range"
                min={config.sliders.initialSavings.min}
                max={config.sliders.initialSavings.max}
                step={config.sliders.initialSavings.step}
                value={initialSavings}
                onChange={(e) => setInitialSavings(Number(e.target.value))}
                className="w-full h-1 bg-terminal-border appearance-none cursor-pointer accent-terminal-amber"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <h3 className="text-sm text-terminal-amber mb-2">
              [PROJECTION_MATRIX]
            </h3>
            <p className="text-xs text-terminal-text/50 mb-4">
              balance by years(cols) × return_rate(rows)
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
                      return (
                        <td
                          key={`${rate}-${year}`}
                          className={`border border-terminal-border px-3 py-2 text-center text-xs ${textColor}`}
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
        </div>

        <div className="text-xs text-terminal-text/40 border-t border-terminal-border pt-4">
          <p>// simplified projection model - educational purposes only</p>
          <p>// returns are variable - past performance ≠ future results</p>
        </div>
      </div>
    </div>
  );
}
