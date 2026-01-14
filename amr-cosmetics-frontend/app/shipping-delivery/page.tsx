export default function ShippingDeliveryPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-pink-500">Shipping & Delivery</h1>
      <p className="text-gray-400 mt-2">Delivery timeline and delivery rules</p>

      <div className="mt-8 border border-zinc-800 bg-zinc-900 rounded-2xl p-6 text-gray-200 space-y-4">
        <div>
          <p className="font-semibold text-white">Delivery Time</p>
          <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-300">
            <li>Dhaka: 1–3 working days (estimate)</li>
            <li>Outside Dhaka: 2–5 working days (estimate)</li>
          </ul>
        </div>

        <div>
          <p className="font-semibold text-white">Delivery Charge</p>
          <p className="text-gray-300 mt-2">
            Delivery charges may vary by location and will be confirmed during order confirmation.
          </p>
        </div>

        <div>
          <p className="font-semibold text-white">Failed Delivery</p>
          <p className="text-gray-300 mt-2">
            If the phone is unreachable or address is incorrect, the delivery may fail and a re-delivery charge may apply.
          </p>
        </div>
      </div>
    </div>
  );
}
