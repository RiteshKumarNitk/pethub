"use client";

import { useState, useEffect } from "react";
import { 
  FileText, 
  Plus, 
  Search, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Loader2,
  CheckCircle2,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blogs");
      const data = await res.json();
      if (data.blogs) {
        setBlogs(data.blogs);
      }
    } catch (err) {
      console.error("Failed to fetch blogs", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBlogs = blogs.filter(b => 
    b.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-[hsl(var(--secondary))] mb-2 tracking-tight">Pet Care Blogs</h1>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Educate your community with breed guides and tips</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search articles..." 
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-orange-500/5 transition-all outline-none font-bold text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-primary !px-8 !py-4 flex items-center gap-2">
            <Plus className="w-5 h-5" /> <span className="hidden sm:inline">New Post</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-[hsl(var(--primary))]" />
          </div>
        ) : filteredBlogs.length > 0 ? (
          filteredBlogs.map((blog, idx) => (
            <motion.div
              key={blog.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden group hover:shadow-2xl transition-all"
            >
               <div className="relative h-48 bg-gray-100">
                  {blog.thumbnailUrl ? (
                    <img src={blog.thumbnailUrl} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                       <FileText className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                     <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${blog.isPublished ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {blog.isPublished ? 'Published' : 'Draft'}
                     </span>
                  </div>
               </div>
               
               <div className="p-8 space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">{blog.category?.name || 'Uncategorized'}</p>
                    <h3 className="text-xl font-black text-[hsl(var(--secondary))] tracking-tight line-clamp-2">{blog.title}</h3>
                  </div>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                     <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase">{new Date(blog.createdAt).toLocaleDateString()}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-[hsl(var(--primary))] hover:text-white transition-all">
                           <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all">
                           <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
               </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-32 bg-white rounded-[3rem] border border-dashed border-gray-200 text-center flex flex-col items-center justify-center space-y-4">
             <FileText className="w-16 h-16 text-gray-100" />
             <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No articles published yet.</p>
             <button className="btn-primary !px-10 mt-4">Create First Post</button>
          </div>
        )}
      </div>
    </div>
  );
}
