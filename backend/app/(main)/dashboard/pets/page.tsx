"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, MoreVertical, Calendar, Info } from "lucide-react";
import { motion } from "framer-motion";

const pets = [
  { id: 1, name: "Max", breed: "Golden Retriever", age: "2 years", image: "/images/dog.png" },
  { id: 2, name: "Luna", breed: "Persian Cat", age: "6 months", image: "/images/adoption.png" },
];

export default function PetsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--secondary))] mb-2">My Pets</h1>
          <p className="text-gray-500">Manage and track your pet's healthcare and history.</p>
        </div>
        <Link href="/dashboard/pets/add" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add New Pet
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {pets.map((pet, idx) => (
          <motion.div
            key={pet.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="group bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-orange-500/5 transition-all"
          >
            <div className="relative h-64 rounded-2xl overflow-hidden mb-6">
              <Image src={pet.image} alt={pet.name} fill className="object-cover transition-transform group-hover:scale-105" />
              <div className="absolute top-4 right-4">
                <button className="w-8 h-8 bg-white/70 backdrop-blur-md rounded-full flex items-center justify-center text-gray-700 hover:bg-white transition-all">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[hsl(var(--secondary))]">{pet.name}</h3>
                  <p className="text-gray-400 text-sm font-medium">{pet.breed}</p>
                </div>
                <div className="bg-orange-50 text-orange-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Active
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-bold uppercase tracking-tight">{pet.age}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Info className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-tight">Healthy</span>
                </div>
              </div>

              <Link 
                href={`/dashboard/pets/${pet.id}`}
                className="block w-full text-center py-3 bg-[hsl(var(--secondary))] text-white rounded-xl font-bold text-sm hover:bg-blue-900 transition-colors"
              >
                View Details
              </Link>
            </div>
          </motion.div>
        ))}

        {/* Empty State / Add New Card */}
        <Link 
          href="/dashboard/pets/add"
          className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-[2rem] p-12 hover:border-[hsl(var(--primary))] hover:bg-orange-50 group transition-all"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-[hsl(var(--primary))] transition-all">
            <Plus className="w-8 h-8 text-gray-400 group-hover:text-white" />
          </div>
          <p className="text-sm font-bold text-gray-400 group-hover:text-[hsl(var(--primary))] transition-all">Add Another Pet</p>
        </Link>
      </div>
    </div>
  );
}
