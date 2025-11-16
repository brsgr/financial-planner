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

      {/* Big Purchases */}
      <div className="mb-8 border border-terminal-border p-4 bg-terminal-bg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs text-terminal-amber">[BIG_PURCHASES]</h3>
          <div className="flex gap-2">
            <button
              onClick={() => onAddBigPurchase("purchase")}
              className="text-xs text-terminal-green hover:text-terminal-greenDim border border-terminal-green px-2 py-1 transition-colors"
            >
              [+ PURCHASE]
            </button>
            <button
              onClick={() => onAddBigPurchase("mortgage")}
              className="text-xs text-terminal-green hover:text-terminal-greenDim border border-terminal-green px-2 py-1 transition-colors"
            >
              [+ MORTGAGE]
            </button>
          </div>
        </div>
        <p className="text-xs text-terminal-text/50 mb-4">
          One-time purchases or mortgages that affect your balance
        </p>
        {bigPurchases.length === 0 ? (
          <p className="text-xs text-terminal-text/30 italic">
            No purchases configured. Click [+ PURCHASE] or [+ MORTGAGE] to add
            one.
          </p>
        ) : (
          <div className="space-y-3">
            {bigPurchases.map((purchase) =>
              purchase.type === "mortgage" ? (
                // Mortgage rendering
                <div
                  key={purchase.id}
                  className="border border-terminal-border/50 p-3 bg-terminal-bgLight"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-terminal-amber">
                      [MORTGAGE]
                    </span>
                    <button
                      onClick={() => onRemoveBigPurchase(purchase.id)}
                      className="text-xs text-terminal-text/50 hover:text-terminal-amber border border-terminal-border px-2 py-1 transition-colors"
                    >
                      [X]
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-terminal-text/60 block mb-1">
                        Start Year
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
                        className="w-full bg-terminal-bg border border-terminal-border text-terminal-amber text-xs px-2 py-1 focus:outline-none focus:border-terminal-amber"
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
                        Description
                      </label>
                      <input
                        type="text"
                        value={purchase.description || ""}
                        onChange={(e) =>
                          onUpdateBigPurchase(
                            purchase.id,
                            "description",
                            e.target.value,
                          )
                        }
                        placeholder="e.g., Primary home"
                        className="w-full bg-terminal-bg border border-terminal-border text-terminal-amber text-xs px-2 py-1 focus:outline-none focus:border-terminal-amber placeholder:text-terminal-text/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-terminal-text/60 block mb-1">
                        House Cost ($)
                      </label>
                      <input
                        type="text"
                        value={purchase.houseCost || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (
                            val === "" ||
                            (!isNaN(parseFloat(val)) && parseFloat(val) >= 0)
                          ) {
                            onUpdateBigPurchase(
                              purchase.id,
                              "houseCost",
                              val === "" ? 0 : parseFloat(val),
                            );
                          }
                        }}
                        placeholder="500000"
                        className="w-full bg-terminal-bg border border-terminal-border text-terminal-amber text-xs px-2 py-1 focus:outline-none focus:border-terminal-amber placeholder:text-terminal-text/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-terminal-text/60 block mb-1">
                        Down Payment ($)
                      </label>
                      <input
                        type="text"
                        value={purchase.downPayment || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (
                            val === "" ||
                            (!isNaN(parseFloat(val)) && parseFloat(val) >= 0)
                          ) {
                            onUpdateBigPurchase(
                              purchase.id,
                              "downPayment",
                              val === "" ? 0 : parseFloat(val),
                            );
                          }
                        }}
                        placeholder="100000"
                        className="w-full bg-terminal-bg border border-terminal-border text-terminal-amber text-xs px-2 py-1 focus:outline-none focus:border-terminal-amber placeholder:text-terminal-text/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-terminal-text/60 block mb-1">
                        Interest Rate (%)
                      </label>
                      <input
                        type="text"
                        value={purchase.interestRate ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (
                            val === "" ||
                            (!isNaN(parseFloat(val)) && parseFloat(val) >= 0)
                          ) {
                            onUpdateBigPurchase(
                              purchase.id,
                              "interestRate",
                              val === "" ? 0 : parseFloat(val),
                            );
                          }
                        }}
                        placeholder="6.5"
                        className="w-full bg-terminal-bg border border-terminal-border text-terminal-amber text-xs px-2 py-1 focus:outline-none focus:border-terminal-amber placeholder:text-terminal-text/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-terminal-text/60 block mb-1">
                        Mortgage Term (years)
                      </label>
                      <input
                        type="text"
                        value={purchase.mortgageTerm || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (
                            val === "" ||
                            (!isNaN(parseInt(val)) && parseInt(val) > 0)
                          ) {
                            onUpdateBigPurchase(
                              purchase.id,
                              "mortgageTerm",
                              val === "" ? 30 : parseInt(val),
                            );
                          }
                        }}
                        placeholder="30"
                        className="w-full bg-terminal-bg border border-terminal-border text-terminal-amber text-xs px-2 py-1 focus:outline-none focus:border-terminal-amber placeholder:text-terminal-text/30"
                      />
                    </div>
                  </div>
                  {purchase.houseCost &&
                    purchase.downPayment &&
                    purchase.interestRate !== undefined &&
                    purchase.mortgageTerm && (
                      <div className="mt-2 text-xs text-terminal-text/50">
                        → Monthly payment: $
                        {(() => {
                          const principal =
                            purchase.houseCost - purchase.downPayment;
                          const monthlyRate = purchase.interestRate / 100 / 12;
                          const numPayments = purchase.mortgageTerm * 12;
                          const monthlyPayment =
                            (principal *
                              (monthlyRate *
                                Math.pow(1 + monthlyRate, numPayments))) /
                            (Math.pow(1 + monthlyRate, numPayments) - 1);
                          return monthlyPayment.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          });
                        })()}
                        /mo ($
                        {(
                          (((purchase.houseCost - purchase.downPayment) *
                            (purchase.interestRate / 100 / 12) *
                            Math.pow(
                              1 + purchase.interestRate / 100 / 12,
                              purchase.mortgageTerm * 12,
                            )) /
                            (Math.pow(
                              1 + purchase.interestRate / 100 / 12,
                              purchase.mortgageTerm * 12,
                            ) -
                              1)) *
                          12
                        ).toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                        /yr)
                      </div>
                    )}
                </div>
              ) : (
                // Regular purchase rendering
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
                      placeholder="e.g., car, college"
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
              ),
            )}
          </div>
        )}
      </div>
    </>
  );
}
