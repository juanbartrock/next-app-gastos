"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function TestCalendar() {
  const [date, setDate] = useState<Date | undefined>(undefined)

  const handleDateSelect = (selectedDate: Date | undefined) => {
    console.log("Fecha seleccionada:", selectedDate)
    setDate(selectedDate)
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Test Calendar Component</h3>
      
      {/* Test 1: Calendar sin popover */}
      <div>
        <h4 className="font-medium mb-2">Calendar standalone:</h4>
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          className="rounded-md border"
        />
      </div>

      {/* Test 2: Calendar con popover */}
      <div>
        <h4 className="font-medium mb-2">Calendar con Popover:</h4>
        <Popover modal={false}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-0 z-[60]" 
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              e.preventDefault()
            }}
          >
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Debug info */}
      <div className="mt-4 p-2 bg-gray-100 rounded">
        <p><strong>Fecha seleccionada:</strong> {date ? format(date, "PPP", { locale: es }) : "Ninguna"}</p>
      </div>
    </div>
  )
} 