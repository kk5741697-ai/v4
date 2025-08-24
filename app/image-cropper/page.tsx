"use client"

import { ToolLayout, ProcessedFile } from "@/components/tool-layout"
import { CropInterface } from "@/components/crop-interface"
import { Crop } from "lucide-react"
import { useState } from "react"
import { ImageProcessor } from "@/lib/processors/image-processor"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"


export default function ImageCropperPage() {
  const [files, setFiles] = useState<ProcessedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [cropArea, setCropArea] = useState({ x: 10, y: 10, width: 80, height: 80 })
  const [outputFormat, setOutputFormat] = useState<"jpeg" | "png" | "webp">("png")
  const [quality, setQuality] = useState(95)
  const [backgroundColor, setBackgroundColor] = useState("#ffffff")

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
              await new Promise(resolve => setTimeout(resolve, 100))
            }

            const processedBlob = await ImageProcessor.cropImage(
              file.originalFile,
              cropArea,
              {
                outputFormat,
                quality,
                backgroundColor
              }
            )

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

  const selectedFileData = files.find(f => f.id === selectedFile)

  return (
    <ToolLayout
      title="Crop IMAGE"
      description="Crop JPG, PNG, or GIFs with ease. Choose pixels to define your rectangle or use our visual editor."
      icon={Crop}
      files={files}
      onFilesChange={setFiles}
      onProcess={handleProcess}
      isProcessing={isProcessing}
      acceptedTypes={["image/jpeg", "image/png", "image/gif", "image/webp"]}
      maxFiles={10}
      allowBulk={true}
      processingOptions={
        <div className="space-y-4">
          <div>
            <Label htmlFor="output-format">Output Format</Label>
            <select
              id="output-format"
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white mt-1"
            >
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
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

          <div>
            <Label htmlFor="bg-color">Background Color</Label>
            <div className="flex items-center space-x-2 mt-1">
              <input
                id="bg-color"
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-12 h-8 border border-gray-300 rounded"
              />
              <Input
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                placeholder="#ffffff"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      }
    >
      {/* Crop Interface */}
      {selectedFileData && selectedFileData.preview && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Crop Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label className="text-sm font-medium mb-2 block">Select Image to Crop</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {files.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => setSelectedFile(file.id)}
                      className={`relative border-2 rounded-lg overflow-hidden ${
                        selectedFile === file.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="aspect-square bg-gray-100">
                        {file.preview && (
                          <img
                            src={file.preview}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-xs p-1 truncate">
                        {file.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedFileData.preview && (
                <CropInterface
                  imageUrl={selectedFileData.preview}
                  originalWidth={selectedFileData.metadata?.width || 1000}
                  originalHeight={selectedFileData.metadata?.height || 1000}
                  onCropChange={setCropArea}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </ToolLayout>
  )
}
