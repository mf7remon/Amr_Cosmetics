import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">
        Welcome to <span className="text-pink-500">Amr Cosmetics</span> 💄
      </h1>
      <p className="text-gray-300 mb-10">Beauty that belongs to you</p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/products"
          className="bg-pink-500 hover:bg-pink-600 px-6 py-3 rounded font-semibold"
        >
          Shop Products
        </Link>

        <Link
          href="/account/spin"
          className="border border-zinc-700 hover:border-pink-500 px-6 py-3 rounded font-semibold"
        >
          Spin to Win 🎡
        </Link>

        <Link
          href="/account/coupons"
          className="border border-zinc-700 hover:border-pink-500 px-6 py-3 rounded font-semibold"
        >
          My Coupons
        </Link>
      </div>
    </div>
  );
}
