'use client'

import type { ReactNode } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface RevenuePoint {
  month: string
  revenue: number // cents
}

const dollars = (cents: number): string => `$${Math.round(cents / 100).toLocaleString()}`

export function RevenueChart({ data }: { data: RevenuePoint[] }): ReactNode {
  return (
    <figure aria-label="Monthly revenue over the last 12 months" className="m-0">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--muted-foreground)" strokeOpacity={0.2} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
            <YAxis tickFormatter={dollars} width={64} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
            <Tooltip formatter={(value) => dollars(Number(value))} />
            <Line type="monotone" dataKey="revenue" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* Screen-reader fallback: the chart is decorative to AT, the table carries the data. */}
      <table className="sr-only">
        <caption>Monthly revenue</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <th scope="row">{d.month}</th>
              <td>{dollars(d.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
