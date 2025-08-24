"use client"

import { ImageToolLayout } from "@/components/image-tool-layout"
import { Maximize } from "lucide-react"

const resizeOptions = [
  {
    key: "width",
    label: "Width (px)",
    type: "number" as const,
    defaultValue: 800,
  },
  {
    key: "height",
    label: "Height (px)",
    type: "number" as const,
    defaultValue: 600,
  },
  {
    key: "maintainAspectRatio",
    label: "Maintain Aspect Ratio",
    type: "checkbox" as const,
    defaultValue: true,
  },
  {
    key: "resizeMode",
    label: "Resize Mode",
    type: "select" as const,
    defaultValue: "fit",
    selectOptions: [
      { value: "fit", label: "Fit (maintain ratio)" },
      { value: "fill", label: "Fill (crop if needed)" },
      { value: "stretch", label: "Stretch (ignore ratio)" },
    ],
  },
  {
    key: "quality",
    label: "Quality",
    type: "slider" as const,
    defaultValue: 90,
    min: 10,
    max: 100,
    step: 5,
  },
  {
    key: "outputFormat",
    label: "Output Format",
    type: "select" as const,
    defaultValue: "jpeg",
    selectOptions: [
      { value: "jpeg", label: "JPEG" },
      { value: "png", label: "PNG" },
      { value: "webp", label: "WebP" },
    ],
  },
]

async function resizeImages(files: any[], options: any) {
  return new Promise<{ success: boolean; processedFiles?: any[]; error?: string }>((resolve) => {
    try {
      const processedFiles = files.map(async (file) => {
        return new Promise<any>((fileResolve) => {
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")
          if (!ctx) {
            fileResolve(file)
            return
          }

          const img = new Image()
          img.onload = () => {
            let { width: targetWidth, height: targetHeight } = options
            const { width: originalWidth, height: originalHeight } = file.dimensions

            // Calculate dimensions based on resize mode
            if (options.maintainAspectRatio && options.resizeMode === "fit") {
              const aspectRatio = originalWidth / originalHeight
              if (targetWidth / targetHeight > aspectRatio) {
                targetWidth = targetHeight * aspectRatio
              } else {
                targetHeight = targetWidth / aspectRatio
              }
            }

            canvas.width = targetWidth
            canvas.height = targetHeight

            // Apply resize mode
            switch (options.resizeMode) {
              case "fit":
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
                break
              case "fill":
                const scale = Math.max(targetWidth / originalWidth, targetHeight / originalHeight)
                const scaledWidth = originalWidth * scale
                const scaledHeight = originalHeight * scale
                const offsetX = (targetWidth - scaledWidth) / 2
                const offsetY = (targetHeight - scaledHeight) / 2
                ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight)
                break
              case "stretch":
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
                break
            }

            const quality = options.quality / 100
            const format = options.outputFormat === "jpg" ? "jpeg" : options.outputFormat
            const mimeType = `image/${format}`

            const processedDataUrl = canvas.toDataURL(mimeType, quality)

            fileResolve({
              ...file,
              processed: true,
              processedPreview: processedDataUrl,
              dimensions: {
                width: targetWidth,
                height: targetHeight,
              },
            })
          }

          img.onerror = () => {
            fileResolve(file)
          }

          img.src = file.preview
        })
      })

      Promise.all(processedFiles).then((results) => {
        resolve({
          success: true,
          processedFiles: results,
        })
      })
    } catch (error) {
      resolve({
        success: false,
        error: "Failed to process images",
      })
    }
  })
}

export default function ImageResizerPage() {
  return (
    <ImageToolLayout
      title="Image Resizer"
      description="Resize images to specific dimensions while maintaining quality. Perfect for web optimization, social media, and print preparation."
      icon={Maximize}
      toolType="resize"
      processFunction={resizeImages}
      options={resizeOptions}
      maxFiles={10}
      allowBatchProcessing={true}
    />
  )
}
