"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Beaker, Clock, Star, Users, Files } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { experimentsCatalog } from "@/lib/experiments-catalog"

const vrSubjects = ["physics", "chemistry", "biology"] as const
type VRSubject = (typeof vrSubjects)[number]

const subjectLabel: Record<VRSubject, string> = {
  physics: "Physics",
  chemistry: "Chemistry",
  biology: "Biology",
}

const difficultyColor = (d: string) =>
  d === "beginner"
    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    : d === "intermediate"
      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"

const subjectColor = (s: string) =>
  s === "physics"
    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    : s === "chemistry"
      ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"

function RelatedFiles({ id, subject }: { id: string; subject: VRSubject }) {
  return (
    <div className="text-xs text-gray-600 dark:text-gray-300 mt-2">
      <div className="flex items-center gap-2 font-medium">
        <Files className="h-3.5 w-3.5" />
        Related Files
      </div>
      <ul className="list-disc list-inside mt-1 space-y-0.5">
        <li>{"components/experiments/experiment-viewer.tsx"}</li>
        <li>{"components/experiments/experiment-controls.tsx"}</li>
        <li>{"components/3d/optimized-model-loader.tsx"}</li>
        <li>{"components/3d/hdri-environment-loader.tsx"}</li>
        <li>{"components/3d/asset-browser.tsx"}</li>
        <li>{"components/vr/vr-classroom.tsx"}</li>
        <li>{`app/experiments/[experimentId]/page.tsx`}</li>
      </ul>
      <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
        Edit these to customize visuals and parameters for {subjectLabel[subject]} experiments.
      </div>
    </div>
  )
}

export default function VRExperimentsPage() {
  const [q, setQ] = useState("")
  const vrExperiments = useMemo(() => experimentsCatalog.filter((e) => e.subject !== "math"), [])

  const grouped = useMemo(() => {
    const map: Record<VRSubject, typeof vrExperiments> = { physics: [], chemistry: [], biology: [] }
    for (const e of vrExperiments) {
      const s = e.subject as VRSubject
      if (vrSubjects.includes(s)) map[s].push(e)
    }
    return map
  }, [vrExperiments])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Beaker className="h-6 w-6 text-purple-600" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">VR Experiments</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/experiments">
              <Button variant="ghost" size="sm">
                All Experiments
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Input
            placeholder="Search VR experiments..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-md"
          />
        </div>

        {vrSubjects.map((subj) => {
          const list = grouped[subj].filter(
            (e) =>
              e.title.toLowerCase().includes(q.toLowerCase()) ||
              e.description.toLowerCase().includes(q.toLowerCase()) ||
              e.tags.some((t) => t.toLowerCase().includes(q.toLowerCase())),
          )
          if (list.length === 0) return null
          return (
            <section key={subj} className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{subjectLabel[subj]}</h2>
                <Badge className={subjectColor(subj)}>{subjectLabel[subj]}</Badge>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {list.map((exp) => (
                  <Card key={exp.id} className="hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <img
                        src={exp.thumbnail || "/placeholder.svg?height=192&width=320&query=experiment"}
                        alt={exp.title}
                        className="w-full h-40 object-cover rounded-t-lg"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className={difficultyColor(exp.difficulty)}>{exp.difficulty}</Badge>
                      </div>
                      <div className="absolute top-2 left-2">
                        <Badge className={subjectColor(exp.subject)}>{exp.subject}</Badge>
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{exp.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{exp.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {exp.duration} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {exp.participants.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          {exp.rating}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {exp.tags.slice(0, 3).map((t) => (
                          <Badge key={t} variant="outline" className="text-[11px]">
                            {t}
                          </Badge>
                        ))}
                      </div>
                      <RelatedFiles id={exp.id} subject={exp.subject as VRSubject} />
                      <Link href={`/experiments/${exp.id}`}>
                        <Button className="w-full mt-2">Open</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )
        })}
      </main>
    </div>
  )
}
