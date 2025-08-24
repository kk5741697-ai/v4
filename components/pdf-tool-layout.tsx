"use client"

import React from "react"

import { useState, useRef, useCallback } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import {
  Upload,
  FileType,
  Download,
  Trash2,
  RotateCw,
  Settings,
  Plus,
  Minus,
  CheckCircle,
  RefreshCw,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface PDFPage {
  id: string
  pageNumber: number
  thumbnail: string
  selected: boolean
  rotation: number
}

interface PDFFile {
  id: string
  name: string
  size: number
  pages: PDFPage[]
  file: File
}

interface PDFToolLayoutProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  toolType: "merge" | "split" | "compress" | "convert" | "rotate" | "protect" | "unlock"
  processFunction: (
    files: PDFFile[],
    options: any,
  ) => Promise<{ success: boolean; downloadUrl?: string; error?: string }>
  options?: Array<{
    key: string
    label: string
    type: "checkbox" | "select" | "number" | "text" | "slider"
    defaultValue: any
    selectOptions?: Array<{ value: string; label: string }>
    min?: number
    max?: number
    step?: number
  }>
  maxFiles?: number
  allowPageSelection?: boolean
  allowPageReorder?: boolean
}

export function PDFToolLayout({
  title,
  description,
  icon: Icon,
  toolType,
  processFunction,
  options = [],
  maxFiles = 10,
  allowPageSelection = false,
  allowPageReorder = false,
}: PDFToolLayoutProps) {
  const [files, setFiles] = useState<PDFFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [toolOptions, setToolOptions] = useState<Record<string, any>>({})
  const [rangeMode, setRangeMode] = useState<"all" | "custom" | "fixed">("all")
  const [customRanges, setCustomRanges] = useState([{ from: 1, to: 1 }])
  const [draggedPage, setDraggedPage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize options
  React.useEffect(() => {
    const initialOptions: Record<string, any> = {}
    options.forEach((option) => {
      initialOptions[option.key] = option.defaultValue
    })
    setToolOptions(initialOptions)
  }, [options])

  // Simulate PDF page generation
  const generatePDFPages = useCallback((file: File): PDFPage[] => {
    const pageCount = Math.floor(Math.random() * 10) + 1 // Random 1-10 pages
    return Array.from({ length: pageCount }, (_, index) => ({
      id: `${file.name}-page-${index + 1}`,
      pageNumber: index + 1,
      thumbnail: `/placeholder.svg?height=200&width=150&text=Page ${index + 1}`,
      selected: true,
      rotation: 0,
    }))
  }, [])

  const handleFileUpload = useCallback(
    (uploadedFiles: FileList | null) => {
      if (!uploadedFiles) return

      const newFiles: PDFFile[] = []
      Array.from(uploadedFiles).forEach((file) => {
        if (file.type === "application/pdf") {
          const pdfFile: PDFFile = {
            id: `${file.name}-${Date.now()}`,
            name: file.name,
            size: file.size,
            pages: generatePDFPages(file),
            file,
          }
          newFiles.push(pdfFile)
        } else {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not a PDF file`,
            variant: "destructive",
          })
        }
      })

      if (files.length + newFiles.length > maxFiles) {
        toast({
          title: "Too many files",
          description: `Maximum ${maxFiles} files allowed`,
          variant: "destructive",
        })
        return
      }

      setFiles((prev) => [...prev, ...newFiles])
    },
    [files.length, maxFiles, generatePDFPages],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      handleFileUpload(e.dataTransfer.files)
    },
    [handleFileUpload],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const togglePageSelection = (fileId: string, pageId: string) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.id === fileId
          ? {
              ...file,
              pages: file.pages.map((page) => (page.id === pageId ? { ...page, selected: !page.selected } : page)),
            }
          : file,
      ),
    )
  }

  const rotatePage = (fileId: string, pageId: string) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.id === fileId
          ? {
              ...file,
              pages: file.pages.map((page) =>
                page.id === pageId ? { ...page, rotation: (page.rotation + 90) % 360 } : page,
              ),
            }
          : file,
      ),
    )
  }

  const selectAllPages = (fileId: string, selected: boolean) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.id === fileId
          ? {
              ...file,
              pages: file.pages.map((page) => ({ ...page, selected })),
            }
          : file,
      ),
    )
  }

  const addRange = () => {
    setCustomRanges((prev) => [...prev, { from: 1, to: 1 }])
  }

  const removeRange = (index: number) => {
    setCustomRanges((prev) => prev.filter((_, i) => i !== index))
  }

  const updateRange = (index: number, field: "from" | "to", value: number) => {
    setCustomRanges((prev) => prev.map((range, i) => (i === index ? { ...range, [field]: value } : range)))
  }

  const processPDFs = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one PDF file",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const result = await processFunction(files, {
        ...toolOptions,
        rangeMode,
        customRanges,
      })

      if (result.success) {
        toast({
          title: "Success!",
          description: "PDF processing completed successfully",
        })

        if (result.downloadUrl) {
          // Trigger download
          const link = document.createElement("a")
          link.href = result.downloadUrl
          link.download = `processed-${Date.now()}.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
      } else {
        toast({
          title: "Processing failed",
          description: result.error || "An error occurred during processing",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getTotalPages = () => {
    return files.reduce((total, file) => total + file.pages.length, 0)
  }

  const getSelectedPages = () => {
    return files.reduce((total, file) => total + file.pages.filter((page) => page.selected).length, 0)
  }

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

        {/* File Upload Area */}
        {files.length === 0 && (
          <Card className="mb-8">
            <CardContent className="p-8">
              <div
                className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-accent/50 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Select PDF files</h3>
                <p className="text-muted-foreground mb-4">or drop PDF files here</p>
                <Button size="lg">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  Maximum {maxFiles} files • PDF format only • Up to 100MB per file
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                multiple={maxFiles > 1}
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
            </CardContent>
          </Card>
        )}

        {/* Files and Processing */}
        {files.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Files Panel */}
            <div className="lg:col-span-3 space-y-6">
              {/* File List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <FileType className="h-5 w-5" />
                        <span>PDF Files ({files.length})</span>
                      </CardTitle>
                      <CardDescription>
                        {getTotalPages()} total pages • {getSelectedPages()} selected
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={files.length >= maxFiles}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add More
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setFiles([])}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {files.map((file) => (
                    <div key={file.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <FileType className="h-6 w-6 text-accent" />
                          <div>
                            <h4 className="font-medium text-foreground">{file.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(file.size)} • {file.pages.length} pages
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {allowPageSelection && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => selectAllPages(file.id, true)}>
                                Select All
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => selectAllPages(file.id, false)}>
                                Deselect All
                              </Button>
                            </>
                          )}
                          <Button variant="outline" size="sm" onClick={() => removeFile(file.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Page Thumbnails */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                        {file.pages.map((page) => (
                          <div
                            key={page.id}
                            className={`relative group border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                              page.selected ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
                            }`}
                            onClick={() => allowPageSelection && togglePageSelection(file.id, page.id)}
                          >
                            <div
                              className="aspect-[3/4] bg-muted flex items-center justify-center text-xs text-muted-foreground"
                              style={{ transform: `rotate(${page.rotation}deg)` }}
                            >
                              <img
                                src={page.thumbnail || "/placeholder.svg"}
                                alt={`Page ${page.pageNumber}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-xs p-1 text-center">
                              {page.pageNumber}
                            </div>
                            {allowPageSelection && page.selected && (
                              <div className="absolute top-1 right-1">
                                <CheckCircle className="h-4 w-4 text-accent bg-background rounded-full" />
                              </div>
                            )}
                            <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  rotatePage(file.id, page.id)
                                }}
                              >
                                <RotateCw className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Page Range Selection */}
              {(toolType === "split" || allowPageSelection) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Page Selection</CardTitle>
                    <CardDescription>Choose which pages to process</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={rangeMode} onValueChange={(value) => setRangeMode(value as any)}>
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="all">All Pages</TabsTrigger>
                        <TabsTrigger value="custom">Custom Ranges</TabsTrigger>
                        <TabsTrigger value="fixed">Fixed Ranges</TabsTrigger>
                      </TabsList>

                      <TabsContent value="all" className="mt-4">
                        <p className="text-sm text-muted-foreground">All pages will be processed.</p>
                      </TabsContent>

                      <TabsContent value="custom" className="mt-4 space-y-4">
                        {customRanges.map((range, index) => (
                          <div key={index} className="flex items-center space-x-4">
                            <Label className="text-sm font-medium">Range {index + 1}:</Label>
                            <div className="flex items-center space-x-2">
                              <Label htmlFor={`from-${index}`} className="text-sm">
                                from page
                              </Label>
                              <Input
                                id={`from-${index}`}
                                type="number"
                                min="1"
                                value={range.from}
                                onChange={(e) => updateRange(index, "from", Number.parseInt(e.target.value))}
                                className="w-20"
                              />
                              <Label htmlFor={`to-${index}`} className="text-sm">
                                to
                              </Label>
                              <Input
                                id={`to-${index}`}
                                type="number"
                                min="1"
                                value={range.to}
                                onChange={(e) => updateRange(index, "to", Number.parseInt(e.target.value))}
                                className="w-20"
                              />
                              {customRanges.length > 1 && (
                                <Button variant="outline" size="sm" onClick={() => removeRange(index)}>
                                  <Minus className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addRange}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Range
                        </Button>
                      </TabsContent>

                      <TabsContent value="fixed" className="mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Button variant="outline" onClick={() => setCustomRanges([{ from: 1, to: 1 }])}>
                            First Page Only
                          </Button>
                          <Button variant="outline" onClick={() => setCustomRanges([{ from: 2, to: 999 }])}>
                            All Except First
                          </Button>
                          <Button variant="outline" onClick={() => setCustomRanges([{ from: 1, to: 5 }])}>
                            First 5 Pages
                          </Button>
                          <Button variant="outline" onClick={() => setCustomRanges([{ from: 6, to: 999 }])}>
                            From Page 6
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Options and Process Panel */}
            <div className="space-y-6">
              {/* Tool Options */}
              {options.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="h-5 w-5" />
                      <span>Options</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {options.map((option) => (
                      <div key={option.key} className="space-y-2">
                        <Label htmlFor={option.key}>{option.label}</Label>
                        {option.type === "checkbox" && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={option.key}
                              checked={toolOptions[option.key] || false}
                              onCheckedChange={(checked) =>
                                setToolOptions((prev) => ({ ...prev, [option.key]: checked }))
                              }
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
                        {option.type === "slider" && (
                          <div className="space-y-2">
                            <Slider
                              value={[toolOptions[option.key] || option.defaultValue]}
                              onValueChange={(value) => setToolOptions((prev) => ({ ...prev, [option.key]: value[0] }))}
                              max={option.max || 100}
                              min={option.min || 0}
                              step={option.step || 1}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{option.min || 0}</span>
                              <span>{toolOptions[option.key] || option.defaultValue}</span>
                              <span>{option.max || 100}</span>
                            </div>
                          </div>
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
                  </CardContent>
                </Card>
              )}

              {/* Process Button */}
              <Card>
                <CardHeader>
                  <CardTitle>Process PDF</CardTitle>
                  <CardDescription>Ready to process your PDF files</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={processPDFs}
                    disabled={isProcessing || files.length === 0}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Process & Download
                      </>
                    )}
                  </Button>
                  {files.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Processing {files.length} file{files.length > 1 ? "s" : ""} with {getTotalPages()} total pages
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* File Info */}
              {files.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>File Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Files:</span>
                      <span>{files.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Pages:</span>
                      <span>{getTotalPages()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Selected Pages:</span>
                      <span>{getSelectedPages()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Size:</span>
                      <span>{formatFileSize(files.reduce((total, file) => total + file.size, 0))}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Hidden file input for additional uploads */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple={maxFiles > 1}
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
        />
      </div>

      <Footer />
    </div>
  )
}
