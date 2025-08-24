"use client"

import { ImageToolLayout } from "@/components/image-tool-layout"
import { Archive } from "lucide-react"

const compressOptions = [
  {
    key: "quality",
    label: "Quality",
    type: "slider" as const,
    defaultValue: 80,
    min: 10,
    max: 100,
    step: 5,
  },
  {
    key: "compressionLevel",
    label: "Compression Level",
    type: "select" as const,
    defaultValue: "medium",
    selectOptions: [
      { value: "low", label: "Low (High Quality)" },
      { value: "medium", label: "Medium (Balanced)" },
      { value: "high", label: "High (Small Size)" },
      { value: "maximum", label: "Maximum (Smallest)" },
    ],
  },
  {
    key: "outputFormat",
    label: "Output Format",
    type: "select" as const,
    defaultValue: "jpeg",
    selectOptions: [
      { value: "jpeg", label: "JPEG" },
      { value: "webp", label: "WebP" },
      { value: "png", label: "PNG" },
    ],
  },
  {
    key: "removeMetadata",
    label: "Remove Metadata",
    type: "checkbox" as const,
    defaultValue: true,
  },
  {
    key: "progressive",
    label: "Progressive JPEG",
    type: "checkbox" as const,
    defaultValue: false,
  },
]

async function compressImages(files: any[], options: any) {
  // Simulate image compression process
  return new Promise<{ success: boolean; processedFiles?: any[]; error?: string }>((resolve) => {
    setTimeout(() => {
      if (files.length === 0) {
        resolve({
          success: false,
          error: "No files to process",
        })
        return
      }

      // Simulate successful compression
      const compressionRatio = options.quality / 100
      const processedFiles = files.map((file) => ({
        ...file,
        processed: true,
        processedPreview: file.preview,
        size: Math.round(file.size * compressionRatio), // Simulate size reduction
      }))

      resolve({
        success: true,
        processedFiles,
      })
    }, 2500)
  })
}

export default function ImageCompressorPage() {
  return (
    <ImageToolLayout
      title="Image Compressor"
      description="Reduce image file size while maintaining visual quality. Optimize images for web, email, and storage with advanced compression algorithms."
      icon={Archive}
      toolType="compress"
      processFunction={compressImages}
      options={compressOptions}
      maxFiles={20}
      allowBatchProcessing={true}
    />
  )
}
