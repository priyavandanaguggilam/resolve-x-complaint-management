
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user"))
  );

  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState(
    user?.name || user?.username || ""
  );

  const [email, setEmail] = useState(
    user?.email || ""
  );

  const [mobile, setMobile] = useState(
    user?.mobile || user?.phone || user?.mobileNumber || ""
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">
          Please login to view your profile.
        </p>
      </div>
    );
  }

  // Save profile changes
  const handleSave = () => {
    const updatedUser = {
      ...user,
      name: name,
      email: email,
      mobile: mobile,
    };

    localStorage.setItem(
      "user",
      JSON.stringify(updatedUser)
    );

    setUser(updatedUser);
    setIsEditing(false);

    // Update Navbar
    window.dispatchEvent(
      new Event("userChanged")
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 px-6">

      <div className="max-w-xl mx-auto">

        {/* PROFILE CARD */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">

          {/* TOP */}
          <div className="px-6 py-7 border-b border-gray-200">

            <div className="flex items-center gap-5">

              {/* SMALL PROFILE CIRCLE */}
              <div className="w-16 h-16 shrink-0 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-bold">
                {(user.name ||
                  user.username ||
                  "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              {/* NAME + EMAIL */}
              <div className="min-w-0">

                <h1 className="text-2xl font-bold text-gray-900 truncate">
                  {user.name ||
                    user.username ||
                    "User"}
                </h1>

                <p className="text-gray-500 truncate">
                  {user.email ||
                    "Email not available"}
                </p>

              </div>

            </div>

          </div>

          {/* DETAILS */}
          <div className="p-6">

            <div className="flex items-center justify-between mb-6">

              <h2 className="text-xl font-bold text-gray-900">
                Profile Details
              </h2>

              {!isEditing && (
                <button
                  onClick={() =>
                    setIsEditing(true)
                  }
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  Edit Profile
                </button>
              )}

            </div>

            {/* NAME */}
            <div className="mb-5">

              <label className="block text-sm font-semibold text-gray-500 mb-2">
                Name
              </label>

              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <p className="text-lg font-medium text-gray-800">
                  {user.name ||
                    user.username ||
                    "Not available"}
                </p>
              )}

            </div>

            {/* EMAIL */}
            <div className="mb-5">

              <label className="block text-sm font-semibold text-gray-500 mb-2">
                Email
              </label>

              {isEditing ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <p className="text-lg font-medium text-gray-800">
                  {user.email ||
                    "Not available"}
                </p>
              )}

            </div>

            {/* MOBILE NUMBER */}
            <div className="mb-5">

              <label className="block text-sm font-semibold text-gray-500 mb-2">
                Mobile Number
              </label>

              {isEditing ? (
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) =>
                    setMobile(e.target.value)
                  }
                  placeholder="Enter mobile number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <p className="text-lg font-medium text-gray-800">
                  {user.mobile ||
                    user.phone ||
                    user.mobileNumber ||
                    "Not available"}
                </p>
              )}

            </div>

            {/* ACCOUNT TYPE */}
            <div className="mb-6">

              <label className="block text-sm font-semibold text-gray-500 mb-2">
                Account Type
              </label>

              <p className="text-lg font-medium text-gray-800 capitalize">
                {user.role || "User"}
              </p>

            </div>

            {/* EDIT BUTTONS */}
            {isEditing && (
              <div className="flex gap-3 mb-6">

                <button
                  onClick={handleSave}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
                >
                  Save Changes
                </button>

                <button
                  onClick={() => {
                    setIsEditing(false);

                    setName(
                      user.name ||
                        user.username ||
                        ""
                    );

                    setEmail(
                      user.email || ""
                    );

                    setMobile(
                      user.mobile ||
                        user.phone ||
                        user.mobileNumber ||
                        ""
                    );
                  }}
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>

              </div>
            )}

            {/* BACK HOME */}
            <div className="border-t border-gray-200 pt-5">

              <button
                onClick={() => navigate("/")}
                className="text-gray-500 hover:text-indigo-600 font-medium"
              >
                ← Back to Home
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Profile;

