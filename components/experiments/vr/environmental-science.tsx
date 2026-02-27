"use client"
/*
import { useMemo } from "react"
import IframeWithFallback from "@/components/experiments/vr/iframe-wrapper"
import { Box, Text, Sphere } from "@react-three/drei"

export function EnvironmentalScience({
  parameters = {},
}: {
  parameters?: { trees?: number; pollution?: number }
}) {
  const trees = Math.max(0, Math.min(200, Math.floor(parameters.trees ?? 60)))
  const pollution = Math.max(0, Math.min(1, parameters.pollution ?? 0.3))

  const treePositions = useMemo<[number, number, number][]>(() => {
    return Array.from({ length: trees }).map(() => [(Math.random() - 0.5) * 12, 0, (Math.random() - 0.5) * 12])
  }, [trees])

  return (
    <group>
      <Box args={[16, 0.1, 16]} position={[0, -0.05, 0]}>
        <meshStandardMaterial color="#16a34a" />
      </Box>

      {treePositions.map((p, i) => (
        <group key={i} position={[p[0], 0, p[2]]}>
          <Box args={[0.12, 0.6, 0.12]} position={[0, 0.3, 0]}>
            <meshStandardMaterial color="#78350f" />
          </Box>
          <Sphere args={[0.35]} position={[0, 0.8, 0]}>
            <meshStandardMaterial color="#22c55e" />
          </Sphere>
        </group>
      ))}

      {/* Pollution sky tint *//*}
      <Box args={[20, 0.1 + pollution * 2, 20]} position={[0, 1 + pollution, 0]}>
        <meshStandardMaterial color="#9ca3af" transparent opacity={0.08 + pollution * 0.2} />
      </Box>

      <Text position={[0, 1.6, 0]} fontSize={0.12} color="white" anchorX="center">
        {"Environmental Science: Trees vs Pollution"}
      </Text>
    </group>
  )
}*/
"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Info, BookOpen } from "lucide-react"
import IframeWithFallback from '@/components/experiments/vr/iframe-wrapper'

const models = [
  {
    id: 1,
    title: "Water Cycle",
    embedUrl: "https://sketchfab.com/models/8817dd5ea51c487fae89cce8a4bafda7/embed",
    author: "butterflybliss",
    description: "The continuous movement of water on, above, and below Earth's surface",
    keyPoints: [
      "Evaporation: Water transforms from liquid to vapor through solar energy",
      "Condensation: Water vapor cools and forms clouds in the atmosphere",
      "Precipitation: Water falls back to Earth as rain, snow, sleet, or hail",
      "Collection: Water gathers in oceans, rivers, lakes, and underground aquifers",
      "Transpiration: Plants release water vapor through their leaves"
    ],
    facts: [
      "97% of Earth's water is saltwater in oceans",
      "Only 3% is freshwater, mostly frozen in ice caps",
      "The water cycle has no beginning or end - it's continuous",
      "A water molecule spends an average of 9 days in the atmosphere"
    ],
    realWorld: "The water cycle is essential for all life on Earth, regulating climate, distributing heat, and supporting ecosystems. Climate change is intensifying this cycle, leading to more extreme weather events."
  },
  {
    id: 2,
    title: "Earthquake and Tsunami",
    embedUrl: "https://sketchfab.com/models/5325ba12207c4dada68345e52c35ee38/embed",
    author: "arloopa",
    description: "Natural disasters caused by sudden movements in Earth's crust",
    keyPoints: [
      "Seismic Waves: Energy released from earthquakes travels through Earth's layers",
      "Epicenter: The point on Earth's surface directly above the earthquake's origin",
      "Tsunami Generation: Underwater earthquakes displace massive volumes of water",
      "Wave Propagation: Tsunami waves travel at speeds up to 800 km/h in deep ocean",
      "Coastal Impact: Waves slow down and increase in height near shorelines"
    ],
    facts: [
      "Most tsunamis are caused by underwater earthquakes magnitude 7.5+",
      "In deep ocean, tsunami waves are only 30-60 cm high but have long wavelengths",
      "Tsunami waves can reach heights of 30+ meters when they hit the coast",
      "The 2004 Indian Ocean tsunami affected 14 countries and traveled 5,000 km"
    ],
    realWorld: "Early warning systems use seismographs and ocean buoys to detect tsunamis, providing crucial minutes to hours for coastal evacuation. Understanding these phenomena saves lives."
  },
  {
    id: 3,
    title: "Tectonic Plate Collision",
    embedUrl: "https://sketchfab.com/models/4a052941a17941b39052fa1451c63928/embed",
    author: "LasquetiSpice",
    description: "The dynamic process of Earth's crustal plates interacting at boundaries",
    keyPoints: [
      "Convergent Boundaries: Plates collide, forming mountains or subduction zones",
      "Subduction: Denser oceanic plate slides beneath continental plate",
      "Mountain Formation: Continental collision creates ranges like the Himalayas",
      "Volcanic Activity: Subducting plates melt, creating magma that forms volcanoes",
      "Deep Ocean Trenches: Deepest parts of ocean form at subduction zones"
    ],
    facts: [
      "Plates move at rates of 2-10 cm per year (about as fast as fingernails grow)",
      "The Himalayas grow about 5mm taller each year from ongoing collision",
      "The Mariana Trench (deepest point on Earth) formed from plate subduction",
      "Most of Earth's earthquakes occur at plate boundaries"
    ],
    realWorld: "Plate tectonics shapes our planet's surface, creates natural resources like oil and minerals, and influences where earthquakes and volcanoes occur. The Pacific Ring of Fire is the most active tectonic region."
  },
  {
    id: 4,
    title: "Water Distribution on Earth",
    embedUrl: "https://sketchfab.com/models/53d3741b5edb486e9f72ffd96107d37c/embed",
    author: "arloopa",
    description: "The allocation of Earth's water resources across different reservoirs",
    keyPoints: [
      "Oceans: Hold 97% of all water on Earth but it's too salty for direct use",
      "Ice Caps & Glaciers: Contain 68.7% of Earth's freshwater supply",
      "Groundwater: Makes up 30.1% of freshwater, stored in underground aquifers",
      "Surface Water: Rivers, lakes, and swamps hold only 0.3% of freshwater",
      "Atmospheric Water: Less than 0.04% exists as water vapor and clouds"
    ],
    facts: [
      "If all Earth's water fit in a 1-gallon jug, available freshwater would be 1 tablespoon",
      "Antarctica contains 90% of the world's ice and 70% of freshwater",
      "Groundwater takes years to centuries to replenish naturally",
      "Less than 1% of Earth's water is accessible freshwater for human use"
    ],
    realWorld: "Water scarcity affects over 2 billion people globally. Understanding water distribution helps us manage resources sustainably, plan for droughts, and address climate change impacts on water availability."
  }
]

