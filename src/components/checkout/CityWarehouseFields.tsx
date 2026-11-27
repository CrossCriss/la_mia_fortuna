"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatCityLabel } from "@/lib/delivery/nova-poshta";
import {
  AUTOCOMPLETE_DEBOUNCE_MS,
  CITY_MIN_QUERY_LENGTH,
  WAREHOUSE_MIN_QUERY_LENGTH,
  isAbortError,
  shouldSearch,
} from "@/lib/checkout/autocomplete";

type NovaPoshtaCity = { ref: string; name: string; area: string };
type NovaPoshtaWarehouse = { ref: string; description: string; shortAddress: string; number: string };

type Selected = { ref: string; label: string };

export function CityWarehouseFields({
  city,
  warehouse,
  onCityChange,
  onWarehouseChange,
  cityError,
  warehouseError,
}: {
  city: Selected;
  warehouse: Selected;
  onCityChange: (value: Selected) => void;
  onWarehouseChange: (value: Selected) => void;
  cityError?: string;
  warehouseError?: string;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Combobox
        label="Місто"
        value={city.label}
        error={cityError}
        placeholder="Почніть вводити назву міста"
        onSelect={(option) => {
          onCityChange({ ref: option.ref, label: option.label });
          onWarehouseChange({ ref: "", label: "" });
        }}
        minQueryLength={CITY_MIN_QUERY_LENGTH}
        fetchOptions={async (query, signal) => {
          const response = await fetch(`/api/delivery/nova-poshta/cities?q=${encodeURIComponent(query)}`, { signal });
          if (!response.ok) return [];
          const cities: NovaPoshtaCity[] = await response.json();
          return cities.map((c) => ({ ref: c.ref, label: formatCityLabel(c) }));
        }}
      />

      <Combobox
        label="Відділення Нової Пошти"
        value={warehouse.label}
        error={warehouseError}
        placeholder={city.ref ? "Номер або адреса відділення" : "Спочатку оберіть місто"}
        disabled={!city.ref}
        onSelect={(option) => onWarehouseChange({ ref: option.ref, label: option.label })}
        searchKey={city.ref}
        minQueryLength={WAREHOUSE_MIN_QUERY_LENGTH}
        fetchOptions={async (query, signal) => {
          if (!city.ref) return [];
          const response = await fetch(
            `/api/delivery/nova-poshta/warehouses?cityRef=${encodeURIComponent(city.ref)}&q=${encodeURIComponent(query)}`,
            { signal }
          );
          if (!response.ok) return [];
          const warehouses: NovaPoshtaWarehouse[] = await response.json();
          return warehouses.map((w) => ({ ref: w.ref, label: w.description }));
        }}
      />
    </div>
  );
}

type Option = { ref: string; label: string };

function Combobox({
  label,
  value,
  placeholder,
  disabled,
  error,
  searchKey,
  minQueryLength,
  fetchOptions,
  onSelect,
}: {
  label: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  // Додатковий ключ, зміна якого потребує нового запиту (наприклад, обране місто).
  searchKey?: string;
  minQueryLength: number;
  fetchOptions: (query: string, signal: AbortSignal) => Promise<Option[]>;
  onSelect: (option: Option) => void;
}) {
  const [query, setQuery] = useState(value);
  const [options, setOptions] = useState<Option[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Свіжа функція завжди в ref, щоб ререндер батька не запускав новий запит.
  const fetchOptionsRef = useRef(fetchOptions);
  fetchOptionsRef.current = fetchOptions;

  useEffect(() => setQuery(value), [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen || !shouldSearch(query, minQueryLength)) {
      setOptions([]);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetchOptionsRef
        .current(query, controller.signal)
        .then((result) => {
          if (!controller.signal.aborted) setOptions(result);
        })
        .catch((error) => {
          if (isAbortError(error) || controller.signal.aborted) return;
          setOptions([]);
        });
    }, AUTOCOMPLETE_DEBOUNCE_MS);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, isOpen, searchKey, minQueryLength]);

  return (
    <div ref={containerRef} className="relative">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
        <input
          type="text"
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          className={cn(
            "w-full border bg-surface px-3 py-2.5 text-sm transition-colors focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-sale" : "border-border"
          )}
        />
        {error && <span className="mt-1 block text-xs text-sale">{error}</span>}
      </label>

      {isOpen && options.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto border border-border bg-surface shadow-lg">
          {options.map((option) => (
            <li key={option.ref}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-background"
                onClick={() => {
                  onSelect(option);
                  setQuery(option.label);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
