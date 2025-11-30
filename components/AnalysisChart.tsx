import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { DetectedTool } from '../types';

interface AnalysisChartProps {
  data: DetectedTool[];
}

const AnalysisChart: React.FC<AnalysisChartProps> = ({ data }) => {
  // Sort data by score descending for better visualization
  const sortedData = [...data].sort((a, b) => b.likelihoodScore - a.likelihoodScore);

  const getBarColor = (score: number) => {
    if (score >= 8) return '#ef4444'; // Red-500
    if (score >= 5) return '#f59e0b'; // Amber-500
    return '#3b82f6'; // Blue-500
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as DetectedTool;
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded shadow-xl text-xs sm:text-sm">
          <p className="font-bold text-slate-100 mb-1">{item.name}</p>
          <p className="text-slate-300">Score: <span className="font-mono text-cyan-400">{item.likelihoodScore}/10</span></p>
          <p className="text-slate-400 mt-1 italic max-w-[200px]">{item.reasoning}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[300px] mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis type="number" domain={[0, 10]} hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={100} 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
          />
          <Tooltip content={<CustomTooltip />} cursor={{fill: '#1e293b'}} />
          <Bar dataKey="likelihoodScore" radius={[0, 4, 4, 0]} barSize={20}>
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.likelihoodScore)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalysisChart;