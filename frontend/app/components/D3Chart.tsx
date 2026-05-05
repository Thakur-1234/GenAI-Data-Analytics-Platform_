'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface Visualization {
  type: string
  title: string
  x?: string
  y?: string | string[]
  values?: number[]
  labels?: string[]
  options?: Record<string, any>
}

interface Props {
  viz: Visualization
  data: any[]
  width?: number
  height?: number
  theme?: 'light' | 'dark'
}

export default function D3Chart({ viz, data, width = 600, height = 300, theme = 'light' }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 24, right: 24, bottom: 40, left: 50 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const colorScale = d3.scaleOrdinal<string>()
      .range(['#0ea5e9', '#10b981', '#f97316', '#6366f1', '#facc15', '#ec4899'])

    const container = svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('fill', 'none')

    const g = container.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const axisColor = theme === 'dark' ? '#d1d5db' : '#374151'
    const labelColor = theme === 'dark' ? '#f3f4f6' : '#111827'

    const drawAxes = (xScale: any, yScale: any, xLabel: string) => {
      g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).ticks(Math.min(10, data.length)))
        .selectAll('text')
        .attr('fill', axisColor)
        .attr('font-size', 10)
        .attr('transform', 'rotate(-30)')
        .style('text-anchor', 'end')

      g.append('g')
        .call(d3.axisLeft(yScale).ticks(6))
        .selectAll('text')
        .attr('fill', axisColor)
        .attr('font-size', 10)

      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + 35)
        .attr('fill', labelColor)
        .attr('text-anchor', 'middle')
        .attr('font-size', 12)
        .text(xLabel)
    }

    if (viz.type === 'bar') {
      const xKey = viz.x || ''
      const yKey = typeof viz.y === 'string' ? viz.y : Array.isArray(viz.y) ? viz.y[0] : ''
      const filtered = data
        .map((d) => ({
          x: d[xKey],
          y: Number(d[yKey])
        }))
        .filter((d) => d.x != null && Number.isFinite(d.y))

      const xValues = filtered.map((d) => String(d.x))
      const yValues = filtered.map((d) => d.y)

      const xScale = d3.scaleBand<string>()
        .domain(xValues)
        .range([0, innerWidth])
        .padding(0.2)

      const yScale = d3.scaleLinear()
        .domain([0, d3.max(yValues) ?? 0])
        .nice()
        .range([innerHeight, 0])

      drawAxes(xScale, yScale, xKey)

      g.selectAll('rect')
        .data(filtered)
        .enter()
        .append('rect')
        .attr('x', (d) => xScale(String(d.x)) ?? 0)
        .attr('y', (d) => yScale(d.y))
        .attr('width', xScale.bandwidth())
        .attr('height', (d) => innerHeight - yScale(d.y))
        .attr('fill', (d, i) => colorScale(String(i)))
        .append('title')
        .text((d) => `${d.x}: ${d.y}`)

    } else if (viz.type === 'line') {
      const xKey = viz.x || ''
      const yKeys = Array.isArray(viz.y) ? viz.y : [viz.y || '']
      const filtered = data
        .map((d) => ({
          x: d[xKey],
          y: yKeys.reduce((acc: number[], key) => {
            const val = Number(d[key])
            return acc.concat(Number.isFinite(val) ? val : [])
          }, [] as number[])
        }))
        .filter((d) => d.x != null && d.y.length > 0)

      const xScale = d3.scalePoint<string>()
        .domain(filtered.map((d) => String(d.x)))
        .range([0, innerWidth])
        .padding(0.5)

      const yMax = d3.max(filtered, (d) => d3.max(d.y)) ?? 0
      const yScale = d3.scaleLinear().domain([0, yMax]).nice().range([innerHeight, 0])

      drawAxes(xScale, yScale, xKey)

      yKeys.forEach((yKey, idx) => {
        g.append('path')
          .datum(filtered)
          .attr('fill', 'none')
          .attr('stroke', colorScale(String(idx)))
          .attr('stroke-width', 2)
          .attr('d', d3.line<any>()
            .x((d: any) => xScale(String(d.x)) ?? 0)
            .y((d: any) => yScale(d.y[idx]))
            .curve(d3.curveMonotoneX)
          )

  
        g.append('text')
          .attr('x', innerWidth - 10)
          .attr('y', 10 + idx * 16)
          .attr('text-anchor', 'end')
          .attr('fill', labelColor)
          .attr('font-size', 10)
          .text(yKey)
      })

    } else if (viz.type === 'pie') {
      const labels = viz.labels || []
      const values = viz.values || []
      const pieData = labels.map((label, idx) => ({ label, value: values[idx] ?? 0 }))

      const radius = Math.min(innerWidth, innerHeight) / 2
      const pieGroup = g.append('g').attr('transform', `translate(${innerWidth / 2},${innerHeight / 2})`)

      const pie = d3.pie<any>().value((d) => d.value)(pieData)
      const arc = d3.arc<any>().innerRadius(0).outerRadius(radius)

      pieGroup.selectAll('path')
        .data(pie)
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => colorScale(String(i)))
        .attr('stroke', theme === 'dark' ? '#0f172a' : '#ffffff')
        .attr('stroke-width', 1)
        .append('title')
        .text((d) => `${d.data.label}: ${d.data.value}`)

      // Legend
      const legend = g.append('g').attr('transform', `translate(${innerWidth - 120}, 0)`)
      pieData.forEach((d, i) => {
        const row = legend.append('g').attr('transform', `translate(0, ${i * 18})`)
        row.append('rect')
          .attr('width', 10)
          .attr('height', 10)
          .attr('fill', colorScale(String(i)))
        row.append('text')
          .attr('x', 14)
          .attr('y', 10)
          .attr('fill', labelColor)
          .attr('font-size', 10)
          .text(d.label)
      })

    } else {
      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight / 2)
        .attr('fill', labelColor)
        .attr('text-anchor', 'middle')
        .attr('font-size', 14)
        .text('Visualization type not supported yet')
    }
  }, [viz, data, width, height, theme])

  return (
    <div className="w-full h-full">
      <svg ref={svgRef} />
    </div>
  )
}
