import Image from "next/image";
import Link from "next/link";
import { PawPrint, BadgeCheck, Users, MapPin } from "lucide-react";

interface Listing {
  id: number; slug: string; name: string; species: string; breed: string | null;
  gender: string | null; ageText: string | null; price: string | null; priceType: string;
  listingType: string; isVerified: boolean; city: string | null; vaccinated: boolean;
  primaryImage: string | null; intent?: string;
}

export function PetGridCard({ pet }: { pet: Listing }) {
  const isBusiness = pet.listingType === "business";
  const isAdoption = (pet.intent ?? (pet.priceType === "free" || pet.priceType === "adoption_fee" ? "adoption" : "sale")) === "adoption";
  return (
    <Link href={`/pets/${pet.slug}`} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
      <div className="aspect-[4/3] bg-gradient-to-br from-teal-50 to-orange-50 relative">
        {pet.primaryImage ? (
          <Image src={pet.primaryImage} alt={pet.name} fill className="object-cover group-hover:scale-105 transition-transform" sizes="320px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><PawPrint className="w-10 h-10 text-gray-300" /></div>
        )}
        {isBusiness ? (
          <span className="absolute top-2 left-2 bg-teal-600 text-white text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
            <BadgeCheck className="w-3 h-3" /> VERIFIED BY US
          </span>
        ) : (
          <span className="absolute top-2 left-2 bg-white/95 text-gray-600 text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1 border border-gray-100">
            <Users className="w-3 h-3" /> COMMUNITY
          </span>
        )}
        {isAdoption && (
          <span className="absolute bottom-2 left-2 bg-pink-500/95 text-white text-[9px] font-bold px-2 py-1 rounded-md">
            FOR ADOPTION
          </span>
        )}
        {!isAdoption && pet.vaccinated && (
          <span className="absolute bottom-2 left-2 bg-white/95 text-teal-700 text-[9px] font-bold px-2 py-1 rounded-md border border-teal-100">
            Vaccinated
          </span>
        )}
      </div>
      <div className="p-3.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-gray-900">{pet.name}</h3>
          <span className="text-xs text-gray-400">{pet.gender === "male" ? "♂" : pet.gender === "female" ? "♀" : pet.species}</span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{[pet.breed, pet.ageText].filter(Boolean).join(" · ")}</p>
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm font-extrabold text-teal-700">
            {isAdoption && !pet.price
              ? "Free to good home"
              : isAdoption && pet.price
                ? `Adoption fee ₹${parseFloat(pet.price).toFixed(0)}`
                : pet.price
                  ? `₹${parseFloat(pet.price).toFixed(0)}`
                  : "Enquire"}
          </p>
          {pet.city && <p className="text-xs text-gray-400 flex items-center gap-0.5"><MapPin className="w-3 h-3" />{pet.city}</p>}
        </div>
      </div>
    </Link>
  );
}
