export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-pink-500">Privacy Policy</h1>
      <p className="text-gray-400 mt-2">How we collect and use your information</p>

      <div className="mt-8 border border-zinc-800 bg-zinc-900 rounded-2xl p-6 text-gray-200 space-y-4">
        <p>
          We collect basic information to process orders and provide customer support. This may include your name, phone number,
          delivery address, and email address.
        </p>

        <div>
          <p className="font-semibold text-white">What we use it for</p>
          <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-300">
            <li>Order processing and delivery</li>
            <li>Customer support and communication</li>
            <li>Improving our store experience</li>
          </ul>
        </div>

        <div>
          <p className="font-semibold text-white">Sharing</p>
          <p className="text-gray-300 mt-2">
            We may share limited information with delivery partners and payment providers only to complete your order.
          </p>
        </div>

        <div>
          <p className="font-semibold text-white">Contact</p>
          <p className="text-gray-300 mt-2">
            If you have questions about privacy, contact us at <span className="text-white">hurreh1234@gmail.com</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
