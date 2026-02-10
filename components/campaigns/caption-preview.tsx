"use client"

import { useState, useEffect, useMemo } from "react"
import {
  CAPTION_PRESETS,
  DEFAULT_CAPTION_STYLE,
  type CaptionStyle,
  type CaptionSegment,
} from "@/lib/types/caption"

interface CaptionPreviewProps {
  style?: Partial<CaptionStyle>
  presetId?: string | null
  segments?: CaptionSegment[]
  previewText?: string
  imageUrl?: string | null
}

const EXAMPLE_SEGMENTS = [
  "Olha só que incrível",
  "esse produto mudou",
  "completamente minha rotina",
  "vocês precisam conhecer",
]

export function CaptionPreview({
  style: customStyle,
  presetId,
  segments,
  previewText,
  imageUrl,
}: CaptionPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const resolvedStyle = useMemo(() => {
    const preset = presetId ? CAPTION_PRESETS.find((p) => p.id === presetId) : undefined
    const base = preset?.style ?? DEFAULT_CAPTION_STYLE
    if (!customStyle) return base
    return {
      ...base,
      ...Object.fromEntries(
        Object.entries(customStyle).filter(([, v]) => v !== undefined)
      ),
    } as CaptionStyle
  }, [presetId, customStyle])

  const displayTexts = useMemo(() => {
    if (segments && segments.length > 0) {
      return segments.map((s) => s.text)
    }
    if (previewText) {
      return previewText.split(/[.!?]+/).filter(Boolean).map((s) => s.trim())
    }
    return EXAMPLE_SEGMENTS
  }, [segments, previewText])

  useEffect(() => {
    if (displayTexts.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayTexts.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [displayTexts.length])

  const animationName = getAnimationName(resolvedStyle.animation)
  const positionStyles = getPositionStyles(resolvedStyle.position)

  return (
    <div
      className="relative rounded-lg overflow-hidden border"
      style={{
        aspectRatio: "9/16",
        maxHeight: 320,
        background: imageUrl
          ? `url(${imageUrl}) center/cover no-repeat`
          : "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      }}
    >
      {/* Caption overlay */}
      <div
        className="absolute inset-x-0 flex justify-center px-3"
        style={positionStyles}
      >
        <div
          key={currentIndex}
          className="inline-block px-3 py-1.5 max-w-[90%] text-center"
          style={{
            fontFamily: resolvedStyle.fontFamily,
            fontSize: `${Math.min(resolvedStyle.fontSize * 0.45, 20)}px`,
            fontWeight: resolvedStyle.fontWeight,
            color: resolvedStyle.color,
            backgroundColor: `${resolvedStyle.backgroundColor}${Math.round(resolvedStyle.backgroundOpacity * 255).toString(16).padStart(2, "0")}`,
            borderRadius: `${resolvedStyle.borderRadius * 0.5}px`,
            letterSpacing: `${resolvedStyle.letterSpacing}px`,
            textTransform: resolvedStyle.textTransform,
            WebkitTextStroke: resolvedStyle.strokeWidth > 0
              ? `${resolvedStyle.strokeWidth * 0.5}px ${resolvedStyle.strokeColor}`
              : undefined,
            animation: animationName
              ? `${animationName} ${resolvedStyle.animationDuration}s ease-out`
              : undefined,
          }}
        >
          {displayTexts[currentIndex]}
        </div>
      </div>

      {/* Gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
    </div>
  )
}

function getAnimationName(animation: CaptionStyle["animation"]): string | null {
  switch (animation) {
    case "fade-in": return "captionFadeIn"
    case "slide-up": return "captionSlideUp"
    case "pop-scale": return "captionPopScale"
    case "typewriter": return "captionTypewriter"
    case "bounce": return "captionBounce"
    case "none": return null
    default: return "captionFadeIn"
  }
}

function getPositionStyles(position: CaptionStyle["position"]): React.CSSProperties {
  switch (position) {
    case "top": return { top: "12%" }
    case "center": return { top: "50%", transform: "translateY(-50%)" }
    case "bottom": return { bottom: "12%" }
    default: return { bottom: "12%" }
  }
}
