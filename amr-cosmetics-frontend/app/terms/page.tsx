export default function TermsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-pink-500">Terms & Conditions</h1>
      <p className="text-gray-400 mt-2">Rules for using our store and placing orders</p>

      <div className="mt-8 border border-zinc-800 bg-zinc-900 rounded-2xl p-6 text-gray-200 space-y-4">
        <div>
          <p className="font-semibold text-white">Orders & Availability</p>
          <p className="text-gray-300 mt-2">
            Product availability may change. If a product becomes unavailable after an order, we will contact you for a replacement or refund.
          </p>
        </div>

        <div>
          <p className="font-semibold text-white">Pricing</p>
          <p className="text-gray-300 mt-2">
            Prices may be updated anytime. The price shown at checkout is the final price for that order.
          </p>
        </div>

        <div>
          <p className="font-semibold text-white">Product Information</p>
          <p className="text-gray-300 mt-2">
            Images are for reference. Color/packaging may vary slightly due to lighting or brand updates.
          </p>
        </div>

        <div>
          <p className="font-semibold text-white">Contact</p>
          <p className="text-gray-300 mt-2">
            For any questions, email <span className="text-white">hurreh1234@gmail.com</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
