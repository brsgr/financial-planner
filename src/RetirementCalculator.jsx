import { useState } from "react";

export default function RetirementCalculator() {
  const [annualIncome, setAnnualIncome] = useState(50000);
  const [initialSavings, setInitialSavings] = useState(100000);
  const [savingsRate, setSavingsRate] = useState(15);

  // Define the ranges for the table
  const yearOptions = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
  const returnRateOptions = [0, 2, 4, 6, 8, 10, 12, 14];

  const calculateBalance = (years, returnRate) => {
    let balance = initialSavings;
    const annualContribution = annualIncome * (savingsRate / 100);

    for (let year = 0; year < years; year++) {
      balance = balance * (1 + returnRate / 100) + annualContribution;
    }

    return Math.round(balance);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">
          Retirement Calculator
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Plan your financial future with simple projections
        </p>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          {/* Controls */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Annual Income: ${annualIncome.toLocaleString()}
              </label>
              <input
                type="range"
                min="20000"
                max="1000000"
                step="10000"
                value={annualIncome}
                onChange={(e) => setAnnualIncome(Number(e.target.value))}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Savings Rate: {savingsRate}%
              </label>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={savingsRate}
                onChange={(e) => setSavingsRate(Number(e.target.value))}
                className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">
                Annual contribution: $
                {(annualIncome * (savingsRate / 100)).toLocaleString()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Initial Savings: ${initialSavings.toLocaleString()}
              </label>
              <input
                type="range"
                min="0"
                max="1000000"
                step="10000"
                value={initialSavings}
                onChange={(e) => setInitialSavings(Number(e.target.value))}
                className="w-full h-2 bg-teal-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Retirement Balance Projections
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Table shows projected balance based on years to retirement
              (columns) and annual return rate (rows)
            </p>
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-indigo-600 text-white">
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                    Return Rate
                  </th>
                  {yearOptions.map((year) => (
                    <th
                      key={year}
                      className="border border-gray-300 px-4 py-3 text-center font-semibold"
                    >
                      {year} yrs
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {returnRateOptions.map((rate, idx) => (
                  <tr
                    key={rate}
                    className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}
                  >
                    <td className="border border-gray-300 px-4 py-3 font-semibold text-gray-700">
                      {rate}%
                    </td>
                    {yearOptions.map((year) => {
                      const balance = calculateBalance(year, rate);
                      let bgColor = "";
                      if (balance > 10000000) {
                        bgColor = "bg-green-200";
                      } else if (balance > 5000000) {
                        bgColor = "bg-yellow-200";
                      }
                      return (
                        <td
                          key={`${rate}-${year}`}
                          className={`border border-gray-300 px-4 py-3 text-center ${bgColor}`}
                        >
                          ${(balance / 1000000).toFixed(2)}m
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center text-sm text-gray-600">
          <p>This is a simplified projection for educational purposes only.</p>
          <p>
            Actual investment returns vary and past performance doesn't
            guarantee future results.
          </p>
        </div>
      </div>
    </div>
  );
}
