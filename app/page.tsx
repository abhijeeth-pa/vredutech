import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Users, Beaker, Sparkles } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">EduTech VR</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">The Future of Learning is Here</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Experience immersive education with AI-powered study assistance, VR classrooms, and interactive experiments
            that bring learning to life.
          </p>
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8 py-4">
              Start Learning Today
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>AI Study Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Upload your notes and get intelligent answers with our AI-powered chat system
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>VR Classrooms</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Join immersive virtual classrooms with real-time collaboration and spatial audio
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Beaker className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>VR Experiments</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Explore interactive 3D experiments in physics, chemistry, and biology</CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Sparkles className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>Custom Experiments</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create your own VR experiments with AI-generated interactive simulations
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
