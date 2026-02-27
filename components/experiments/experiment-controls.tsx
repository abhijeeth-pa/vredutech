"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Settings, RotateCcw } from "lucide-react"

interface Parameter {
  name: string
  label: string
  type?: string
  min?: number
  max?: number
  default: any
  step?: number
  options?: string[]
}

interface ExperimentControlsProps {
  parameters: Parameter[]
}

export function ExperimentControls({ parameters }: ExperimentControlsProps) {
  const [values, setValues] = useState<Record<string, any>>({})

  useEffect(() => {
    // Initialize with default values
    const defaultValues: Record<string, any> = {}
    parameters.forEach((param) => {
      defaultValues[param.name] = param.default
    })
    setValues(defaultValues)
  }, [parameters])

  const handleValueChange = (name: string, value: any) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Dispatch custom event to notify the experiment viewer
    window.dispatchEvent(
      new CustomEvent("parameterChange", {
        detail: { name, value },
      }),
    )
  }

  const resetToDefaults = () => {
    const defaultValues: Record<string, any> = {}
    parameters.forEach((param) => {
      defaultValues[param.name] = param.default
      // Dispatch reset events
      window.dispatchEvent(
        new CustomEvent("parameterChange", {
          detail: { name: param.name, value: param.default },
        }),
      )
    })
    setValues(defaultValues)
  }

  const renderControl = (param: Parameter) => {
    const value = values[param.name] ?? param.default

    switch (param.type) {
      case "select":
        return (
          <div key={param.name} className="space-y-2">
            <Label htmlFor={param.name}>{param.label}</Label>
            <Select value={value} onValueChange={(newValue) => handleValueChange(param.name, newValue)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {param.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case "boolean":
        return (
          <div key={param.name} className="flex items-center justify-between">
            <Label htmlFor={param.name}>{param.label}</Label>
            <Switch
              id={param.name}
              checked={value}
              onCheckedChange={(checked) => handleValueChange(param.name, checked)}
            />
          </div>
        )

      default:
        // Number slider
        return (
          <div key={param.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={param.name}>{param.label}</Label>
              <span className="text-sm text-gray-600 dark:text-gray-300 font-mono">
                {typeof value === "number" ? value.toFixed(2) : value}
              </span>
            </div>
            <Slider
              id={param.name}
              min={param.min || 0}
              max={param.max || 100}
              step={param.step || 1}
              value={[value]}
              onValueChange={([newValue]) => handleValueChange(param.name, newValue)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{param.min || 0}</span>
              <span>{param.max || 100}</span>
            </div>
          </div>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5" />
            Parameters
          </CardTitle>
          <Button variant="outline" size="sm" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">{parameters.map(renderControl)}</CardContent>
    </Card>
  )
}
