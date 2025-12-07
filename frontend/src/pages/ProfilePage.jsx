import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../client";
import { useUser } from "../context/UserContext";

const ProfilePage = () => {
  const { id } = useParams();
  const { user } = useUser();

  const [userInfo, setUserInfo] = useState({
    username: "",
    about: "",
    watched: 0,
    rated: 0,
    wantToWatch: 0,
    profileImageUrl: null,
  });

  const [watchedShows, setWatchedShows] = useState([]);
  const [listedShows, setListedShows] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    about: "",
  });

  useEffect(() => {
    const controller = new AbortController();

    const fetchProfile = async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        if (!user) {
          setErrorMsg("You must be logged in to view profiles.");
          setLoading(false);
          return;
        }

        const userIdToFetch = id || user.id;

        const { data: userProfile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userIdToFetch)
          .single();

        if (profileError || !userProfile) {
          setErrorMsg("User profile not found.");
          setLoading(false);
          return;
        }

        setUserInfo({
          username: userProfile.username || "",
          about: userProfile.about || "",
          profileImageUrl: userProfile.profile_image_url || null,
          watched: userProfile.watched || 0,
          rated: userProfile.rated || 0,
          wantToWatch: userProfile.want_to_watch || 0,
        });

        const [watchedRes, listedRes, reviewsRes] = await Promise.all([
          supabase
            .from("user_shows")
            .select("*")
            .eq("userid", userIdToFetch)
            .eq("watched", true),
          supabase
            .from("user_shows")
            .select("*")
            .eq("userid", userIdToFetch)
            .eq("listed", true),
          supabase
            .from("reviews")
            .select("*")
            .eq("userid", userIdToFetch)
            .order("createdat", { ascending: false }),
        ]);

        setWatchedShows(watchedRes.data || []);
        setListedShows(listedRes.data || []);
        setReviews(reviewsRes.data || []);
      } catch (err) {
        console.error("Profile fetch error:", err);
        if (err.name !== "AbortError") setErrorMsg("Could not load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    return () => controller.abort();
  }, [id, user]);

  const handleProfileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `avatars/${user.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(filePath);

      const imageUrl = `${data.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profile_image_url: imageUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setUserInfo((prev) => ({ ...prev, profileImageUrl: imageUrl }));
      alert("Profile picture updated!");
    } catch (err) {
      console.error("Profile upload error:", err);
      alert("Image upload failed. Try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        username: editForm.username,
        about: editForm.about,
      })
      .eq("id", user.id);

    if (error) {
      alert("Failed to update profile.");
      return;
    }

    setUserInfo((prev) => ({
      ...prev,
      username: editForm.username,
      about: editForm.about,
    }));

    setIsEditing(false);
  };

  if (loading) return <p className="text-white p-6">Loading...</p>;

  return (
    <div className="bg-[#0C2D48] min-h-screen text-white px-8 py-8 pt-32">
      <div className="max-w-7xl mx-auto">
        {errorMsg && (
          <div className="mb-6 p-4 rounded bg-red-800 text-sm text-red-100">
            {errorMsg}
          </div>
        )}

        {/* ------------------------ */}
        {/* TOP SECTION WITH RIGHT-ALIGNED EDIT BUTTON */}
        {/* ------------------------ */}
        <div className="flex items-start gap-10">
          {/* PROFILE IMAGE + UPLOAD */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={userInfo.profileImageUrl || "/Profileplaceholderimage.png"}
                className="w-32 h-32 rounded-full border-4 border-white object-cover"
                alt="Profile"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">Uploading...</span>
                </div>
              )}
            </div>

            {(!id || id === user?.id) && (
              <label
                className={`mt-4 bg-[#FCA311] px-4 py-2 rounded text-black font-semibold cursor-pointer hover:bg-opacity-90 transition-all ${
                  uploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {userInfo.profileImageUrl ? "Change Image" : "Upload Image"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          {/* USERNAME + BUTTON ON FAR RIGHT */}
          <div className="flex-1">
            <div className="flex justify-between items-center w-full">
              <h1 className="text-3xl font-bold">{userInfo.username}</h1>

              {(!id || id === user?.id) && (
                <button
                  onClick={() => {
                    setEditForm({
                      username: userInfo.username,
                      about: userInfo.about,
                    });
                    setIsEditing(true);
                  }}
                  className="bg-[#FCA311] px-4 py-2 rounded text-black font-semibold"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <p className="text-lg font-semibold tracking-wide mt-4">
              ABOUT ME:
            </p>
            <p className="mt-2 max-w-xl leading-relaxed">
              {userInfo.about || "No bio yet."}
            </p>

            <div className="flex gap-12 mt-6">
              <Stat number={userInfo.watched} label="Watched" />
              <Stat number={userInfo.rated} label="Rated" />
              <Stat number={userInfo.wantToWatch} label="Want to Watch" />
            </div>
          </div>
        </div>

        {/* WATCHED */}
        <Section title="WATCHED SHOWS" items={watchedShows} />

        {/* WANT TO WATCH */}
        <Section title="WANT TO WATCH" items={listedShows} />

        {/* REVIEWS */}
        <div className="mt-16">
          <h2 className="text-lg font-semibold border-b border-gray-500 pb-1 tracking-wide">
            SHOWS I RECENTLY RATED
          </h2>

          {reviews.length === 0 ? (
            <p className="mt-4 text-gray-300">No reviews yet.</p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="mt-4 p-3 bg-gray-800 rounded">
                <p className="font-semibold">{r.title || "Untitled Show"}</p>
                <p className="text-gray-300">{r.comment}</p>
                <p className="text-sm text-gray-400">Rating: {r.rating} ⭐</p>
              </div>
            ))
          )}
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        editForm={editForm}
        setEditForm={setEditForm}
        onSave={handleSaveProfile}
      />
    </div>
  );
};

export default ProfilePage;

/* STATS */
const Stat = ({ number, label }) => (
  <div>
    <p className="text-2xl font-bold">{number}</p>
    <p className="text-sm text-gray-300">{label}</p>
  </div>
);

/* SHOW GRID */
const Section = ({ title, items = [] }) => (
  <div className="mt-16">
    <h2 className="text-lg font-semibold tracking-wide border-b border-gray-500 pb-1 w-full">
      {title}
    </h2>

    {items.length === 0 ? (
      <p className="text-gray-300 mt-4">No items found.</p>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 mt-6">
        {items.map((item) => (
          <div key={item.id} className="text-center">
            <img
              src={
                item.poster_path
                  ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
                  : "https://placehold.co/200x260"
              }
              className="w-full h-48 object-cover rounded-lg bg-gray-700"
              alt={item.title}
            />
            <p className="mt-2 text-sm">{item.title}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

/* EDIT MODAL */
const EditProfileModal = ({
  isOpen,
  onClose,
  editForm,
  setEditForm,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-6 z-50">
      <div className="bg-white text-black p-6 rounded-lg w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Edit Profile</h2>

        <label className="font-semibold">Username</label>
        <input
          type="text"
          value={editForm.username}
          onChange={(e) =>
            setEditForm({ ...editForm, username: e.target.value })
          }
          className="w-full border p-2 rounded mb-4"
        />

        <label className="font-semibold">About Me</label>
        <textarea
          value={editForm.about}
          onChange={(e) =>
            setEditForm({ ...editForm, about: e.target.value })
          }
          className="w-full border p-2 rounded h-32 mb-4"
        />

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-400 rounded text-black"
          >
            Cancel
          </button>

          <button
            onClick={onSave}
            className="px-4 py-2 bg-[#FCA311] rounded text-black font-semibold"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
