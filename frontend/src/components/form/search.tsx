"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { fetchScrapy } from "@/utils/fetchScrapy";
import { fetchData } from "@/utils/fetchData";

type Status = {
  value: string;
  label: string;
};

// Lista de statuses
const statuses: Status[] = [
  { value: "erome", label: "erome" },
  { value: "coomer", label: "coomer" },
  { value: "bunkr", label: "bunkr" },
  { value: "todos", label: "todos" },
];

// Componente Scraper
function Scraper({
  onSelectStatus,
  initialStatus,
}: {
  onSelectStatus: (status: Status | null) => void;
  initialStatus: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [selectedStatus, setSelectedStatus] = React.useState<Status | null>(
    statuses.find((status) => status.value === initialStatus) || null,
  );

  useEffect(() => {
    // Actualizar el estado cuando cambie initialStatus
    const status =
      statuses.find((status) => status.value === initialStatus) || null;
    setSelectedStatus(status);
  }, [initialStatus]);

  return (
    <div className="flex items-center space-x-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-[150px] justify-start"
            onClick={() => setOpen(!open)}
          >
            {selectedStatus ? selectedStatus.label : "Selecciona scraper"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 z-[100]" side="bottom" align="start">
          <Command>
            <CommandList>
              <CommandEmpty>No hay resultados</CommandEmpty>
              <CommandGroup>
                {statuses.map((status) => (
                  <CommandItem
                    key={status.value}
                    value={status.value}
                    onSelect={() => {
                      setSelectedStatus(status);
                      onSelectStatus(status);
                      setOpen(false);
                    }}
                  >
                    {status.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Componente InputWithButton
export function InputWithButton() {
  // Obtener valores iniciales de la URL usando URLSearchParams
  const getInitialValues = () => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      return {
        modelName: urlParams.get("model") || "",
        scraperValue: urlParams.get("scraper") || "bunkr",
      };
    }
    return { modelName: "", scraperValue: "bunkr" };
  };

  const { modelName: initialModelName, scraperValue: initialScraperValue } =
    getInitialValues();

  const [modelName, setModelName] = useState(initialModelName);
  const [selectedScraper, setSelectedScraper] = React.useState<Status | null>(
    statuses.find((status) => status.value === initialScraperValue) || null,
  );
  const [loadingScrape, setLoadingScrape] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Actualizar la URL cuando cambien los valores
  const updateURL = (model: string, scraper: string) => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams();
      if (model) urlParams.set("model", model);
      if (scraper) urlParams.set("scraper", scraper);

      const newURL = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""}`;
      window.history.pushState({}, "", newURL);
    }
  };

  // Manejar cambios en el input
  const handleModelNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setModelName(newValue);
    updateURL(newValue, selectedScraper?.value || "bunkr");
  };

  // Manejar cambios en el selector de scraper
  const handleScraperChange = (status: Status | null) => {
    setSelectedScraper(status);
    if (status) {
      updateURL(modelName, status.value);
    }
  };

  const handleSearch = async () => {
    if (!modelName) {
      alert("Por favor, ingresa el nombre del modelo.");
      return;
    }

    if (!selectedScraper) {
      alert("Por favor, selecciona un scraper.");
      return;
    }

    setLoadingScrape(true);
    setError(null);

    try {
      const data = await fetchScrapy(selectedScraper.value, modelName);
      console.log("Datos obtenidos (Scrapear):", data);
    } catch (error) {
      console.error("Error al scrapear:", error);
      setError("Error al scrapear. Por favor, intenta de nuevo.");
    } finally {
      setLoadingScrape(false);
    }
  };

  const handleData = async () => {
    if (!modelName) {
      alert("Por favor, ingresa el nombre del modelo.");
      return;
    }

    setLoadingData(true);
    setError(null);

    try {
      const data = await fetchData(modelName);
      console.log("Datos obtenidos (Buscar):", data);
    } catch (error) {
      console.error("Error al buscar:", error);
      setError(
        "Error al buscar. Por favor, verifica la conexión o la URL de la API.",
      );
    } finally {
      setLoadingData(false);
    }
  };

  // Ejecutar fetchData automáticamente al cargar la página si hay un nombre de modelo
  useEffect(() => {
    if (modelName) {
      handleData();
    }
  }, []);

  return (
    <div className="flex w-full items-center space-x-2">
      <Input
        type="text"
        placeholder="Nombre modelo"
        value={modelName}
        onChange={handleModelNameChange}
      />
      <Scraper
        onSelectStatus={handleScraperChange}
        initialStatus={selectedScraper?.value || initialScraperValue}
      />
      <Button
        type="button"
        onClick={handleSearch}
        disabled={loadingScrape || loadingData}
      >
        {loadingScrape ? "Scrapeando..." : "Scrapear"}
      </Button>
      <Button
        type="button"
        onClick={handleData}
        disabled={loadingScrape || loadingData}
      >
        {loadingData ? "Buscando..." : "Buscar"}
      </Button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
