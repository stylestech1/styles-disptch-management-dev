"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Dayjs } from 'dayjs';

type FilterScope = string;
const DEFAULT_SCOPE = "global";

interface FilterState {
  fromDate: Dayjs | null;
  toDate: Dayjs | null;
  isFiltered: boolean;
}

interface FilterContextType {
  filters: Record<FilterScope, FilterState>;
  setFromDate: (date: Dayjs | null, scope?: FilterScope) => void;
  setToDate: (date: Dayjs | null, scope?: FilterScope) => void;
  setIsFiltered: (filtered: boolean, scope?: FilterScope) => void;
  applyFilter: (from: Dayjs | null, to: Dayjs | null, scope?: FilterScope) => void;
  clearFilter: (scope?: FilterScope) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const useFilter = (scope?: FilterScope) => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }

  const resolvedScope = scope || DEFAULT_SCOPE;
  const state = context.filters[resolvedScope] ?? {
    fromDate: null,
    toDate: null,
    isFiltered: false,
  };

  return {
    fromDate: state.fromDate,
    toDate: state.toDate,
    isFiltered: state.isFiltered,
    setFromDate: (date: Dayjs | null) => context.setFromDate(date, resolvedScope),
    setToDate: (date: Dayjs | null) => context.setToDate(date, resolvedScope),
    setIsFiltered: (filtered: boolean) => context.setIsFiltered(filtered, resolvedScope),
    applyFilter: (from: Dayjs | null, to: Dayjs | null) => context.applyFilter(from, to, resolvedScope),
    clearFilter: () => context.clearFilter(resolvedScope),
  };
};

interface FilterProviderProps {
  children: ReactNode;
}

export const FilterProvider: React.FC<FilterProviderProps> = ({ children }) => {
  const [filters, setFilters] = useState<Record<FilterScope, FilterState>>({
    [DEFAULT_SCOPE]: { fromDate: null, toDate: null, isFiltered: false },
  });

  const setScopeValue = <K extends keyof FilterState>(
    scope: FilterScope = DEFAULT_SCOPE,
    key: K,
    value: FilterState[K]
  ) => {
    setFilters((prev) => {
      const current = prev[scope] ?? { fromDate: null, toDate: null, isFiltered: false };
      return {
        ...prev,
        [scope]: {
          ...current,
          [key]: value,
        },
      };
    });
  };

  const applyFilter = (from: Dayjs | null, to: Dayjs | null, scope: FilterScope = DEFAULT_SCOPE) => {
    setFilters((prev) => ({
      ...prev,
      [scope]: {
        fromDate: from,
        toDate: to,
        isFiltered: !!(from && to),
      },
    }));
  };

  const clearFilter = (scope: FilterScope = DEFAULT_SCOPE) => {
    setFilters((prev) => ({
      ...prev,
      [scope]: {
        fromDate: null,
        toDate: null,
        isFiltered: false,
      },
    }));
  };

  const setFromDate = (date: Dayjs | null, scope: FilterScope = DEFAULT_SCOPE) => {
    setScopeValue(scope, "fromDate", date);
  };

  const setToDate = (date: Dayjs | null, scope: FilterScope = DEFAULT_SCOPE) => {
    setScopeValue(scope, "toDate", date);
  };

  const setIsFiltered = (filtered: boolean, scope: FilterScope = DEFAULT_SCOPE) => {
    setScopeValue(scope, "isFiltered", filtered);
  };

  return (
    <FilterContext.Provider
      value={{
        filters,
        setFromDate,
        setToDate,
        setIsFiltered,
        applyFilter,
        clearFilter,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};