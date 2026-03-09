"use client"

import { useState, useMemo } from "react";
import { 
    Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, 
    Legend, LabelList 
} from "recharts";
import { RotateCcw, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoaderState } from "@/components/ui/loader-state"; 
import { EmptyState } from "@/components/portal/empty-state"; 
import { formatCurrency } from "@/lib/formatter";
import { TIME_FILTER } from "@/lib/constants";

interface PerformanceChartProps {
    data: any[]; 
    loading: boolean;
    filter: string;
    onFilterChange: (val: string) => void;
}

export function PerformanceChart({ data, loading, filter, onFilterChange }: PerformanceChartProps) {
    // UI State for toggling bars
    const [visibleSeries, setVisibleSeries] = useState({ Actual: true, Forecast: true });

    // Process Data: Handle String -> Number conversion safely
    const chartData = useMemo(() => {
        if (!data) return [];
        return data.map((item: any) => ({
            name: item.dayName ? item.dayName.substring(0, 3) : "N/A",
            // FIX: Ensure these are numbers to prevent "invisible bars"
            Actual: Number(item.actualAmount || 0), 
            Forecast: Number(item.forecastAmount || 0),
            fullDate: item.date ? new Date(item.date).toLocaleDateString() : "",
            isForecast: item.isForecast || false
        }));
    }, [data]);

    const handleLegendClick = (e: any) => {
        const seriesName = e.dataKey as keyof typeof visibleSeries;
        setVisibleSeries(prev => ({ ...prev, [seriesName]: !prev[seriesName] }));
    };

    return (
        <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle>Performance Overview</CardTitle>
                        <CardDescription className="mt-1">Weekly Sales Revenue</CardDescription>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* Reset View Button */}
                        {(!visibleSeries.Actual || !visibleSeries.Forecast) && (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setVisibleSeries({ Actual: true, Forecast: true })} 
                                className="h-9 w-9"
                            >
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        )}

                        {/* Filter Select */}
                        <Select value={filter} onValueChange={onFilterChange} disabled={loading}>
                            <SelectTrigger className="w-[130px] h-9 text-xs">
                                <SelectValue placeholder="Period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TIME_FILTER.THIS_WEEK}>This Week</SelectItem>
                                <SelectItem value={TIME_FILTER.NEXT_WEEK}>Next Week</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pl-0">
                <div className="h-[300px] w-full">
                    {loading && data.length === 0 ? (
                        <LoaderState message="Loading chart data..." className="h-full min-h-[300px] border-none bg-transparent" />
                    ) : chartData.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <EmptyState icon={BarChart3} title="No data available" description="Sales trends will appear here." />
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 15, bottom: 5 }}>
                                <defs>
                                    <pattern id="stripe-pattern" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                                        <rect width="4" height="8" transform="translate(0,0)" fill="#9333EA" opacity="0.3" />
                                    </pattern>
                                </defs>

                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                
                                <YAxis 
                                    stroke="hsl(var(--muted-foreground))" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickFormatter={(value) => `RM${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`} 
                                />
                                
                                <Tooltip 
                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }} 
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            const activeItem = payload.find(p => (p.value as number) > 0) || payload[0];
                                            const data = activeItem.payload;
                                            const isForecastBar = activeItem.dataKey === "Forecast";
                                            
                                            return (
                                                <div className="bg-popover border border-border p-3 rounded-lg shadow-xl text-sm">
                                                    <div className="flex items-center justify-between gap-4 mb-1">
                                                        <span className="font-semibold">{label}</span>
                                                        {isForecastBar && (
                                                            <Badge variant="outline" className="h-5 px-1.5 text-[10px] border-purple-200 text-purple-700 bg-purple-50">Forecast</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mb-2">{data.fullDate}</p>
                                                    <p className="text-primary font-bold text-base">{formatCurrency(activeItem.value as number)}</p>
                                                </div>
                                            )
                                        }
                                        return null;
                                    }}
                                />
                                
                                <Legend 
                                    verticalAlign="top" height={36} iconType="circle" onClick={handleLegendClick}
                                    formatter={(value) => {
                                        const isVisible = visibleSeries[value as keyof typeof visibleSeries];
                                        return <span className={`text-sm font-medium ml-1 ${!isVisible ? "text-muted-foreground opacity-50 decoration-slate-400 line-through" : "text-foreground"}`}>{value}</span>
                                    }}
                                />

                                <Bar 
                                    dataKey="Actual" 
                                    fill="#4F46E5" 
                                    radius={[4, 4, 4, 4]} 
                                    hide={!visibleSeries.Actual} 
                                    animationDuration={1000} 
                                    barSize={40}
                                    minPointSize={2} 
                                >
                                    <LabelList dataKey="Actual" position="top" className="fill-foreground font-bold text-[10px]" formatter={(val: any) => val > 0 ? `RM${val}` : ''} />
                                </Bar>

                                <Bar 
                                    dataKey="Forecast" 
                                    fill="url(#stripe-pattern)" 
                                    radius={[4, 4, 4, 4]}
                                    hide={!visibleSeries.Forecast} 
                                    animationDuration={1000} 
                                    barSize={40}
                                    minPointSize={2}
                                >
                                    <LabelList dataKey="Forecast" position="top" className="fill-muted-foreground font-medium text-[10px]" formatter={(val: any) => val > 0 ? `RM${Number(val).toFixed(0)}` : ''} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}