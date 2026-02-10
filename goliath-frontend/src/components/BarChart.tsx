import { createEffect, onCleanup } from 'solid-js'
import {
  Chart,
  BarController,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import type { ChartConfiguration } from 'chart.js'

// Register Chart.js components
Chart.register(BarController, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface BarChartProps {
  labels: string[]
  data: number[]
  label: string
  backgroundColor?: string
  borderColor?: string
  height?: string
}

export default function BarChart(props: BarChartProps) {
  let canvasRef: HTMLCanvasElement | undefined
  let chartInstance: Chart | null = null

  createEffect(() => {
    if (!canvasRef) return

    // Destroy previous chart instance
    if (chartInstance) {
      chartInstance.destroy()
    }

    const ctx = canvasRef.getContext('2d')
    if (!ctx) return

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: props.labels,
        datasets: [
          {
            label: props.label,
            data: props.data,
            backgroundColor: props.backgroundColor || 'rgba(99, 102, 241, 0.5)',
            borderColor: props.borderColor || 'rgba(99, 102, 241, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 13,
            },
            bodyFont: {
              size: 12,
            },
            cornerRadius: 8,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              font: {
                size: 11,
              },
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                size: 11,
              },
            },
          },
        },
      },
    }

    chartInstance = new Chart(ctx, config)
  })

  onCleanup(() => {
    if (chartInstance) {
      chartInstance.destroy()
      chartInstance = null
    }
  })

  return (
    <div style={{ height: props.height || '300px', position: 'relative' }}>
      <canvas ref={canvasRef} />
    </div>
  )
}
