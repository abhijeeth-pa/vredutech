"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExperimentViewer } from "@/components/experiments/experiment-viewer"
import { ExperimentControls } from "@/components/experiments/experiment-controls"
import { Beaker, ArrowLeft, Share, Bookmark, RotateCcw } from "lucide-react"

// Mock experiment data - in real app this would come from API
const getExperimentData = (id: string) => {
  const experiments = {
    "pendulum-motion": {
      id: "pendulum-motion",
      title: "Simple Pendulum Motion",
      description: "Explore the physics of pendulum motion with adjustable length, mass, and gravity parameters.",
      subject: "physics",
      difficulty: "beginner",
      instructions: [
        "Adjust the pendulum length using the slider",
        "Change the mass of the pendulum bob",
        "Modify gravity to see effects on different planets",
        "Release the pendulum and observe the motion",
        "Record the period for different configurations",
      ],
      parameters: [
        { name: "length", label: "Length (m)", min: 0.5, max: 3, default: 1, step: 0.1 },
        { name: "mass", label: "Mass (kg)", min: 0.1, max: 2, default: 0.5, step: 0.1 },
        { name: "gravity", label: "Gravity (m/s²)", min: 1, max: 15, default: 9.81, step: 0.1 },
        { name: "angle", label: "Initial Angle (°)", min: 5, max: 45, default: 15, step: 1 },
      ],
    },
    "molecular-structure": {
      id: "molecular-structure",
      title: "3D Molecular Structures",
      description: "Visualize and manipulate molecular structures of common compounds in 3D space.",
      subject: "chemistry",
      difficulty: "beginner",
      instructions: [
        "Select a molecule from the dropdown menu",
        "Rotate the molecule to view from different angles",
        "Click on atoms to see their properties",
        "Toggle between different visualization modes",
        "Measure bond lengths and angles",
      ],
      parameters: [
        {
          name: "molecule",
          label: "Molecule",
          type: "select",
          options: ["Water", "Methane", "Benzene", "Caffeine"],
          default: "Water",
        },
        {
          name: "visualization",
          label: "Visualization",
          type: "select",
          options: ["Ball & Stick", "Space Filling", "Wireframe"],
          default: "Ball & Stick",
        },
        { name: "rotation", label: "Auto Rotation", type: "boolean", default: false },
        { name: "labels", label: "Show Labels", type: "boolean", default: true },
      ],
    },
    "cell-structure": {
      id: "cell-structure",
      title: "Animal Cell Exploration",
      description: "Take a journey inside an animal cell and explore organelles in immersive 3D.",
      subject: "biology",
      difficulty: "beginner",
      instructions: [
        "Navigate through the cell using VR controls",
        "Click on organelles to learn about their functions",
        "Use the zoom feature to see detailed structures",
        "Toggle different organelle visibility",
        "Take a guided tour of the cell",
      ],
      parameters: [
        { name: "zoom", label: "Zoom Level", min: 0.5, max: 5, default: 1, step: 0.1 },
        { name: "organelles", label: "Show Organelles", type: "boolean", default: true },
        { name: "labels", label: "Show Labels", type: "boolean", default: true },
        { name: "tour", label: "Guided Tour", type: "boolean", default: false },
      ],
    },
    differentiation: {
      id: "differentiation",
      title: "Visual Differentiation",
      description: "Explore derivatives and rates of change with interactive visual aids.",
      subject: "math",
      difficulty: "intermediate",
      instructions: [
        "Input a function using the function editor",
        "Observe the tangent line at different points",
        "Explore instantaneous rate of change",
        "Compare different orders of derivatives",
        "Analyze critical points and extrema",
      ],
      parameters: [
        { name: "function", label: "Function Input", type: "string", default: "x^2" },
        { name: "xRange", label: "X Range", min: -10, max: 10, default: 5, step: 1 },
        { name: "point", label: "Evaluation Point", min: -10, max: 10, default: 0, step: 0.1 },
        { name: "order", label: "Derivative Order", min: 1, max: 3, default: 1, step: 1 },
        { name: "showTangent", label: "Show Tangent", type: "boolean", default: true },
      ],
    },

    integration: {
      id: "integration",
      title: "Interactive Integration",
      description: "Visualize definite and indefinite integrals in 3D space.",
      subject: "math",
      difficulty: "intermediate",
      instructions: [
        "Select a function to integrate",
        "Adjust integration bounds",
        "View area under the curve",
        "Explore Riemann sums",
        "Compare different integration methods",
      ],
      parameters: [
        { name: "function", label: "Function Input", type: "string", default: "x^2" },
        { name: "lowerBound", label: "Lower Bound", min: -10, max: 10, default: -2, step: 0.5 },
        { name: "upperBound", label: "Upper Bound", min: -10, max: 10, default: 2, step: 0.5 },
        { name: "partitions", label: "Number of Partitions", min: 4, max: 50, default: 10, step: 2 },
        {
          name: "method",
          label: "Integration Method",
          type: "select",
          options: ["Left", "Right", "Midpoint", "Trapezoidal"],
          default: "Midpoint",
        },
      ],
    },

    "vectors-3d": {
      id: "vectors-3d",
      title: "3D Vector Operations",
      description: "Manipulate and visualize vectors in three-dimensional space.",
      subject: "math",
      difficulty: "intermediate",
      instructions: [
        "Create vectors by specifying components",
        "Perform vector operations (add, subtract, dot product)",
        "Visualize cross products",
        "Explore vector projections",
        "Calculate vector magnitudes and directions",
      ],
      parameters: [
        { name: "vector1", label: "Vector 1", type: "vector3", default: [1, 0, 0] },
        { name: "vector2", label: "Vector 2", type: "vector3", default: [0, 1, 0] },
        {
          name: "operation",
          label: "Operation",
          type: "select",
          options: ["Add", "Subtract", "Dot Product", "Cross Product"],
          default: "Add",
        },
        { name: "showGrid", label: "Show Grid", type: "boolean", default: true },
        { name: "showComponents", label: "Show Components", type: "boolean", default: true },
      ],
    },

    probability: {
      id: "probability",
      title: "Probability Experiments",
      description: "Interactive simulations of probability concepts and random processes.",
      subject: "math",
      difficulty: "beginner",
      instructions: [
        "Choose a probability experiment type",
        "Set experiment parameters",
        "Run multiple trials",
        "View probability distributions",
        "Compare experimental vs theoretical results",
      ],
      parameters: [
        {
          name: "experimentType",
          label: "Experiment Type",
          type: "select",
          options: ["Coin Flip", "Dice Roll", "Card Draw", "Random Walk"],
          default: "Coin Flip",
        },
        { name: "trials", label: "Number of Trials", min: 10, max: 1000, default: 100, step: 10 },
        { name: "speed", label: "Animation Speed", min: 1, max: 10, default: 5, step: 1 },
        { name: "showStats", label: "Show Statistics", type: "boolean", default: true },
        { name: "showGraph", label: "Show Graph", type: "boolean", default: true },
      ],
    },

    "function-input": {
      id: "function-input",
      title: "Function Explorer",
      description: "Input and visualize mathematical functions with real-time plotting.",
      subject: "math",
      difficulty: "beginner",
      instructions: [
        "Enter a mathematical function",
        "Adjust domain and range",
        "Explore function transformations",
        "Analyze key points",
        "Compare multiple functions",
      ],
      parameters: [
        { name: "function", label: "Function Input", type: "string", default: "sin(x)" },
        { name: "xRange", label: "X Range", min: -10, max: 10, default: 5, step: 0.5 },
        { name: "yRange", label: "Y Range", min: -10, max: 10, default: 5, step: 0.5 },
        { name: "grid", label: "Grid Density", min: 10, max: 50, default: 20, step: 5 },
        { name: "showTrace", label: "Show Trace", type: "boolean", default: false },
      ],
    },
    "projectile-motion": {
      id: "projectile-motion",
      title: "Projectile Motion Lab",
      description: "Launch projectiles and analyze their trajectories with different angles and initial velocities.",
      subject: "physics",
      difficulty: "intermediate",
      instructions: [
        "Set initial speed and angle.",
        "Observe projectile trajectory and max height.",
        "Adjust gravity to simulate different planets.",
        "Measure range and time of flight.",
      ],
      parameters: [
        { name: "v0", label: "Initial Speed (m/s)", min: 1, max: 50, default: 12, step: 1 },
        { name: "angle", label: "Launch Angle (°)", min: 0, max: 90, default: 45, step: 1 },
        { name: "gravity", label: "Gravity (m/s²)", min: 1, max: 20, default: 9.81, step: 0.1 },
      ],
    },
    "chemical-reactions": {
      id: "chemical-reactions",
      title: "Chemical Reaction Simulator",
      description: "Observe reaction progress and visualize molecules.",
      subject: "chemistry",
      difficulty: "advanced",
      instructions: [
        "Pick reaction type and rate constants.",
        "Start simulation and monitor concentrations.",
        "Compare effect of temperature on rate.",
      ],
      parameters: [
        { name: "temperature", label: "Temperature (K)", min: 250, max: 1000, default: 298, step: 5 },
        { name: "k", label: "Rate Constant (k)", min: 0.01, max: 5, default: 0.5, step: 0.01 },
        { name: "showGraph", label: "Show Concentration Graph", type: "boolean", default: true },
      ],
    },
    "dna-structure": {
      id: "dna-structure",
      title: "DNA Double Helix",
      description: "Explore base pairing and helical structure in an interactive 3D model.",
      subject: "biology",
      difficulty: "intermediate",
      instructions: [
        "Rotate and zoom to examine the helix.",
        "Adjust number of turns and radius.",
        "Toggle auto-rotation to study geometry.",
      ],
      parameters: [
        { name: "turns", label: "Turns", min: 1, max: 10, default: 3, step: 1 },
        { name: "height", label: "Height", min: 2, max: 12, default: 6, step: 0.5 },
        { name: "radius", label: "Radius", min: 0.5, max: 2, default: 1, step: 0.1 },
        { name: "rotationSpeed", label: "Rotation Speed", min: 0, max: 2, default: 0.5, step: 0.1 },
      ],
    },
    "anatomy-explorer": {
      id: "anatomy-explorer",
      title: "Anatomy Explorer",
      description: "Interact with organs and systems in a simplified 3D body.",
      subject: "biology",
      difficulty: "beginner",
      instructions: [
        "Toggle labels to identify organs.",
        "Adjust organ scale for emphasis.",
        "Enable auto-rotate to inspect the model.",
      ],
      parameters: [
        { name: "showLabels", label: "Show Labels", type: "boolean", default: true },
        { name: "organScale", label: "Organ Scale", min: 0.5, max: 1.5, default: 1, step: 0.1 },
        { name: "autoRotate", label: "Auto Rotate", type: "boolean", default: false },
      ],
    },
    "cell-biology": {
      id: "cell-biology",
      title: "Virtual Cell Biology",
      description: "Zoom into a cell and explore organelles and processes.",
      subject: "biology",
      difficulty: "beginner",
      instructions: [
        "Zoom to focus on organelles.",
        "Toggle organelles visibility.",
        "Enable auto-rotate to study the cell.",
      ],
      parameters: [
        { name: "zoom", label: "Zoom", min: 0.5, max: 3, default: 1, step: 0.1 },
        { name: "showOrganelles", label: "Show Organelles", type: "boolean", default: true },
        { name: "autoRotate", label: "Auto Rotate", type: "boolean", default: false },
      ],
    },
    "vr-chemistry-lab": {
      id: "vr-chemistry-lab",
      title: "VR Chemistry Lab",
      description: "Perform safe virtual reactions and visualize molecules.",
      subject: "chemistry",
      difficulty: "intermediate",
      instructions: ["Set temperature and rate constant.", "Start simulation.", "Monitor concentrations A and B."],
      parameters: [
        { name: "temperature", label: "Temperature (K)", min: 250, max: 1000, default: 298, step: 5 },
        { name: "k", label: "Rate Constant (k)", min: 0.01, max: 5, default: 0.4, step: 0.01 },
        { name: "showGraph", label: "Show Graph", type: "boolean", default: true },
      ],
    },
    "physics-lab": {
      id: "physics-lab",
      title: "Physics Lab Simulator",
      description: "Experiment with gravity, pendulum, and projectiles.",
      subject: "physics",
      difficulty: "intermediate",
      instructions: ["Adjust pendulum length and gravity.", "Set projectile speed and angle.", "Observe results."],
      parameters: [
        { name: "length", label: "Pendulum Length (m)", min: 0.5, max: 3, default: 1.4, step: 0.1 },
        { name: "gravity", label: "Gravity (m/s²)", min: 1, max: 20, default: 9.81, step: 0.1 },
        { name: "v0", label: "Projectile Speed (m/s)", min: 1, max: 50, default: 10, step: 1 },
        { name: "angle", label: "Launch Angle (°)", min: 0, max: 90, default: 45, step: 1 },
      ],
    },
    "space-exploration": {
      id: "space-exploration",
      title: "Space Exploration",
      description: "Orbit the sun with Earth and Moon and study orbits.",
      subject: "physics",
      difficulty: "beginner",
      instructions: ["Increase time speed.", "Change Earth and Moon distances.", "Observe orbital motion."],
      parameters: [
        { name: "timeSpeed", label: "Time Speed", min: 0.1, max: 5, default: 1, step: 0.1 },
        { name: "earthDistance", label: "Earth Distance", min: 3, max: 9, default: 5, step: 0.5 },
        { name: "moonDistance", label: "Moon Distance", min: 0.5, max: 3, default: 1.5, step: 0.1 },
      ],
    },
    "environmental-science": {
      id: "environmental-science",
      title: "Environmental Science Explorer",
      description: "Observe the effect of trees vs pollution.",
      subject: "biology",
      difficulty: "beginner",
      instructions: ["Add or remove trees.", "Increase pollution to see sky haze."],
      parameters: [
        { name: "trees", label: "Trees", min: 0, max: 200, default: 60, step: 10 },
        { name: "pollution", label: "Pollution", min: 0, max: 1, default: 0.3, step: 0.05 },
      ],
    },
    "historical-site": {
      id: "historical-site",
      title: "Virtual Historical Site Visit",
      description: "Explore a stylized ancient site with columns.",
      subject: "history",
      difficulty: "beginner",
      instructions: ["Adjust number of columns.", "Walk around to observe layout."],
      parameters: [{ name: "columns", label: "Columns", min: 4, max: 24, default: 8, step: 1 }],
    },
    "robotics-simulator": {
      id: "robotics-simulator",
      title: "Engineering/Robotics Simulator",
      description: "Control a robotic arm with adjustable joints.",
      subject: "cs",
      difficulty: "intermediate",
      instructions: ["Adjust shoulder, elbow, and wrist angles.", "Observe end-effector position."],
      parameters: [
        { name: "shoulder", label: "Shoulder (°)", min: -60, max: 60, default: 20, step: 1 },
        { name: "elbow", label: "Elbow (°)", min: -90, max: 90, default: 30, step: 1 },
        { name: "wrist", label: "Wrist (°)", min: -45, max: 45, default: 15, step: 1 },
      ],
    },
    "vr-programming-environment": {
      id: "vr-programming-environment",
      title: "VR Programming Environment",
      description: "Visualize sorting in 3D with animated bars.",
      subject: "cs",
      difficulty: "beginner",
      instructions: ["Increase count to add bars.", "Change speed for faster sorting."],
      parameters: [
        { name: "count", label: "Count", min: 5, max: 40, default: 20, step: 1 },
        { name: "speed", label: "Speed", min: 0.5, max: 5, default: 1.5, step: 0.5 },
      ],
    },
    "virtual-network-simulation": {
      id: "virtual-network-simulation",
      title: "Virtual Network Simulation",
      description: "See packets move across a simple network graph.",
      subject: "cs",
      difficulty: "beginner",
      instructions: ["Increase nodes.", "Speed up packet flow.", "Follow the packet through the network."],
      parameters: [
        { name: "nodes", label: "Nodes", min: 3, max: 12, default: 6, step: 1 },
        { name: "packetSpeed", label: "Packet Speed", min: 0.5, max: 5, default: 1, step: 0.5 },
      ],
    },
    "ai-ml-visualizer": {
      id: "ai-ml-visualizer",
      title: "AI & Machine Learning Concepts",
      description: "Visualize neuron activations across layers.",
      subject: "cs",
      difficulty: "intermediate",
      instructions: ["Increase layers and neurons.", "Adjust speed to see activations."],
      parameters: [
        { name: "layers", label: "Layers", min: 2, max: 6, default: 4, step: 1 },
        { name: "neurons", label: "Neurons/Layer", min: 2, max: 10, default: 6, step: 1 },
        { name: "speed", label: "Activation Speed", min: 0.5, max: 5, default: 1, step: 0.5 },
      ],
    },
  }

  return experiments[id as keyof typeof experiments] || null
}

