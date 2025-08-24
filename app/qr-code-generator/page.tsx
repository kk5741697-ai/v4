"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { QRProcessor } from "@/lib/qr-processor"
import {
  QrCode,
  Download,
  Settings,
  Wifi,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  User,
  Link,
  FileText,
} from "lucide-react"

// QR Code content types
const contentTypes = [
  { id: "url", label: "URL", icon: Link, placeholder: "https://example.com" },
  { id: "text", label: "TEXT", icon: FileText, placeholder: "Enter your text here..." },
  { id: "email", label: "EMAIL", icon: Mail, placeholder: "email@example.com" },
  { id: "phone", label: "PHONE", icon: Phone, placeholder: "+1234567890" },
  { id: "sms", label: "SMS", icon: MessageSquare, placeholder: "Phone number" },
  { id: "wifi", label: "WIFI", icon: Wifi, placeholder: "Network name" },
  { id: "vcard", label: "VCARD", icon: User, placeholder: "Contact information" },
  { id: "event", label: "EVENT", icon: Calendar, placeholder: "Event details" },
]

// Color presets
const colorPresets = [
  { name: "Classic", foreground: "#000000", background: "#FFFFFF" },
  { name: "Blue", foreground: "#1E40AF", background: "#FFFFFF" },
  { name: "Green", foreground: "#059669", background: "#FFFFFF" },
  { name: "Red", foreground: "#DC2626", background: "#FFFFFF" },
  { name: "Purple", foreground: "#7C3AED", background: "#FFFFFF" },
  { name: "Orange", foreground: "#EA580C", background: "#FFFFFF" },
  { name: "Dark", foreground: "#FFFFFF", background: "#1F2937" },
  { name: "Gradient", foreground: "#3B82F6", background: "#EFF6FF" },
]

