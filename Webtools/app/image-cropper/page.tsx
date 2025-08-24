"use client"

import { ImageToolLayout } from "@/components/image-tool-layout"
import { Crop } from "lucide-react"

const cropOptions = [
  {
    key: "aspectRatio",
    label: "Aspect Ratio",
    type: "select" as const,
    defaultValue: "free",
    selectOptions: [
      { value: "free", label: "Free Form" },
      { value: "1:1", label: "Square (1:1)" },
      { value: "4:3", label: "Standard (4:3)" },
      { value: "16:9", label: "Widescreen (16:9)" },
      { value: "3:2", label: "Photo (3:2)" },
      { value: "5:4", label: "Large Format (5:4)" },
    ],
  },
  {
    key: "outputFormat",
    label: "Output Format",
    type: "select" as const,
    defaultValue: "png",
    selectOptions: [
      { value: "jpeg", label: "JPEG" },
      { value: "png", label: "PNG" },
      { value: "webp", label: "WebP" },
    ],
  },
  {
    key: "quality",
    label: "Quality",
    type: "slider" as const,
    defaultValue: 95,
    min: 10,
    max: 100,
    step: 5,
  },
  {
    key: "backgroundColor",
    label: "Background Color",
    type: "color" as const,
    defaultValue: "#ffffff",
  },
]

async function cropImages(files: any[], options: any) {
  // Simulate image cropping process
  return new Promise<{ success: boolean; processedFiles?: any[]; error?: string }>((resolve) => {
    setTimeout(() => {
      if (files.length === 0) {
        resolve({
          success: false,
          error: "No files to process",
        })
        return
      }

      // Simulate successful crop
      const processedFiles = files.map((file) => {
        const cropArea = options.cropArea || { x: 10, y: 10, width: 80, height: 80 }
        const newWidth = Math.round((cropArea.width / 100) * file.dimensions.width)
        const newHeight = Math.round((cropArea.height / 100) * file.dimensions.height)

        return {
          ...file,
          processed: true,
          processedPreview: file.preview,
          dimensions: { width: newWidth, height: newHeight },
        }
      })

      resolve({
        success: true,
        processedFiles,
      })
    }, 1800)
  })
}

export default function ImageCropperPage() {
  return (
    <ImageToolLayout
      title="Image Cropper"
      description="Crop images to specific dimensions or aspect ratios. Perfect for creating thumbnails, profile pictures, and social media content."
      icon={Crop}
      toolType="crop"
      processFunction={cropImages}
      options={cropOptions}
      maxFiles={5}
      allowBatchProcessing={false}
      showCropInterface={true}
    />
  )
}
