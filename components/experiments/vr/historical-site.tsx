"use client"

// import { Box, Text } from "@react-three/drei"

// export function HistoricalSite({ parameters = {} }: { parameters?: { columns?: number } }) {
//   const n = Math.max(4, Math.min(24, Math.floor(parameters.columns ?? 8)))
//   const radius = 3.5
//   return (
//     <group>
//       <Box args={[10, 0.1, 10]} position={[0, -0.05, 0]}>
//         <meshStandardMaterial color="#d1d5db" />
//       </Box>
//       {Array.from({ length: n }).map((_, i) => {
//         const t = (i / n) * Math.PI * 2
//         const x = Math.cos(t) * radius
//         const z = Math.sin(t) * radius
//         return (
//           <group key={i} position={[x, 0, z]}>
//             <Box args={[0.4, 2.2, 0.4]} position={[0, 1.1, 0]}>
//               <meshStandardMaterial color="#e5e7eb" />
//             </Box>
//           </group>
//         )
//       })}
//       <Text position={[0, 1.6, 0]} fontSize={0.12} color="white" anchorX="center">
//         {"Virtual Historical Site"}
//       </Text>
//     </group>
//   )
// }
import { useState } from 'react';

export default function HistoricalLandmarks() {
  const [selectedLandmark, setSelectedLandmark] = useState('taj-mahal');
  const [selectedRegion, setSelectedRegion] = useState('all');
  
  const landmarks = {
    'taj-mahal': {
      name: 'Taj Mahal',
      location: 'Agra, India',
      embedUrl: 'https://sketchfab.com/models/d02e8cdef15946408be6613fc5d1f0ff/embed',
      description: 'An ivory-white marble mausoleum built by Mughal emperor Shah Jahan in memory of his wife Mumtaz Mahal. A UNESCO World Heritage Site and one of the New Seven Wonders of the World.',
      year: '1653',
      region: 'india',
      color: 'bg-amber-600',
      icon: '🕌'
    },
    'great-wall': {
      name: 'Great Wall of China',
      location: 'China',
      embedUrl: 'https://sketchfab.com/models/eb94be2c56a14f009e6f0f2533c996d7/embed',
      description: 'An ancient series of fortifications stretching over 13,000 miles, built to protect Chinese states from invasions. One of the most impressive architectural feats in history.',
      year: '7th Century BC - 1644 AD',
      region: 'asia',
      color: 'bg-red-700',
      icon: '🏯'
    },
    'colosseum': {
      name: 'Colosseum',
      location: 'Rome, Italy',
      embedUrl: 'https://sketchfab.com/models/451e34b6d48c44e7b2e334f8eece7aea/embed',
      description: 'An ancient amphitheater that could hold 50,000-80,000 spectators. Used for gladiatorial contests, public spectacles, and dramas. The largest amphitheater ever built.',
      year: '80 AD',
      region: 'europe',
      color: 'bg-orange-700',
      icon: '🏛️'
    },
    'gateway-india': {
      name: 'Gateway of India',
      location: 'Mumbai, India',
      embedUrl: 'https://sketchfab.com/models/38a652e9f3bf49039026ef65ef61ac92/embed',
      description: 'A majestic arch monument built to commemorate the visit of King George V and Queen Mary to Mumbai. Combines Hindu and Muslim architectural styles.',
      year: '1924',
      region: 'india',
      color: 'bg-yellow-700',
      icon: '🚪'
    },
    'red-fort': {
      name: 'Red Fort',
      location: 'Delhi, India',
      embedUrl: 'https://sketchfab.com/models/74ff6d703a174f9fb1ba266003f5c4fc/embed',
      description: 'A historic fortification and the main residence of Mughal emperors for nearly 200 years. Named for its massive red sandstone walls. Symbol of Indian independence.',
      year: '1648',
      region: 'india',
      color: 'bg-red-800',
      icon: '🏰'
    },
    'hampi': {
      name: 'Hampi Chariot',
      location: 'Karnataka, India',
      embedUrl: 'https://sketchfab.com/models/81b5cd48f4384b309df5fa43ea3b3741/embed',
      description: 'The iconic stone chariot at Vittala Temple complex in Hampi. Part of the ruins of Vijayanagara, once one of the richest cities in the world. UNESCO World Heritage Site.',
      year: '15th Century',
      region: 'india',
      color: 'bg-stone-600',
      icon: '🛕'
    },
    'mahabalipuram': {
      name: 'Shore Temple',
      location: 'Mahabalipuram, India',
      embedUrl: 'https://sketchfab.com/models/4a6a5c0795034b7fa91bbbd384b5ab28/embed',
      description: 'A 7th-century temple complex overlooking the Bay of Bengal. One of the oldest stone temples in South India, showcasing Dravidian architecture. UNESCO World Heritage Site.',
      year: '700-728 AD',
      region: 'india',
      color: 'bg-teal-700',
      icon: '⛩️'
    },
    'sydney-opera': {
      name: 'Sydney Opera House',
      location: 'Sydney, Australia',
      embedUrl: 'https://sketchfab.com/models/73267b70f8fd46a8a175bd51f1c77b1c/embed',
      description: 'A multi-venue performing arts center with distinctive sail-like design. One of the most famous and distinctive buildings of the 20th century. UNESCO World Heritage Site.',
      year: '1973',
      region: 'oceania',
      color: 'bg-blue-600',
      icon: '🎭'
    }
  };

  const regions = {
    all: { name: 'All Landmarks', icon: '🌍' },
    india: { name: 'India', icon: '🇮🇳' },
    asia: { name: 'Asia', icon: '🌏' },
    europe: { name: 'Europe', icon: '🇪🇺' },
    oceania: { name: 'Oceania', icon: '🌊' }
  };

  const filteredLandmarks = Object.entries(landmarks).filter(([_, landmark]) => 
    selectedRegion === 'all' || landmark.region === selectedRegion
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Decorative background pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      <div className="relative container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold mb-3 bg-gradient-to-r from-amber-700 via-orange-600 to-red-600 bg-clip-text text-transparent">
            🏛️ Historical Landmarks Explorer 🏛️
          </h1>
          <p className="text-gray-700 text-xl font-medium">
            Journey through time and explore iconic monuments from around the world
          </p>
        </div>

        {/* Region Filter */}
        <div className="flex justify-center gap-3 mb-6 flex-wrap">
          {Object.entries(regions).map(([key, region]) => (
            <button
              key={key}
              onClick={() => {
                setSelectedRegion(key);
                const firstInRegion = Object.entries(landmarks).find(
                  ([_, l]) => key === 'all' || l.region === key
                );
                if (firstInRegion) setSelectedLandmark(firstInRegion[0]);
              }}
              className={`px-5 py-2 rounded-full font-semibold text-sm transition-all transform hover:scale-105 ${
                selectedRegion === key
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
              }`}
            >
              <span className="mr-2">{region.icon}</span>
              {region.name}
            </button>
          ))}
        </div>

        {/* Landmark Selection */}
        <div className="flex justify-center gap-3 mb-8 flex-wrap">
          {filteredLandmarks.map(([key, landmark]) => (
            <button
              key={key}
              onClick={() => setSelectedLandmark(key)}
              className={`px-5 py-3 rounded-xl font-semibold text-base transition-all transform hover:scale-105 hover:shadow-xl ${
                selectedLandmark === key
                  ? `${landmark.color} text-white shadow-xl ring-2 ring-amber-300`
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
              }`}
            >
              <span className="mr-2">{landmark.icon}</span>
              {landmark.name}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 3D Model Viewer */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border-2 border-amber-200">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <span className="text-4xl">{landmarks[selectedLandmark].icon}</span>
                    {landmarks[selectedLandmark].name}
                  </h2>
                  <p className="text-gray-600 mt-1 flex items-center gap-2">
                    📍 {landmarks[selectedLandmark].location}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 rounded-full text-white text-sm font-bold shadow-lg">
                  Built: {landmarks[selectedLandmark].year}
                </div>
              </div>
              
              <div className="relative w-full bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl overflow-hidden shadow-inner" style={{ paddingBottom: '75%' }}>
                <iframe
                  title={landmarks[selectedLandmark].name}
                  className="absolute top-0 left-0 w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; fullscreen; xr-spatial-tracking"
                  src={landmarks[selectedLandmark].embedUrl}
                />
              </div>
              
              <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200">
                <p className="text-gray-700 text-sm flex items-start gap-2">
                  <span className="text-amber-600 text-lg flex-shrink-0">💡</span>
                  <span><strong>Interactive Controls:</strong> Click and drag to rotate • Scroll wheel to zoom in/out • Right-click and drag to pan • Double-click to reset view</span>
                </p>
              </div>
            </div>
          </div>

          {/* Information Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border-2 border-amber-200 sticky top-8">
              <h3 className="text-2xl font-bold mb-4 border-b-2 border-amber-300 pb-3 flex items-center gap-2 text-gray-800">
                <span className="text-2xl">📜</span>
                Historical Details
              </h3>
              
              <p className="text-gray-700 leading-relaxed mb-6 text-justify">
                {landmarks[selectedLandmark].description}
              </p>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl p-4 border-2 border-amber-200">
                  <h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                    <span>🏆</span> Key Highlights
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    {selectedLandmark === 'taj-mahal' && (
                      <>
                        <li>• Built with 28 types of precious stones</li>
                        <li>• Took 22 years and 20,000 workers</li>
                        <li>• Changes color throughout the day</li>
                        <li>• Perfect symmetry in design</li>
                      </>
                    )}
                    {selectedLandmark === 'great-wall' && (
                      <>
                        <li>• Longest wall in the world (13,171 miles)</li>
                        <li>• Built over 2,000+ years</li>
                        <li>• Visible from low Earth orbit</li>
                        <li>• Made with rice flour mortar</li>
                      </>
                    )}
                    {selectedLandmark === 'colosseum' && (
                      <>
                        <li>• Held up to 80,000 spectators</li>
                        <li>• Had 80 entrances for crowd control</li>
                        <li>• Underground passages for gladiators</li>
                        <li>• Could be flooded for naval battles</li>
                      </>
                    )}
                    {selectedLandmark === 'gateway-india' && (
                      <>
                        <li>• Overlooks the Arabian Sea</li>
                        <li>• Built from yellow basalt and concrete</li>
                        <li>• 26 meters (85 feet) tall</li>
                        <li>• Iconic Mumbai landmark</li>
                      </>
                    )}
                    {selectedLandmark === 'red-fort' && (
                      <>
                        <li>• Walls are 2.5 km long</li>
                        <li>• Built by Emperor Shah Jahan</li>
                        <li>• Indian PM hoists flag here yearly</li>
                        <li>• Houses famous Peacock Throne room</li>
                      </>
                    )}
                    {selectedLandmark === 'hampi' && (
                      <>
                        <li>• Stone chariot is temple centerpiece</li>
                        <li>• Capital of Vijayanagara Empire</li>
                        <li>• 500+ monuments across 41 sq km</li>
                        <li>• Musical pillars in temple</li>
                      </>
                    )}
                    {selectedLandmark === 'mahabalipuram' && (
                      <>
                        <li>• Oldest structural temple in South India</li>
                        <li>• Built with granite blocks</li>
                        <li>• Survived 2004 tsunami</li>
                        <li>• Pallava dynasty architecture</li>
                      </>
                    )}
                    {selectedLandmark === 'sydney-opera' && (
                      <>
                        <li>• Over 1 million roof tiles</li>
                        <li>• 7 performance venues inside</li>
                        <li>• Designed by Jørn Utzon</li>
                        <li>• Hosts 1,500+ performances yearly</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-xl p-4 border-2 border-orange-200">
                  <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                    <span>📚</span> Did You Know?
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    {selectedLandmark === 'taj-mahal' && (
                      <>
                        <li>• Built as a symbol of eternal love</li>
                        <li>• Gardens represent paradise</li>
                        <li>• Calligraphy increases in size upward</li>
                      </>
                    )}
                    {selectedLandmark === 'great-wall' && (
                      <>
                        <li>• Not a single continuous wall</li>
                        <li>• Some sections are over 2,000 years old</li>
                        <li>• Used as a border defense system</li>
                      </>
                    )}
                    {selectedLandmark === 'colosseum' && (
                      <>
                        <li>• Original name was Flavian Amphitheatre</li>
                        <li>• Free admission for Roman citizens</li>
                        <li>• Damaged by earthquakes over time</li>
                      </>
                    )}
                    {selectedLandmark === 'gateway-india' && (
                      <>
                        <li>• Last British troops left through here</li>
                        <li>• Popular gathering spot for locals</li>
                        <li>• Ferry point to Elephanta Caves</li>
                      </>
                    )}
                    {selectedLandmark === 'red-fort' && (
                      <>
                        <li>• Originally white, then painted red</li>
                        <li>• Has underground passages</li>
                        <li>• Sound and light show held nightly</li>
                      </>
                    )}
                    {selectedLandmark === 'hampi' && (
                      <>
                        <li>• Once richest city in the world</li>
                        <li>• Boulder-strewn landscape is unique</li>
                        <li>• Popular rock climbing destination</li>
                      </>
                    )}
                    {selectedLandmark === 'mahabalipuram' && (
                      <>
                        <li>• Withstood centuries of sea erosion</li>
                        <li>• Part of "Seven Pagodas" legend</li>
                        <li>• Carved from single rock formations</li>
                      </>
                    )}
                    {selectedLandmark === 'sydney-opera' && (
                      <>
                        <li>• Took 14 years to build (1959-1973)</li>
                        <li>• Original budget was $7M, cost $102M</li>
                        <li>• Youngest UNESCO World Heritage Site</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="bg-gradient-to-r from-yellow-100 to-amber-100 rounded-xl p-4 border-2 border-yellow-300 text-center">
                  <p className="text-xs text-gray-700 italic leading-relaxed">
                    "The world is a book, and those who do not travel read only one page."
                    <br/>
                    <span className="text-amber-700 font-semibold">- Saint Augustine</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center shadow-xl border-2 border-amber-200">
            <div className="text-4xl mb-2">🌍</div>
            <div className="text-2xl font-bold text-amber-700">{Object.keys(landmarks).length}</div>
            <div className="text-sm text-gray-600">Landmarks</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center shadow-xl border-2 border-orange-200">
            <div className="text-4xl mb-2">🏛️</div>
            <div className="text-2xl font-bold text-orange-700">4</div>
            <div className="text-sm text-gray-600">Regions</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center shadow-xl border-2 border-red-200">
            <div className="text-4xl mb-2">📜</div>
            <div className="text-2xl font-bold text-red-700">3000+</div>
            <div className="text-sm text-gray-600">Years History</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center shadow-xl border-2 border-yellow-200">
            <div className="text-4xl mb-2">🎭</div>
            <div className="text-2xl font-bold text-yellow-700">5</div>
            <div className="text-sm text-gray-600">UNESCO Sites</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="inline-block bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 border-2 border-amber-200 shadow-lg">
            <p className="text-gray-700 text-sm font-medium">
              🏛️ 3D models powered by Sketchfab • Explore architectural wonders of the world
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}