'use client';

import { useState } from "react";
import Link from 'next/link';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation Menu */}
      <header className="px-6 py-4 flex justify-between items-center shadow-md bg-white sticky top-0 z-50">
        <div className="text-xl font-bold text-blue-600">LearnConnect</div>
        <nav className="hidden md:flex space-x-6">
          <Link href="/#how-it-works" className="text-gray-700 hover:text-blue-600">How It Works</Link>
          <Link href="/#why" className="text-gray-700 hover:text-blue-600">Why Us</Link>
          <Link href="/#testimonials" className="text-gray-700 hover:text-blue-600">Testimonials</Link>
          <Link href="/login" className="text-blue-600 font-semibold">Login</Link>
        </nav>
        <button className="md:hidden text-gray-700" onClick={() => setMenuOpen(!menuOpen)}>
          &#9776;
        </button>
      </header>
      {menuOpen && (
        <div className="md:hidden bg-white shadow-md px-6 py-4 space-y-4">
          <Link href="/#how-it-works" className="block text-gray-700 hover:text-blue-600">How It Works</Link>
          <Link href="/#why" className="block text-gray-700 hover:text-blue-600">Why Us</Link>
          <Link href="/#testimonials" className="block text-gray-700 hover:text-blue-600">Testimonials</Link>
          <Link href="/login" className="block text-blue-600 font-semibold">Login</Link>
        </div>
      )}

      {/* Hero Section */}
      <section className="px-6 py-20 text-center bg-gray-50">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Connect with Vetted Teachers for Personalized Learning</h1>
        <p className="text-base md:text-lg mb-6">Submit your goals, get matched, and start learning — with trusted experts.</p>
        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
          <Link href="/signup?role=student" className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow text-center">Get Started as a Student</Link>
          <Link href="/signup?role=teacher" className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl shadow text-center">Teach on LearnConnect</Link>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-6 py-16 text-center">
        <h2 className="text-2xl font-semibold mb-10">How It Works</h2>
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3">
          {["Submit a request", "Get matched with a vetted teacher", "Pay and learn"].map((step, index) => (
            <div key={index} className="p-6 border rounded-xl shadow-sm">
              <div className="text-4xl font-bold mb-4">{index + 1}</div>
              <p className="text-base md:text-lg">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why LearnConnect */}
      <section id="why" className="px-6 py-16 bg-gray-100 text-center">
        <h2 className="text-2xl font-semibold mb-10">Why LearnConnect</h2>
        <ul className="space-y-4 max-w-xl mx-auto text-left list-disc list-inside text-sm md:text-base">
          <li>Vetted Teachers with Verified Credentials</li>
          <li>Admin-assisted matching for quality</li>
          <li>Secure payment and satisfaction tracking</li>
        </ul>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="px-6 py-16 text-center">
        <h2 className="text-2xl font-semibold mb-10">What Our Users Say</h2>
        <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto">
          <blockquote className="p-6 border rounded-xl">&quot;Great experience! I found a fantastic math tutor.&quot; <br/><span className="block mt-2 text-sm">- Sarah, Student</span></blockquote>
          <blockquote className="p-6 border rounded-xl">&quot;LearnConnect helped me find students easily and get paid quickly.&quot; <br/><span className="block mt-2 text-sm">- James, Teacher</span></blockquote>
        </div>
      </section>

      {/* Call to Action */}
      <section className="px-6 py-16 text-center bg-blue-50">
        <h2 className="text-2xl font-semibold mb-6">Start your learning journey today</h2>
        <Link href="/signup" className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow inline-block">Sign Up Now</Link>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 text-center text-sm bg-gray-800 text-white">
        <p>&copy; {new Date().getFullYear()} LearnConnect. All rights reserved.</p>
        <div className="mt-4 space-x-4">
          <Link href="/terms" className="underline">Terms</Link>
          <Link href="/privacy" className="underline">Privacy</Link>
          <Link href="/contact" className="underline">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
