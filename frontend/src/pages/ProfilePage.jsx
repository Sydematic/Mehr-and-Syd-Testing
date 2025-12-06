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

  // Fetch profile & related data
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

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

        // Fetch Supabase profile
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

        // Fetch watched shows, listed shows, and reviews
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

  // Upload profile picture
  const handleProfileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `avatars/${user.id}.${fileExt}`;

      // Upload with upsert to replace existing file
      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, file, { 
          upsert: true,
          cacheControl: '0' // Prevent caching issues
        });
      
      if (uploadError) throw uploadError;

      // Get public URL with cache-busting timestamp
      const { data } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(filePath);

      const imageUrl = `${data.publicUrl}?t=${new Date().getTime()}`;

      // Update database
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profile_image_url: imageUrl })
        .eq("id", user.id);
      
      if (updateError) throw updateError;

      setUserInfo((prev) => ({ ...prev, profileImageUrl: imageUrl }));
      alert('Profile picture updated successfully!');
    } catch (err) {
      console.error("Profile upload error:", err);
      alert("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
      // Reset the input so the same file can be selected again if needed
      e.target.value = '';
    }
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

        {/* Top User Section */}
        <div className="flex items-start gap-10">
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
              <label className={`mt-4 bg-[#FCA311] px-4 py-2 rounded text-black font-semibold cursor-pointer hover:bg-opacity-90 transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {userInfo.profileImageUrl ? 'Change Image' : 'Upload Image'}
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

          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-4">{userInfo.username}</h1>
            <p className="text-lg font-semibold tracking-wide">ABOUT ME:</p>
            <p className="mt-2 max-w-xl leading-relaxed">{userInfo.about || "No bio yet."}</p>
            <div className="flex gap-12 mt-6">
              <Stat number={userInfo.watched} label="Watched" />
              <Stat number={userInfo.rated} label="Rated" />
              <Stat number={userInfo.wantToWatch} label="Want to Watch" />
            </div>
          </div>
        </div>

        {/* Watched Shows Section */}
        <Section title="WATCHED SHOWS" items={watchedShows} />
        
        {/* Want to Watch Section */}
        <Section title="WANT TO WATCH" items={listedShows} />

        {/* Reviews Section */}
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
    </div>
  );
};

export default ProfilePage;

// STATS COMPONENT
const Stat = ({ number, label }) => (
  <div>
    <p className="text-2xl font-bold">{number}</p>
    <p className="text-sm text-gray-300">{label}</p>
  </div>
);

// SECTION COMPONENT
const Section = ({ title, items = [] }) => (
  <div className="mt-16">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-lg font-semibold tracking-wide border-b border-gray-500 pb-1 w-full">
        {title}
      </h2>
    </div>
    {items.length === 0 ? (
      <p className="text-gray-300">No items found.</p>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8">
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