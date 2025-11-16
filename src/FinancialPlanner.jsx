import { useState } from "react";
import config from "./config.json";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";

export default function FinancialPlanner() {
  const [annualIncome, setAnnualIncome] = useState(
    config.defaults.annualIncome,
  );
  const [initialSavings, setInitialSavings] = useState(
    config.defaults.initialSavings,
  );
  const [savingsRate, setSavingsRate] = useState(config.defaults.savingsRate);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [yearlyAdjustments, setYearlyAdjustments] = useState({});
  const [bigPurchases, setBigPurchases] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null); // { years, returnRate }

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

      // Subtract big purchases for this year
      if (advancedMode) {
        const purchasesThisYear = bigPurchases.filter(
          (p) => p.year === year + 1,
        );
        purchasesThisYear.forEach((purchase) => {
          balance -= purchase.amount;
        });
      }
    }

    return Math.round(balance);
  };

  // Calculate year-by-year progression with event metadata
  const calculateYearlyProgression = (years, returnRate) => {
    const data = [];
    let balance = initialSavings;
    let currentIncome = annualIncome;
    let currentSavingsRate = savingsRate;

    // Add year 0
    data.push({
      year: 0,
      balance: Math.round(balance),
      events: [],
    });

    for (let year = 0; year < years; year++) {
      const events = [];
      const yearNum = year + 1;

      // Apply growth from previous year
      balance = balance * (1 + returnRate / 100);

      // Check for adjustments for this year
      if (advancedMode && yearlyAdjustments[yearNum]) {
        const adjustment = yearlyAdjustments[yearNum];
        if (adjustment.income !== undefined) {
          events.push({
            type: "income",
            label: `Income: $${adjustment.income.toLocaleString()}`,
          });
          currentIncome = adjustment.income;
        }
        if (adjustment.savingsRate !== undefined) {
          events.push({
            type: "savings",
            label: `Savings Rate: ${adjustment.savingsRate}%`,
          });
          currentSavingsRate = adjustment.savingsRate;
        }
      }

      // Add contribution for this year
      const annualContribution = currentIncome * (currentSavingsRate / 100);
      balance += annualContribution;

      // Subtract big purchases for this year
      if (advancedMode) {
        const purchasesThisYear = bigPurchases.filter(
          (p) => p.year === yearNum,
        );
        purchasesThisYear.forEach((purchase) => {
          balance -= purchase.amount;
          events.push({
            type: "purchase",
            label: `${purchase.description || "Purchase"}: -$${purchase.amount.toLocaleString()}`,
          });
        });
      }

      data.push({
        year: yearNum,
        balance: Math.round(balance),
        events,
      });
    }

    return data;
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

  const addBigPurchase = () => {
    const newPurchase = {
      id: Date.now(),
      year: 5,
      amount: 50000,
      description: "",
    };
    setBigPurchases([...bigPurchases, newPurchase]);
  };

  const removeBigPurchase = (id) => {
    setBigPurchases(bigPurchases.filter((p) => p.id !== id));
  };

  const updateBigPurchase = (id, field, value) => {
    setBigPurchases(
      bigPurchases.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-text font-mono p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl text-terminal-amber mb-1">
          $ financial-planner
        </h1>
        <p className="text-sm text-terminal-text/60 mb-8">
          simple financial projection tool v1.0
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
                        <div className="h-[1.375rem]"></div>
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
                          <p className="text-xs text-terminal-amber mt-1 h-5">
                            ⚠ rate &gt; 100%
                          </p>
                        ) : (
                          <p className="text-xs text-terminal-text/50 mt-1 h-5">
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

          {/* Advanced Mode - Big Purchases */}
          {advancedMode && (
            <div className="mb-8 border border-terminal-border p-4 bg-terminal-bg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs text-terminal-amber">[BIG_PURCHASES]</h3>
                <button
                  onClick={addBigPurchase}
                  className="text-xs text-terminal-green hover:text-terminal-greenDim border border-terminal-green px-2 py-1 transition-colors"
                >
                  [+ ADD]
                </button>
              </div>
              <p className="text-xs text-terminal-text/50 mb-4">
                One-time expenses that reduce your balance (house, college,
                etc.)
              </p>
              {bigPurchases.length === 0 ? (
                <p className="text-xs text-terminal-text/30 italic">
                  No purchases configured. Click [+ ADD] to add one.
                </p>
              ) : (
                <div className="space-y-3">
                  {bigPurchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="grid grid-cols-4 gap-3 items-center border border-terminal-border/50 p-3"
                    >
                      <div>
                        <label className="text-xs text-terminal-text/60 block mb-1">
                          Year
                        </label>
                        <select
                          value={purchase.year}
                          onChange={(e) =>
                            updateBigPurchase(
                              purchase.id,
                              "year",
                              Number(e.target.value),
                            )
                          }
                          className="w-full bg-terminal-bgLight border border-terminal-border text-terminal-amber text-xs px-2 py-1 focus:outline-none focus:border-terminal-amber"
                        >
                          {yearOptions
                            .filter((y) => y > 0)
                            .map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-terminal-text/60 block mb-1">
                          Amount ($)
                        </label>
                        <input
                          type="text"
                          value={purchase.amount || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (
                              val === "" ||
                              (!isNaN(parseFloat(val)) && parseFloat(val) >= 0)
                            ) {
                              updateBigPurchase(
                                purchase.id,
                                "amount",
                                val === "" ? 0 : parseFloat(val),
                              );
                            }
                          }}
                          className="w-full bg-terminal-bgLight border border-terminal-border text-terminal-amber text-xs px-2 py-1 focus:outline-none focus:border-terminal-amber"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-terminal-text/60 block mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={purchase.description}
                          onChange={(e) =>
                            updateBigPurchase(
                              purchase.id,
                              "description",
                              e.target.value,
                            )
                          }
                          placeholder="e.g., house, car"
                          className="w-full bg-terminal-bgLight border border-terminal-border text-terminal-amber text-xs px-2 py-1 focus:outline-none focus:border-terminal-amber placeholder:text-terminal-text/30"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => removeBigPurchase(purchase.id)}
                          className="text-xs text-terminal-text/50 hover:text-terminal-amber border border-terminal-border px-2 py-1 transition-colors"
                        >
                          [X]
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <h3 className="text-sm text-terminal-amber mb-2">
              [PROJECTION_MATRIX]
            </h3>
            <p className="text-xs text-terminal-text/50 mb-4">
              balance by years(cols) × return_rate(rows) - click cell to
              visualize
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
                          onClick={() =>
                            setSelectedCell({ years: year, returnRate: rate })
                          }
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

          {/* Graph Visualization */}
          {selectedCell && (
            <div className="mt-8 border border-terminal-border p-4 bg-terminal-bg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs text-terminal-amber">
                  [WEALTH_ACCUMULATION_GRAPH] - {selectedCell.years} years @{" "}
                  {selectedCell.returnRate}% return
                </h3>
                <button
                  onClick={() => setSelectedCell(null)}
                  className="text-xs text-terminal-text/50 hover:text-terminal-amber border border-terminal-border px-2 py-1 transition-colors"
                >
                  [X CLOSE]
                </button>
              </div>
              <div className="h-96 bg-terminal-bgLight p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={calculateYearlyProgression(
                      selectedCell.years,
                      selectedCell.returnRate,
                    )}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis
                      dataKey="year"
                      stroke="#a0a0a0"
                      style={{ fontSize: "12px", fontFamily: "monospace" }}
                      label={{
                        value: "Year",
                        position: "insideBottom",
                        offset: -5,
                        style: { fill: "#d4af37", fontSize: "12px" },
                      }}
                    />
                    <YAxis
                      stroke="#a0a0a0"
                      style={{ fontSize: "12px", fontFamily: "monospace" }}
                      tickFormatter={(value) =>
                        `$${(value / 1000000).toFixed(1)}M`
                      }
                      label={{
                        value: "Balance",
                        angle: -90,
                        position: "insideLeft",
                        style: { fill: "#d4af37", fontSize: "12px" },
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #404040",
                        borderRadius: "0",
                        fontFamily: "monospace",
                        fontSize: "11px",
                      }}
                      labelStyle={{ color: "#d4af37" }}
                      itemStyle={{ color: "#00ff00" }}
                      formatter={(value) => [
                        `$${value.toLocaleString()}`,
                        "Balance",
                      ]}
                      labelFormatter={(label) => `Year ${label}`}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div
                              style={{
                                backgroundColor: "#1a1a1a",
                                border: "1px solid #404040",
                                padding: "8px",
                                fontFamily: "monospace",
                                fontSize: "11px",
                              }}
                            >
                              <p style={{ color: "#d4af37", margin: 0 }}>
                                Year {data.year}
                              </p>
                              <p style={{ color: "#00ff00", margin: "4px 0" }}>
                                Balance: ${data.balance.toLocaleString()}
                              </p>
                              {data.events && data.events.length > 0 && (
                                <div
                                  style={{
                                    marginTop: "8px",
                                    paddingTop: "8px",
                                    borderTop: "1px solid #404040",
                                  }}
                                >
                                  <p
                                    style={{
                                      color: "#d4af37",
                                      margin: "0 0 4px 0",
                                    }}
                                  >
                                    Events:
                                  </p>
                                  {data.events.map((event, idx) => (
                                    <p
                                      key={idx}
                                      style={{
                                        color:
                                          event.type === "purchase"
                                            ? "#ff6b6b"
                                            : "#a0a0a0",
                                        margin: "2px 0",
                                        fontSize: "10px",
                                      }}
                                    >
                                      • {event.label}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="stepAfter"
                      dataKey="balance"
                      stroke="#00ff00"
                      strokeWidth={2}
                      dot={{
                        fill: "#00ff00",
                        r: 3,
                      }}
                      activeDot={{
                        r: 5,
                        fill: "#d4af37",
                      }}
                    />
                    {/* Mark events with dots */}
                    {calculateYearlyProgression(
                      selectedCell.years,
                      selectedCell.returnRate,
                    ).map((point, idx) =>
                      point.events && point.events.length > 0
                        ? point.events.map((event, eventIdx) => (
                            <ReferenceDot
                              key={`${idx}-${eventIdx}`}
                              x={point.year}
                              y={point.balance}
                              r={6}
                              fill={
                                event.type === "purchase"
                                  ? "#ff6b6b"
                                  : "#d4af37"
                              }
                              stroke="#1a1a1a"
                              strokeWidth={2}
                            />
                          ))
                        : null,
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        <div className="text-xs text-terminal-text/40 border-t border-terminal-border pt-4">
          <p>// simplified projection model - educational purposes only</p>
          <p>
            // all calculations run locally in your browser - no data is saved
            or stored
          </p>
          <p>
            //{" "}
            <a
              href="https://github.com/brsg/readme"
              target="_blank"
              rel="noopener noreferrer"
              className="text-terminal-amber hover:text-terminal-amberDim underline"
            >
              how it works
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
