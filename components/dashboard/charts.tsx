'use client'

import { useMemo } from 'react'
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  DoughnutController,
  Legend,
  LinearScale,
  Tooltip,
  type ChartOptions,
  type Plugin,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  COLORS,
  PROFS,
  PROFS_FR,
  SEGS,
  SPEND,
  SPEND_COLORS,
  SPEND_FR,
  fmt,
  mean,
  pct,
  type Customer,
  type Segment,
} from '@/lib/segmentation'

ChartJS.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Legend,
  LinearScale,
  Tooltip,
)

if (typeof window !== 'undefined') {
  ChartJS.defaults.font.family =
    getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif'
}
ChartJS.defaults.color = '#64748b'
ChartJS.defaults.plugins.legend.labels.boxWidth = 12
ChartJS.defaults.plugins.legend.labels.boxHeight = 12

const grid = { color: '#eef0f3' }
const segLabels = SEGS.map((s) => 'Segment ' + s)
const segColors = SEGS.map((s) => COLORS[s])

function bySegment(rows: Customer[]) {
  return Object.fromEntries(
    SEGS.map((s) => [s, rows.filter((r) => r.seg === s)]),
  ) as Record<Segment, Customer[]>
}

export function DistChart({ rows }: { rows: Customer[] }) {
  const data = useMemo(() => {
    const seg = bySegment(rows)
    return {
      labels: segLabels,
      datasets: [
        {
          data: SEGS.map((s) => seg[s].length),
          backgroundColor: segColors,
          borderColor: '#fff',
          borderWidth: 3,
        },
      ],
    }
  }, [rows])

  const options = useMemo<ChartOptions<'doughnut'>>(
    () => ({
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: { position: 'right' },
        tooltip: {
          callbacks: {
            label: (c) => {
              const t = (c.dataset.data as number[]).reduce((a, b) => a + b, 0) || 1
              return ` ${fmt.format(c.raw as number)} clients (${pct((c.raw as number) / t)})`
            },
          },
        },
      },
    }),
    [],
  )

  return <Doughnut data={data} options={options} />
}

const ageLabels: Plugin<'bar'> = {
  id: 'ageLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart
    chart.getDatasetMeta(0).data.forEach((bar, i) => {
      const v = chart.data.datasets[0].data[i] as number
      if (!v) return
      ctx.save()
      ctx.fillStyle = '#0f172a'
      ctx.font = `600 13px ${ChartJS.defaults.font.family}`
      ctx.textAlign = 'center'
      ctx.fillText(v.toFixed(1).replace('.', ',') + ' ans', bar.x, bar.y - 8)
      ctx.restore()
    })
  },
}

export function AgeChart({ rows }: { rows: Customer[] }) {
  const data = useMemo(() => {
    const seg = bySegment(rows)
    return {
      labels: segLabels,
      datasets: [
        {
          label: 'Âge moyen',
          data: SEGS.map((s) => mean(seg[s].map((r) => r.age))),
          backgroundColor: segColors,
          borderRadius: 8,
          maxBarThickness: 64,
        },
      ],
    }
  }, [rows])

  const options = useMemo<ChartOptions<'bar'>>(
    () => ({
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => ` ${(c.raw as number).toFixed(1).replace('.', ',')} ans`,
          },
        },
      },
      scales: {
        y: { beginAtZero: true, suggestedMax: 60, grid, title: { display: true, text: 'ans' } },
        x: { grid: { display: false } },
      },
    }),
    [],
  )

  return <Bar data={data} options={options} plugins={[ageLabels]} />
}

export type ProfMode = 'share' | 'count'

export function ProfChart({ rows, mode }: { rows: Customer[]; mode: ProfMode }) {
  const data = useMemo(
    () => ({
      labels: PROFS.map((p) => PROFS_FR[p]),
      datasets: SEGS.map((s) => ({
        label: 'Segment ' + s,
        backgroundColor: COLORS[s],
        borderRadius: 2,
        data: PROFS.map((p) => {
          const inProf = rows.filter((r) => r.p === p)
          const n = inProf.filter((r) => r.seg === s).length
          return mode === 'share' ? (inProf.length ? (n / inProf.length) * 100 : 0) : n
        }),
      })),
    }),
    [rows, mode],
  )

  const options = useMemo<ChartOptions<'bar'>>(
    () => ({
      indexAxis: 'y',
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: (c) =>
              mode === 'share'
                ? ` ${c.dataset.label} : ${(c.raw as number).toFixed(0)} %`
                : ` ${c.dataset.label} : ${fmt.format(c.raw as number)} clients`,
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          grid,
          max: mode === 'share' ? 100 : undefined,
          ticks: {
            callback: (v) => (mode === 'share' ? v + ' %' : fmt.format(Number(v))),
          },
        },
        y: { stacked: true, grid: { display: false } },
      },
    }),
    [mode],
  )

  return <Bar data={data} options={options} />
}

export function SpendChart({ rows }: { rows: Customer[] }) {
  const data = useMemo(() => {
    const seg = bySegment(rows)
    return {
      labels: segLabels,
      datasets: SPEND.map((k) => ({
        label: SPEND_FR[k],
        backgroundColor: SPEND_COLORS[k],
        borderRadius: 2,
        maxBarThickness: 64,
        data: SEGS.map((s) =>
          seg[s].length ? (seg[s].filter((r) => r.sp === k).length / seg[s].length) * 100 : 0,
        ),
      })),
    }
  }, [rows])

  const options = useMemo<ChartOptions<'bar'>>(
    () => ({
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: (c) => ` ${c.dataset.label} : ${(c.raw as number).toFixed(0)} %`,
          },
        },
      },
      scales: {
        y: { stacked: true, max: 100, grid, ticks: { callback: (v) => v + ' %' } },
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { color: segColors, font: { weight: 600 } },
        },
      },
    }),
    [],
  )

  return <Bar data={data} options={options} />
}

export function FamilyChart({ rows }: { rows: Customer[] }) {
  const data = useMemo(() => {
    const seg = bySegment(rows)
    return {
      labels: ['Taille du foyer', 'Expérience (années)'],
      datasets: SEGS.map((s) => ({
        label: 'Segment ' + s,
        backgroundColor: COLORS[s],
        borderRadius: 6,
        maxBarThickness: 36,
        data: [
          mean(seg[s].filter((r) => r.fam !== null).map((r) => r.fam as number)),
          mean(seg[s].filter((r) => r.we !== null).map((r) => r.we as number)),
        ],
      })),
    }
  }, [rows])

  const options = useMemo<ChartOptions<'bar'>>(
    () => ({
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: (c) => ` ${c.dataset.label} : ${(c.raw as number).toFixed(1).replace('.', ',')}`,
          },
        },
      },
      scales: { y: { beginAtZero: true, grid }, x: { grid: { display: false } } },
    }),
    [],
  )

  return <Bar data={data} options={options} />
}
