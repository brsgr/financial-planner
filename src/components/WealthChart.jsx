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

export default function WealthChart({
  selectedCell,
  calculateYearlyProgression,
  onClose,
}) {
  if (!selectedCell) return null;

  const data = calculateYearlyProgression(
    selectedCell.years,
    selectedCell.returnRate,
  );

  return (
    <div className="mt-8 border border-terminal-border p-4 bg-terminal-bg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs text-terminal-amber">
          [WEALTH_ACCUMULATION_GRAPH] - {selectedCell.years} years @{" "}
          {selectedCell.returnRate}% return
        </h3>
        <button
          onClick={onClose}
          className="text-xs text-terminal-text/50 hover:text-terminal-amber border border-terminal-border px-2 py-1 transition-colors"
        >
          [X CLOSE]
        </button>
      </div>
      <div className="h-96 bg-terminal-bgLight p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
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
              tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
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
              formatter={(value) => [`$${value.toLocaleString()}`, "Balance"]}
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
            {data.map((point, idx) =>
              point.events && point.events.length > 0
                ? point.events.map((event, eventIdx) => (
                    <ReferenceDot
                      key={`${idx}-${eventIdx}`}
                      x={point.year}
                      y={point.balance}
                      r={6}
                      fill={event.type === "purchase" ? "#ff6b6b" : "#d4af37"}
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
  );
}
