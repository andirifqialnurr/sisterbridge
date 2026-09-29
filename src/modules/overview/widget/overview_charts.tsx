"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

import { theme } from "@/const/theme";
import { useTheme } from "@/hook/use-theme";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type ChartPalette = {
  categorical: readonly string[];
  sequential: string;
  surface: string;
  grid: string;
  text: string;
  muted: string;
};

function usePalette(): { mode: "light" | "dark"; palette: ChartPalette } {
  const { resolvedTheme } = useTheme();
  return { mode: resolvedTheme, palette: theme.chartPalette[resolvedTheme] };
}

// Shared anatomy: hairline solid grid, muted axes, no toolbar/animation.
function baseOptions(palette: ChartPalette, mode: "light" | "dark"): ApexOptions {
  return {
    chart: {
      background: "transparent",
      fontFamily: theme.typography.sans,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: false },
    },
    theme: { mode },
    grid: { borderColor: palette.grid, strokeDashArray: 0 },
    xaxis: {
      axisBorder: { color: palette.grid },
      axisTicks: { color: palette.grid },
      labels: { style: { colors: palette.muted } },
    },
    yaxis: { labels: { style: { colors: palette.muted } } },
    legend: {
      position: "top",
      horizontalAlign: "left",
      labels: { colors: palette.text },
      markers: { size: 5 },
    },
    tooltip: { theme: mode },
    states: { hover: { filter: { type: "lighten" } } },
  };
}

const integer = (value: number) => Math.round(value).toLocaleString("id-ID");

// Trend over time for up to three output types (categorical slots 1-3).
export function LuaranTrendChart({
  years,
  series,
  currentYear,
}: {
  years: number[];
  series: { label: string; data: number[] }[];
  // The running year is still incomplete; its axis label says so.
  currentYear?: number;
}) {
  const { mode, palette } = usePalette();
  const last = years.length - 1;
  const base = baseOptions(palette, mode);
  const options: ApexOptions = {
    ...base,
    colors: [...palette.categorical.slice(0, series.length)],
    stroke: { width: 2, curve: "straight", lineCap: "round" },
    markers: {
      size: 0,
      strokeColors: palette.surface,
      strokeWidth: 2,
      hover: { size: 5 },
      // End dots anchor the direct labels.
      discrete: series.map((_, index) => ({
        seriesIndex: index,
        dataPointIndex: last,
        size: 4,
        fillColor: palette.categorical[index],
        strokeColor: palette.surface,
      })),
    },
    dataLabels: {
      enabled: true,
      // Direct label only at the end of each line; other values live in the
      // tooltip and table view.
      formatter: (value, context) =>
        context?.dataPointIndex === last
          ? `${series[context.seriesIndex].label} ${integer(Number(value))}`
          : "",
      offsetX: 6,
      textAnchor: "start",
      background: { enabled: false },
      style: { colors: [palette.text], fontSize: "11px", fontWeight: 600 },
    },
    xaxis: {
      ...base.xaxis,
      categories: years.map((year) => (year === currentYear ? `${year}*` : String(year))),
      crosshairs: { show: true },
    },
    yaxis: { min: 0, forceNiceScale: true, labels: { style: { colors: palette.muted }, formatter: integer } },
    grid: { ...base.grid, padding: { right: 110 } },
    tooltip: { theme: mode, shared: true, intersect: false, y: { formatter: integer } },
  };

  return (
    <Chart
      height={280}
      options={options}
      series={series.map((entry) => ({ name: entry.label, data: entry.data }))}
      type="line"
    />
  );
}

// Magnitude comparison of one measure: single brand hue, sorted, horizontal.
export function StatusBarChart({ rows }: { rows: { label: string; total: number }[] }) {
  const { mode, palette } = usePalette();
  const base = baseOptions(palette, mode);
  const height = Math.max(160, rows.length * 36 + 40);
  const options: ApexOptions = {
    ...base,
    colors: [palette.sequential],
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: "60%",
        borderRadius: 4,
        borderRadiusApplication: "end",
        dataLabels: { position: "top" },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => integer(Number(value)),
      offsetX: 22,
      style: { colors: [palette.text], fontSize: "11px", fontWeight: 600 },
    },
    xaxis: { ...base.xaxis, categories: rows.map((row) => row.label), labels: { show: false } },
    yaxis: { labels: { style: { colors: palette.muted }, maxWidth: 180 } },
    grid: { ...base.grid, xaxis: { lines: { show: false } }, yaxis: { lines: { show: false } }, padding: { right: 24 } },
    legend: { show: false },
    tooltip: { theme: mode, y: { formatter: integer, title: { formatter: () => "SDM" } } },
  };

  return (
    <Chart
      height={height}
      options={options}
      series={[{ name: "SDM", data: rows.map((row) => row.total) }]}
      type="bar"
    />
  );
}

// Part-to-whole per semester: stacked columns, categorical slots 1-2,
// separated by a 2px surface gap.
export function BkdSemesterChart({
  semesters,
}: {
  semesters: { label: string; memenuhi: number; tidak_memenuhi: number }[];
}) {
  const { mode, palette } = usePalette();
  const base = baseOptions(palette, mode);
  const options: ApexOptions = {
    ...base,
    chart: { ...base.chart, stacked: true },
    colors: [...palette.categorical.slice(0, 2)],
    stroke: { show: true, width: 2, colors: [palette.surface] },
    plotOptions: {
      bar: {
        columnWidth: "28%",
        borderRadius: 4,
        borderRadiusApplication: "end",
        borderRadiusWhenStacked: "last",
      },
    },
    dataLabels: { enabled: false },
    xaxis: { ...base.xaxis, categories: semesters.map((semester) => semester.label) },
    yaxis: { min: 0, forceNiceScale: true, labels: { style: { colors: palette.muted }, formatter: integer } },
    tooltip: { theme: mode, shared: true, intersect: false, y: { formatter: (value) => `${integer(value)} dosen` } },
  };

  return (
    <Chart
      height={280}
      options={options}
      series={[
        { name: "Memenuhi", data: semesters.map((semester) => semester.memenuhi) },
        { name: "Tidak memenuhi", data: semesters.map((semester) => semester.tidak_memenuhi) },
      ]}
      type="bar"
    />
  );
}
