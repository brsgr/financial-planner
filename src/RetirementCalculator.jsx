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
  const [advancedMode, setAdvancedMode] = useState(false);
  const [yearlyAdjustments, setYearlyAdjustments] = useState({});

  // Define the ranges for the table
  const yearOptions = config.projections.yearOptions;
  const returnRateOptions = config.projections.returnRateOptions;

  const calculateBalance = (years, returnRate) => {
    let balance = initialSavings;
    let currentIncome = annualIncome;
    let currentSavingsRate = savingsRate;

    for (let year = 0; year < years; year++) {
      // Apply growth from previous year
      balance = balance * (1 + returnRate / 100);

      // Check for adjustments for this year (year+1 since we're 0-indexed)
      if (advancedMode && yearlyAdjustments[year + 1]) {
        const adjustment = yearlyAdjustments[year + 1];
        if (adjustment.income !== undefined) {
          currentIncome = adjustment.income;
        }
        if (adjustment.savingsRate !== undefined) {
          currentSavingsRate = adjustment.savingsRate;
        }
      }

      // Add contribution for this year using current values
      const annualContribution = currentIncome * (currentSavingsRate / 100);
      balance += annualContribution;
    }

    return Math.round(balance);
  };

  const updateYearlyAdjustment = (year, field, value) => {
    setYearlyAdjustments((prev) => ({
      ...prev,
      [year]: {
        ...prev[year],
        [field]: value,
      },
    }));
  };

  const handleTextInput = (year, field, value) => {
    // Allow empty string to clear the field
    if (value === "") {
      updateYearlyAdjustment(year, field, undefined);
      return;
    }

    // Only update if it's a valid number
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      updateYearlyAdjustment(year, field, numValue);
    }
  };

  const getYearValue = (year, field) => {
    if (
      yearlyAdjustments[year] &&
      yearlyAdjustments[year][field] !== undefined
    ) {
      return yearlyAdjustments[year][field];
    }
    return field === "income" ? annualIncome : savingsRate;
  };

  const getEffectiveValue = (year, field) => {
    // Check if this year has a value set
    if (
      yearlyAdjustments[year] &&
      yearlyAdjustments[year][field] !== undefined
    ) {
      return yearlyAdjustments[year][field];
    }

    // Otherwise, look backwards to find the most recent adjustment
    for (let y = year - 1; y > 0; y--) {
      if (yearlyAdjustments[y] && yearlyAdjustments[y][field] !== undefined) {
        return yearlyAdjustments[y][field];
      }
    }

    // Fall back to base value
    return field === "income" ? annualIncome : savingsRate;
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
          {/* Mode Toggle */}
          <div className="mb-6 pb-4 border-b border-terminal-border">
            <button
              onClick={() => setAdvancedMode(!advancedMode)}
              className="text-xs text-terminal-amber hover:text-terminal-amberDim border border-terminal-amber px-3 py-1.5 transition-colors"
            >
              {advancedMode ? "[-] ADVANCED_MODE" : "[+] ADVANCED_MODE"}
            </button>
            <span className="ml-3 text-xs text-terminal-text/50">
              {advancedMode
                ? "yearly income/savings adjustments enabled"
                : "enable yearly projections"}
            </span>
          </div>

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

          {/* Advanced Mode - Yearly Adjustments */}
          {advancedMode && (
            <div className="mb-8 border border-terminal-border p-4 bg-terminal-bg">
              <h3 className="text-xs text-terminal-amber mb-3">
                [YEARLY_ADJUSTMENTS]
              </h3>
              <p className="text-xs text-terminal-text/50 mb-4">
                Configure income and savings rate changes by year. Leave blank
                to use base values.
              </p>
              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                {yearOptions
                  .filter((y) => y > 0)
                  .map((year) => (
                    <div
                      key={year}
                      className="grid grid-cols-3 gap-4 items-center border-b border-terminal-border/30 pb-3"
                    >
                      <div className="text-xs text-terminal-text/80">
                        YEAR_{year}:
                      </div>
                      <div>
                        <label className="text-xs text-terminal-text/60 block mb-1">
                          Income
                        </label>
                        <input
                          type="text"
                          placeholder={getEffectiveValue(
                            year,
                            "income",
                          ).toLocaleString()}
                          value={yearlyAdjustments[year]?.income ?? ""}
                          onChange={(e) =>
                            handleTextInput(year, "income", e.target.value)
                          }
                          className="w-full bg-terminal-bgLight border border-terminal-border text-terminal-amber text-xs px-2 py-1 focus:outline-none focus:border-terminal-amber placeholder:text-terminal-text/30"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-terminal-text/60 block mb-1">
                          Savings %
                        </label>
                        <input
                          type="text"
                          placeholder={getEffectiveValue(
                            year,
                            "savingsRate",
                          ).toString()}
                          value={yearlyAdjustments[year]?.savingsRate ?? ""}
                          onChange={(e) =>
                            handleTextInput(year, "savingsRate", e.target.value)
                          }
                          className="w-full bg-terminal-bgLight border border-terminal-border text-terminal-amber text-xs px-2 py-1 focus:outline-none focus:border-terminal-amber placeholder:text-terminal-text/30"
                        />
                        {getEffectiveValue(year, "savingsRate") > 100 ? (
                          <p className="text-xs text-terminal-amber mt-1">
                            ⚠ rate &gt; 100%
                          </p>
                        ) : (
                          <p className="text-xs text-terminal-text/50 mt-1">
                            → $
                            {(
                              (getEffectiveValue(year, "income") *
                                getEffectiveValue(year, "savingsRate")) /
                              100
                            ).toLocaleString()}
                            /yr
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

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