export default function EnvironmentalScience() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showDetails, setShowDetails] = useState(false)
  
  const currentModel = models[currentIndex]

  const nextModel = () => {
    setCurrentIndex((prev) => (prev + 1) % models.length)
    setShowDetails(false)
  }

  const prevModel = () => {
    setCurrentIndex((prev) => (prev - 1 + models.length) % models.length)
    setShowDetails(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-teal-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">
            Environmental Science Interactive Lab
          </h1>
          <p className="text-blue-200 text-lg md:text-xl">
            Explore Earth's Natural Processes in 3D
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center items-center gap-2 mb-6">
          {models.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? "w-12 bg-green-400"
                  : "w-2 bg-gray-600"
              }`}
            />
          ))}
          <span className="ml-3 text-white font-semibold">
            {currentIndex + 1} / {models.length}
          </span>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* 3D Model Viewer */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/80 rounded-2xl overflow-hidden shadow-2xl border border-blue-500/30">
              <div className="bg-gradient-to-r from-blue-600 to-teal-600 px-6 py-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className="bg-white/20 rounded-full w-10 h-10 flex items-center justify-center text-lg">
                    {currentIndex + 1}
                  </span>
                  {currentModel.title}
                </h2>
                <p className="text-blue-100 mt-1">{currentModel.description}</p>
              </div>
              
              <div className="aspect-video w-full bg-black/50">
                <IframeWithFallback src={currentModel.embedUrl} title={currentModel.title} />
              </div>

              <div className="px-6 py-4 bg-gray-800/50 flex items-center justify-between">
                <button
                  onClick={prevModel}
                  className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all hover:scale-105"
                >
                  <ChevronLeft size={20} />
                  Previous
                </button>
                
                <p className="text-gray-400 text-sm hidden md:block">
                  Model by {currentModel.author}
                </p>

                <button
                  onClick={nextModel}
                  className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all hover:scale-105"
                >
                  Next
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Information Panel */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900/80 rounded-2xl p-6 shadow-2xl border border-green-500/30 h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Info className="text-green-400" size={24} />
                  Quick Facts
                </h3>
              </div>
              
              <div className="space-y-3 mb-6">
                {currentModel.facts.map((fact, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <div className="bg-green-500 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{fact}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-lg font-semibold transition-all"
              >
                <BookOpen size={20} />
                {showDetails ? "Hide Details" : "Show Detailed Info"}
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Information Panel */}
        {showDetails && (
          <div className="bg-gray-900/80 rounded-2xl p-6 md:p-8 shadow-2xl border border-purple-500/30 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <BookOpen className="text-purple-400" size={28} />
              Detailed Scientific Information
            </h3>

            {/* Key Concepts */}
            <div className="mb-8">
              <h4 className="text-xl font-semibold text-green-400 mb-4">Key Concepts & Processes</h4>
              <div className="grid gap-3">
                {currentModel.keyPoints.map((point, idx) => (
                  <div key={idx} className="bg-gray-800/50 rounded-lg p-4 border-l-4 border-green-500">
                    <p className="text-gray-200">{point}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Real World Application */}
            <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-6 border border-blue-500/30">
              <h4 className="text-xl font-semibold text-blue-300 mb-3 flex items-center gap-2">
                <span className="text-2xl">🌍</span>
                Real-World Impact
              </h4>
              <p className="text-gray-200 leading-relaxed text-lg">
                {currentModel.realWorld}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Use navigation buttons to explore each environmental process • Click "Show Detailed Info" for in-depth learning
          </p>
        </div>
      </div>
    </div>
  )
}
