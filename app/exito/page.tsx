import Link from "next/link";

export default function ExitoPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-emerald-50">
      <h1 className="text-5xl mb-4">✅</h1>
      <h2 className="text-3xl font-bold text-emerald-800">
        ¡Reserva Solicitada!
      </h2>
      <p className="text-gray-600 mt-2 max-w-md">
        Hemos registrado tu solicitud en el sistema del Hotel Kametza. El estado
        actual es "Pendiente de Pago".
      </p>
      <Link
        href="/"
        className="mt-8 px-6 py-3 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition"
      >
        Volver al Inicio
      </Link>
    </div>
  );
}
