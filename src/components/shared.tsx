import React, { useState } from 'react';
import { Search, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

// ==========================================
// 1. MetricCard Component
// ==========================================
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor?: string; // Tailwind class like bg-blue-50
  iconColor?: string; // Tailwind class like text-blue-600
  trend?: {
    value: string;
    isPositive: boolean;
  };
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = 'bg-slate-100',
  iconColor = 'text-slate-600',
  trend,
  onClick,
}) => {
  const cardContent = (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>}
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            <span
              className={`text-xs font-bold px-1.5 py-0.5 rounded-sm ${
                trend.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">vs last month</span>
          </div>
        )}
      </div>
      <div className={`p-3.5 sm:p-4 rounded-xl ${iconBgColor} ${iconColor} shadow-sm transition-transform duration-300 hover:scale-105`}>
        {icon}
      </div>
    </div>
  );

  const baseStyles = "bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] transition-all duration-200";

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${baseStyles} hover:border-indigo-100 hover:shadow-[0_4px_12px_-3px_rgba(99,102,241,0.1)] cursor-pointer text-left w-full block focus:outline-none focus:ring-2 focus:ring-indigo-500/10`}
      >
        {cardContent}
      </button>
    );
  }

  return <div className={baseStyles}>{cardContent}</div>;
};

// ==========================================
// 2. RiskBadge Component
// ==========================================
interface RiskBadgeProps {
  isAtRisk: boolean;
  reason?: string;
  compact?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ isAtRisk, reason, compact = false }) => {
  if (isAtRisk) {
    return (
      <div className="inline-flex flex-col items-start gap-1">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100 shadow-sm animate-pulse-slow">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          At Risk
        </span>
        {!compact && reason && (
          <span className="text-[10px] text-rose-500 font-medium max-w-[200px] leading-tight">
            {reason}
          </span>
        )}
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm">
      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      On Track
    </span>
  );
};

// ==========================================
// 3. DataTable Component
// ==========================================
interface DataTableProps<T> {
  headers: string[];
  data: T[];
  renderRow: (item: T, index: number) => React.ReactNode;
  onRowClick?: (item: T) => void;
  searchPlaceholder?: string;
  searchField?: keyof T;
  searchFields?: (keyof T)[]; // Multiple search fields
}

export function DataTable<T>({
  headers,
  data,
  renderRow,
  onRowClick,
  searchPlaceholder = 'Search...',
  searchField,
  searchFields,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');

  // Handle Filtering
  const filteredData = data.filter((item) => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();

    if (searchFields) {
      return searchFields.some((field) => {
        const val = item[field];
        return val ? String(val).toLowerCase().includes(term) : false;
      });
    }

    if (searchField) {
      const val = item[searchField];
      return val ? String(val).toLowerCase().includes(term) : false;
    }

    // Default: search all keys
    return Object.values(item as object).some((val) =>
      val ? String(val).toLowerCase().includes(term) : false
    );
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] overflow-hidden">
      {/* Search Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h4 className="font-semibold text-slate-800 text-sm tracking-wide">RECORDS LIST ({filteredData.length})</h4>
        <div className="relative w-full sm:w-72">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-left">
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.length > 0 ? (
              filteredData.map((item, index) => {
                const clickable = typeof onRowClick === 'function';
                return (
                  <tr
                    key={index}
                    onClick={() => clickable && onRowClick!(item)}
                    className={`transition-colors duration-150 ${
                      clickable ? 'hover:bg-slate-50/70 cursor-pointer' : ''
                    }`}
                  >
                    {renderRow(item, index)}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={headers.length} className="px-6 py-12 text-center text-sm text-slate-400">
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
