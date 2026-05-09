'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { supabase, UserAnalytics, SkillProgression } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Award, 
  Loader as Loader2 
} from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  frameMindset: 'Frame & Mindset',
  qualifying: 'Qualifying',
  rapportBuilding: 'Always Agreeing',
  pasAida: 'PAS/AIDA Formula',
  objectionHandling: 'Objection Handling',
  closingNextSteps: 'Closing & Next Steps',
};

const CATEGORY_COLORS: Record<string, string> = {
  frameMindset: '#10b981',
  qualifying: '#3b82f6',
  rapportBuilding: '#f59e0b',
  pasAida: '#8b5cf6',
  objectionHandling: '#ef4444',
  closingNextSteps: '#06b6d4',
};

type ExtendedUserAnalytics = UserAnalytics & {
  skill_trends?: Record<string, number>;
};

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<ExtendedUserAnalytics | null>(null);
  const [skillProgression, setSkillProgression] = useState<SkillProgression[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    (async () => {
      try {
        // Get user analytics
        const { data: analyticsData } = await supabase
          .from('user_analytics')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        // Get skill progression data
        const { data: progressionData } = await supabase
          .from('skill_progression')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(50);
        
        setAnalytics(analyticsData as ExtendedUserAnalytics);
        setSkillProgression(progressionData || []);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Process data for charts
  const skillTrendData = skillProgression.reduce((acc: any[], item) => {
    const existingDate = acc.find(d => d.date === new Date(item.created_at).toLocaleDateString());
    if (existingDate) {
      existingDate[item.category] = item.score;
    } else {
      acc.push({
        date: new Date(item.created_at).toLocaleDateString(),
        [item.category]: item.score,
      });
    }
    return acc;
  }, []);

  const categoryScores = Object.entries(analytics?.category_scores || {}).map(([key, value]: [string, any]) => ({
    category: CATEGORY_LABELS[key] || key,
    score: value.score || 0,
    color: CATEGORY_COLORS[key] || '#6b7280',
  }));

  const averageScore = analytics?.average_score || 0;
  const totalSessions = analytics?.total_sessions || 0;
  const totalPracticeTime = analytics?.total_practice_time || 0; // in minutes
  const practiceTimeText = totalPracticeTime < 60 
    ? `${totalPracticeTime} min` 
    : `${Math.floor(totalPracticeTime / 60)}h ${totalPracticeTime % 60}min`;

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="text-sm font-medium text-emerald-400">Analytics Dashboard</div>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">Your Performance</h1>
          <p className="mt-2 text-white/60">Track your progress and identify areas for improvement</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="glass glow-border rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 ring-1 ring-emerald-400/20">
                <Target className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <div className="text-sm text-white/60">Average Score</div>
                <div className="text-2xl font-semibold text-white">{averageScore.toFixed(0)}</div>
              </div>
            </div>
          </div>

          <div className="glass glow-border rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-400/10 ring-1 ring-blue-400/20">
                <Award className="h-5 w-5 text-blue-300" />
              </div>
              <div>
                <div className="text-sm text-white/60">Total Sessions</div>
                <div className="text-2xl font-semibold text-white">{totalSessions}</div>
              </div>
            </div>
          </div>

          <div className="glass glow-border rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-400/10 ring-1 ring-purple-400/20">
                <Clock className="h-5 w-5 text-purple-300" />
              </div>
              <div>
                <div className="text-sm text-white/60">Practice Time</div>
                <div className="text-2xl font-semibold text-white">{practiceTimeText}</div>
              </div>
            </div>
          </div>

          <div className="glass glow-border rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10 ring-1 ring-amber-400/20">
                {averageScore >= 70 ? (
                  <TrendingUp className="h-5 w-5 text-emerald-300" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-amber-300" />
                )}
              </div>
              <div>
                <div className="text-sm text-white/60">Performance</div>
                <div className="text-2xl font-semibold text-white">
                  {averageScore >= 70 ? 'Strong' : averageScore >= 50 ? 'Good' : 'Developing'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Skill Progression */}
          <div className="glass glow-border rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Skill Progression</h3>
            {skillTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={skillTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }} 
                  />
                  {Object.keys(CATEGORY_LABELS).map((category) => (
                    <Line
                      key={category}
                      type="monotone"
                      dataKey={category}
                      stroke={CATEGORY_COLORS[category]}
                      strokeWidth={2}
                      dot={{ fill: CATEGORY_COLORS[category], r: 4 }}
                      name={CATEGORY_LABELS[category]}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-white/60">
                Complete more sessions to see your progress
              </div>
            )}
          </div>

          {/* Category Scores */}
          <div className="glass glow-border rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Category Breakdown</h3>
            {categoryScores.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryScores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="category" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="score" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-white/60">
                No data available yet
              </div>
            )}
          </div>
        </div>

        {/* Skill Distribution */}
        {categoryScores.length > 0 && (
          <div className="glass glow-border rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Skill Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryScores}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, score }) => `${category}: ${score.toFixed(0)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="score"
                >
                  {categoryScores.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </AppShell>
  );
}
