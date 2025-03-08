"use client"

import { FinancialAdvisor } from "./FinancialAdvisor"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, ChevronDown, ChevronUp, MinusCircle, PlusCircle } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export function FinancialAdvisorCard() {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <Bot className="mr-2 h-5 w-5 text-primary" />
            Asesor Financiero
          </CardTitle>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <PlusCircle className="h-4 w-4" /> : <MinusCircle className="h-4 w-4" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {!isMinimized && (
        <CardContent className={`transition-all duration-300 ${isExpanded ? 'max-h-[600px]' : 'max-h-0 overflow-hidden p-0'}`}>
          <FinancialAdvisor />
        </CardContent>
      )}
    </Card>
  )
} 