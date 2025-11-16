import { useState } from "react";
import config from "./config.json";
import ProjectionTable from "./components/ProjectionTable";
import WealthChart from "./components/WealthChart";
import AdvancedModeControls from "./components/AdvancedModeControls";

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

          {/* Advanced Mode Controls */}
          {advancedMode && (
            <AdvancedModeControls
              yearOptions={yearOptions}
              yearlyAdjustments={yearlyAdjustments}
              bigPurchases={bigPurchases}
              onUpdateYearlyAdjustment={updateYearlyAdjustment}
              onAddBigPurchase={addBigPurchase}
              onRemoveBigPurchase={removeBigPurchase}
              onUpdateBigPurchase={updateBigPurchase}
              getEffectiveValue={getEffectiveValue}
            />
          )}

          <ProjectionTable
            yearOptions={yearOptions}
            returnRateOptions={returnRateOptions}
            calculateBalance={calculateBalance}
            selectedCell={selectedCell}
            onCellClick={(year, rate) =>
              setSelectedCell({ years: year, returnRate: rate })
            }
          />

          <WealthChart
            selectedCell={selectedCell}
            calculateYearlyProgression={calculateYearlyProgression}
            onClose={() => setSelectedCell(null)}
          />
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
