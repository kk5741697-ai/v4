"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, ImageIcon, Download, Trash2, Settings, Plus, RefreshCw, Crop, ZoomIn, ZoomOut } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ImageFile {
  id: string
  name: string
  size: number
  file: File
  preview: string
  processedPreview?: string
  dimensions: { width: number; height: number }
  processed: boolean
}

interface ImageToolLayoutProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  toolType: "resize" | "compress" | "convert" | "crop" | "rotate" | "watermark" | "background"
  processFunction: (
    files: ImageFile[],
    options: any,
  ) => Promise<{ success: boolean; processedFiles?: ImageFile[]; error?: string }>
  options?: Array<{
    key: string
    label: string
    type: "checkbox" | "select" | "number" | "text" | "slider" | "color"
    defaultValue: any
    selectOptions?: Array<{ value: string; label: string }>
    min?: number
    max?: number
    step?: number
  }>
  maxFiles?: number
  supportedFormats?: string[]
  outputFormats?: string[]
  allowBatchProcessing?: boolean
  showCropInterface?: boolean
}

export function ImageToolLayout({
  title,
  description,
  icon: Icon,
  toolType,
  processFunction,
  options = [],
  maxFiles = 10,
  supportedFormats = ["image/jpeg", "image/png", "image/gif", "image/webp"],
  outputFormats = ["jpeg", "png", "webp"],
  allowBatchProcessing = true,
  showCropInterface = false,
}: ImageToolLayoutProps) {
  const [files, setFiles] = useState<ImageFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [toolOptions, setToolOptions] = useState<Record<string, any>>({})
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 })
  const [zoom, setZoom] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Initialize options
  useEffect(() => {
    const initialOptions: Record<string, any> = {}
    options.forEach((option) => {
      initialOptions[option.key] = option.defaultValue
    })
    setToolOptions(initialOptions)
  }, [options])

  useEffect(() => {
    if (files.length > 0 && Object.keys(toolOptions).length > 0) {
      processImagesLive()
    }
  }, [toolOptions, cropArea, zoom])

  const processImagesLive = async () => {
    if (files.length === 0) return

    try {
      const updatedFiles = await Promise.all(
        files.map(async (file) => {
          const processedPreview = await applyImageProcessing(file, toolOptions, cropArea, zoom)
          return {
            ...file,
            processedPreview,
            processed: true,
          }
        }),
      )
      setFiles(updatedFiles)
    } catch (error) {
      console.log("[v0] Live preview processing error:", error)
    }
  }

  const applyImageProcessing = async (file: ImageFile, options: any, cropArea: any, zoom: number): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        resolve(file.preview)
        return
      }

      const img = new Image()
      img.onload = () => {
        let { width, height } = file.dimensions

        // Apply crop if enabled
        if (showCropInterface) {
          const cropX = (cropArea.x / 100) * width
          const cropY = (cropArea.y / 100) * height
          const cropWidth = (cropArea.width / 100) * width
          const cropHeight = (cropArea.height / 100) * height

          canvas.width = cropWidth
          canvas.height = cropHeight
          ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)
        } else {
          // Apply resize if specified
          if (options.width || options.height) {
            width = options.width || height * (options.height / height)
            height = options.height || width * (options.width / width)
          }

          canvas.width = width
          canvas.height = height
          ctx.drawImage(img, 0, 0, width, height)
        }

        // Apply filters based on tool type
        if (toolType === "compress" && options.quality) {
          // Quality is handled in toDataURL
        }

        if (toolType === "rotate" && options.rotation) {
          const centerX = canvas.width / 2
          const centerY = canvas.height / 2
          ctx.translate(centerX, centerY)
          ctx.rotate((options.rotation * Math.PI) / 180)
          ctx.translate(-centerX, -centerY)
        }

        const quality = options.quality ? options.quality / 100 : 0.9
        const format = options.outputFormat || "png"
        const mimeType = format === "jpg" ? "image/jpeg" : `image/${format}`

        resolve(canvas.toDataURL(mimeType, quality))
      }
      img.src = file.preview
    })
  }

  const loadImageDimensions = useCallback((file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.src = URL.createObjectURL(file)
    })
  }, [])

  const handleFileUpload = useCallback(
    async (uploadedFiles: FileList | null) => {
      if (!uploadedFiles) return

      const newFiles: ImageFile[] = []
      for (const file of Array.from(uploadedFiles)) {
        if (supportedFormats.includes(file.type)) {
          const dimensions = await loadImageDimensions(file)
          const imageFile: ImageFile = {
            id: `${file.name}-${Date.now()}`,
            name: file.name,
            size: file.size,
            file,
            preview: URL.createObjectURL(file),
            dimensions,
            processed: false,
          }
          newFiles.push(imageFile)
        } else {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not a supported image format`,
            variant: "destructive",
          })
        }
      }

      if (files.length + newFiles.length > maxFiles) {
        toast({
          title: "Too many files",
          description: `Maximum ${maxFiles} files allowed`,
          variant: "destructive",
        })
        return
      }

      setFiles((prev) => [...prev, ...newFiles])
      if (newFiles.length > 0 && !selectedFile) {
        setSelectedFile(newFiles[0].id)
      }
    },
    [files.length, maxFiles, supportedFormats, loadImageDimensions, selectedFile],
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
    setFiles((prev) => {
      const newFiles = prev.filter((f) => f.id !== fileId)
      if (selectedFile === fileId && newFiles.length > 0) {
        setSelectedFile(newFiles[0].id)
      } else if (newFiles.length === 0) {
        setSelectedFile(null)
      }
      return newFiles
    })
  }

  const processImages = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one image file",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const result = await processFunction(files, {
        ...toolOptions,
        cropArea: showCropInterface ? cropArea : undefined,
        zoom,
      })

      if (result.success && result.processedFiles) {
        setFiles(result.processedFiles)
        toast({
          title: "Success!",
          description: "Images processed successfully",
        })
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

  const downloadFile = (file: ImageFile, format?: string) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      canvas.width = file.dimensions.width
      canvas.height = file.dimensions.height
      ctx.drawImage(img, 0, 0)

      const outputFormat = format || toolOptions.outputFormat || "png"
      const mimeType = outputFormat === "jpg" ? "image/jpeg" : `image/${outputFormat}`
      const quality = outputFormat === "jpeg" || outputFormat === "jpg" ? (toolOptions.quality || 90) / 100 : undefined

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = `${file.name.split(".")[0]}.${outputFormat}`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            toast({
              title: "Download started",
              description: `${file.name} is being downloaded`,
            })
          }
        },
        mimeType,
        quality,
      )
    }
    img.src = file.processedPreview || file.preview
  }

  const downloadAll = () => {
    files.forEach((file, index) => {
      setTimeout(() => {
        downloadFile(file, toolOptions.outputFormat)
      }, index * 500) // Stagger downloads
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const selectedFileData = files.find((f) => f.id === selectedFile)

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
                <h3 className="text-lg font-semibold text-foreground mb-2">Select images</h3>
                <p className="text-muted-foreground mb-4">or drop images here</p>
                <Button size="lg">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Images
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  Maximum {maxFiles} files • {supportedFormats.map((f) => f.split("/")[1]).join(", ")} formats • Up to
                  50MB per file
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={supportedFormats.join(",")}
                multiple={allowBatchProcessing}
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
            </CardContent>
          </Card>
        )}

        {/* Images and Processing */}
        {files.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Images Panel */}
            <div className="lg:col-span-3 space-y-6">
              {/* Image Preview */}
              {selectedFileData && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <ImageIcon className="h-5 w-5" />
                          <span>Preview</span>
                        </CardTitle>
                        <CardDescription>{selectedFileData.name}</CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        {showCropInterface && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}>
                              <ZoomOut className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(3, zoom + 0.1))}>
                              <ZoomIn className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadFile(selectedFileData, toolOptions.outputFormat)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="relative bg-muted rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
                      <img
                        src={selectedFileData.processedPreview || selectedFileData.preview}
                        alt={selectedFileData.name}
                        className="w-full h-full object-contain"
                        style={{ transform: `scale(${zoom})` }}
                      />
                      {showCropInterface && (
                        <div
                          className="absolute border-2 border-accent bg-accent/20"
                          style={{
                            left: `${cropArea.x}%`,
                            top: `${cropArea.y}%`,
                            width: `${cropArea.width}%`,
                            height: `${cropArea.height}%`,
                          }}
                        >
                          <div className="absolute inset-0 border border-white/50" />
                        </div>
                      )}
                    </div>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <Label className="text-muted-foreground">Dimensions</Label>
                        <p className="font-medium">
                          {selectedFileData.dimensions.width} × {selectedFileData.dimensions.height}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">File Size</Label>
                        <p className="font-medium">{formatFileSize(selectedFileData.size)}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Format</Label>
                        <p className="font-medium">{selectedFileData.file.type.split("/")[1].toUpperCase()}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Status</Label>
                        <p className="font-medium">{selectedFileData.processed ? "Processed" : "Original"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Crop Interface */}
              {showCropInterface && selectedFileData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Crop className="h-5 w-5" />
                      <span>Crop Options</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="crop-width">Width (px)</Label>
                        <Input
                          id="crop-width"
                          type="number"
                          value={Math.round((cropArea.width / 100) * selectedFileData.dimensions.width)}
                          onChange={(e) =>
                            setCropArea((prev) => ({
                              ...prev,
                              width: (Number.parseInt(e.target.value) / selectedFileData.dimensions.width) * 100,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="crop-height">Height (px)</Label>
                        <Input
                          id="crop-height"
                          type="number"
                          value={Math.round((cropArea.height / 100) * selectedFileData.dimensions.height)}
                          onChange={(e) =>
                            setCropArea((prev) => ({
                              ...prev,
                              height: (Number.parseInt(e.target.value) / selectedFileData.dimensions.height) * 100,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="crop-x">Position X (px)</Label>
                        <Input
                          id="crop-x"
                          type="number"
                          value={Math.round((cropArea.x / 100) * selectedFileData.dimensions.width)}
                          onChange={(e) =>
                            setCropArea((prev) => ({
                              ...prev,
                              x: (Number.parseInt(e.target.value) / selectedFileData.dimensions.width) * 100,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="crop-y">Position Y (px)</Label>
                        <Input
                          id="crop-y"
                          type="number"
                          value={Math.round((cropArea.y / 100) * selectedFileData.dimensions.height)}
                          onChange={(e) =>
                            setCropArea((prev) => ({
                              ...prev,
                              y: (Number.parseInt(e.target.value) / selectedFileData.dimensions.height) * 100,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* File List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <ImageIcon className="h-5 w-5" />
                        <span>Images ({files.length})</span>
                      </CardTitle>
                      <CardDescription>Click on an image to preview and edit</CardDescription>
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
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className={`relative group border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                          selectedFile === file.id
                            ? "border-accent bg-accent/10"
                            : "border-border hover:border-accent/50"
                        }`}
                        onClick={() => setSelectedFile(file.id)}
                      >
                        <div className="aspect-square bg-muted">
                          <img
                            src={file.processedPreview || file.preview}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-xs p-2">
                          <p className="truncate">{file.name}</p>
                          <p className="text-white/75">
                            {file.dimensions.width} × {file.dimensions.height}
                          </p>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeFile(file.id)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        {file.processed && (
                          <div className="absolute top-2 left-2">
                            <div className="bg-green-500 text-white text-xs px-2 py-1 rounded">Processed</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
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
                        {option.type === "color" && (
                          <div className="flex items-center space-x-2">
                            <Input
                              id={option.key}
                              type="color"
                              value={toolOptions[option.key] || option.defaultValue}
                              onChange={(e) => setToolOptions((prev) => ({ ...prev, [option.key]: e.target.value }))}
                              className="w-12 h-10 p-1"
                            />
                            <Input
                              value={toolOptions[option.key] || option.defaultValue}
                              onChange={(e) => setToolOptions((prev) => ({ ...prev, [option.key]: e.target.value }))}
                              placeholder="#000000"
                            />
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
                  <CardTitle>Process Images</CardTitle>
                  <CardDescription>Apply changes to your images</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={processImages}
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
                        <Settings className="h-4 w-4 mr-2" />
                        Process Images
                      </>
                    )}
                  </Button>
                  {files.length > 1 && (
                    <Button
                      variant="outline"
                      onClick={downloadAll}
                      disabled={isProcessing}
                      className="w-full bg-transparent"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download All
                    </Button>
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
                      <span>Processed:</span>
                      <span>{files.filter((f) => f.processed).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Size:</span>
                      <span>{formatFileSize(files.reduce((total, file) => total + file.size, 0))}</span>
                    </div>
                    {selectedFileData && (
                      <div className="pt-2 border-t">
                        <div className="flex justify-between">
                          <span>Selected:</span>
                          <span>{selectedFileData.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Dimensions:</span>
                          <span>
                            {selectedFileData.dimensions.width} × {selectedFileData.dimensions.height}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Hidden file input for additional uploads */}
        <input
          ref={fileInputRef}
          type="file"
          accept={supportedFormats.join(",")}
          multiple={allowBatchProcessing}
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
        />
      </div>

      <Footer />
    </div>
  )
}
