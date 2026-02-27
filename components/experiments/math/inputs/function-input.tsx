"use client"

import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Parser } from "expr-eval"

export type ParsedFn = {
  fn: (x: number) => number
  error?: string
}

export function useParsedFunction(expr: string): ParsedFn {
  return useMemo(() => {
    try {
      const ast = Parser.parse(expr)
      const fn = (x: number) => {
        // allow only "x" variable
        return ast.evaluate({ x })
      }
      // quick sanity check to avoid NaN explosions
      const test = fn(0)
      if (!Number.isFinite(test)) throw new Error("Function returned non-finite value at x=0")
      return { fn }
    } catch (e: any) {
      return { fn: () => Number.NaN, error: e?.message || "Invalid expression" }
    }
  }, [expr])
}

export function FunctionInput({
  label = "f(x)",
  value,
  onChange,
  placeholder = "e.g. sin(x) + 0.3*x^2",
}: {
  label?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const { error } = useParsedFunction(value)
  const [dirty, setDirty] = useState(false)
  const showError = dirty && error
  return (
    <div className="space-y-2">
      <Label htmlFor="fx">{label}</Label>
      <Input
        id="fx"
        value={value}
        onChange={(e) => {
          setDirty(true)
          onChange(e.target.value)
        }}
        placeholder={placeholder}
        spellCheck={false}
      />
      {showError ? <p className="text-xs text-destructive">{error}</p> : null}
      {!showError ? (
        <p className="text-xs text-muted-foreground">Allowed: x, + - * / ^, sin cos tan exp log sqrt, parentheses</p>
      ) : null}
    </div>
  )
}
