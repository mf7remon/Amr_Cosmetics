export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-pink-500">About Us</h1>
      <p className="text-gray-400 mt-2">Learn more about Amr Cosmetics</p>

      <div className="mt-8 border border-zinc-800 bg-zinc-900 rounded-2xl p-6 text-gray-200 space-y-4">
        <p>
          Amr Cosmetics brings curated beauty and lifestyle picks that feel premium, simple, and made for everyday confidence.
        </p>

        <p>
          We focus on quality, clean presentation, and a smooth shopping experience — from browsing to delivery.
        </p>

        <div className="pt-2">
          <p className="font-semibold text-white">Need help?</p>
          <p className="text-gray-300 mt-1">Email: hurreh1234@gmail.com</p>
          <p className="text-gray-300">WhatsApp: 01302180147</p>
        </div>
      </div>
    </div>
  );
}
