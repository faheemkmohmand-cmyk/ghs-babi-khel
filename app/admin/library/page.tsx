'use client'
import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Book = { id: string; title: string; author: string; subject: string; class: string; type: string; total_copies: number; available_copies: number; isbn: string; description: string }
type Issue = { id: string; book_id: string; student_id: string; issued_date: string; due_date: string; returned_date: string | null; status: string; books: { title: string }; students: { full_name: string; roll_no: string; class: string } }
type Student = { id: string; full_name: string; roll_no: string; class: string }

export default function AdminLibraryPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'books'|'issues'>('books')
  const [books, setBooks] = useState<Book[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showBookForm, setShowBookForm] = useState(false)
  const [showIssueForm, setShowIssueForm] = useState(false)
  const [editBook, setEditBook] = useState<Book | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [bookForm, setBookForm] = useState({ title:'', author:'', subject:'', class:'All', type:'textbook', total_copies:1, available_copies:1, isbn:'', description:'' })
  const [issueForm, setIssueForm] = useState({ book_id:'', student_id:'', issued_date:new Date().toISOString().split('T')[0], due_date:'' })

  const loadBooks = useCallback(async () => {
    const { data } = await supabase.from('books').select('*').order('title')
    setBooks(data || [])
  }, [])

  const loadIssues = useCallback(async () => {
    const { data } = await supabase.from('book_issues')
      .select('*, books(title), students(full_name, roll_no, class)')
      .order('due_date', { ascending: true })
    setIssues(data || [])
  }, [])

  const loadStudents = useCallback(async () => {
    const { data } = await supabase.from('students').select('id,full_name,roll_no,class').eq('status','active').order('full_name')
    setStudents(data || [])
  }, [])

  useEffect(() => {
    async function init() {
      setLoading(true)
      await Promise.all([loadBooks(), loadIssues(), loadStudents()])
      setLoading(false)
    }
    init()
  }, [])

  async function saveBook() {
    if (!bookForm.title || !bookForm.author) { toast.error('Title and author required'); return }
    setSaving(true)
    try {
      if (editBook) {
        const { error } = await supabase.from('books').update(bookForm).eq('id', editBook.id)
        if (error) throw error; toast.success('Book updated!')
      } else {
        const { error } = await supabase.from('books').insert(bookForm)
        if (error) throw error; toast.success('Book added!')
      }
      setShowBookForm(false); loadBooks()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function deleteBook(id: string) {
    if (!confirm('Delete this book?')) return
    await supabase.from('books').delete().eq('id', id)
    toast.success('Deleted'); loadBooks()
  }

  async function issueBook() {
    if (!issueForm.book_id || !issueForm.student_id || !issueForm.due_date) {
      toast.error('Book, student, and due date required'); return
    }
    setSaving(true)
    try {
      const { error } = await supabase.from('book_issues').insert({ ...issueForm, status: 'issued' })
      if (error) throw error
      await supabase.from('books').update({ available_copies: supabase.rpc as any }).eq('id', issueForm.book_id)
      const book = books.find(b => b.id === issueForm.book_id)
      if (book) await supabase.from('books').update({ available_copies: Math.max(0, book.available_copies - 1) }).eq('id', issueForm.book_id)
      toast.success('Book issued!')
      setShowIssueForm(false)
      await Promise.all([loadBooks(), loadIssues()])
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function markReturned(issue: Issue) {
    const today = new Date().toISOString().split('T')[0]
    const { error } = await supabase.from('book_issues').update({ status: 'returned', returned_date: today }).eq('id', issue.id)
    if (error) { toast.error(error.message); return }
    const book = books.find(b => b.id === issue.book_id)
    if (book) await supabase.from('books').update({ available_copies: book.available_copies + 1 }).eq('id', issue.book_id)
    toast.success('Marked as returned!')
    await Promise.all([loadBooks(), loadIssues()])
  }

  const filtered = books.filter(b =>
    b.title?.toLowerCase().includes(search.toLowerCase()) ||
    b.author?.toLowerCase().includes(search.toLowerCase()) ||
    b.subject?.toLowerCase().includes(search.toLowerCase())
  )

  const today = new Date().toISOString().split('T')[0]
  const overdueIssues = issues.filter(i => i.status === 'issued' && i.due_date < today)
  const activeIssues = issues.filter(i => i.status === 'issued')

  return (
    <AdminLayout adminName="">
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-black text-slate-800">📚 Library Management</h1>
            <p className="text-slate-500 text-sm">{books.length} books · {activeIssues.length} issued · {overdueIssues.length} overdue</p>
          </div>
          <div className="flex gap-2">
            {tab === 'books' ? (
              <button onClick={() => { setEditBook(null); setBookForm({ title:'', author:'', subject:'', class:'All', type:'textbook', total_copies:1, available_copies:1, isbn:'', description:'' }); setShowBookForm(true) }}
                className="bg-green-900 hover:bg-green-950 text-white font-bold px-4 py-2.5 rounded-xl text-sm">+ Add Book</button>
            ) : (
              <button onClick={() => { setIssueForm({ book_id:'', student_id:'', issued_date:new Date().toISOString().split('T')[0], due_date:'' }); setShowIssueForm(true) }}
                className="bg-green-900 hover:bg-green-950 text-white font-bold px-4 py-2.5 rounded-xl text-sm">+ Issue Book</button>
            )}
          </div>
        </div>

        {overdueIssues.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-red-700 text-sm">{overdueIssues.length} Overdue Books</p>
              <p className="text-red-500 text-xs">These books are past their due date</p>
            </div>
          </div>
        )}

        <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm w-fit">
          <button onClick={() => setTab('books')} className={`px-5 py-2.5 text-sm font-black transition-all ${tab==='books'?'bg-green-900 text-white':'text-slate-500 hover:bg-slate-50'}`}>📖 Books</button>
          <button onClick={() => setTab('issues')} className={`px-5 py-2.5 text-sm font-black transition-all flex items-center gap-2 ${tab==='issues'?'bg-green-900 text-white':'text-slate-500 hover:bg-slate-50'}`}>
            📤 Issues {activeIssues.length > 0 && <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{activeIssues.length}</span>}
          </button>
        </div>

        {tab === 'books' && (
          <>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search books..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400"/>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {loading ? <div className="text-center py-16 text-slate-400">Loading...</div>
              : filtered.length === 0 ? (
                <div className="text-center py-16"><div className="text-5xl mb-3">📚</div><p className="text-slate-400 font-semibold">No books found</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>{['Title','Author','Subject','Class','Type','Copies','Avail.','Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase whitespace-nowrap">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filtered.map(b => (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-bold text-slate-800 max-w-[160px] truncate">{b.title}</td>
                          <td className="px-4 py-3 text-slate-500">{b.author}</td>
                          <td className="px-4 py-3 text-slate-500">{b.subject}</td>
                          <td className="px-4 py-3 text-slate-500">{b.class}</td>
                          <td className="px-4 py-3"><span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">{b.type}</span></td>
                          <td className="px-4 py-3 text-center font-bold text-slate-600">{b.total_copies}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs font-black px-2 py-1 rounded-full ${b.available_copies>0?'bg-green-50 text-green-700':'bg-red-50 text-red-600'}`}>{b.available_copies}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button onClick={() => { setEditBook(b); setBookForm({ title:b.title, author:b.author, subject:b.subject, class:b.class, type:b.type, total_copies:b.total_copies, available_copies:b.available_copies, isbn:b.isbn||'', description:b.description||'' }); setShowBookForm(true) }}
                                className="text-xs font-bold text-sky-600 px-2 py-1 rounded-lg hover:bg-sky-50">Edit</button>
                              <button onClick={() => deleteBook(b.id)} className="text-xs font-bold text-red-500 px-2 py-1 rounded-lg hover:bg-red-50">Del</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'issues' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {issues.length === 0 ? (
              <div className="text-center py-16"><div className="text-5xl mb-3">📤</div><p className="text-slate-400 font-semibold">No books issued yet</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>{['Book','Student','Class','Issued','Due Date','Status','Action'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase whitespace-nowrap">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {issues.map(i => {
                      const overdue = i.status === 'issued' && i.due_date < today
                      return (
                        <tr key={i.id} className={`hover:bg-slate-50 ${overdue ? 'bg-red-50/30' : ''}`}>
                          <td className="px-4 py-3 font-bold text-slate-800 max-w-[140px] truncate">{(i.books as any)?.title}</td>
                          <td className="px-4 py-3 font-semibold text-slate-700">{(i.students as any)?.full_name}</td>
                          <td className="px-4 py-3 text-slate-500">{(i.students as any)?.class}</td>
                          <td className="px-4 py-3 text-slate-500">{i.issued_date}</td>
                          <td className="px-4 py-3">
                            <span className={`font-bold text-sm ${overdue ? 'text-red-600' : 'text-slate-700'}`}>{i.due_date}</span>
                            {overdue && <span className="ml-1 text-xs text-red-500 font-bold">OVERDUE</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-black px-2 py-1 rounded-full ${
                              i.status==='returned'?'bg-green-50 text-green-700':
                              overdue?'bg-red-50 text-red-600':'bg-amber-50 text-amber-700'
                            }`}>{i.status==='returned'?'Returned':overdue?'Overdue':'Issued'}</span>
                          </td>
                          <td className="px-4 py-3">
                            {i.status === 'issued' && (
                              <button onClick={() => markReturned(i)}
                                className="text-xs font-bold text-green-700 border border-green-200 px-2.5 py-1 rounded-lg hover:bg-green-50">
                                ✅ Return
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Book Form Modal */}
      {showBookForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-xl font-black text-slate-800 mb-5">{editBook ? 'Edit Book' : 'Add Book'}</h2>
            <div className="space-y-3">
              {[{label:'Title *',key:'title',ph:'Book title'},{label:'Author *',key:'author',ph:'Author name'},{label:'Subject',key:'subject',ph:'e.g. Mathematics'},{label:'ISBN',key:'isbn',ph:'ISBN'}].map(f => (
                <div key={f.key}><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{f.label}</label>
                  <input value={(bookForm as any)[f.key]} onChange={e => setBookForm(p => ({...p,[f.key]:e.target.value}))} placeholder={f.ph}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/></div>
              ))}
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Description</label>
                <textarea value={bookForm.description} onChange={e => setBookForm(p => ({...p,description:e.target.value}))} rows={2}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 resize-none"/></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Class</label>
                  <select value={bookForm.class} onChange={e => setBookForm(p => ({...p,class:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400">
                    {['All','6','7','8','9','10'].map(c => <option key={c} value={c}>{c==='All'?'All':'Class '+c}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Type</label>
                  <select value={bookForm.type} onChange={e => setBookForm(p => ({...p,type:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400">
                    {['textbook','reference','guide'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Total Copies</label>
                  <input type="number" min="1" value={bookForm.total_copies}
                    onChange={e => { const v=parseInt(e.target.value)||1; setBookForm(p => ({...p,total_copies:v,available_copies:v})) }}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/></div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowBookForm(false)} className="flex-1 border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={saveBook} disabled={saving} className="flex-1 bg-green-900 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">{saving?'Saving...':(editBook?'Update':'Add Book')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Book Modal */}
      {showIssueForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="font-display text-xl font-black text-slate-800 mb-5">📤 Issue Book</h2>
            <div className="space-y-3">
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Book *</label>
                <select value={issueForm.book_id} onChange={e => setIssueForm(p => ({...p,book_id:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400">
                  <option value="">Select book...</option>
                  {books.filter(b => b.available_copies > 0).map(b => <option key={b.id} value={b.id}>{b.title} ({b.available_copies} avail.)</option>)}
                </select></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Student *</label>
                <select value={issueForm.student_id} onChange={e => setIssueForm(p => ({...p,student_id:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400">
                  <option value="">Select student...</option>
                  {students.map(s => <option key={s.id} value={s.id}>Class {s.class} · {s.full_name} (Roll {s.roll_no})</option>)}
                </select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Issue Date</label>
                  <input type="date" value={issueForm.issued_date} onChange={e => setIssueForm(p => ({...p,issued_date:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Due Date *</label>
                  <input type="date" value={issueForm.due_date} onChange={e => setIssueForm(p => ({...p,due_date:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/></div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowIssueForm(false)} className="flex-1 border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={issueBook} disabled={saving} className="flex-1 bg-green-900 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">{saving?'Issuing...':'Issue Book'}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
