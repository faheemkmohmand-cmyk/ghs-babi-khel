'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugPage() {
  const [results, setResults] = useState<any[]>([])
  const [testing, setTesting] = useState(false)
  const [testEmail, setTestEmail] = useState('test123@gmail.com')
  const [testPass, setTestPass] = useState('test123456')

  async function runTests() {
    setTesting(true)
    setResults([])
    const logs: any[] = []
    const supabase = createClient()

    // Test 1: env vars
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    logs.push({
      test: '1. Environment Variables',
      status: url && key ? 'PASS' : 'FAIL',
      detail: url
        ? `URL: ${url.slice(0,30)}... Key: ${key ? key.slice(0,20)+'...' : 'MISSING'}`
        : 'MISSING - Variables not set in Vercel!',
    })

    // Test 2: URL format
    const urlOk = url?.startsWith('https://') && url?.includes('.supabase.co')
    logs.push({
      test: '2. URL Format',
      status: urlOk ? 'PASS' : 'FAIL',
      detail: urlOk ? `Correct format: ${url}` : `Wrong format! Got: "${url}" — must be https://xxxxx.supabase.co`,
    })

    // Test 3: key format
    const keyOk = key?.startsWith('eyJ') && (key?.length || 0) > 100
    logs.push({
      test: '3. Anon Key Format',
      status: keyOk ? 'PASS' : 'FAIL',
      detail: keyOk ? `Key length: ${key?.length} chars ✅` : `Wrong key! Length: ${key?.length || 0} chars. Must start with "eyJ" and be 200+ chars long`,
    })

    // Test 4: ping Supabase
    try {
      const res = await fetch(`${url}/rest/v1/`, {
        headers: { apikey: key || '', Authorization: `Bearer ${key}` }
      })
      logs.push({
        test: '4. Supabase Reachable',
        status: res.status < 500 ? 'PASS' : 'FAIL',
        detail: `HTTP ${res.status} — ${res.status === 200 ? 'Connected!' : res.status === 401 ? 'Unauthorized — wrong key?' : 'Server error'}`,
      })
    } catch (e: any) {
      logs.push({ test: '4. Supabase Reachable', status: 'FAIL', detail: `Network error: ${e.message}` })
    }

    // Test 5: try signup
    try {
      const { data, error } = await supabase.auth.signUp({ email: testEmail, password: testPass, options: { data: { full_name: 'Test User' } } })
      if (error) {
        logs.push({ test: '5. Signup Test', status: 'FAIL', detail: `Error: ${error.message} (code: ${error.status})` })
      } else {
        logs.push({ test: '5. Signup Test', status: 'PASS', detail: `User created! ID: ${data.user?.id?.slice(0,12)}... Email confirmed: ${data.user?.email_confirmed_at ? 'YES' : 'NO — turn off email confirmation in Supabase Auth settings'}` })
      }
    } catch (e: any) {
      logs.push({ test: '5. Signup Test', status: 'FAIL', detail: `Exception: ${e.message}` })
    }

    // Test 6: try login
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: testEmail, password: testPass })
      if (error) {
        logs.push({ test: '6. Login Test', status: 'FAIL', detail: `Error: ${error.message} — ${
          error.message.includes('Invalid login') ? 'Account may need email verification. Go to Supabase → Auth → Settings → turn OFF Confirm Email' :
          error.message.includes('Email not confirmed') ? 'EMAIL NOT CONFIRMED — Go to Supabase → Auth → Settings → turn OFF Confirm Email' :
          error.message.includes('Invalid API') ? 'Wrong API key in Vercel env vars' : 'Unknown error'
        }` })
      } else {
        logs.push({ test: '6. Login Test', status: 'PASS', detail: `Login works! User: ${data.user?.email}` })
        await supabase.auth.signOut()
      }
    } catch (e: any) {
      logs.push({ test: '6. Login Test', status: 'FAIL', detail: `Exception: ${e.message}` })
    }

    // Test 7: check profiles table
    try {
      const { data, error } = await supabase.from('profiles').select('id').limit(1)
      logs.push({
        test: '7. Profiles Table',
        status: error ? 'FAIL' : 'PASS',
        detail: error ? `Table error: ${error.message} — Did you run SUPABASE-SETUP.sql?` : `Table exists ✅`,
      })
    } catch (e: any) {
      logs.push({ test: '7. Profiles Table', status: 'FAIL', detail: e.message })
    }

    setResults(logs)
    setTesting(false)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black mb-2">🔍 GHS Debug Tool</h1>
          <p className="text-slate-400 text-sm">This page diagnoses your Supabase connection. Delete after fixing.</p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-5 mb-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Test Account (will be created)</p>
          <div className="flex gap-3 mb-3">
            <input value={testEmail} onChange={e => setTestEmail(e.target.value)}
              className="flex-1 bg-slate-700 rounded-xl px-3 py-2 text-sm outline-none border border-slate-600 focus:border-green-400" placeholder="Test email"/>
            <input value={testPass} onChange={e => setTestPass(e.target.value)}
              className="flex-1 bg-slate-700 rounded-xl px-3 py-2 text-sm outline-none border border-slate-600 focus:border-green-400" placeholder="Test password"/>
          </div>
          <button onClick={runTests} disabled={testing}
            className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-50 font-bold py-3 rounded-xl transition-all">
            {testing ? '🔄 Running tests...' : '▶️ Run Diagnostics'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((r, i) => (
              <div key={i} className={`rounded-xl p-4 border ${r.status === 'PASS' ? 'bg-green-900/30 border-green-700' : 'bg-red-900/30 border-red-700'}`}>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-lg">{r.status === 'PASS' ? '✅' : '❌'}</span>
                  <span className="font-black text-sm">{r.test}</span>
                  <span className={`text-xs font-black ml-auto px-2 py-0.5 rounded-full ${r.status === 'PASS' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{r.status}</span>
                </div>
                <p className={`text-xs pl-8 ${r.status === 'PASS' ? 'text-green-300' : 'text-red-300'}`}>{r.detail}</p>
              </div>
            ))}

            <div className="bg-slate-800 rounded-xl p-4 mt-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">📋 What to fix</p>
              {results.filter(r => r.status === 'FAIL').length === 0
                ? <p className="text-green-400 text-sm font-bold">✅ All tests passed! Login & signup should work.</p>
                : results.filter(r => r.status === 'FAIL').map((r, i) => (
                  <div key={i} className="text-red-300 text-xs mb-2">⚠️ <strong>{r.test}</strong>: {r.detail}</div>
                ))
              }
            </div>
          </div>
        )}

        <div className="mt-6 bg-amber-900/30 border border-amber-700 rounded-xl p-4 text-xs text-amber-300">
          <p className="font-bold mb-1">⚠️ Security: Delete this page after fixing!</p>
          <p>Delete the file <code>app/debug/page.tsx</code> once your login is working.</p>
        </div>
      </div>
    </div>
  )
}
