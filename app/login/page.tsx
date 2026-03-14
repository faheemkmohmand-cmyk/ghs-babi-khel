export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const error = searchParams.error
  let errorMsg = ''
  if (error === 'missing') errorMsg = 'Please enter your email and password.'
  else if (error) errorMsg = 'Wrong email or password. Please try again.'

  return (
    <div className="min-h-screen flex" style={{background:'linear-gradient(135deg,#020810 0%,#0a1628 50%,#014d26 100%)'}}>
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12">
        <div className="text-center max-w-sm">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-5xl mx-auto mb-6 shadow-2xl">🏫</div>
          <h1 className="font-display text-3xl font-black text-white mb-3">Government High School<br/>Babi Khel</h1>
          <p className="text-white/40 text-sm mb-8">Khyber Pakhtunkhwa, Pakistan</p>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-2xl mx-auto mb-3">🏫</div>
            <div className="font-display text-xl font-black text-white">GHS Babi Khel</div>
          </div>
          <div className="bg-white/6 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
            <h2 className="font-display text-2xl font-black text-white mb-1">Sign In</h2>
            <p className="text-white/40 text-sm mb-6">Access your school portal</p>
            {errorMsg && (
              <div className="bg-red-500/15 border border-red-400/30 text-red-300 text-sm font-semibold rounded-xl px-4 py-3 mb-5">
                ⚠️ {errorMsg}
              </div>
            )}
            <form action="/auth/login" method="POST" className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">Email</label>
                <input type="email" name="email" placeholder="you@email.com" required
                  className="w-full bg-white/8 border-2 border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400/60 transition-all"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">Password</label>
                <input type="password" name="password" placeholder="Your password" required
                  className="w-full bg-white/8 border-2 border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400/60 transition-all"/>
              </div>
              <button type="submit"
                className="w-full bg-green-900 hover:bg-green-950 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg">
                🚀 Sign In
              </button>
            </form>
            <div className="mt-6 pt-5 border-t border-white/8 text-center space-y-3 text-sm">
              <p className="text-white/35">No account? <a href="/signup" className="text-green-400 font-bold">Create one →</a></p>
              <a href="/" className="block text-white/20 text-xs">← Back to School Website</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}