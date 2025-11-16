import { useState, useEffect } from "react";
import config from "./config.json";
import ProjectionTable from "./components/ProjectionTable";
import WealthChart from "./components/WealthChart";
import AdvancedModeControls from "./components/AdvancedModeControls";
import {
  loadState,
  saveState,
  clearState,
  encodeStateToURL,
  decodeStateFromURL,
} from "./utils/storage";

export default function FinancialPlanner() {
  // Check for shared state in URL first, then localStorage, then defaults
  const getInitialState = () => {
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const sharedState = urlParams.get("state");

    if (sharedState) {
      const decodedState = decodeStateFromURL(sharedState);
      if (decodedState) {
        return decodedState;
      }
    }

    // Fall back to localStorage
    return loadState();
  };

  const savedState = getInitialState();

  const [annualIncome, setAnnualIncome] = useState(
    savedState?.annualIncome ?? config.defaults.annualIncome,
  );
  const [initialSavings, setInitialSavings] = useState(
    savedState?.initialSavings ?? config.defaults.initialSavings,
  );
  const [savingsRate, setSavingsRate] = useState(
    savedState?.savingsRate ?? config.defaults.savingsRate,
  );
  const [advancedMode, setAdvancedMode] = useState(
    savedState?.advancedMode ?? false,
  );
  const [yearlyAdjustments, setYearlyAdjustments] = useState(
    savedState?.yearlyAdjustments ?? {},
  );
  const [bigPurchases, setBigPurchases] = useState(
    savedState?.bigPurchases ?? [],
  );
  const [selectedCell, setSelectedCell] = useState(null); // Don't persist selected cell
  const [linkCopied, setLinkCopied] = useState(false); // Track if shareable link was copied

  // Clear URL state parameter after initial load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("state")) {
      // Remove the state parameter from URL without reloading the page
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("state");
      window.history.replaceState({}, "", newUrl);
    }
  }, []); // Run only once on mount

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const stateToSave = {
      annualIncome,
      initialSavings,
      savingsRate,
      advancedMode,
      yearlyAdjustments,
      bigPurchases,
    };
    saveState(stateToSave);
  }, [
    annualIncome,
    initialSavings,
    savingsRate,
    advancedMode,
    yearlyAdjustments,
    bigPurchases,
  ]);

  // Define the ranges for the table
  const yearOptions = config.projections.yearOptions;
  const returnRateOptions = config.projections.returnRateOptions;

  const calculateBalance = (years, returnRate) => {
    let balance = initialSavings;
    let currentIncome = annualIncome;
    let currentSavingsRate = savingsRate;

    // Track mortgage equity separately for each mortgage
    const mortgageEquities = {};

    for (let year = 0; year < years; year++) {
      // Apply growth from previous year (only if balance is positive)
      if (balance > 0) {
        balance = balance * (1 + returnRate / 100);
      }

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

      // Handle big purchases and mortgages for this year
      if (advancedMode) {
        bigPurchases.forEach((purchase) => {
          if (purchase.type === "mortgage") {
            // Initialize mortgage equity tracking on first year
            if (purchase.year === year + 1) {
              mortgageEquities[purchase.id] = {
                homeValue: purchase.houseCost || 0,
                remainingPrincipal:
                  (purchase.houseCost || 0) - (purchase.downPayment || 0),
              };
              balance -= purchase.downPayment || 0;
            }

            // Track mortgage through its lifetime
            if (
              year + 1 >= purchase.year &&
              year + 1 < purchase.year + (purchase.mortgageTerm || 30)
            ) {
              const principal =
                (purchase.houseCost || 0) - (purchase.downPayment || 0);
              const monthlyRate = (purchase.interestRate || 0) / 100 / 12;
              const numPayments = (purchase.mortgageTerm || 30) * 12;

              if (monthlyRate > 0) {
                const monthlyPayment =
                  (principal *
                    (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
                  (Math.pow(1 + monthlyRate, numPayments) - 1);
                balance -= monthlyPayment * 12;

                // Calculate principal paid this year
                const yearsIntoPurchase = year + 1 - purchase.year;
                const monthsIntoPurchase = yearsIntoPurchase * 12;

                // Calculate remaining principal at start of year
                const remainingAtStart =
                  principal *
                  ((Math.pow(1 + monthlyRate, numPayments) -
                    Math.pow(1 + monthlyRate, monthsIntoPurchase)) /
                    (Math.pow(1 + monthlyRate, numPayments) - 1));

                // Calculate remaining principal at end of year
                const remainingAtEnd =
                  principal *
                  ((Math.pow(1 + monthlyRate, numPayments) -
                    Math.pow(1 + monthlyRate, monthsIntoPurchase + 12)) /
                    (Math.pow(1 + monthlyRate, numPayments) - 1));

                mortgageEquities[purchase.id].remainingPrincipal = Math.max(
                  0,
                  remainingAtEnd,
                );
              }
            }

            // Apply appreciation to home value (using same return rate)
            if (mortgageEquities[purchase.id]) {
              mortgageEquities[purchase.id].homeValue *= 1 + returnRate / 100;
            }
          } else if (purchase.year === year + 1) {
            // Regular one-time purchase
            balance -= purchase.amount || 0;
          }
        });
      }
    }

    // Calculate total equity across all mortgages
    const totalEquity = Object.values(mortgageEquities).reduce(
      (sum, mortgage) => {
        return sum + (mortgage.homeValue - mortgage.remainingPrincipal);
      },
      0,
    );

    return Math.round(balance + totalEquity);
  };

  // Calculate year-by-year progression with event metadata
  const calculateYearlyProgression = (years, returnRate) => {
    const data = [];
    let balance = initialSavings;
    let currentIncome = annualIncome;
    let currentSavingsRate = savingsRate;

    // Track mortgage equity separately for each mortgage
    const mortgageEquities = {};

    // Add year 0
    data.push({
      year: 0,
      balance: Math.round(balance),
      liquidBalance: Math.round(balance),
      totalEquity: 0,
      mortgageEquities: {},
      events: [],
    });

    for (let year = 0; year < years; year++) {
      const events = [];
      const yearNum = year + 1;

      // Apply growth from previous year (only if balance is positive)
      if (balance > 0) {
        balance = balance * (1 + returnRate / 100);
      }

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

      // Handle big purchases and mortgages for this year
      if (advancedMode) {
        bigPurchases.forEach((purchase) => {
          if (purchase.type === "mortgage") {
            // Initialize mortgage equity tracking on first year
            if (purchase.year === yearNum) {
              mortgageEquities[purchase.id] = {
                description: purchase.description || "Mortgage",
                homeValue: purchase.houseCost || 0,
                remainingPrincipal:
                  (purchase.houseCost || 0) - (purchase.downPayment || 0),
              };
              const downPayment = purchase.downPayment || 0;
              balance -= downPayment;
              events.push({
                type: "mortgage_down",
                label: `${purchase.description || "Mortgage"} Down Payment: -$${downPayment.toLocaleString()}`,
              });
            }

            // Track mortgage through its lifetime
            if (
              yearNum >= purchase.year &&
              yearNum < purchase.year + (purchase.mortgageTerm || 30)
            ) {
              const principal =
                (purchase.houseCost || 0) - (purchase.downPayment || 0);
              const monthlyRate = (purchase.interestRate || 0) / 100 / 12;
              const numPayments = (purchase.mortgageTerm || 30) * 12;

              if (monthlyRate > 0) {
                const monthlyPayment =
                  (principal *
                    (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
                  (Math.pow(1 + monthlyRate, numPayments) - 1);
                const annualPayment = monthlyPayment * 12;
                balance -= annualPayment;
                events.push({
                  type: "mortgage_payment",
                  label: `${purchase.description || "Mortgage"} Payment: -$${annualPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr`,
                });

                // Calculate remaining principal at end of year
                const yearsIntoPurchase = yearNum - purchase.year;
                const monthsIntoPurchase = yearsIntoPurchase * 12;

                const remainingAtEnd =
                  principal *
                  ((Math.pow(1 + monthlyRate, numPayments) -
                    Math.pow(1 + monthlyRate, monthsIntoPurchase + 12)) /
                    (Math.pow(1 + monthlyRate, numPayments) - 1));

                mortgageEquities[purchase.id].remainingPrincipal = Math.max(
                  0,
                  remainingAtEnd,
                );
              }
            }

            // Apply appreciation to home value (using same return rate)
            if (mortgageEquities[purchase.id]) {
              mortgageEquities[purchase.id].homeValue *= 1 + returnRate / 100;
            }
          } else if (purchase.year === yearNum) {
            // Regular one-time purchase
            const amount = purchase.amount || 0;
            balance -= amount;
            events.push({
              type: "purchase",
              label: `${purchase.description || "Purchase"}: -$${amount.toLocaleString()}`,
            });
          }
        });
      }

      // Calculate total equity across all mortgages
      const totalEquity = Object.values(mortgageEquities).reduce(
        (sum, mortgage) => {
          return sum + (mortgage.homeValue - mortgage.remainingPrincipal);
        },
        0,
      );

      // Create mortgage equity details for display
      const mortgageEquityDetails = {};
      Object.entries(mortgageEquities).forEach(([id, mortgage]) => {
        mortgageEquityDetails[id] = {
          description: mortgage.description,
          homeValue: Math.round(mortgage.homeValue),
          remainingPrincipal: Math.round(mortgage.remainingPrincipal),
          equity: Math.round(mortgage.homeValue - mortgage.remainingPrincipal),
        };
      });

      data.push({
        year: yearNum,
        balance: Math.round(balance + totalEquity),
        liquidBalance: Math.round(balance),
        totalEquity: Math.round(totalEquity),
        mortgageEquities: mortgageEquityDetails,
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

  const addBigPurchase = (type = "purchase") => {
    const newPurchase = {
      id: Date.now(),
      type,
      year: 5,
      ...(type === "mortgage"
        ? {
            houseCost: 500000,
            downPayment: 100000,
            interestRate: 6.5,
            mortgageTerm: 30,
            description: "",
          }
        : {
            amount: 50000,
            description: "",
          }),
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

  const handleReset = () => {
    if (
      window.confirm(
        "Are you sure you want to reset all inputs to defaults? This cannot be undone.",
      )
    ) {
      clearState();
      setAnnualIncome(config.defaults.annualIncome);
      setInitialSavings(config.defaults.initialSavings);
      setSavingsRate(config.defaults.savingsRate);
      setAdvancedMode(false);
      setYearlyAdjustments({});
      setBigPurchases([]);
      setSelectedCell(null);
    }
  };

  const handleShareableLink = async () => {
    const stateToShare = {
      annualIncome,
      initialSavings,
      savingsRate,
      advancedMode,
      yearlyAdjustments,
      bigPurchases,
    };

    const encodedState = encodeStateToURL(stateToShare);
    if (!encodedState) {
      alert("Failed to generate shareable link");
      return;
    }

    const url = new URL(window.location.href);
    url.search = ""; // Clear existing params
    url.searchParams.set("state", encodedState);
    const shareableURL = url.toString();

    let copySuccess = false;

    try {
      await navigator.clipboard.writeText(shareableURL);
      copySuccess = true;
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = shareableURL;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        copySuccess = true;
      } catch (e) {
        alert("Failed to copy to clipboard. URL: " + shareableURL);
      }
      document.body.removeChild(textArea);
    }

    if (copySuccess) {
      setLinkCopied(true);
      setTimeout(() => {
        setLinkCopied(false);
      }, 2000); // Reset after 2 seconds
    }
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
          <div className="mb-6 pb-4 border-b border-terminal-border flex items-center justify-between">
            <div>
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
            <div className="flex gap-2">
              <button
                onClick={handleShareableLink}
                className={`text-xs px-3 py-1.5 transition-colors ${
                  linkCopied
                    ? "text-green-400 border border-green-400"
                    : "text-terminal-amber hover:text-terminal-amberDim border border-terminal-amber hover:border-terminal-amberDim"
                }`}
                title="Copy shareable link to clipboard"
              >
                {linkCopied ? "[✓ COPIED!]" : "[SHARE LINK]"}
              </button>
              <button
                onClick={handleReset}
                className="text-xs text-terminal-text/50 hover:text-red-400 border border-terminal-border hover:border-red-400 px-3 py-1.5 transition-colors"
                title="Reset all inputs to defaults"
              >
                [RESET]
              </button>
            </div>
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
          <p>// simplified projection model</p>
          <p>
            // all calculations run locally in your browser - your inputs are
            saved in your browser's local storage only
          </p>
          <p>
            //{" "}
            <a
              href="https://github.com/brsg/financial-planner"
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
