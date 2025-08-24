"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Crop, RotateCw, ZoomIn, ZoomOut, Move, Square } from "lucide-react"

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

interface CropInterfaceProps {
  imageUrl: string
  originalWidth: number
  originalHeight: number
  onCropChange: (cropArea: CropArea) => void
  aspectRatio?: number | null
  className?: string
}

export function CropInterface({
  imageUrl,
  originalWidth,
  originalHeight,
  onCropChange,
  aspectRatio = null,
  className = ""
}: CropInterfaceProps) {
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 10,
    y: 10,
    width: 80,
    height: 80
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragType, setDragType] = useState<"move" | "resize" | null>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    onCropChange(cropArea)
  }, [cropArea, onCropChange])

  const handleMouseDown = useCallback((e: React.MouseEvent, type: "move" | "resize") => {
    e.preventDefault()
    setIsDragging(true)
    setDragType(type)
    setDragStart({ x: e.clientX, y: e.clientY })
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current || !dragType) return

    const rect = containerRef.current.getBoundingClientRect()
    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100

    setCropArea(prev => {
      let newArea = { ...prev }

      if (dragType === "move") {
        newArea.x = Math.max(0, Math.min(100 - prev.width, prev.x + deltaX))
        newArea.y = Math.max(0, Math.min(100 - prev.height, prev.y + deltaY))
      } else if (dragType === "resize") {
        newArea.width = Math.max(5, Math.min(100 - prev.x, prev.width + deltaX))
        newArea.height = Math.max(5, Math.min(100 - prev.y, prev.height + deltaY))
        
        // Maintain aspect ratio if specified
        if (aspectRatio) {
          const currentRatio = newArea.width / newArea.height
          if (currentRatio > aspectRatio) {
            newArea.width = newArea.height * aspectRatio
          } else {
            newArea.height = newArea.width / aspectRatio
          }
        }
      }

      return newArea
    })

    setDragStart({ x: e.clientX, y: e.clientY })
  }, [isDragging, dragStart, dragType, aspectRatio])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragType(null)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const updateCropValue = (field: keyof CropArea, value: number) => {
    setCropArea(prev => {
      const newArea = { ...prev, [field]: value }
      
      // Ensure crop area stays within bounds
      if (field === "x" || field === "width") {
        newArea.x = Math.max(0, Math.min(100 - newArea.width, newArea.x))
        newArea.width = Math.max(1, Math.min(100 - newArea.x, newArea.width))
      }
      if (field === "y" || field === "height") {
        newArea.y = Math.max(0, Math.min(100 - newArea.height, newArea.y))
        newArea.height = Math.max(1, Math.min(100 - newArea.y, newArea.height))
      }
      
      return newArea
    })
  }

  const setAspectRatio = (ratio: number | null) => {
    if (ratio) {
      setCropArea(prev => {
        const currentRatio = prev.width / prev.height
        let newArea = { ...prev }
        
        if (currentRatio > ratio) {
          newArea.width = prev.height * ratio
        } else {
          newArea.height = prev.width / ratio
        }
        
        // Ensure it fits within bounds
        if (newArea.x + newArea.width > 100) {
          newArea.x = 100 - newArea.width
        }
        if (newArea.y + newArea.height > 100) {
          newArea.y = 100 - newArea.height
        }
        
        return newArea
      })
    }
  }

  const pixelCropArea = {
    x: Math.round((cropArea.x / 100) * originalWidth),
    y: Math.round((cropArea.y / 100) * originalHeight),
    width: Math.round((cropArea.width / 100) * originalWidth),
    height: Math.round((cropArea.height / 100) * originalHeight)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Crop Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crop className="h-5 w-5" />
              <span>Crop Preview</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">{Math.round(zoom * 100)}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.min(3, zoom + 0.1))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRotation(prev => (prev + 90) % 360)}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            ref={containerRef}
            className="relative bg-gray-100 rounded-lg overflow-hidden"
            style={{ aspectRatio: "16/10", minHeight: "400px" }}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Crop preview"
              className="w-full h-full object-contain select-none"
              style={{ 
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: "center"
              }}
              draggable={false}
            />
            
            {/* Crop Overlay */}
            <div
              className="absolute border-2 border-blue-500 bg-blue-500/20 cursor-move"
              style={{
                left: `${cropArea.x}%`,
                top: `${cropArea.y}%`,
                width: `${cropArea.width}%`,
                height: `${cropArea.height}%`
              }}
              onMouseDown={(e) => handleMouseDown(e, "move")}
            >
              {/* Corner Resize Handles */}
              <div
                className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white cursor-se-resize"
                onMouseDown={(e) => {
                  e.stopPropagation()
                  handleMouseDown(e, "resize")
                }}
              />
              
              {/* Move Icon */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Move className="h-6 w-6 text-white drop-shadow-lg" />
              </div>
            </div>

            {/* Grid Lines */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="border border-white/50" />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Crop Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Crop Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Aspect Ratio Presets */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Aspect Ratio</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAspectRatio(null)}
                className={aspectRatio === null ? "bg-blue-50 border-blue-500" : ""}
              >
                Free
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAspectRatio(1)}
                className={aspectRatio === 1 ? "bg-blue-50 border-blue-500" : ""}
              >
                1:1
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAspectRatio(4/3)}
                className={aspectRatio === 4/3 ? "bg-blue-50 border-blue-500" : ""}
              >
                4:3
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAspectRatio(16/9)}
                className={aspectRatio === 16/9 ? "bg-blue-50 border-blue-500" : ""}
              >
                16:9
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAspectRatio(3/2)}
                className={aspectRatio === 3/2 ? "bg-blue-50 border-blue-500" : ""}
              >
                3:2
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAspectRatio(5/4)}
                className={aspectRatio === 5/4 ? "bg-blue-50 border-blue-500" : ""}
              >
                5:4
              </Button>
            </div>
          </div>

          {/* Pixel Values */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="crop-width">Width (px)</Label>
              <Input
                id="crop-width"
                type="number"
                value={pixelCropArea.width}
                onChange={(e) => updateCropValue("width", (parseInt(e.target.value) / originalWidth) * 100)}
                min="1"
                max={originalWidth}
              />
            </div>
            <div>
              <Label htmlFor="crop-height">Height (px)</Label>
              <Input
                id="crop-height"
                type="number"
                value={pixelCropArea.height}
                onChange={(e) => updateCropValue("height", (parseInt(e.target.value) / originalHeight) * 100)}
                min="1"
                max={originalHeight}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="crop-x">Position X (px)</Label>
              <Input
                id="crop-x"
                type="number"
                value={pixelCropArea.x}
                onChange={(e) => updateCropValue("x", (parseInt(e.target.value) / originalWidth) * 100)}
                min="0"
                max={originalWidth - pixelCropArea.width}
              />
            </div>
            <div>
              <Label htmlFor="crop-y">Position Y (px)</Label>
              <Input
                id="crop-y"
                type="number"
                value={pixelCropArea.y}
                onChange={(e) => updateCropValue("y", (parseInt(e.target.value) / originalHeight) * 100)}
                min="0"
                max={originalHeight - pixelCropArea.height}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCropArea({ x: 0, y: 0, width: 100, height: 100 })}
            >
              <Square className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCropArea({ x: 25, y: 25, width: 50, height: 50 })}
            >
              Center
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}