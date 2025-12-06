import { useState } from "react";

export default function RegisterModal({ isOpen, onClose }) {
  const [form, setForm] = useState({
    email: "",
    displayName: "",
    password: "",
    confirmPassword: "",
    terms: false,
    privacy: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", form);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Background overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal content */}
      <div className="relative bg-[#002a3a] text-white rounded-md shadow-xl w-[400px] p-6 border border-yellow-500 z-10">
        {/* Title */}
        <h2 className="text-lg font-bold uppercase mb-4 border-b border-dotted border-gray-400 pb-2">
          Create an Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 text-black border rounded"
            />
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              Display Name
            </label>
            <input
              type="text"
              name="displayName"
              value={form.displayName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 text-black border rounded"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 text-black border rounded"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 text-black border rounded"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-2 text-sm">
            <label className="flex items-start space-x-2">
              <input
                type="checkbox"
                name="terms"
                checked={form.terms}
                onChange={handleChange}
                className="mt-1"
              />
              <span>
                I am at least 13 years old and accept the Terms of Conditions
                and Use.
              </span>
            </label>

            <label className="flex items-start space-x-2">
              <input
                type="checkbox"
                name="privacy"
                checked={form.privacy}
                onChange={handleChange}
                className="mt-1"
              />
              <span>
                I accept the Privacy Policy and consent to the processing of my
                personal information.
              </span>
            </label>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded mt-4 transition"
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}
