import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, Beaker, Sparkles, Bell, Settings, User } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getUser } from "@/lib/auth"

export default async function DashboardPage() {
  const user = await getUser()
  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">EduTech VR</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome back, {user.name}!</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Ready to explore the future of learning? Choose your adventure below.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Chat with Notes */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Chat with Notes</CardTitle>
                  <CardDescription>AI-powered study assistance</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Upload your study materials and get intelligent answers with short explanations, intuitive breakdowns,
                or detailed essays.
              </p>
              <Link href="/chat">
                <Button className="w-full">Start Studying</Button>
              </Link>
            </CardContent>
          </Card>

          {/* VR Classroom */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>VR Classroom</CardTitle>
                  <CardDescription>Immersive virtual learning</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Join or create virtual classrooms with real-time collaboration, spatial audio, and interactive
                whiteboards.
              </p>
              <Link href="/classroom">
                <Button className="w-full">Enter VR</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Predefined VR Experiments */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Beaker className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle>VR Experiments</CardTitle>
                  <CardDescription>Interactive 3D simulations</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Explore physics, chemistry, biology, and math through immersive 3D experiments with adjustable
                parameters.
              </p>
              <Link href="/experiments">
                <Button className="w-full">Explore Experiments</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Create Custom VR Experiment */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Sparkles className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle>Create Experiment</CardTitle>
                  <CardDescription>AI-generated custom simulations</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Describe your experiment idea and let AI generate a custom VR simulation with interactive parameters.
              </p>
              <Link href="/create-experiment">
                <Button className="w-full">Create Now</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest learning sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium">Physics Notes Q&A Session</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Beaker className="h-5 w-5 text-purple-600" />
                <div className="flex-1">
                  <p className="font-medium">Chemical Reactions VR Lab</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">1 day ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium">Biology Study Group VR</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">3 days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
