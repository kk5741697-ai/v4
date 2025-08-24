"use client"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { QRProcessor } from "@/lib/processors/qr-processor"
import { Badge } from "@/components/ui/badge"
import {
  QrCode,
  Download,
  Settings,
  Link,
  FileText,
  Wifi,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  User,
  Upload,
  Palette,
  Image as ImageIcon,
  CheckCircle,
  Minus,
  Plus
} from "lucide-react"

export default function QRCodeGeneratorPage() {
  const [activeType, setActiveType] = useState("URL")
  const [content, setContent] = useState("https://www.qrcode-monkey.com")
  const [qrSize, setQrSize] = useState([1000])
  const [errorCorrection, setErrorCorrection] = useState("M")
  const [foregroundColor, setForegroundColor] = useState("#000000")
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoUrl, setLogoUrl] = useState("")
  const [statisticsEnabled, setStatisticsEnabled] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrDataUrl, setQrDataUrl] = useState("")

  const contentTypes = [
    { id: "URL", label: "URL", icon: Link },
    { id: "TEXT", label: "TEXT", icon: FileText },
    { id: "EMAIL", label: "EMAIL", icon: Mail },
    { id: "PHONE", label: "PHONE", icon: Phone },
    { id: "SMS", label: "SMS", icon: MessageSquare },
    { id: "VCARD", label: "VCARD", icon: User },
    { id: "MECARD", label: "MECARD", icon: User },
    { id: "LOCATION", label: "LOCATION", icon: Calendar },
    { id: "FACEBOOK", label: "FACEBOOK", icon: Link },
    { id: "TWITTER", label: "TWITTER", icon: Link },
    { id: "YOUTUBE", label: "YOUTUBE", icon: Link },
    { id: "WIFI", label: "WIFI", icon: Wifi },
    { id: "EVENT", label: "EVENT", icon: Calendar },
    { id: "BITCOIN", label: "BITCOIN", icon: Link },
  ]

  const generateQRContent = () => {
    return content // For now, just use the content directly
  }

  useEffect(() => {
    const generateQR = async () => {
      try {
        const qrContent = generateQRContent()
        if (!qrContent.trim()) return

        const qrOptions = {
          width: qrSize[0],
          color: {
            dark: foregroundColor,
            light: backgroundColor,
          },
          errorCorrectionLevel: errorCorrection as "L" | "M" | "Q" | "H",
          logo: logoUrl
            ? {
                src: logoUrl,
                width: qrSize[0] * 0.2,
              }
            : undefined,
        }

        const qrDataURL = await QRProcessor.generateQRCode(qrContent, qrOptions)
        setQrDataUrl(qrDataURL)

      } catch (error) {
        console.error("Failed to generate QR code:", error)
      }
    }

    generateQR()
  }, [
    qrSize,
    foregroundColor,
    backgroundColor,
    logoUrl,
    content,
    errorCorrection,
  ])

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const url = URL.createObjectURL(file)
      setLogoUrl(url)
    }
  }

  const downloadQR = async (format: string) => {
    try {
      if (format === "svg") {
        const qrContent = generateQRContent()
        const qrOptions = {
          width: qrSize[0],
          color: { dark: foregroundColor, light: backgroundColor },
          errorCorrectionLevel: errorCorrection as "L" | "M" | "Q" | "H"
        }
        const svgString = await QRProcessor.generateQRCodeSVG(qrContent, qrOptions)
        const blob = new Blob([svgString], { type: "image/svg+xml" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.download = "qr-code.svg"
        link.href = url
        link.click()
        URL.revokeObjectURL(url)
      } else {
        if (!qrDataUrl) return
        const link = document.createElement("a")
        link.download = `qr-code.${format}`
        link.href = qrDataUrl
        link.click()
      }
    } catch (error) {
      console.error("Failed to download QR code:", error)
    }
  }

  return (
    <div className="min-h-screen bg-green-500">
      <Header />

      {/* Top Navigation Bar */}
      <div className="bg-green-600 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-8 py-3 text-sm">
            {contentTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setActiveType(type.id)}
                className={`px-3 py-1 rounded ${
                  activeType === type.id 
                    ? "bg-white text-green-600 font-medium" 
                    : "hover:bg-green-500"
                }`}
              >
                {type.label}
              </button>
            ))}
            <button className="hover:bg-green-500 px-3 py-1 rounded">MORE</button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3">
            {/* Left Panel - Content Input */}
            <div className="lg:col-span-2 p-6 space-y-6">
              {/* Content Input */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg">ENTER CONTENT</CardTitle>
                    <Button variant="ghost" size="sm" className="ml-auto">
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="content" className="text-sm text-gray-600">
                      Your URL
                    </Label>
                    <Input
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="https://www.qrcode-monkey.com"
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="mt-4 flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-xs">OFF</span>
                    </div>
                    <span className="text-sm text-gray-600">Statistics and Editability</span>
                  </div>
                </CardContent>
              </Card>

              {/* Set Colors */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                      <Palette className="h-5 w-5 text-gray-600" />
                    </div>
                    <CardTitle className="text-lg">SET COLORS</CardTitle>
                    <Button variant="ghost" size="sm" className="ml-auto">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* Add Logo Image */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <CardTitle className="text-lg">ADD LOGO IMAGE</CardTitle>
                    <Button variant="ghost" size="sm" className="ml-auto">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* Customize Design */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                      <Settings className="h-5 w-5 text-gray-600" />
                    </div>
                    <CardTitle className="text-lg">CUSTOMIZE DESIGN</CardTitle>
                    <Button variant="ghost" size="sm" className="ml-auto">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              <div className="text-sm text-blue-600 cursor-pointer">
                Upload MP3, PDF or any file you wish to your QR Code.
              </div>
            </div>

            {/* Right Panel - QR Code Preview */}
            <div className="bg-gray-50 p-6 space-y-6">
              {/* QR Code Display */}
              <div className="bg-white p-8 rounded-lg text-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    className="mx-auto max-w-full h-auto"
                    style={{ maxWidth: "300px" }}
                  />
                ) : (
                  <div className="w-64 h-64 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
                    <QrCode className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Quality Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Low Quality</span>
                  <span className="text-sm font-medium">{qrSize[0]} x {qrSize[0]} Px</span>
                  <span className="text-sm text-gray-600">High Quality</span>
                </div>
                <Slider
                  value={qrSize}
                  onValueChange={setQrSize}
                  max={2000}
                  min={200}
                  step={100}
                  className="w-full"
                />
              </div>

              {/* Download Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={() => downloadQR("png")} 
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                  size="lg"
                >
                  Create QR Code
                </Button>
                
                <Button 
                  onClick={() => downloadQR("png")} 
                  className="w-full bg-blue-400 hover:bg-blue-500 text-white"
                  size="lg"
                >
                  Download PNG
                </Button>

                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => downloadQR("svg")}
                    className="text-blue-400 border-blue-400"
                  >
                    .SVG
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => downloadQR("pdf")}
                    className="text-orange-400 border-orange-400"
                  >
                    .PDF*
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => downloadQR("eps")}
                    className="text-purple-400 border-purple-400"
                  >
                    .EPS*
                  </Button>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  * no support for color gradients
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* QR Code Templates */}
        <div className="mt-8 text-center">
          <Button className="bg-gray-600 hover:bg-gray-700 text-white px-8">
            <Settings className="h-4 w-4 mr-2" />
            QR Code Templates
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  )
}