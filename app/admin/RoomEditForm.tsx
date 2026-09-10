"use client";

import { useState } from "react";
import { updateRoom } from "../actions";
import Swal from "sweetalert2";

export default function RoomEditForm({ room }: { room: any }) {
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const result = await updateRoom(formData);

    setSaving(false);

    if (result?.error) {
      Swal.fire("Error", result.error, "error");
    } else {
      Swal.fire({
        title: "Guardado",
        text: "Los cambios de la habitación se guardaron correctamente.",
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
      });
      e.currentTarget.reset();
    }
  };

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <input type="hidden" name="roomId" value={room.id} />

        <div className="grid grid-cols-2 gap-4">
          <div className="group/input">
            <label className="text-[9px] font-black uppercase tracking-wider text-stone-400 block mb-1.5 group-focus-within/input:text-[#d97706] transition-colors">
              Precio Noche
            </label>
            <div className="relative w-28">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-[10px]">S/</span>
              <input
                name="price"
                defaultValue={room.price_per_night}
                type="number"
                className="w-full pl-7 pr-2 py-2 bg-stone-50/50 rounded-lg border border-stone-200 font-bold text-stone-700 focus:bg-white focus:ring-2 focus:ring-[#d97706]/20 focus:border-[#d97706] outline-none transition-all text-xs shadow-inner shadow-stone-100/50"
              />
            </div>
          </div>
          <div className="group/input">
            <label className="text-[9px] font-black uppercase tracking-wider text-stone-400 block mb-1.5 group-focus-within/input:text-[#d97706] transition-colors">
              Cambiar Imagen
            </label>
            <input type="hidden" name="oldImage" value={room.image_url || ""} />
            <input
              name="image"
              type="file"
              accept="image/*"
              className="w-full bg-stone-50/50 rounded-xl border border-stone-200 text-[10px] file:mr-3 file:py-3 file:px-4 file:border-0 file:text-[9px] file:font-black file:uppercase file:tracking-wider file:bg-stone-200 file:text-stone-700 hover:file:bg-[#d97706] hover:file:text-white file:transition-colors outline-none transition-all shadow-inner shadow-stone-100/50 focus:border-[#d97706] focus:bg-white"
            />
          </div>
        </div>

        <div className="group/input">
          <label className="text-[9px] font-black uppercase tracking-wider text-stone-400 block mb-1.5 group-focus-within/input:text-[#d97706] transition-colors">
            Descripción
          </label>
          <textarea
            name="description"
            defaultValue={room.description}
            className="w-full p-3.5 bg-stone-50/50 rounded-xl border border-stone-200 text-xs h-20 resize-none font-medium text-stone-600 focus:bg-white focus:ring-2 focus:ring-[#d97706]/20 focus:border-[#d97706] outline-none transition-all shadow-inner shadow-stone-100/50"
            placeholder="Descripción de la habitación..."
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="relative overflow-hidden w-full bg-stone-900 text-amber-500 font-black py-3.5 rounded-xl transition-all duration-300 text-[10px] uppercase tracking-widest shadow-lg hover:shadow-[#d97706]/20 hover:-translate-y-0.5 group/btn disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {saving ? "Guardando..." : "Guardar Cambios"}
          </span>
          <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 transform translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out" />
        </button>
      </form>
    </div>
  );
}
