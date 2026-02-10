import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function DebugReviewsPage() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // 1. Check if ANY reviews exist (simple count)
    const { count, error: countError } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })

    // 2. Fetch first 5 reviews with NO joins to see raw data
    const { data: rawReviews, error: rawError } = await supabase
        .from('reviews')
        .select('*')
        .limit(5)

    // 3. Fetch first 5 reviews WITH joins (like the main page)
    const { data: joinedReviews, error: joinError } = await supabase
        .from('reviews')
        .select(`
            id,
            rating_academic,
            program_id,
            profiles ( full_name, email ),
            programs (
                id,
                name_th,
                departments (
                    name_th,
                    faculties (
                        name_th,
                        universities (
                            id,
                            name_th
                        )
                    )
                )
            )
        `)
        .limit(5)

    return (
        <div className="p-8 font-mono text-sm space-y-8 bg-slate-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Debug Reviews</h1>
            
            <div className="bg-white p-4 rounded shadow border border-slate-200">
                <h2 className="font-bold text-lg mb-2 text-blue-600">1. Total Count</h2>
                <p>Count: {count}</p>
                {countError && <pre className="text-red-500 bg-red-50 p-2 mt-2">{JSON.stringify(countError, null, 2)}</pre>}
            </div>

            <div className="bg-white p-4 rounded shadow border border-slate-200">
                <h2 className="font-bold text-lg mb-2 text-purple-600">2. Raw Data (No Joins)</h2>
                {rawError ? (
                    <pre className="text-red-500 bg-red-50 p-2">{JSON.stringify(rawError, null, 2)}</pre>
                ) : (
                    <pre className="bg-slate-100 p-2 overflow-auto max-h-60">{JSON.stringify(rawReviews, null, 2)}</pre>
                )}
            </div>

            <div className="bg-white p-4 rounded shadow border border-slate-200">
                <h2 className="font-bold text-lg mb-2 text-green-600">3. Joined Data (With Relations)</h2>
                {joinError ? (
                    <pre className="text-red-500 bg-red-50 p-2">{JSON.stringify(joinError, null, 2)}</pre>
                ) : (
                    <pre className="bg-slate-100 p-2 overflow-auto max-h-60">{JSON.stringify(joinedReviews, null, 2)}</pre>
                )}
            </div>
        </div>
    )
}