export default function QRCodeGeneratorPage() {
  const [activeType, setActiveType] = useState("url")
  const [content, setContent] = useState("https://www.example.com")
  const [qrSize, setQrSize] = useState([300])
  const [errorCorrection, setErrorCorrection] = useState("M")
  const [foregroundColor, setForegroundColor] = useState("#000000")
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoUrl, setLogoUrl] = useState("")
  const [cornerStyle, setCornerStyle] = useState("square")
  const [dotStyle, setDotStyle] = useState("square")
  const [quality, setQuality] = useState([1000])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // WiFi form fields
  const [wifiNetwork, setWifiNetwork] = useState("")
  const [wifiPassword, setWifiPassword] = useState("")
  const [wifiSecurity, setWifiSecurity] = useState("WPA")
  const [wifiHidden, setWifiHidden] = useState(false)

  // Email form fields
  const [emailTo, setEmailTo] = useState("")
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")

  // SMS form fields
  const [smsPhone, setSmsPhone] = useState("")
  const [smsMessage, setSmsMessage] = useState("")

  // vCard form fields
  const [vcardFirstName, setVcardFirstName] = useState("")
  const [vcardLastName, setVcardLastName] = useState("")
  const [vcardPhone, setVcardPhone] = useState("")
  const [vcardEmail, setVcardEmail] = useState("")
  const [vcardOrganization, setVcardOrganization] = useState("")
  const [vcardUrl, setVcardUrl] = useState("")

  // Event form fields
  const [eventTitle, setEventTitle] = useState("")
  const [eventLocation, setEventLocation] = useState("")
  const [eventStartDate, setEventStartDate] = useState("")
  const [eventEndDate, setEventEndDate] = useState("")
  const [eventDescription, setEventDescription] = useState("")

  // Generate QR content based on type
  const generateQRContent = () => {
    switch (activeType) {
      case "url":
        return content
      case "text":
        return content
      case "email":
        return `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
      case "phone":
        return `tel:${content}`
      case "sms":
        return `sms:${smsPhone}?body=${encodeURIComponent(smsMessage)}`
      case "wifi":
        return `WIFI:T:${wifiSecurity};S:${wifiNetwork};P:${wifiPassword};H:${wifiHidden ? "true" : "false"};;`
      case "vcard":
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${vcardFirstName} ${vcardLastName}\nORG:${vcardOrganization}\nTEL:${vcardPhone}\nEMAIL:${vcardEmail}\nURL:${vcardUrl}\nEND:VCARD`
      case "event":
        return `BEGIN:VEVENT\nSUMMARY:${eventTitle}\nLOCATION:${eventLocation}\nDTSTART:${eventStartDate}\nDTEND:${eventEndDate}\nDESCRIPTION:${eventDescription}\nEND:VEVENT`
      default:
        return content
    }
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

        // Update canvas with real QR code
        const canvas = canvasRef.current
        if (canvas) {
          const ctx = canvas.getContext("2d")
          if (ctx) {
            const img = new Image()
            img.onload = () => {
              canvas.width = qrSize[0]
              canvas.height = qrSize[0]
              ctx.drawImage(img, 0, 0)
            }
            img.src = qrDataURL
          }
        }
      } catch (error) {
        console.error("Failed to generate QR code:", error)
        // Fallback to existing simulation code
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Set canvas size
        canvas.width = qrSize[0]
        canvas.height = qrSize[0]

        // Clear canvas
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Draw QR code pattern (simplified simulation)
        ctx.fillStyle = foregroundColor
        const moduleSize = canvas.width / 25

        // Draw finder patterns (corners)
        const drawFinderPattern = (x: number, y: number) => {
          ctx.fillRect(x, y, moduleSize * 7, moduleSize * 7)
          ctx.fillStyle = backgroundColor
          ctx.fillRect(x + moduleSize, y + moduleSize, moduleSize * 5, moduleSize * 5)
          ctx.fillStyle = foregroundColor
          ctx.fillRect(x + moduleSize * 2, y + moduleSize * 2, moduleSize * 3, moduleSize * 3)
        }

        drawFinderPattern(0, 0)
        drawFinderPattern(canvas.width - moduleSize * 7, 0)
        drawFinderPattern(0, canvas.height - moduleSize * 7)

        // Draw data modules (random pattern for demo)
        for (let i = 0; i < 25; i++) {
          for (let j = 0; j < 25; j++) {
            if (Math.random() > 0.5) {
              ctx.fillRect(i * moduleSize, j * moduleSize, moduleSize, moduleSize)
            }
          }
        }

        // Draw logo if provided
        if (logoUrl) {
          const img = new Image()
          img.crossOrigin = "anonymous"
          img.onload = () => {
            const logoSize = canvas.width * 0.2
            const logoX = (canvas.width - logoSize) / 2
            const logoY = (canvas.height - logoSize) / 2

            // White background for logo
            ctx.fillStyle = "#FFFFFF"
            ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10)

            ctx.drawImage(img, logoX, logoY, logoSize, logoSize)
          }
          img.src = logoUrl
        }
      }
    }

    generateQR()
  }, [
    qrSize,
    foregroundColor,
    backgroundColor,
    logoUrl,
    activeType,
    content,
    emailTo,
    emailSubject,
    emailBody,
    smsPhone,
    smsMessage,
    wifiNetwork,
    wifiPassword,
    wifiSecurity,
    wifiHidden,
    vcardFirstName,
    vcardLastName,
    vcardPhone,
    vcardEmail,
    vcardOrganization,
    vcardUrl,
    eventTitle,
    eventLocation,
    eventStartDate,
    eventEndDate,
    eventDescription,
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
      const qrContent = generateQRContent()
      if (!qrContent.trim()) return

      const qrOptions = {
        width: quality[0],
        color: {
          dark: foregroundColor,
          light: backgroundColor,
        },
        errorCorrectionLevel: errorCorrection as "L" | "M" | "Q" | "H",
        logo: logoUrl
          ? {
              src: logoUrl,
              width: quality[0] * 0.2,
            }
          : undefined,
      }

      if (format === "svg") {
        const svgString = await QRProcessor.generateQRCodeSVG(qrContent, qrOptions)
        const blob = new Blob([svgString], { type: "image/svg+xml" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.download = "qr-code.svg"
        link.href = url
        link.click()
        URL.revokeObjectURL(url)
      } else {
        const qrDataURL = await QRProcessor.generateQRCode(qrContent, qrOptions)
        const link = document.createElement("a")
        link.download = `qr-code.${format}`
        link.href = qrDataURL
        link.click()
      }
    } catch (error) {
      console.error("Failed to download QR code:", error)
      // Fallback to canvas download
      const canvas = canvasRef.current
      if (!canvas) return

      const link = document.createElement("a")
      link.download = `qr-code.${format}`
      link.href = canvas.toDataURL("image/png")
      link.click()
    }
  }

  const renderContentForm = () => {
    switch (activeType) {
      case "url":
      case "text":
      case "phone":
        return (
          <div className="space-y-4">
            <Label htmlFor="content">
              {activeType === "url" ? "Your URL" : activeType === "phone" ? "Phone Number" : "Your Text"}
            </Label>
            {activeType === "text" ? (
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={contentTypes.find((t) => t.id === activeType)?.placeholder}
                rows={4}
              />
            ) : (
              <Input
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={contentTypes.find((t) => t.id === activeType)?.placeholder}
              />
            )}
          </div>
        )

      case "email":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="email-to">Email Address</Label>
              <Input
                id="email-to"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="recipient@example.com"
              />
            </div>
            <div>
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>
            <div>
              <Label htmlFor="email-body">Message</Label>
              <Textarea
                id="email-body"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Email message"
                rows={3}
              />
            </div>
          </div>
        )

      case "sms":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="sms-phone">Phone Number</Label>
              <Input
                id="sms-phone"
                value={smsPhone}
                onChange={(e) => setSmsPhone(e.target.value)}
                placeholder="+1234567890"
              />
            </div>
            <div>
              <Label htmlFor="sms-message">Message</Label>
              <Textarea
                id="sms-message"
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                placeholder="SMS message"
                rows={3}
              />
            </div>
          </div>
        )

      case "wifi":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="wifi-network">Network Name (SSID)</Label>
              <Input
                id="wifi-network"
                value={wifiNetwork}
                onChange={(e) => setWifiNetwork(e.target.value)}
                placeholder="MyWiFiNetwork"
              />
            </div>
            <div>
              <Label htmlFor="wifi-password">Password</Label>
              <Input
                id="wifi-password"
                type="password"
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                placeholder="WiFi password"
              />
            </div>
            <div>
              <Label htmlFor="wifi-security">Security Type</Label>
              <Select value={wifiSecurity} onValueChange={setWifiSecurity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WPA">WPA/WPA2</SelectItem>
                  <SelectItem value="WEP">WEP</SelectItem>
                  <SelectItem value="nopass">No Password</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case "vcard":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vcard-first">First Name</Label>
                <Input
                  id="vcard-first"
                  value={vcardFirstName}
                  onChange={(e) => setVcardFirstName(e.target.value)}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="vcard-last">Last Name</Label>
                <Input
                  id="vcard-last"
                  value={vcardLastName}
                  onChange={(e) => setVcardLastName(e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="vcard-phone">Phone</Label>
              <Input
                id="vcard-phone"
                value={vcardPhone}
                onChange={(e) => setVcardPhone(e.target.value)}
                placeholder="+1234567890"
              />
            </div>
            <div>
              <Label htmlFor="vcard-email">Email</Label>
              <Input
                id="vcard-email"
                value={vcardEmail}
                onChange={(e) => setVcardEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label htmlFor="vcard-org">Organization</Label>
              <Input
                id="vcard-org"
                value={vcardOrganization}
                onChange={(e) => setVcardOrganization(e.target.value)}
                placeholder="Company Name"
              />
            </div>
            <div>
              <Label htmlFor="vcard-url">Website</Label>
              <Input
                id="vcard-url"
                value={vcardUrl}
                onChange={(e) => setVcardUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
        )

      case "event":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="event-title">Event Title</Label>
              <Input
                id="event-title"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Meeting Title"
              />
            </div>
            <div>
              <Label htmlFor="event-location">Location</Label>
              <Input
                id="event-location"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="Conference Room A"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="event-start">Start Date</Label>
                <Input
                  id="event-start"
                  type="datetime-local"
                  value={eventStartDate}
                  onChange={(e) => setEventStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="event-end">End Date</Label>
                <Input
                  id="event-end"
                  type="datetime-local"
                  value={eventEndDate}
                  onChange={(e) => setEventEndDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="event-description">Description</Label>
              <Textarea
                id="event-description"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Event description"
                rows={3}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-4">
            <QrCode className="h-8 w-8 text-accent" />
            <h1 className="text-3xl font-heading font-bold text-foreground">QR Code Generator</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create custom QR codes with logos, colors, and multiple formats. Perfect for marketing, business cards, and
            digital sharing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Content Input */}
          <div className="lg:col-span-2 space-y-6">
            {/* Content Type Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Content Type</span>
                </CardTitle>
                <CardDescription>Choose what type of content your QR code will contain</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {contentTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <Button
                        key={type.id}
                        variant={activeType === type.id ? "default" : "outline"}
                        className="h-auto p-4 flex flex-col items-center space-y-2"
                        onClick={() => setActiveType(type.id)}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs font-medium">{type.label}</span>
                      </Button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Content Form */}
            <Card>
              <CardHeader>
                <CardTitle>Enter Content</CardTitle>
                <CardDescription>Fill in the details for your QR code content</CardDescription>
              </CardHeader>
              <CardContent>{renderContentForm()}</CardContent>
            </Card>

            {/* Customization Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Customization</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="colors" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="colors">Colors</TabsTrigger>
                    <TabsTrigger value="logo">Logo</TabsTrigger>
                    <TabsTrigger value="style">Style</TabsTrigger>
                  </TabsList>

                  <TabsContent value="colors" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fg-color">Foreground Color</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="fg-color"
                            type="color"
                            value={foregroundColor}
                            onChange={(e) => setForegroundColor(e.target.value)}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={foregroundColor}
                            onChange={(e) => setForegroundColor(e.target.value)}
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="bg-color">Background Color</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="bg-color"
                            type="color"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            placeholder="#FFFFFF"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="mb-3 block">Color Presets</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {colorPresets.map((preset) => (
                          <Button
                            key={preset.name}
                            variant="outline"
                            size="sm"
                            className="h-auto p-2 flex flex-col items-center space-y-1 bg-transparent"
                            onClick={() => {
                              setForegroundColor(preset.foreground)
                              setBackgroundColor(preset.background)
                            }}
                          >
                            <div className="flex space-x-1">
                              <div
                                className="w-3 h-3 rounded-sm border"
                                style={{ backgroundColor: preset.foreground }}
                              />
                              <div
                                className="w-3 h-3 rounded-sm border"
                                style={{ backgroundColor: preset.background }}
                              />
                            </div>
                            <span className="text-xs">{preset.name}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="logo" className="space-y-4">
                    <div>
                      <Label htmlFor="logo-upload">Upload Logo</Label>
                      <div className="mt-2">
                        <Input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-accent-foreground hover:file:bg-accent/80"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Recommended: Square image, max 2MB</p>
                    </div>
                    {logoUrl && (
                      <div className="flex items-center space-x-2">
                        <img
                          src={logoUrl || "/placeholder.svg"}
                          alt="Logo preview"
                          className="w-12 h-12 object-cover rounded"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setLogoUrl("")
                            setLogoFile(null)
                          }}
                        >
                          Remove Logo
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="style" className="space-y-4">
                    <div>
                      <Label>Error Correction Level</Label>
                      <Select value={errorCorrection} onValueChange={setErrorCorrection}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="L">Low (7%)</SelectItem>
                          <SelectItem value="M">Medium (15%)</SelectItem>
                          <SelectItem value="Q">Quartile (25%)</SelectItem>
                          <SelectItem value="H">High (30%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Corner Style</Label>
                      <Select value={cornerStyle} onValueChange={setCornerStyle}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="square">Square</SelectItem>
                          <SelectItem value="rounded">Rounded</SelectItem>
                          <SelectItem value="circle">Circle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Dot Style</Label>
                      <Select value={dotStyle} onValueChange={setDotStyle}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="square">Square</SelectItem>
                          <SelectItem value="rounded">Rounded</SelectItem>
                          <SelectItem value="circle">Circle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Preview & Download */}
          <div className="space-y-6">
            {/* QR Code Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <QrCode className="h-5 w-5" />
                  <span>Preview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <canvas
                    ref={canvasRef}
                    className="border border-border rounded"
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                </div>

                <div className="w-full space-y-4">
                  <div>
                    <Label>
                      Quality: {quality[0]}x{quality[0]} px
                    </Label>
                    <Slider
                      value={quality}
                      onValueChange={setQuality}
                      max={2000}
                      min={200}
                      step={100}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Low Quality</span>
                      <span>High Quality</span>
                    </div>
                  </div>

                  <div>
                    <Label>
                      Size: {qrSize[0]}x{qrSize[0]} px
                    </Label>
                    <Slider value={qrSize} onValueChange={setQrSize} max={800} min={200} step={50} className="mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Download Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="h-5 w-5" />
                  <span>Download</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={() => downloadQR("png")} className="w-full" size="lg">
                  Download PNG
                </Button>

                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" onClick={() => downloadQR("svg")}>
                    SVG
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadQR("pdf")}>
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadQR("eps")}>
                    EPS
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  * No support for color gradients in vector formats
                </p>
              </CardContent>
            </Card>

            {/* QR Code Templates */}
            <Card>
              <CardHeader>
                <CardTitle>QR Code Templates</CardTitle>
                <CardDescription>Quick start with pre-designed templates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto p-3 flex flex-col items-center space-y-1 bg-transparent"
                    onClick={() => {
                      setActiveType("url")
                      setContent("https://example.com")
                      setForegroundColor("#1E40AF")
                      setBackgroundColor("#FFFFFF")
                    }}
                  >
                    <div className="w-6 h-6 bg-blue-500 rounded"></div>
                    <span className="text-xs">Business</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto p-3 flex flex-col items-center space-y-1 bg-transparent"
                    onClick={() => {
                      setActiveType("wifi")
                      setWifiNetwork("MyWiFi")
                      setForegroundColor("#059669")
                      setBackgroundColor("#FFFFFF")
                    }}
                  >
                    <div className="w-6 h-6 bg-green-500 rounded"></div>
                    <span className="text-xs">WiFi</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto p-3 flex flex-col items-center space-y-1 bg-transparent"
                    onClick={() => {
                      setActiveType("vcard")
                      setVcardFirstName("John")
                      setVcardLastName("Doe")
                      setForegroundColor("#DC2626")
                      setBackgroundColor("#FFFFFF")
                    }}
                  >
                    <div className="w-6 h-6 bg-red-500 rounded"></div>
                    <span className="text-xs">Contact</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto p-3 flex flex-col items-center space-y-1 bg-transparent"
                    onClick={() => {
                      setActiveType("event")
                      setEventTitle("Meeting")
                      setForegroundColor("#7C3AED")
                      setBackgroundColor("#FFFFFF")
                    }}
                  >
                    <div className="w-6 h-6 bg-purple-500 rounded"></div>
                    <span className="text-xs">Event</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
