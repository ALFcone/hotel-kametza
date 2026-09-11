"use client";

import { useRef, useState } from "react";
import { updateRoom, addRoomGalleryImages, removeRoomGalleryImage } from "../actions";
import { X, ImagePlus } from "lucide-react";
import Swal from "sweetalert2";

export default function RoomEditForm({ room }: { room: any }) {
  const [saving, setSaving] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [removingUrl, setRemovingUrl] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const gallery: string[] = room.gallery_urls || [];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setSaving(true);

    const formData = new FormData(form);
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
      // Solo se limpia el selector de archivo; precio/descripción se dejan con lo que el admin acaba de guardar.
      const fileInput = form.querySelector<HTMLInputElement>('input[name="image"]');
      if (fileInput) fileInput.value = "";
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingGallery(true);
    const formData = new FormData();
    formData.append("roomId", room.id);
    Array.from(files).forEach((file) => formData.append("images", file));

    const result = await addRoomGalleryImages(formData);
    setUploadingGallery(false);
    if (galleryInputRef.current) galleryInputRef.current.value = "";

    if (result?.error) {
      Swal.fire("Error", result.error, "error");
    } else {
      Swal.fire({
        title: "Fotos agregadas",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  const handleRemoveGalleryImage = async (url: string) => {
    const confirm = await Swal.fire({
      title: "¿Quitar esta foto de la galería?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e3004f",
      cancelButtonColor: "#a8a29e",
      confirmButtonText: "Sí, quitar",
      cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) return;

    setRemovingUrl(url);
    const result = await removeRoomGalleryImage(room.id, url);
    setRemovingUrl(null);

    if (result?.error) {
      Swal.fire("Error", result.error, "error");
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
              Foto de Portada
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

      {/* GALERÍA DE FOTOS ADICIONALES */}
      <div className="mt-6 pt-6 border-t border-stone-100">
        <div className="flex items-center justify-between mb-3">
          <label className="text-[9px] font-black uppercase tracking-wider text-stone-400">
            Galería ({gallery.length} fotos)
          </label>
          <label className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-[#d97706] cursor-pointer hover:text-amber-700 transition-colors ${uploadingGallery ? "opacity-50 pointer-events-none" : ""}`}>
            <ImagePlus size={13} />
            {uploadingGallery ? "Subiendo..." : "Agregar fotos"}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleGalleryUpload}
              disabled={uploadingGallery}
            />
          </label>
        </div>

        {gallery.length === 0 ? (
          <p className="text-[10px] text-stone-400 italic">
            Sin fotos adicionales. Se mostrará solo la portada en la galería de reserva.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {gallery.map((url) => (
              <div key={url} className="relative group/thumb aspect-square rounded-lg overflow-hidden border border-stone-200">
                <img src={url} alt="Foto de galería" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveGalleryImage(url)}
                  disabled={removingUrl === url}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white disabled:opacity-70"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
