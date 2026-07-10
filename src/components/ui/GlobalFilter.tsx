// components/ui/GlobalFilter.tsx
"use client";
import React from 'react';
import { useFilter } from '@/providers/FilterProvider';
import DateRangeFilter from './Filter';
import { Dayjs } from 'dayjs';

interface GlobalFilterProps {
  filterType: 'loads' | 'drivers' | 'trucks' | 'default';
  onFilterChange?: (from: Dayjs | null, to: Dayjs | null) => void;
  filterScope?: string;
}

const GlobalFilter: React.FC<GlobalFilterProps> = ({ 
  onFilterChange,
  filterScope,
}) => {
  const { applyFilter, clearFilter } = useFilter(filterScope);

  const handleApply = (from: Dayjs | null, to: Dayjs | null) => {
    applyFilter(from, to);
    onFilterChange?.(from, to);
  };

  const handleClear = () => {
    clearFilter();
    onFilterChange?.(null, null);
  };

  return (
    <div>
      <DateRangeFilter
        onApply={handleApply}
        onClear={handleClear}
        onFilterApplied={() => undefined}
      />
    </div>
  );
};

export default GlobalFilter;