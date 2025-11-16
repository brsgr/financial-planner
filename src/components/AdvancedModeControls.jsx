export default function AdvancedModeControls({
  yearOptions,
  yearlyAdjustments,
  bigPurchases,
  onUpdateYearlyAdjustment,
  onAddBigPurchase,
  onRemoveBigPurchase,
  onUpdateBigPurchase,
  getEffectiveValue,
}) {
  const handleTextInput = (year, field, value) => {
    // Allow empty string to clear the field
    if (value === "") {
      onUpdateYearlyAdjustment(year, field, undefined);
      return;
    }

    // Only update if it's a valid number
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onUpdateYearlyAdjustment(year, field, numValue);
    }
  };

  return (
    <>
      {/* Yearly Adjustments */}
      <div className="mb-8 border border-terminal-border p-4 bg-terminal-bg">
        <h3 className="text-xs text-terminal-amber mb-3">
          [YEARLY_ADJUSTMENTS]
        </h3>
        <p className="text-xs text-terminal-text/50 mb-4">
          Configure income and savings rate changes by year. Leave blank to use
          base values.
        </p>
        <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
          {yearOptions
            .filter((y) => y > 0)
            .map((year) => (
              <div
                key={year}
                className="grid grid-cols-3 gap-4 items-center border-b border-terminal-border/30 pb-3"
              >
                <div className="text-xs text-terminal-text/80">YEAR_{year}:</div>
                <div>
                  <label className="text-xs text-terminal-text/60 block mb-1">
                    Income
                  </label>
                  <input
                    type="text"
                    placeholder={getEffectiveValue(year, "income").toLocaleString()}
                    value={yearlyAdjustments[year]?.income ?? ""}
                    onChange={(e) => handleTextInput(year, "income", e.target.value)}
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
                    placeholder={getEffectiveValue(year, "savingsRate").toString()}
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

      {/* Big Purchases */}
      <div className="mb-8 border border-terminal-border p-4 bg-terminal-bg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs text-terminal-amber">[BIG_PURCHASES]</h3>
          <button
            onClick={onAddBigPurchase}
            className="text-xs text-terminal-green hover:text-terminal-greenDim border border-terminal-green px-2 py-1 transition-colors"
          >
            [+ ADD]
          </button>
        </div>
        <p className="text-xs text-terminal-text/50 mb-4">
          One-time expenses that reduce your balance (house, college, etc.)
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
                      onUpdateBigPurchase(
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
                        onUpdateBigPurchase(
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
                      onUpdateBigPurchase(
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
                    onClick={() => onRemoveBigPurchase(purchase.id)}
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
    </>
  );
}
