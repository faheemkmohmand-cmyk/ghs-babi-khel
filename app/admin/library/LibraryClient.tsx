'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

import toast from 'react-hot-toast'


const SUBJECTS = ['Mathematics','Physics','Chemistry','Biology','English','Urdu','Islamiat','Pakistan Studies','Computer Science','General Science','Social Studies','History','Geography','Arabic']
const CLASSES = ['All','6','7','8','9','10']

type Book = { id:string; title:string; author:string; subject:string; class:string; type:string; total_copies:number; available_copies:number; isbn?:string; description?:string; added_year?:string }
type Issue = { id:string; book_id:string; student_id:string; issued_date:string; due_date:string; status:string; books?:{title:string}; students?:{full_name:string;class:string;section:string} }
type Student = { id:string; full_name:string; class:string; section:string; roll_no:string }

const emptyBook = { title:'', author:'', subject:'Mathematics', class:'9', type:'textbook', total_copies:1, available_copies:1, isbn:'', description:'', added_year:new Date().getFullYear().toString() }

export default function LibraryClient({ books:initBooks, issues:initIssues, students }: { books:Book[]; issues:Issue[]; students:Student[] }) {
  const supabase = createClient()

  const [books, setBooks] = useState<Book[]>(initBooks)
  const [issues, setIssues] = useState<Issue[]>(initIssues)
  const [tab, setTab] = useState<'books'|'issues'>('books')
  const [search, setSearch] = useState('')
  const [showBookModal, setShowBookModal] = useState(false)
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [editing, setEditing] = useState<Book|null>(null)
  const [bookForm, setBookForm] = useState(emptyBook)
  const [issueForm, setIssueForm] = useState({ book_id:'', student_id:'', due_date:'' })
  const [saving, setSaving] = useState(false)

  const filteredBooks = books.filter(b => !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()) || b.subject.toLowerCase().includes(search.toLowerCase()))

  function openAddBook() { setEditing(null); setBookForm(emptyBook); setShowBookModal(true) }
  function openEditBook(b:Book) { setEditing(b); setBookForm({ title:b.title, author:b.author, subject:b.subject, class:b.class, type:b.type, total_copies:b.total_copies, available_copies:b.available_copies, isbn:b.isbn||'', description:b.description||'', added_year:b.added_year||'' }); setShowBookModal(true) }

  async function handleSaveBook() {
    if (!bookForm.title || !bookForm.author) { toast.error('Title and author required'); return }
    setSaving(true)
    try {
      if (editing) {
        const { data, error } = await supabase.from('books').update(bookForm).eq('id', editing.id).select().single() as any
        if (error) { toast.error(error.message); return }
        setBooks(prev => prev.map(b => b.id===editing.id ? data : b))
        toast.success('Book updated ✅')
      } else {
        const { data, error } = await supabase.from('books').insert(bookForm).select().single() as any
        if (error) { toast.error(error.message); return }
        setBooks(prev => [...prev, data])
        toast.success('Book added ✅')
      }
      setShowBookModal(false)
    } finally { setSaving(false) }
  }

  async function handleDeleteBook(id:string, title:string) {
    if (!confirm(`Delete "${title}"?`)) return
    await supabase.from('books').delete().eq('id', id)
    setBooks(prev => prev.filter(b=>b.id!==id))
    toast.success('Book deleted')
  }

  async function handleIssue() {
    if (!issueForm.book_id || !issueForm.student_id || !issueForm.due_date) { toast.error('Fill all fields'); return }
    const book = books.find(b=>b.id===issueForm.book_id)
    if (!book || book.available_copies < 1) { toast.error('No copies available'); return }
    setSaving(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase.from('book_issues').insert({ ...issueForm, issued_date:today, status:'issued' }).select('*, books(title), students(full_name,class,section)').single() as any
      if (error) { toast.error(error.message); return }
      await supabase.from('books').update({ available_copies: book.available_copies-1 }).eq('id', book.id)
      setBooks(prev => prev.map(b=>b.id===book.id?{...b,available_copies:b.available_copies-1}:b))
      setIssues(prev => [data, ...prev])
      toast.success('Book issued ✅')
      setShowIssueModal(false)
    } finally { setSaving(false) }
  }

  async function handleReturn(issue:Issue) {
    if (!confirm('Mark book as returned?')) return
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('book_issues').update({ status:'returned', returned_date:today }).eq('id', issue.id)
    const bookToReturn = books.find(b=>b.id===issue.book_id)
    if (bookToReturn) await supabase.from('books').update({ available_copies: bookToReturn.available_copies+1 }).eq('id', issue.book_id)
    // Simpler: just re-fetch or increment locally
    const book = books.find(b=>b.id===issue.book_id)
    if (book) setBooks(prev => prev.map(b=>b.id===book.id?{...b,available_copies:b.available_copies+1}:b))
    setIssues(prev => prev.filter(i=>i.id!==issue.id))
    toast.success('Book returned ✅')
  }

  const typeColors: Record<string,string> = { textbook:'bg-blue-50 text-blue-700', reference:'bg-purple-50 text-purple-700', guide:'bg-green-50 text-green-700' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800" style={{fontFamily:'Georgia,serif'}}>📚 Library Management</h1>
          <p className="text-slate-500 text-sm">{books.length} books · {issues.length} currently issued</p>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>setShowIssueModal(true)} className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all shadow-md">
            📤 Issue Book
          </button>
          <button onClick={openAddBook} className="bg-green-900 hover:bg-green-950 text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all shadow-md">
            ➕ Add Book
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 mb-5 w-fit">
        {[{k:'books',l:`📚 Books (${books.length})`},{k:'issues',l:`📤 Issued (${issues.length})`}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k as any)}
            className={`px-5 py-2 rounded-xl text-sm font-black transition-all ${tab===t.k?'bg-white shadow-sm text-slate-800':'text-slate-500 hover:text-slate-700'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {tab==='books' && (
        <>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4">
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search books by title, author or subject..."
              className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500 transition-colors" />
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-100">
                    {['Title & Author','Subject','Class','Type','Copies',''].map(h=>(
                      <th key={h} className="px-4 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.length===0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-slate-400">
                      <div className="text-4xl mb-2">📚</div>
                      <p className="font-semibold">{search?'No books match':'No books yet. Add your first book!'}</p>
                    </td></tr>
                  ) : filteredBooks.map(b => (
                    <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800 text-sm">{b.title}</div>
                        <div className="text-xs text-slate-400">{b.author}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{b.subject}</td>
                      <td className="px-4 py-3"><span className="bg-slate-800 text-white text-xs font-black px-2 py-0.5 rounded-lg">{b.class==='All'?'All':` Class ${b.class}`}</span></td>
                      <td className="px-4 py-3"><span className={`text-xs font-bold px-2.5 py-1 rounded-lg capitalize ${typeColors[b.type]||'bg-slate-50 text-slate-600'}`}>{b.type}</span></td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-black ${b.available_copies===0?'text-red-600':b.available_copies<=2?'text-amber-600':'text-green-700'}`}>{b.available_copies}</span>
                        <span className="text-slate-400 text-xs">/{b.total_copies}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={()=>openEditBook(b)} className="p-2 hover:bg-blue-50 rounded-xl text-blue-600 transition-colors">✏️</button>
                          <button onClick={()=>handleDeleteBook(b.id,b.title)} className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-colors">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab==='issues' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-100">
                  {['Book','Student','Issued','Due Date','Status',''].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {issues.length===0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400">
                    <div className="text-4xl mb-2">📤</div>
                    <p className="font-semibold">No books currently issued</p>
                  </td></tr>
                ) : issues.map(issue => {
                  const overdue = new Date(issue.due_date) < new Date()
                  return (
                    <tr key={issue.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-800 text-sm">{(issue as any).books?.title||'—'}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-bold text-slate-800">{(issue as any).students?.full_name||'—'}</div>
                        <div className="text-xs text-slate-400">Class {(issue as any).students?.class}{(issue as any).students?.section}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{issue.issued_date}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-bold ${overdue?'text-red-600':'text-slate-600'}`}>{issue.due_date}</span>
                        {overdue && <div className="text-xs text-red-500 font-bold">Overdue!</div>}
                      </td>
                      <td className="px-4 py-3"><span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${overdue?'bg-red-50 text-red-600 border-red-200':'bg-amber-50 text-amber-700 border-amber-200'}`}>{overdue?'Overdue':'Issued'}</span></td>
                      <td className="px-4 py-3">
                        <button onClick={()=>handleReturn(issue)} className="bg-green-50 hover:bg-green-100 text-green-700 font-bold text-xs px-3 py-1.5 rounded-xl transition-colors">✅ Return</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Book Modal */}
      {showBookModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="text-xl font-black text-slate-800" style={{fontFamily:'Georgia,serif'}}>{editing?'✏️ Edit Book':'➕ Add Book'}</h2>
              <button onClick={()=>setShowBookModal(false)} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-xl font-bold">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Book Title *</label>
                <input value={bookForm.title} onChange={e=>setBookForm(p=>({...p,title:e.target.value}))} placeholder="Full book title"
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Author *</label>
                <input value={bookForm.author} onChange={e=>setBookForm(p=>({...p,author:e.target.value}))} placeholder="Author name"
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">ISBN (Optional)</label>
                <input value={bookForm.isbn} onChange={e=>setBookForm(p=>({...p,isbn:e.target.value}))} placeholder="978-..."
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                <input value={bookForm.description} onChange={e=>setBookForm(p=>({...p,description:e.target.value}))} placeholder="Short description..."
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Year Added</label>
                <input value={bookForm.added_year} onChange={e=>setBookForm(p=>({...p,added_year:e.target.value}))} placeholder="2024"
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Subject</label>
                  <select value={bookForm.subject} onChange={e=>setBookForm(p=>({...p,subject:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                    {SUBJECTS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Class</label>
                  <select value={bookForm.class} onChange={e=>setBookForm(p=>({...p,class:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                    {CLASSES.map(c=><option key={c} value={c}>{c==='All'?'All Classes':`Class ${c}`}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Type</label>
                  <select value={bookForm.type} onChange={e=>setBookForm(p=>({...p,type:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                    <option value="textbook">Textbook</option><option value="reference">Reference</option><option value="guide">Guide</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Copies</label>
                  <input type="number" min={1} value={bookForm.total_copies} onChange={e=>setBookForm(p=>({...p,total_copies:Number(e.target.value),available_copies:Number(e.target.value)}))}
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-100">
              <button onClick={()=>setShowBookModal(false)} className="flex-1 border-2 border-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-50">Cancel</button>
              <button onClick={handleSaveBook} disabled={saving} className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                {saving?<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:null}
                {editing?'✅ Update':'➕ Add Book'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Book Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-800" style={{fontFamily:'Georgia,serif'}}>📤 Issue Book</h2>
              <button onClick={()=>setShowIssueModal(false)} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-xl font-bold">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Select Book *</label>
                <select value={issueForm.book_id} onChange={e=>setIssueForm(p=>({...p,book_id:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                  <option value="">-- Select Book --</option>
                  {books.filter(b=>b.available_copies>0).map(b=>(
                    <option key={b.id} value={b.id}>{b.title} ({b.available_copies} available)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Select Student *</label>
                <select value={issueForm.student_id} onChange={e=>setIssueForm(p=>({...p,student_id:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                  <option value="">-- Select Student --</option>
                  {students.map(s=><option key={s.id} value={s.id}>{s.full_name} – Class {s.class}{s.section}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Due Date *</label>
                <input type="date" value={issueForm.due_date} onChange={e=>setIssueForm(p=>({...p,due_date:e.target.value}))} min={new Date().toISOString().split('T')[0]}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-100">
              <button onClick={()=>setShowIssueModal(false)} className="flex-1 border-2 border-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-50">Cancel</button>
              <button onClick={handleIssue} disabled={saving} className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                {saving?<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:null}📤 Issue Book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
