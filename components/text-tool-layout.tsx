"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Copy,
  Download,
  Upload,
  Link,
  FileText,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Trash2,
  Settings,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface TextToolLayoutProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  placeholder?: string
  outputPlaceholder?: string
  processFunction: (input: string, options?: any) => { output: string; error?: string; stats?: any }
  validateFunction?: (input: string) => { isValid: boolean; error?: string }
  options?: Array<{
    key: string
    label: string
    type: "checkbox" | "select" | "number" | "text"
    defaultValue: any
    selectOptions?: Array<{ value: string; label: string }>
  }>
  examples?: Array<{ name: string; content: string }>
  fileExtensions?: string[]
}

export function TextToolLayout({
  title,
  description,
  icon: Icon,
  placeholder = "Paste or type your content here...",
  outputPlaceholder = "Processed output will appear here...",
  processFunction,
  validateFunction,
  options = [],
  examples = [],
  fileExtensions = [".txt"],
}: TextToolLayoutProps) {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")
  const [stats, setStats] = useState<any>(null)
  const [autoUpdate, setAutoUpdate] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [toolOptions, setToolOptions] = useState<Record<string, any>>({})
  const [urlInput, setUrlInput] = useState("")
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)

  // Initialize options
  useEffect(() => {
    const initialOptions: Record<string, any> = {}
    options.forEach((option) => {
      initialOptions[option.key] = option.defaultValue
    })
    setToolOptions(initialOptions)
  }, [options])

  // Auto-process when input or options change
  useEffect(() => {
    if (autoUpdate && input.trim()) {
      processText()
    } else if (!input.trim()) {
      setOutput("")
      setError("")
      setStats(null)
    }
  }, [input, toolOptions, autoUpdate])

  const processText = async () => {
    if (!input.trim()) {
      setOutput("")
      setError("")
      setStats(null)
      return
    }

    setIsProcessing(true)
    setError("")

    try {
      // Validate input if validator provided
      if (validateFunction) {
        const validation = validateFunction(input)
        if (!validation.isValid) {
          setError(validation.error || "Invalid input")
          setOutput("")
          setStats(null)
          return
        }
      }

      // Process the text
      const result = processFunction(input, toolOptions)

      if (result.error) {
        setError(result.error)
        setOutput("")
        setStats(null)
      } else {
        setOutput(result.output)
        setStats(result.stats)
        setError("")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed")
      setOutput("")
      setStats(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
      })
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setInput(content)
      }
      reader.readAsText(file)
    }
  }

  const loadFromUrl = async () => {
    if (!urlInput.trim()) return

    setIsLoadingUrl(true)
    try {
      const response = await fetch(`/api/fetch-url?url=${encodeURIComponent(urlInput)}`)
      if (!response.ok) throw new Error("Failed to fetch URL")

      const content = await response.text()
      setInput(content)
      toast({
        title: "Success",
        description: "Content loaded from URL",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load content from URL",
        variant: "destructive",
      })
    } finally {
      setIsLoadingUrl(false)
    }
  }

  const loadExample = (example: { name: string; content: string }) => {
    setInput(example.content)
  }

  const clearAll = () => {
    setInput("")
    setOutput("")
    setError("")
    setStats(null)
  }

  const getInputStats = () => {
    if (!input) return null

    const lines = input.split("\n").length
    const words = input
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
    const chars = input.length
    const charsNoSpaces = input.replace(/\s/g, "").length

    return { lines, words, chars, charsNoSpaces }
  }

  const inputStats = getInputStats()

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-4">
            <Icon className="h-8 w-8 text-accent" />
            <h1 className="text-3xl font-heading font-bold text-foreground">{title}</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Input</CardTitle>
                    <CardDescription>Enter or paste your content</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="auto-update"
                        checked={autoUpdate}
                        onCheckedChange={(checked) => setAutoUpdate(checked as boolean)}
                      />
                      <Label htmlFor="auto-update" className="text-sm">
                        Auto Update
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Input Tabs */}
                <Tabs defaultValue="text" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="text">
                      <FileText className="h-4 w-4 mr-2" />
                      Text
                    </TabsTrigger>
                    <TabsTrigger value="file">
                      <Upload className="h-4 w-4 mr-2" />
                      File
                    </TabsTrigger>
                    <TabsTrigger value="url">
                      <Link className="h-4 w-4 mr-2" />
                      URL
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="text" className="mt-4">
                    {/* Examples */}
                    {examples.length > 0 && (
                      <div className="mb-4">
                        <Label className="text-sm font-medium mb-2 block">Examples:</Label>
                        <div className="flex flex-wrap gap-2">
                          {examples.map((example, index) => (
                            <Button key={index} variant="outline" size="sm" onClick={() => loadExample(example)}>
                              {example.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="file" className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="file-upload">Upload File</Label>
                        <Input
                          id="file-upload"
                          type="file"
                          accept={fileExtensions.join(",")}
                          onChange={handleFileUpload}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Supported formats: {fileExtensions.join(", ")}
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="url" className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="url-input">Load from URL</Label>
                        <div className="flex space-x-2 mt-2">
                          <Input
                            id="url-input"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="https://example.com/data.json"
                          />
                          <Button onClick={loadFromUrl} disabled={isLoadingUrl || !urlInput.trim()}>
                            {isLoadingUrl ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Load"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Input Textarea */}
                <div className="relative">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={placeholder}
                    className="min-h-[400px] font-mono text-sm resize-none"
                  />
                  {input && (
                    <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={clearAll}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Input Stats */}
                {inputStats && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                    <div className="flex space-x-4">
                      <span>Lines: {inputStats.lines}</span>
                      <span>Words: {inputStats.words}</span>
                      <span>Characters: {inputStats.chars}</span>
                      <span>Characters (no spaces): {inputStats.charsNoSpaces}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(input, "Input")}
                        disabled={!input}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Process Button */}
                {!autoUpdate && (
                  <Button onClick={processText} disabled={!input.trim() || isProcessing} className="w-full">
                    {isProcessing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Settings className="h-4 w-4 mr-2" />
                        Process
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Output Panel */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <span>Output</span>
                      {error && <AlertCircle className="h-4 w-4 text-destructive" />}
                      {output && !error && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </CardTitle>
                    <CardDescription>{error ? "Error in processing" : "Processed result"}</CardDescription>
                  </div>
                  {output && !error && (
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(output, "Output")}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadFile(output, `processed${fileExtensions[0]}`)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Error Display */}
                {error && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-center space-x-2 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Error</span>
                    </div>
                    <p className="text-sm text-destructive mt-1">{error}</p>
                  </div>
                )}

                {/* Output Textarea */}
                <div className="relative">
                  <Textarea
                    value={error ? "" : output}
                    readOnly
                    placeholder={error ? "Fix the error to see output" : outputPlaceholder}
                    className="min-h-[400px] font-mono text-sm resize-none"
                  />
                </div>

                {/* Output Stats */}
                {(output || stats) && !error && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                    <div className="flex space-x-4">
                      {output && (
                        <>
                          <span>Lines: {output.split("\n").length}</span>
                          <span>Characters: {output.length}</span>
                        </>
                      )}
                      {stats &&
                        Object.entries(stats).map(([key, value]) => (
                          <span key={key}>
                            {key}: {String(value)}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Options Panel */}
        {options.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Options</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {options.map((option) => (
                  <div key={option.key} className="space-y-2">
                    <Label htmlFor={option.key}>{option.label}</Label>
                    {option.type === "checkbox" && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={option.key}
                          checked={toolOptions[option.key] || false}
                          onCheckedChange={(checked) => setToolOptions((prev) => ({ ...prev, [option.key]: checked }))}
                        />
                      </div>
                    )}
                    {option.type === "select" && (
                      <select
                        id={option.key}
                        value={toolOptions[option.key] || option.defaultValue}
                        onChange={(e) => setToolOptions((prev) => ({ ...prev, [option.key]: e.target.value }))}
                        className="w-full p-2 border border-border rounded-md bg-background"
                      >
                        {option.selectOptions?.map((selectOption) => (
                          <option key={selectOption.value} value={selectOption.value}>
                            {selectOption.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {(option.type === "number" || option.type === "text") && (
                      <Input
                        id={option.key}
                        type={option.type}
                        value={toolOptions[option.key] || option.defaultValue}
                        onChange={(e) =>
                          setToolOptions((prev) => ({
                            ...prev,
                            [option.key]: option.type === "number" ? Number(e.target.value) : e.target.value,
                          }))
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  )
}