export default function ExperimentPage() {
  const params = useParams()
  const experimentId = params.experimentId as string
  const experiment = getExperimentData(experimentId)

  if (!experiment) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Experiment Not Found</h1>
          <Link href="/experiments">
            <Button>Back to Experiments</Button>
          </Link>
        </div>
      </div>
    )
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getSubjectColor = (subject: string) => {
    switch (subject) {
      case "physics":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "chemistry":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "biology":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "math":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      case "cs":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300"
      case "history":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/experiments">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Experiments
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <Beaker className="h-6 w-6 text-purple-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">{experiment.title}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getSubjectColor(experiment.subject)}>{experiment.subject}</Badge>
                    <Badge className={getDifficultyColor(experiment.difficulty)}>{experiment.difficulty}</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Bookmark className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
          {/* Experiment Viewer */}
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardContent className="p-0 h-full">
                <ExperimentViewer experiment={experiment} />
              </CardContent>
            </Card>
          </div>

          {/* Controls and Instructions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {experiment.instructions.map((instruction, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 rounded-full text-xs flex items-center justify-center font-semibold">
                        {index + 1}
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{instruction}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Subject & Files */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Subject & Files</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{"Subject:"}</span>
                  <Badge className={getSubjectColor(experiment.subject)}>{experiment.subject}</Badge>
                </div>

                {/* Related source files */}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{"Related Files"}</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    {/* Math experiment files */}
                    {experiment.subject === "math" && (
                      <>
                        {/* Primary math component by ID (if applicable) */}
                        <li>{`components/experiments/math/${experiment.id}.tsx`}</li>
                        {/* Supporting math utilities/components */}
                        <li>{"components/experiments/math/function-input.tsx"}</li>
                        <li>{"components/experiments/math/inputs/function-input.tsx"}</li>
                      </>
                    )}

                    {/* VR/3D experiment files */}
                    {experiment.subject !== "math" && (
                      <>
                        <li>{"components/experiments/experiment-viewer.tsx"}</li>
                        <li>{"components/3d/optimized-model-loader.tsx"}</li>
                        <li>{"components/3d/hdri-environment-loader.tsx"}</li>
                        <li>{"components/3d/asset-browser.tsx"}</li>
                        <li>{"components/vr/vr-classroom.tsx"}</li>
                      </>
                    )}
                    {/* Always helpful */}
                    <li>{"components/experiments/experiment-controls.tsx"}</li>
                  </ul>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {"Edit these files to customize the experiment visuals and controls."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <ExperimentControls parameters={experiment.parameters} />
          </div>
        </div>
      </div>
    </div>
  )
}
