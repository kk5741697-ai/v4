"use client"

import { ToolLayout, ProcessedFile } from "@/components/tool-layout"
import { Maximize } from "lucide-react"
import { useState } from "react"
import { ImageProcessor } from "@/lib/processors/image-processor"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"


export default function ImageResizerPage() {
  const [files, setFiles] = useState<ProcessedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [width, setWidth] = useState(800)
  const [height, setHeight] = useState(600)
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true)
  const [outputFormat, setOutputFormat] = useState<"jpeg" | "png" | "webp">("jpeg")
  const [quality, setQuality] = useState(90)

  const handleProcess = async (filesToProcess: ProcessedFile[]) => {
    setIsProcessing(true)
    
    try {
      const updatedFiles = await Promise.all(
        filesToProcess.map(async (file) => {
          try {
            file.status = "processing"
            file.progress = 0
            setFiles(prev => prev.map(f => f.id === file.id ? { ...file } : f))

            // Simulate progress
            for (let i = 0; i <= 100; i += 25) {
              file.progress = i
              setFiles(prev => prev.map(f => f.id === file.id ? { ...file } : f))
              await new Promise(resolve => setTimeout(resolve, 100))
            }

            const processedBlob = await ImageProcessor.resizeImage(file.originalFile, {
              width,
              height,
              maintainAspectRatio,
              outputFormat,
              quality
            })

            const processedPreview = URL.createObjectURL(processedBlob)

            return {
              ...file,
              status: "completed" as const,
              progress: 100,
              processedBlob,
              processedPreview,
              processedSize: processedBlob.size
            }
          } catch (error) {
            return {
              ...file,
              status: "error" as const,
              error: error instanceof Error ? error.message : "Processing failed"
            }
          }
        })
      )

      setFiles(updatedFiles)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <ToolLayout
      title="Resize IMAGE"
      description="Define your dimensions, by percent or pixel, and resize your JPG, PNG, SVG, and GIF images."
      icon={Maximize}
      files={files}
      onFilesChange={setFiles}
      onProcess={handleProcess}
      isProcessing={isProcessing}
      acceptedTypes={["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]}
      maxFiles={20}
      allowBulk={true}
      processingOptions={
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="width">Width (px)</Label>
              <Input
                id="width"
                type="number"
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                min="1"
                max="10000"
              />
            </div>
            <div>
              <Label htmlFor="height">Height (px)</Label>
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                min="1"
                max="10000"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="maintain-aspect"
              checked={maintainAspectRatio}
              onCheckedChange={setMaintainAspectRatio}
            />
            <Label htmlFor="maintain-aspect" className="text-sm">
              Maintain Aspect Ratio
            </Label>
          </div>
          
          <div>
            <Label htmlFor="output-format">Output Format</Label>
            <select
              id="output-format"
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white mt-1"
            >
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </div>
          
          <div>
            <Label htmlFor="quality">Quality: {quality}%</Label>
            <input
              id="quality"
              type="range"
              min="10"
              max="100"
              step="5"
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value))}
              className="w-full mt-1"
            />
          </div>
        </div>
      }
    />
  )
}
