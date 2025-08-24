"use client"

import { ToolLayout, ProcessedFile } from "@/components/tool-layout"
import { Archive } from "lucide-react"
import { useState } from "react"
import { ImageProcessor } from "@/lib/processors/image-processor"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"


export default function ImageCompressorPage() {
  const [files, setFiles] = useState<ProcessedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [quality, setQuality] = useState(80)
  const [compressionLevel, setCompressionLevel] = useState<"low" | "medium" | "high" | "maximum">("medium")
  const [outputFormat, setOutputFormat] = useState<"jpeg" | "png" | "webp">("jpeg")
  const [removeMetadata, setRemoveMetadata] = useState(true)

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
            for (let i = 0; i <= 100; i += 20) {
              file.progress = i
              setFiles(prev => prev.map(f => f.id === file.id ? { ...file } : f))
              await new Promise(resolve => setTimeout(resolve, 150))
            }

            const processedBlob = await ImageProcessor.compressImage(file.originalFile, {
              quality,
              compressionLevel,
              outputFormat
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
      title="Compress IMAGE"
      description="Compress JPG, PNG, SVG, and GIFs while saving space and maintaining quality."
      icon={Archive}
      files={files}
      onFilesChange={setFiles}
      onProcess={handleProcess}
      isProcessing={isProcessing}
      acceptedTypes={["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]}
      maxFiles={20}
      allowBulk={true}
      processingOptions={
        <div className="space-y-4">
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
          
          <div>
            <Label htmlFor="compression-level">Compression Level</Label>
            <select
              id="compression-level"
              value={compressionLevel}
              onChange={(e) => setCompressionLevel(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white mt-1"
            >
              <option value="low">Low (High Quality)</option>
              <option value="medium">Medium (Balanced)</option>
              <option value="high">High (Small Size)</option>
              <option value="maximum">Maximum (Smallest)</option>
            </select>
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
              <option value="webp">WebP</option>
              <option value="png">PNG</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remove-metadata"
              checked={removeMetadata}
              onCheckedChange={setRemoveMetadata}
            />
            <Label htmlFor="remove-metadata" className="text-sm">
              Remove Metadata
            </Label>
          </div>
        </div>
      }
    />
  )
}
