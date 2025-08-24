"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Upload, 
  Download, 
  Settings, 
  Play, 
  Pause, 
  Square, 
  Trash2, 
  Copy, 
  Share2,
  FileText,
  Link,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Archive
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

export interface ProcessedFile {
  id: string
  name: string
  originalFile: File
  processedBlob?: Blob
  preview?: string
  processedPreview?: string
  size: number
  processedSize?: number
  status: "pending" | "processing" | "completed" | "error"
  progress: number
  error?: string
  metadata?: any
}

interface ToolLayoutProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  files: ProcessedFile[]
  onFilesChange: (files: ProcessedFile[]) => void
  onProcess: (files: ProcessedFile[], options: any) => Promise<void>
  isProcessing: boolean
  acceptedTypes?: string[]
  maxFiles?: number
  maxFileSize?: number
  showSteps?: boolean
  allowBulk?: boolean
  processingOptions?: React.ReactNode
}

export function ToolLayout({
  title,
  description,
  icon: Icon,
  children,
  files,
  onFilesChange,
  onProcess,
  isProcessing,
  acceptedTypes = ["*/*"],
  maxFiles = 20,
  maxFileSize = 100,
  showSteps = true,
  allowBulk = true,
  processingOptions
}: ToolLayoutProps) {
  const [dragActive, setDragActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [urlInput, setUrlInput] = useState("")
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pasteRef = useRef<HTMLDivElement>(null)

  const steps = [
    { number: 1, title: "Add Files", active: currentStep >= 1 },
    { number: 2, title: "Configure", active: currentStep >= 2 },
    { number: 3, title: "Process", active: currentStep >= 3 },
    { number: 4, title: "Download", active: currentStep >= 4 }
  ]

  useEffect(() => {
    if (files.length > 0) setCurrentStep(2)
    if (files.some(f => f.status === "completed")) setCurrentStep(4)
  }, [files])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFileSelection(droppedFiles)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }, [])

  const handleFileSelection = useCallback(async (selectedFiles: File[]) => {
    if (files.length + selectedFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive"
      })
      return
    }

    const newFiles: ProcessedFile[] = []

    for (const file of selectedFiles) {
      // Validate file type
      if (acceptedTypes.length > 0 && !acceptedTypes.includes("*/*")) {
        const isValidType = acceptedTypes.some(type => {
          if (type.startsWith(".")) {
            return file.name.toLowerCase().endsWith(type.toLowerCase())
          }
          return file.type.includes(type.replace("/*", ""))
        })

        if (!isValidType) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not supported`,
            variant: "destructive"
          })
          continue
        }
      }

      // Validate file size
      if (file.size > maxFileSize * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds ${maxFileSize}MB limit`,
          variant: "destructive"
        })
        continue
      }

      // Generate preview for images
      let preview: string | undefined
      if (file.type.startsWith("image/")) {
        preview = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.onerror = () => resolve(undefined)
          reader.readAsDataURL(file)
        })
      }

      const processedFile: ProcessedFile = {
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        name: file.name,
        originalFile: file,
        preview,
        size: file.size,
        status: "pending",
        progress: 0
      }

      newFiles.push(processedFile)
    }

    onFilesChange([...files, ...newFiles])
  }, [files, maxFiles, maxFileSize, acceptedTypes, onFilesChange])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles) {
      handleFileSelection(Array.from(selectedFiles))
    }
    e.target.value = ""
  }, [handleFileSelection])

  const handleUrlLoad = useCallback(async () => {
    if (!urlInput.trim()) return

    setIsLoadingUrl(true)
    try {
      const response = await fetch(urlInput)
      if (!response.ok) throw new Error("Failed to fetch file")

      const blob = await response.blob()
      const filename = urlInput.split("/").pop() || "downloaded-file"
      const file = new File([blob], filename, { type: blob.type })

      await handleFileSelection([file])
      setUrlInput("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load file from URL",
        variant: "destructive"
      })
    } finally {
      setIsLoadingUrl(false)
    }
  }, [urlInput, handleFileSelection])

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items)
    const files: File[] = []

    for (const item of items) {
      if (item.kind === "file") {
        const file = item.getAsFile()
        if (file) files.push(file)
      }
    }

    if (files.length > 0) {
      await handleFileSelection(files)
      toast({
        title: "Files pasted",
        description: `${files.length} file(s) added from clipboard`
      })
    }
  }, [handleFileSelection])

  const removeFile = useCallback((fileId: string) => {
    onFilesChange(files.filter(f => f.id !== fileId))
  }, [files, onFilesChange])

  const clearAllFiles = useCallback(() => {
    onFilesChange([])
    setCurrentStep(1)
  }, [onFilesChange])

  const downloadFile = useCallback((file: ProcessedFile) => {
    if (!file.processedBlob) return

    const url = URL.createObjectURL(file.processedBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const downloadAllAsZip = useCallback(async () => {
    const completedFiles = files.filter(f => f.status === "completed" && f.processedBlob)
    if (completedFiles.length === 0) return

    // Create ZIP using JSZip
    const JSZip = (await import("jszip")).default
    const zip = new JSZip()

    completedFiles.forEach(file => {
      if (file.processedBlob) {
        zip.file(file.name, file.processedBlob)
      }
    })

    const zipBlob = await zip.generateAsync({ type: "blob" })
    const url = URL.createObjectURL(zipBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${title.toLowerCase().replace(/\s+/g, "-")}-results.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [files, title])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const completedFiles = files.filter(f => f.status === "completed")
  const totalOriginalSize = files.reduce((sum, f) => sum + f.size, 0)
  const totalProcessedSize = completedFiles.reduce((sum, f) => sum + (f.processedSize || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Icon className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{description}</p>
        </div>

        {/* Step Indicator */}
        {showSteps && (
          <div className="flex items-center justify-center space-x-4 mb-8">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step.active 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-200 text-gray-500"
                }`}>
                  {step.number}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  step.active ? "text-gray-900" : "text-gray-500"
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-4 ${
                    step.active ? "bg-blue-500" : "bg-gray-200"
                  }`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* File Upload Area */}
        {files.length === 0 && (
          <Card className="mb-8">
            <CardContent className="p-8">
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer ${
                  dragActive 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                onPaste={handlePaste}
                tabIndex={0}
                ref={pasteRef}
              >
                <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select files</h3>
                <p className="text-gray-600 mb-6">or drop files here</p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button 
                    size="lg" 
                    className="bg-blue-500 hover:bg-blue-600 text-white px-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      fileInputRef.current?.click()
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Files
                  </Button>

                  <Tabs defaultValue="file" className="w-full max-w-md">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="file">
                        <FileText className="h-4 w-4 mr-2" />
                        File
                      </TabsTrigger>
                      <TabsTrigger value="url">
                        <Link className="h-4 w-4 mr-2" />
                        URL
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="url" className="mt-4">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="Enter file URL..."
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUrlLoad()
                          }}
                          disabled={!urlInput.trim() || isLoadingUrl}
                        >
                          {isLoadingUrl ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Load"}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <p className="text-xs text-gray-500 mt-6">
                  Maximum {maxFiles} files • {acceptedTypes.join(", ")} • Up to {maxFileSize}MB per file
                  <br />
                  You can also paste files with Ctrl+V
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedTypes.join(",")}
                multiple={allowBulk}
                onChange={handleFileInput}
                className="hidden"
              />
            </CardContent>
          </Card>
        )}

        {/* File List and Processing */}
        {files.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Files Panel */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="h-5 w-5" />
                        <span>Files ({files.length})</span>
                      </CardTitle>
                      <CardDescription>
                        {formatFileSize(totalOriginalSize)} total
                        {completedFiles.length > 0 && ` • ${formatFileSize(totalProcessedSize)} processed`}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={files.length >= maxFiles}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Add More
                      </Button>
                      <Button variant="outline" size="sm" onClick={clearAllFiles}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {files.map((file) => (
                      <div key={file.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                        {/* File Preview */}
                        <div className="flex-shrink-0">
                          {file.preview ? (
                            <img
                              src={file.processedPreview || file.preview}
                              alt={file.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                              <FileText className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{file.name}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{formatFileSize(file.size)}</span>
                            {file.processedSize && (
                              <span>→ {formatFileSize(file.processedSize)}</span>
                            )}
                            <Badge variant={
                              file.status === "completed" ? "default" :
                              file.status === "error" ? "destructive" :
                              file.status === "processing" ? "secondary" : "outline"
                            }>
                              {file.status}
                            </Badge>
                          </div>
                          
                          {/* Progress Bar */}
                          {file.status === "processing" && (
                            <Progress value={file.progress} className="mt-2 h-2" />
                          )}
                          
                          {/* Error Message */}
                          {file.error && (
                            <p className="text-sm text-red-600 mt-1">{file.error}</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {file.status === "completed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadFile(file)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Options and Process Panel */}
            <div className="space-y-6">
              {/* Processing Options */}
              {processingOptions && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="h-5 w-5" />
                      <span>Options</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {processingOptions}
                  </CardContent>
                </Card>
              )}

              {/* Process Button */}
              <Card>
                <CardHeader>
                  <CardTitle>Process Files</CardTitle>
                  <CardDescription>
                    Ready to process {files.length} file{files.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => {
                      setCurrentStep(3)
                      onProcess(files, {})
                    }}
                    disabled={isProcessing || files.length === 0}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Start Processing
                      </>
                    )}
                  </Button>

                  {completedFiles.length > 1 && (
                    <Button
                      variant="outline"
                      onClick={downloadAllAsZip}
                      className="w-full"
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Download All as ZIP
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* File Stats */}
              {files.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Files:</span>
                      <span>{files.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed:</span>
                      <span>{completedFiles.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Original Size:</span>
                      <span>{formatFileSize(totalOriginalSize)}</span>
                    </div>
                    {totalProcessedSize > 0 && (
                      <div className="flex justify-between">
                        <span>Processed Size:</span>
                        <span>{formatFileSize(totalProcessedSize)}</span>
                      </div>
                    )}
                    {totalProcessedSize > 0 && totalOriginalSize > 0 && (
                      <div className="flex justify-between">
                        <span>Size Change:</span>
                        <span className={
                          totalProcessedSize < totalOriginalSize ? "text-green-600" : "text-red-600"
                        }>
                          {((totalProcessedSize / totalOriginalSize - 1) * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Custom Content */}
        {children}

        {/* Hidden file input for additional uploads */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          multiple={allowBulk}
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      <Footer />
    </div>
  )
}