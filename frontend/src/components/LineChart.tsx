// Export required Chart.js elements - this is only used in LineChart.tsx
import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js';

// Register Chart.js components at import time
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
);

interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  borderWidth?: number;
  pointRadius?: number;
  pointHoverRadius?: number;
  tension?: number;
  borderDash?: number[];
}

interface LineChartProps {
  labels: string[];
  datasets: ChartDataset[];
  options?: any;
  className?: string;
}

// Use imported and registered Chart.js
const LineChart: React.FC<LineChartProps> = ({ 
  labels, 
  datasets, 
  options = {}, 
  className = '' 
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Create and update chart
  useEffect(() => {
    if (!chartRef.current) return;

    // Clean up existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Create new chart
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: options
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [labels, datasets, options]);

  return (
    <div className={className}>
      <canvas ref={chartRef} />
    </div>
  );
};

export default LineChart;