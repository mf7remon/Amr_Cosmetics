export default function ReturnsRefundsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-pink-500">Returns & Refunds</h1>
      <p className="text-gray-400 mt-2">Return eligibility and refund process</p>

      <div className="mt-8 border border-zinc-800 bg-zinc-900 rounded-2xl p-6 text-gray-200 space-y-4">
        <div>
          <p className="font-semibold text-white">Wrong / Damaged Item</p>
          <p className="text-gray-300 mt-2">
            If you receive a wrong or damaged product, please contact us within 24 hours of delivery with photos/video proof.
          </p>
        </div>

        <div>
          <p className="font-semibold text-white">Non-returnable Items</p>
          <p className="text-gray-300 mt-2">
            Opened/used cosmetics and personal-care items are generally non-returnable for hygiene reasons.
          </p>
        </div>

        <div>
          <p className="font-semibold text-white">Refunds</p>
          <p className="text-gray-300 mt-2">
            If approved, refunds are processed via the original payment method or an agreed method (bKash/Nagad/bank).
          </p>
        </div>

        <div>
          <p className="font-semibold text-white">Contact</p>
          <p className="text-gray-300 mt-2">
            Email: <span className="text-white">hurreh1234@gmail.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}
