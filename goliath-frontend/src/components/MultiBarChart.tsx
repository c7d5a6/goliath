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

interface Dataset {
  label: string
  data: number[]
  backgroundColor: string
  borderColor: string
}

interface MultiBarChartProps {
  labels: string[]
  datasets: Dataset[]
  height?: string
  yAxisLabel?: string
}

// Predefined color palette
const colorPalette = [
  { bg: 'rgba(99, 102, 241, 0.6)', border: 'rgba(99, 102, 241, 1)' },    // Indigo
  { bg: 'rgba(236, 72, 153, 0.6)', border: 'rgba(236, 72, 153, 1)' },    // Pink
  { bg: 'rgba(34, 197, 94, 0.6)', border: 'rgba(34, 197, 94, 1)' },      // Green
  { bg: 'rgba(251, 146, 60, 0.6)', border: 'rgba(251, 146, 60, 1)' },    // Orange
  { bg: 'rgba(168, 85, 247, 0.6)', border: 'rgba(168, 85, 247, 1)' },    // Purple
  { bg: 'rgba(59, 130, 246, 0.6)', border: 'rgba(59, 130, 246, 1)' },    // Blue
  { bg: 'rgba(234, 179, 8, 0.6)', border: 'rgba(234, 179, 8, 1)' },      // Yellow
  { bg: 'rgba(20, 184, 166, 0.6)', border: 'rgba(20, 184, 166, 1)' },    // Teal
]

export default function MultiBarChart(props: MultiBarChartProps) {
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

    // Apply colors from palette if not provided
    const datasets = props.datasets.map((dataset, index) => {
      const colors = colorPalette[index % colorPalette.length]
      return {
        label: dataset.label,
        data: dataset.data,
        backgroundColor: dataset.backgroundColor || colors.bg,
        borderColor: dataset.borderColor || colors.border,
        borderWidth: 1,
      }
    })

    // Calculate max value from all datasets
    let maxValue = 100
    const dataValues = props.datasets.flatMap(dataset => dataset.data)
    const maxDataValue = Math.max(...dataValues)
    if (maxDataValue > 100) {
      // Round up to nearest 10
      maxValue = Math.ceil(maxDataValue / 10) * 10
    }

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: props.labels,
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                size: 12,
              },
              padding: 15,
              usePointStyle: true,
              pointStyle: 'rectRounded',
            },
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
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || ''
                if (label) {
                  label += ': '
                }
                const value = context.parsed.y ?? 0
                label += Math.round(value * 10) / 10 + '%'
                return label
              }
            }
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: maxValue,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              font: {
                size: 11,
              },
              callback: function(value) {
                return value + '%'
              }
            },
            title: {
              display: !!props.yAxisLabel,
              text: props.yAxisLabel || '',
              font: {
                size: 12,
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
