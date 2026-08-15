'use client'

import type { ReactNode } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface TopProduct {
  title: string
  units: number
}

export function TopProductsChart({ data }: { data: TopProduct[] }): ReactNode {
  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        No sales data yet.
      </div>
    )
  }
  return (
    <figure aria-label="Top products by units sold" className="m-0">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--muted-foreground)" strokeOpacity={0.2} />
            <XAxis type="number" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
            <YAxis type="category" dataKey="title" width={128} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
            <Tooltip />
            <Bar dataKey="units" fill="var(--chart-3)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Top products by units sold</caption>
        <thead>
          <tr>
            <th scope="col">Product</th>
            <th scope="col">Units</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.title}>
              <th scope="row">{d.title}</th>
              <td>{d.units}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
