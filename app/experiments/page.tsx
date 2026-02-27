"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Beaker, Search, Play, Clock, Users, Star } from "lucide-react"
import { experimentsCatalog } from "@/lib/experiments-catalog"

const experiments = experimentsCatalog

export default function ExperimentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubject, setSelectedSubject] = useState<string>("all")

  const filteredExperiments = experiments.filter((exp) => {
    const matchesSearch =
      exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesSubject = selectedSubject === "all" || exp.subject === selectedSubject

    return matchesSearch && matchesSubject
  })

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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                ← Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Beaker className="h-6 w-6 text-purple-600" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">VR Experiments</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search experiments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs value={selectedSubject} onValueChange={setSelectedSubject} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="all">All Subjects</TabsTrigger>
              <TabsTrigger value="physics">Physics</TabsTrigger>
              <TabsTrigger value="chemistry">Chemistry</TabsTrigger>
              <TabsTrigger value="biology">Biology</TabsTrigger>
              <TabsTrigger value="math">Mathematics</TabsTrigger>
              <TabsTrigger value="cs">Computer Science</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedSubject} className="mt-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredExperiments.map((experiment) => (
                  <Card key={experiment.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                    <div className="relative">
                      <img
                        src={experiment.thumbnail || "/placeholder.svg"}
                        alt={experiment.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className={getDifficultyColor(experiment.difficulty)}>{experiment.difficulty}</Badge>
                      </div>
                      <div className="absolute top-2 left-2">
                        <Badge className={getSubjectColor(experiment.subject)}>{experiment.subject}</Badge>
                      </div>
                    </div>

                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg group-hover:text-purple-600 transition-colors">
                        {experiment.title}
                      </CardTitle>
                      <CardDescription className="text-sm line-clamp-2">{experiment.description}</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{experiment.duration} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{experiment.participants.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{experiment.rating}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {experiment.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <Link href={`/experiments/${experiment.id}`}>
                        <Button className="w-full group-hover:bg-purple-600 transition-colors">
                          <Play className="h-4 w-4 mr-2" />
                          Start Experiment
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredExperiments.length === 0 && (
                <div className="text-center py-12">
                  <Beaker className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No experiments found</h3>
                  <p className="text-gray-600 dark:text-gray-300">Try adjusting your search or filter criteria</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
